package Handlers

import (
	"fmt"
	"net/http"
	"strconv"

	"github.com/Ariffansyah/UnivTalk/Models"
	"github.com/gin-gonic/gin"
	"github.com/go-pg/pg/v10"
	"github.com/google/uuid"
	"github.com/patrickmn/go-cache"
)

func processVote(c *gin.Context, db *pg.DB, ch *cache.Cache, postID *int, commentID *int, value int) {
	userIDInterface, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userID, ok := userIDInterface.(uuid.UUID)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "User ID format error"})
		return
	}
	var vote Models.Votes
	var existsQuery *pg.Query
	if postID != nil {
		existsQuery = db.Model(&vote).Where("user_id = ? AND post_id = ?", userID, *postID)
	} else {
		existsQuery = db.Model(&vote).Where("user_id = ? AND comment_id = ?", userID, *commentID)
	}
	err := existsQuery.Select()
	if err != nil {
		if err != pg.ErrNoRows {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
			return
		}
		newVote := Models.Votes{
			UserID:    userID,
			PostID:    postID,
			CommentID: commentID,
			Value:     value,
		}
		_, err := db.Model(&newVote).Insert()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to cast vote"})
			return
		}
	} else {
		if vote.Value != value {
			vote.Value = value
			_, err := db.Model(&vote).WherePK().Column("value").Update()
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update vote"})
				return
			}
		} else {
			c.JSON(http.StatusOK, gin.H{"message": "No change", "value": value})
			return
		}
	}
	if postID != nil {
		ch.Delete("global_posts")
		var p Models.Posts
		err := db.Model(&p).Where("id = ?", *postID).Select()
		if err == nil {
			ch.Delete(fmt.Sprintf("forum_posts_%s", p.ForumID))
		}
		ch.Delete(fmt.Sprintf("post_%d", *postID))
	} else if commentID != nil {
		var cmt Models.Comments
		if err := db.Model(&cmt).Where("id = ?", *commentID).Select(); err == nil {
			ch.Delete(fmt.Sprintf("comments_post_%d", cmt.PostID))
		}
	}
	c.JSON(http.StatusOK, gin.H{"message": "Vote processed", "value": value})
}

func UpVotePost(c *gin.Context, db *pg.DB, ch *cache.Cache) {
	id, _ := strconv.Atoi(c.Param("post_id"))
	processVote(c, db, ch, &id, nil, 1)
}

func DownVotePost(c *gin.Context, db *pg.DB, ch *cache.Cache) {
	id, _ := strconv.Atoi(c.Param("post_id"))
	processVote(c, db, ch, &id, nil, -1)
}

func RemoveVotePost(c *gin.Context, db *pg.DB, ch *cache.Cache) {
	postID, _ := strconv.Atoi(c.Param("post_id"))
	userID := c.MustGet("user_id").(uuid.UUID)
	_, err := db.Model(&Models.Votes{}).Where("user_id = ? AND post_id = ?", userID, postID).Delete()
	if err == nil {
		ch.Delete("global_posts")
		var p Models.Posts
		db.Model(&p).Where("id = ?", postID).Select()
		ch.Delete(fmt.Sprintf("forum_posts_%s", p.ForumID))
		ch.Delete(fmt.Sprintf("post_%d", postID))
	}
	c.JSON(http.StatusOK, gin.H{"message": "Vote removed"})
}

func UpVoteComment(c *gin.Context, db *pg.DB, ch *cache.Cache) {
	id, _ := strconv.Atoi(c.Param("comment_id"))
	processVote(c, db, ch, nil, &id, 1)
}

func DownVoteComment(c *gin.Context, db *pg.DB, ch *cache.Cache) {
	id, _ := strconv.Atoi(c.Param("comment_id"))
	processVote(c, db, ch, nil, &id, -1)
}

func RemoveVoteComment(c *gin.Context, db *pg.DB, ch *cache.Cache) {
	id, _ := strconv.Atoi(c.Param("comment_id"))
	userID := c.MustGet("user_id").(uuid.UUID)
	_, _ = db.Model(&Models.Votes{}).Where("user_id = ? AND comment_id = ?", userID, id).Delete()

	var cmt Models.Comments
	if err := db.Model(&cmt).Where("id = ?", id).Select(); err == nil {
		ch.Delete(fmt.Sprintf("comments_post_%d", cmt.PostID))
	}
	c.JSON(http.StatusOK, gin.H{"message": "Vote removed"})
}

func GetPostVotes(c *gin.Context, db *pg.DB) {
	id, _ := strconv.Atoi(c.Param("post_id"))
	up, _ := db.Model(&Models.Votes{}).Where("post_id = ? AND value = 1", id).Count()
	down, _ := db.Model(&Models.Votes{}).Where("post_id = ? AND value = -1", id).Count()
	var myVotePtr *int
	if uidI, ok := c.Get("user_id"); ok {
		if uid, ok2 := uidI.(uuid.UUID); ok2 {
			type Row struct{ Value int }
			var r Row
			_, err := db.Query(&r, `SELECT value FROM votes WHERE user_id = ? AND post_id = ? LIMIT 1`, uid, id)
			if err == nil && (r.Value == 1 || r.Value == -1 || r.Value == 0) {
				myVotePtr = new(int)
				*myVotePtr = r.Value
			}
		}
	}
	c.JSON(http.StatusOK, gin.H{"up_votes": up, "down_votes": down, "my_vote": myVotePtr})
}

func GetCommentVotes(c *gin.Context, db *pg.DB) {
	id, _ := strconv.Atoi(c.Param("comment_id"))
	up, _ := db.Model(&Models.Votes{}).Where("comment_id = ? AND value = 1", id).Count()
	down, _ := db.Model(&Models.Votes{}).Where("comment_id = ? AND value = -1", id).Count()
	var myVotePtr *int
	if uidI, ok := c.Get("user_id"); ok {
		if uid, ok2 := uidI.(uuid.UUID); ok2 {
			type Row struct{ Value int }
			var r Row
			_, err := db.Query(&r, `SELECT value FROM votes WHERE user_id = ? AND comment_id = ? LIMIT 1`, uid, id)
			if err == nil && (r.Value == 1 || r.Value == -1 || r.Value == 0) {
				myVotePtr = new(int)
				*myVotePtr = r.Value
			}
		}
	}
	c.JSON(http.StatusOK, gin.H{"up_votes": up, "down_votes": down, "my_vote": myVotePtr})
}

func GetPostVoters(c *gin.Context, db *pg.DB) {
	postID, err := strconv.Atoi(c.Param("post_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Post ID"})
		return
	}
	type Row struct {
		UserID   uuid.UUID `json:"user_id"`
		Username string    `json:"username"`
		Value    int       `json:"value"`
	}
	var voters []Row
	_, qErr := db.Query(&voters, `
		SELECT v.user_id, u.username, v.value
		FROM votes v
		JOIN users u ON u.uid = v.user_id
		WHERE v.post_id = ?
	`, postID)
	if qErr != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch voters"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"voters": voters})
}
