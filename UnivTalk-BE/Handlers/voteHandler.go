package Handlers

import (
	"fmt"
	"log"
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

	userIDStr, ok := userIDInterface.(string)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "User ID format error"})
		return
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid User ID"})
		return
	}

	var vote Models.Votes
	var existsQuery *pg.Query

	if postID != nil {
		existsQuery = db.Model(&vote).Where("user_id = ? AND post_id = ?", userID, *postID)
	} else {
		existsQuery = db.Model(&vote).Where("user_id = ? AND comment_id = ?", userID, *commentID)
	}

	err = existsQuery.Select()

	if err != nil {
		if err != pg.ErrNoRows {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":  "Database error checking vote",
				"detail": err.Error(),
			})
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
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":  "Failed to cast vote",
				"detail": err.Error(),
			})
			log.Printf("Insert Vote Failed: %v", err.Error())
			return
		}
	} else {
		if vote.Value != value {
			vote.Value = value
			_, err := db.Model(&vote).WherePK().Column("value").Update()
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{
					"error":  "Failed to update vote",
					"detail": err.Error(),
				})
				log.Printf("Update Vote Failed: %v", err.Error())
				return
			}
		}
	}

	if postID != nil {
		ch.Delete(fmt.Sprintf("post_%d", *postID))
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Vote processed successfully",
		"value":   value,
	})
}

func UpVotePost(c *gin.Context, db *pg.DB, ch *cache.Cache) {
	postIDStr := c.Param("post_id")
	postID, err := strconv.Atoi(postIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Post ID format"})
		return
	}

	processVote(c, db, ch, &postID, nil, 1)
}

func DownVotePost(c *gin.Context, db *pg.DB, ch *cache.Cache) {
	postIDStr := c.Param("post_id")
	postID, err := strconv.Atoi(postIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Post ID format"})
		return
	}

	processVote(c, db, ch, &postID, nil, -1)
}

func RemoveVotePost(c *gin.Context, db *pg.DB, ch *cache.Cache) {
	postIDStr := c.Param("post_id")
	postID, err := strconv.Atoi(postIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Post ID format"})
		return
	}

	userIDInterface, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userIDStr := userIDInterface.(string)
	userID, _ := uuid.Parse(userIDStr)

	res, err := db.Model(&Models.Votes{}).
		Where("user_id = ? AND post_id = ?", userID, postID).
		Delete()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to remove vote", "detail": err.Error()})
		return
	}

	if res.RowsAffected() == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Vote not found"})
		return
	}

	ch.Delete(fmt.Sprintf("post_%d", postID))

	c.JSON(http.StatusOK, gin.H{"message": "Vote removed successfully"})
}

func UpVoteComment(c *gin.Context, db *pg.DB, ch *cache.Cache) {
	commentIDStr := c.Param("comment_id")
	commentID, err := strconv.Atoi(commentIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Comment ID format"})
		return
	}

	processVote(c, db, ch, nil, &commentID, 1)
}

func DownVoteComment(c *gin.Context, db *pg.DB, ch *cache.Cache) {
	commentIDStr := c.Param("comment_id")
	commentID, err := strconv.Atoi(commentIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Comment ID format"})
		return
	}

	processVote(c, db, ch, nil, &commentID, -1)
}

func RemoveVoteComment(c *gin.Context, db *pg.DB, ch *cache.Cache) {
	commentIDStr := c.Param("comment_id")
	commentID, err := strconv.Atoi(commentIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Comment ID format"})
		return
	}

	userIDInterface, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userIDStr := userIDInterface.(string)
	userID, _ := uuid.Parse(userIDStr)

	res, err := db.Model(&Models.Votes{}).
		Where("user_id = ? AND comment_id = ?", userID, commentID).
		Delete()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to remove vote", "detail": err.Error()})
		return
	}

	if res.RowsAffected() == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Vote not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Vote removed successfully"})
}

func GetPostVotes(c *gin.Context, db *pg.DB) {
	postIDStr := c.Param("post_id")
	postID, err := strconv.Atoi(postIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Post ID format"})
		return
	}

	var upVotes int
	var downVotes int

	upVotes, err = db.Model(&Models.Votes{}).
		Where("post_id = ? AND value = 1", postID).
		Count()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count upvotes", "detail": err.Error()})
		return
	}

	downVotes, err = db.Model(&Models.Votes{}).
		Where("post_id = ? AND value = -1", postID).
		Count()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count downvotes", "detail": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"post_id":    postID,
		"up_votes":   upVotes,
		"down_votes": downVotes,
	})
}

func GetCommentVotes(c *gin.Context, db *pg.DB) {
	commentIDStr := c.Param("comment_id")
	commentID, err := strconv.Atoi(commentIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Comment ID format"})
		return
	}

	var upVotes int
	var downVotes int

	upVotes, err = db.Model(&Models.Votes{}).
		Where("comment_id = ? AND value = 1", commentID).
		Count()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count upvotes", "detail": err.Error()})
		return
	}

	downVotes, err = db.Model(&Models.Votes{}).
		Where("comment_id = ? AND value = -1", commentID).
		Count()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count downvotes", "detail": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"comment_id": commentID,
		"up_votes":   upVotes,
		"down_votes": downVotes,
	})
}
