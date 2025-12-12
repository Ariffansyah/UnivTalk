package Handlers

import (
	"fmt"
	"net/http"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/Ariffansyah/UnivTalk/Models"
	"github.com/gin-gonic/gin"
	"github.com/go-pg/pg/v10"
	"github.com/google/uuid"
	"github.com/patrickmn/go-cache"
)

func GetForumPosts(c *gin.Context, db *pg.DB, ch *cache.Cache) {
	forumIDStr := c.Param("forum_id")
	forumID, err := uuid.Parse(forumIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Forum ID format"})
		return
	}

	userIDInterface, _ := c.Get("user_id")
	var currentUser uuid.UUID
	if uid, ok := userIDInterface.(uuid.UUID); ok {
		currentUser = uid
	}

	var posts []Models.Posts
	err = db.Model(&posts).
		Relation("User").
		Where("forum_id = ?", forumID).
		Order("posts.created_at DESC").
		Select()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve posts"})
		return
	}

	postIDs := make([]int, 0, len(posts))
	for _, p := range posts {
		postIDs = append(postIDs, p.ID)
	}

	type VoteCount struct {
		PostID int
		Up     int
		Down   int
	}
	var counts []VoteCount
	if len(postIDs) > 0 {
		_, _ = db.Query(&counts, `
			SELECT post_id,
			       COALESCE(SUM(CASE WHEN value = 1 THEN 1 ELSE 0 END), 0) AS up,
			       COALESCE(SUM(CASE WHEN value = -1 THEN 1 ELSE 0 END), 0) AS down
			FROM votes
			WHERE post_id IN ( ? )
			GROUP BY post_id
		`, pg.In(postIDs))
	}

	countMap := make(map[int]VoteCount, len(counts))
	for _, cRow := range counts {
		countMap[cRow.PostID] = cRow
	}

	type MyVoteRow struct {
		PostID int
		Value  int
	}
	myVoteMap := make(map[int]int, len(posts))
	if len(postIDs) > 0 && currentUser != uuid.Nil {
		var myVotes []MyVoteRow
		_, _ = db.Query(&myVotes, `
			SELECT post_id, value
			FROM votes
			WHERE user_id = ? AND post_id IN ( ? )
		`, currentUser, pg.In(postIDs))
		for _, mv := range myVotes {
			myVoteMap[mv.PostID] = mv.Value
		}
	}

	response := make([]Models.PostWithCounts, 0, len(posts))
	for _, p := range posts {
		count := countMap[p.ID]
		var mvPtr *int
		if v, ok := myVoteMap[p.ID]; ok {
			mvPtr = new(int)
			*mvPtr = v
		}
		response = append(response, Models.PostWithCounts{
			Posts:     p,
			Upvotes:   count.Up,
			Downvotes: count.Down,
			MyVote:    mvPtr,
		})
	}

	for i := 0; i < len(response)-1; i++ {
		for j := i + 1; j < len(response); j++ {
			si := response[i].Upvotes - response[i].Downvotes
			sj := response[j].Upvotes - response[j].Downvotes
			if sj > si || (sj == si && response[j].CreatedAt.After(response[i].CreatedAt)) {
				response[i], response[j] = response[j], response[i]
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{"posts": response})
}

func GetForumPostsByID(c *gin.Context, db *pg.DB, ch *cache.Cache) {
	postIDStr := c.Param("post_id")
	postID, err := strconv.Atoi(postIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Post ID format"})
		return
	}

	userIDInterface, _ := c.Get("user_id")
	var currentUser uuid.UUID
	if uid, ok := userIDInterface.(uuid.UUID); ok {
		currentUser = uid
	}

	var post Models.Posts
	err = db.Model(&post).
		Relation("User").
		Where("posts.id = ?", postID).
		Select()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve post"})
		return
	}

	type VoteCount struct {
		Up   int
		Down int
	}
	var counts VoteCount
	_, _ = db.Query(&counts, `
		SELECT
			COALESCE(SUM(CASE WHEN value = 1 THEN 1 ELSE 0 END), 0) AS up,
			COALESCE(SUM(CASE WHEN value = -1 THEN 1 ELSE 0 END), 0) AS down
		FROM votes
		WHERE post_id = ?
	`, postID)

	var myVotePtr *int
	if currentUser != uuid.Nil {
		type MyVoteRow struct {
			Value int
		}
		var myVote MyVoteRow
		_, _ = db.Query(&myVote, `
			SELECT value
			FROM votes
			WHERE user_id = ? AND post_id = ?
			LIMIT 1
		`, currentUser, postID)
		if myVote.Value == 1 || myVote.Value == -1 || myVote.Value == 0 {
			myVotePtr = new(int)
			*myVotePtr = myVote.Value
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"post": gin.H{
			"id":         post.ID,
			"forum_id":   post.ForumID,
			"user_id":    post.UserID,
			"title":      post.Title,
			"body":       post.Body,
			"media_url":  post.MediaURL,
			"media_type": post.MediaType,
			"created_at": post.CreatedAt,
			"updated_at": post.UpdatedAt,
			"user":       post.User,
			"upvotes":    counts.Up,
			"downvotes":  counts.Down,
			"my_vote":    myVotePtr,
		},
	})
}

