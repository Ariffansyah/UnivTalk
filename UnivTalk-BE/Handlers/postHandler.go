package Handlers

import (
	"fmt"
	"log"
	"net/http"
	"strconv"
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

	cacheKey := fmt.Sprintf("posts_forum_%s", forumIDStr)

	if saved, found := ch.Get(cacheKey); found {
		c.JSON(http.StatusOK, gin.H{
			"posts": saved,
		})
		return
	}

	var posts []Models.Posts

	err = db.Model(&posts).Where("forum_id = ?", forumID).Order("created_at DESC").Select()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":  "Failed to retrieve posts",
			"detail": err.Error(),
		})
		log.Printf("Get Forum Posts Failed: %v", err.Error())
		return
	}

	ch.Set(cacheKey, posts, 5*time.Minute)

	c.JSON(http.StatusOK, gin.H{
		"posts": posts,
	})
}

func GetForumPostsByID(c *gin.Context, db *pg.DB, ch *cache.Cache) {
	postIDStr := c.Param("post_id")

	postID, err := strconv.Atoi(postIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Post ID format"})
		return
	}

	cacheKey := fmt.Sprintf("post_%d", postID)

	if saved, found := ch.Get(cacheKey); found {
		c.JSON(http.StatusOK, gin.H{
			"post": saved,
		})
		return
	}

	var post Models.Posts

	err = db.Model(&post).Where("id = ?", postID).Select()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":  "Failed to retrieve post",
			"detail": err.Error(),
		})

		log.Printf("Get Forum Post By ID Failed: %v", err.Error())
		return
	}

	ch.Set(cacheKey, post, 10*time.Minute)

	c.JSON(http.StatusOK, gin.H{
		"post": post,
	})
}

func CreatePost(c *gin.Context, db *pg.DB, ch *cache.Cache) {
	var post Models.Posts
	if err := c.ShouldBindJSON(&post); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":  "Invalid request",
			"detail": err.Error(),
		})
		log.Printf("Create Post Failed, Error: %v", err.Error())
		return
	}

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

	post.UserID = userID

	if post.ForumID == uuid.Nil || post.Title == "" || post.Body == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":  "All fields are required",
			"detail": "One or more fields are empty",
		})
		log.Printf("Create Post Failed: One or more fields are empty")
		return
	}

	_, err = db.Model(&post).Returning("*").Insert()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":  "Failed to create post",
			"detail": err.Error(),
		})
		log.Printf("Create Post Failed: %v", err.Error())
		return
	}

	ch.Delete(fmt.Sprintf("posts_forum_%s", post.ForumID))

	c.JSON(http.StatusCreated, gin.H{
		"message": "Post created successfully",
		"post":    post,
	})
}

func DeletePost(c *gin.Context, db *pg.DB, ch *cache.Cache) {
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

	var post Models.Posts
	err = db.Model(&post).Where("id = ?", postID).Select()
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Post not found"})
		return
	}

	isSysAdmin, _ := isSystemAdmin(db, userID)

	if post.UserID != userID && !isSysAdmin {
		c.JSON(http.StatusForbidden, gin.H{"error": "You are not allowed to delete this post"})
		return
	}

	res, err := db.Model(&post).Where("id = ?", postID).Delete()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":  "Failed to delete post",
			"detail": err.Error(),
		})
		log.Printf("Delete Post Failed: %v", err.Error())
		return
	}

	if res.RowsAffected() == 0 {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Post not found or already deleted",
		})
		return
	}

	ch.Delete(fmt.Sprintf("posts_forum_%s", post.ForumID))
	ch.Delete(fmt.Sprintf("post_%d", postID))

	c.JSON(http.StatusOK, gin.H{
		"message": "Post deleted successfully",
	})
}