func GetGlobalPosts(c *gin.Context, db *pg.DB, ch *cache.Cache) {
	var posts []Models.Posts
	err := db.Model(&posts).
		Relation("User").
		Order("posts.created_at DESC").
		Select()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve posts"})
		return
	}

	postIDs := make([]int, 0, len(posts))
	for _, p := range posts {
		postIDs = append(postIDs, p.ID)
	}

	type VoteCount struct {
		PostID int
		Up     int
		Down   int
	}
	var counts []VoteCount
	if len(postIDs) > 0 {
		_, _ = db.Query(&counts, `
			SELECT post_id,
			       COALESCE(SUM(CASE WHEN value = 1 THEN 1 ELSE 0 END), 0) AS up,
			       COALESCE(SUM(CASE WHEN value = -1 THEN 1 ELSE 0 END), 0) AS down
			FROM votes
			WHERE post_id IN ( ? )
			GROUP BY post_id
		`, pg.In(postIDs))
	}

	countMap := make(map[int]VoteCount, len(counts))
	for _, cRow := range counts {
		countMap[cRow.PostID] = cRow
	}

	userIDInterface, _ := c.Get("user_id")
	var currentUser uuid.UUID
	if uid, ok := userIDInterface.(uuid.UUID); ok {
		currentUser = uid
	}

	type MyVoteRow struct {
		PostID int
		Value  int
	}
	myVoteMap := make(map[int]int, len(posts))
	if len(postIDs) > 0 && currentUser != uuid.Nil {
		var myVotes []MyVoteRow
		_, _ = db.Query(&myVotes, `
			SELECT post_id, value
			FROM votes
			WHERE user_id = ? AND post_id IN ( ? )
		`, currentUser, pg.In(postIDs))
		for _, mv := range myVotes {
			myVoteMap[mv.PostID] = mv.Value
		}
	}

	response := make([]Models.PostWithCounts, 0, len(posts))
	for _, p := range posts {
		count := countMap[p.ID]
		var mvPtr *int
		if v, ok := myVoteMap[p.ID]; ok {
			mvPtr = new(int)
			*mvPtr = v
		}
		response = append(response, Models.PostWithCounts{
			Posts:     p,
			Upvotes:   count.Up,
			Downvotes: count.Down,
			MyVote:    mvPtr,
		})
	}

	for i := 0; i < len(response)-1; i++ {
		for j := i + 1; j < len(response); j++ {
			si := response[i].Upvotes - response[i].Downvotes
			sj := response[j].Upvotes - response[j].Downvotes
			if sj > si || (sj == si && response[j].CreatedAt.After(response[i].CreatedAt)) {
				response[i], response[j] = response[j], response[i]
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{"posts": response})
}

func GetPostByUserID(c *gin.Context, db *pg.DB, ch *cache.Cache) {
	userIDStr := c.Param("user_id")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid User ID format"})
		return
	}

	var posts []Models.Posts
	err = db.Model(&posts).
		Relation("User").
		Where("user_id = ?", userID).
		Order("posts.created_at DESC").
		Select()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve posts"})
		return
	}

	postIDs := make([]int, 0, len(posts))
	for _, p := range posts {
		postIDs = append(postIDs, p.ID)
	}

	type VoteCount struct {
		PostID int
		Up     int
		Down   int
	}
	var counts []VoteCount
	if len(postIDs) > 0 {
		_, _ = db.Query(&counts, `
			SELECT post_id,
			       COALESCE(SUM(CASE WHEN value = 1 THEN 1 ELSE 0 END), 0) AS up,
			       COALESCE(SUM(CASE WHEN value = -1 THEN 1 ELSE 0 END), 0) AS down
			FROM votes
			WHERE post_id IN ( ? )
			GROUP BY post_id
		`, pg.In(postIDs))
	}

	countMap := make(map[int]VoteCount, len(counts))
	for _, cRow := range counts {
		countMap[cRow.PostID] = cRow
	}

	userIDInterface, _ := c.Get("user_id")
	var currentUser uuid.UUID
	if uid, ok := userIDInterface.(uuid.UUID); ok {
		currentUser = uid
	}

	type MyVoteRow struct {
		PostID int
		Value  int
	}
	myVoteMap := make(map[int]int, len(posts))
	if len(postIDs) > 0 && currentUser != uuid.Nil {
		var myVotes []MyVoteRow
		_, _ = db.Query(&myVotes, `
			SELECT post_id, value
			FROM votes
			WHERE user_id = ? AND post_id IN ( ? )
		`, currentUser, pg.In(postIDs))
		for _, mv := range myVotes {
			myVoteMap[mv.PostID] = mv.Value
		}
	}

	response := make([]Models.PostWithCounts, 0, len(posts))
	for _, p := range posts {
		count := countMap[p.ID]
		var mvPtr *int
		if v, ok := myVoteMap[p.ID]; ok {
			mvPtr = new(int)
			*mvPtr = v
		}
		response = append(response, Models.PostWithCounts{
			Posts:     p,
			Upvotes:   count.Up,
			Downvotes: count.Down,
			MyVote:    mvPtr,
		})
	}

	for i := 0; i < len(response)-1; i++ {
		for j := i + 1; j < len(response); j++ {
			si := response[i].Upvotes - response[i].Downvotes
			sj := response[j].Upvotes - response[j].Downvotes
			if sj > si || (sj == si && response[j].CreatedAt.After(response[i].CreatedAt)) {
				response[i], response[j] = response[j], response[i]
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{"posts": response})
}

func CreatePost(c *gin.Context, db *pg.DB, ch *cache.Cache) {
	userID, err := getUserIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	if err := c.Request.ParseMultipartForm(32 << 20); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File upload error"})
		return
	}

	rawForumID := c.PostForm("forum_id")
	cleanForumIDStr := strings.Trim(strings.TrimSpace(rawForumID), `"'[]`)
	forumID, err := uuid.Parse(cleanForumIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Forum ID format"})
		return
	}

	post := Models.Posts{
		Title:     c.PostForm("title"),
		Body:      c.PostForm("body"),
		ForumID:   forumID,
		UserID:    userID,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if post.Title == "" || post.Body == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Title and Body are required"})
		return
	}

	file, err := c.FormFile("media")
	if err == nil {
		ext := strings.ToLower(filepath.Ext(file.Filename))
		allowedImages := map[string]bool{".jpg": true, ".jpeg": true, ".png": true, ".gif": true, ".webp": true}
		allowedVideos := map[string]bool{".mp4": true, ".mov": true, ".avi": true, ".mkv": true}

		if allowedImages[ext] {
			post.MediaType = "image"
		} else if allowedVideos[ext] {
			post.MediaType = "video"
		} else {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Unsupported file type"})
			return
		}

		newFileName := uuid.New().String() + ext
		uploadPath := "./uploads/" + newFileName

		if err := c.SaveUploadedFile(file, uploadPath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
			return
		}
		post.MediaURL = "/uploads/" + newFileName
	}

	_, err = db.Model(&post).Insert()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create post", "detail": err.Error()})
		return
	}

	ch.Delete(fmt.Sprintf("posts_forum_%s", forumID.String()))

	c.JSON(http.StatusCreated, gin.H{
		"message": "Post created successfully",
		"post":    post,
	})
}