func UpdatePost(c *gin.Context, db *pg.DB, ch *cache.Cache) {
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

	var existingPost Models.Posts
	err = db.Model(&existingPost).Where("id = ?", postID).Select()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":  "Failed to retrieve existing post",
			"detail": err.Error(),
		})
		return
	}

	if existingPost.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{
			"error":  "Unauthorized",
			"detail": "You can only update your own posts",
		})
		return
	}

	var post Models.Posts
	if err := c.ShouldBindJSON(&post); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":  "Invalid request",
			"detail": err.Error(),
		})
		return
	}

	if post.Title == "" || post.Body == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":  "All fields are required",
			"detail": "One or more fields are empty",
		})
		return
	}

	post.UpdatedAt = time.Now()

	res, err := db.Model(&post).Column("title", "body", "updated_at").Where("id = ?", postID).Update()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":  "Failed to update post",
			"detail": err.Error(),
		})
		log.Printf("Update Post Failed: %v", err.Error())
		return
	}

	if res.RowsAffected() == 0 {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Post not found or already deleted",
		})
		return
	}

	ch.Delete(fmt.Sprintf("posts_forum_%s", existingPost.ForumID))
	ch.Delete(fmt.Sprintf("post_%d", postID))

	c.JSON(http.StatusOK, gin.H{
		"message": "Post updated successfully",
		"post":    post,
	})
}

func CreateComment(c *gin.Context, db *pg.DB, ch *cache.Cache) {
	var comment Models.Comments
	if err := c.ShouldBindJSON(&comment); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

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

	comment.UserID = userID

	if comment.ParentCommentID != 0 {
		var parentComment Models.Comments
		err := db.Model(&parentComment).
			Where("id = ?", comment.ParentCommentID).
			Where("post_id = ?", comment.PostID).
			Select()
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Parent comment not found"})
			return
		}
		if parentComment.ParentCommentID != 0 {
			comment.ParentCommentID = parentComment.ParentCommentID
		}
	}

	_, err = db.Model(&comment).Returning("*").Insert()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ch.Delete(fmt.Sprintf("comments_post_%d", comment.PostID))

	c.JSON(http.StatusCreated, gin.H{
		"message": "Comment created",
		"comment": comment,
	})
}

func DeleteComment(c *gin.Context, db *pg.DB, ch *cache.Cache) {
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

	var comment Models.Comments
	err = db.Model(&comment).Where("id = ?", commentID).Select()
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Comment not found"})
		return
	}

	isSysAdmin, _ := isSystemAdmin(db, userID)

	if comment.UserID != userID && !isSysAdmin {
		c.JSON(http.StatusForbidden, gin.H{"error": "You are not allowed to delete this comment"})
		return
	}

	res, err := db.Model(&comment).Where("id = ?", commentID).Delete()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":  "Failed to delete comment",
			"detail": err.Error(),
		})
		log.Printf("Delete Comment Failed: %v", err.Error())
		return
	}

	if res.RowsAffected() == 0 {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Comment not found or already deleted",
		})
		return
	}

	ch.Delete(fmt.Sprintf("comments_post_%d", comment.PostID))

	c.JSON(http.StatusOK, gin.H{
		"message": "Comment deleted successfully",
	})
}

func GetPostComments(c *gin.Context, db *pg.DB, ch *cache.Cache) {
	postIDStr := c.Param("post_id")

	postID, err := strconv.Atoi(postIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Post ID format"})
		return
	}

	cacheKey := fmt.Sprintf("comments_post_%d", postID)

	if saved, found := ch.Get(cacheKey); found {
		c.JSON(http.StatusOK, gin.H{
			"comments": saved,
		})
		return
	}

	var comments []Models.Comments

	err = db.Model(&comments).Where("post_id = ?", postID).Order("created_at ASC").Select()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":  "Failed to retrieve comments",
			"detail": err.Error(),
		})
		log.Printf("Get Post Comments Failed: %v", err.Error())
		return
	}

	ch.Set(cacheKey, comments, 5*time.Minute)

	c.JSON(http.StatusOK, gin.H{
		"comments": comments,
	})
}