func UpdatePost(c *gin.Context, db *pg.DB, ch *cache.Cache) {
	postIDStr := c.Param("post_id")
	postID, err := strconv.Atoi(postIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Post ID format"})
		return
	}

	userID, err := getUserIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	var existingPost Models.Posts
	err = db.Model(&existingPost).Where("id = ?", postID).Select()
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Post not found"})
		return
	}

	if existingPost.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Unauthorized to update this post"})
		return
	}

	var updateData Models.Posts
	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	res, err := db.Model(&existingPost).
		Set("title = ?", updateData.Title).
		Set("body = ?", updateData.Body).
		Set("updated_at = ?", time.Now()).
		Where("id = ?", postID).
		Update()

	if err != nil || res.RowsAffected() == 0 {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Update failed"})
		return
	}

	ch.Delete(fmt.Sprintf("posts_forum_%s", existingPost.ForumID.String()))
	ch.Delete(fmt.Sprintf("post_%d", postID))

	c.JSON(http.StatusOK, gin.H{"message": "Post updated successfully"})
}

func DeletePost(c *gin.Context, db *pg.DB, ch *cache.Cache) {
	postIDStr := c.Param("post_id")
	postID, err := strconv.Atoi(postIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Post ID format"})
		return
	}

	userID, err := getUserIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	var post Models.Posts
	err = db.Model(&post).Where("id = ?", postID).Select()
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Post not found"})
		return
	}

	isSysAdmin, _ := isSystemAdmin(db, userID)
	if post.UserID != userID && !isSysAdmin {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden"})
		return
	}

	_, err = db.Model(&post).Where("id = ?", postID).Delete()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Delete failed"})
		return
	}

	ch.Delete(fmt.Sprintf("posts_forum_%s", post.ForumID.String()))
	ch.Delete(fmt.Sprintf("post_%d", postID))

	c.JSON(http.StatusOK, gin.H{"message": "Post deleted successfully"})
}

func CreateComment(c *gin.Context, db *pg.DB, ch *cache.Cache) {
	userID, err := getUserIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	var comment Models.Comments
	if err := c.ShouldBindJSON(&comment); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	comment.UserID = userID
	comment.CreatedAt = time.Now()

	if comment.ParentCommentID != 0 {
		var parent Models.Comments
		err := db.Model(&parent).Where("id = ?", comment.ParentCommentID).Select()
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Parent comment not found"})
			return
		}
	}

	_, err = db.Model(&comment).Insert()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Comment failed"})
		return
	}

	ch.Delete(fmt.Sprintf("comments_post_%d", comment.PostID))
	c.JSON(http.StatusCreated, gin.H{"message": "Comment created", "comment": comment})
}

func GetPostComments(c *gin.Context, db *pg.DB, ch *cache.Cache) {
	postIDStr := c.Param("post_id")
	postID, err := strconv.Atoi(postIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Post ID"})
		return
	}

	cacheKey := fmt.Sprintf("comments_post_%d", postID)
	if saved, found := ch.Get(cacheKey); found {
		c.JSON(http.StatusOK, gin.H{"comments": saved})
		return
	}

	var comments []Models.Comments
	err = db.Model(&comments).
		Relation("User").
		Where("post_id = ?", postID).
		Order("created_at ASC").
		Select()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch comments"})
		return
	}

	commentIDs := make([]int, 0, len(comments))
	for _, cmt := range comments {
		commentIDs = append(commentIDs, cmt.ID)
	}

	type CCount struct {
		CommentID int
		Up        int
		Down      int
	}
	var cc []CCount
	if len(commentIDs) > 0 {
		_, _ = db.Query(&cc, `
			SELECT comment_id,
			       COALESCE(SUM(CASE WHEN value = 1 THEN 1 ELSE 0 END), 0) AS up,
			       COALESCE(SUM(CASE WHEN value = -1 THEN 1 ELSE 0 END), 0) AS down
			FROM votes
			WHERE comment_id IN ( ? )
			GROUP BY comment_id
		`, pg.In(commentIDs))
	}
	cMap := make(map[int]CCount, len(cc))
	for _, r := range cc {
		cMap[r.CommentID] = r
	}

	type CommentWithCounts struct {
		Models.Comments
		Upvotes   int  `json:"upvotes"`
		Downvotes int  `json:"downvotes"`
		MyVote    *int `json:"my_vote"`
	}
	result := make([]CommentWithCounts, 0, len(comments))
	for _, cmt := range comments {
		count := cMap[cmt.ID]
		result = append(result, CommentWithCounts{
			Comments:  cmt,
			Upvotes:   count.Up,
			Downvotes: count.Down,
			MyVote:    nil,
		})
	}

	for i := 0; i < len(result)-1; i++ {
		for j := i + 1; j < len(result); j++ {
			si := result[i].Upvotes - result[i].Downvotes
			sj := result[j].Upvotes - result[j].Downvotes
			if sj > si || (sj == si && result[j].CreatedAt.After(result[i].CreatedAt)) {
				result[i], result[j] = result[j], result[i]
			}
		}
	}

	ch.Set(cacheKey, result, 5*time.Minute)
	c.JSON(http.StatusOK, gin.H{"comments": result})
}

func DeleteComment(c *gin.Context, db *pg.DB, ch *cache.Cache) {
	commentIDStr := c.Param("comment_id")
	commentID, err := strconv.Atoi(commentIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	userID, err := getUserIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	var comment Models.Comments
	err = db.Model(&comment).Where("id = ?", commentID).Select()
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Not found"})
		return
	}

	isSysAdmin, _ := isSystemAdmin(db, userID)
	if comment.UserID != userID && !isSysAdmin {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden"})
		return
	}

	_, err = db.Model(&comment).Where("id = ?", commentID).Delete()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Delete failed"})
		return
	}

	ch.Delete(fmt.Sprintf("comments_post_%d", comment.PostID))
	c.JSON(http.StatusOK, gin.H{"message": "Deleted"})
}

func UpdateComment(c *gin.Context, db *pg.DB, ch *cache.Cache) {
	commentIDStr := c.Param("comment_id")
	commentID, err := strconv.Atoi(commentIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	userID, err := getUserIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	var existing Models.Comments
	err = db.Model(&existing).Where("id = ?", commentID).Select()
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Comment not found"})
		return
	}

	if existing.UserID != userID {
		isSysAdmin, _ := isSystemAdmin(db, userID)
		if !isSysAdmin {
			c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden"})
			return
		}
	}

	var payload struct {
		Body string `json:"body"`
	}
	if err := c.ShouldBindJSON(&payload); err != nil || strings.TrimSpace(payload.Body) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	_, err = db.Model(&existing).
		Set("body = ?", payload.Body).
		Set("created_at = ?", existing.CreatedAt).
		Where("id = ?", commentID).
		Update()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update comment"})
		return
	}

	ch.Delete("comments_post_" + strconv.Itoa(existing.PostID))
	c.JSON(http.StatusOK, gin.H{"message": "Comment updated"})
}
