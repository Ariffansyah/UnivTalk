package Handlers

import (
	"log"
	"net/http"
	"time"

	"github.com/Ariffansyah/UnivTalk/Models"
	"github.com/gin-gonic/gin"
	"github.com/go-pg/pg/v10"
	"github.com/google/uuid"
)

func GetForumPosts(c *gin.Context, db *pg.DB) {
	forumID := c.Param("forum_id")
	var posts []Models.Posts

	err := db.Model(&posts).Where("forum_id = ?", forumID).Order("created_at DESC").Select()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":  "Failed to retrieve posts",
			"detail": err.Error(),
		})
		log.Printf("Get Forum Posts Failed: %v", err.Error())
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"posts": posts,
	})
}

func GetForumPostsByID(c *gin.Context, db *pg.DB) {
	postID := c.Param("post_id")
	var post Models.Posts

	err := db.Model(&post).Where("id = ?", postID).Select()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":  "Failed to retrieve post",
			"detail": err.Error(),
		})

		log.Printf("Get Forum Post By ID Failed: %v", err.Error())
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"post": post,
	})
}

func CreatePost(c *gin.Context, db *pg.DB) {
	var post Models.Posts
	if err := c.ShouldBindJSON(&post); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":  "Invalid request",
			"detail": err.Error(),
		})
		log.Printf("Create Post Failed, Error: %v", err.Error())
		return
	}

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	post.UserID = userID.(uuid.UUID)

	if post.ForumID == uuid.Nil || post.Title == "" || post.Body == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":  "All fields are required",
			"detail": "One or more fields are empty",
		})
		log.Printf("Create Post Failed: One or more fields are empty")
		return
	}

	_, err := db.Model(&post).Returning("*").Insert()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":  "Failed to create post",
			"detail": err.Error(),
		})
		log.Printf("Create Post Failed: %v", err.Error())
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Post created successfully",
		"post":    post,
	})
}

func DeletePost(c *gin.Context, db *pg.DB) {
	postID := c.Param("post_id")
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var post Models.Posts
	err := db.Model(&post).Where("id = ?", postID).Select()
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Post not found"})
		return
	}

	if post.UserID != userID.(uuid.UUID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "You are not allowed to delete this post"})
		return
	}

	_, err = db.Model(&post).Where("id = ?", postID).Delete()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":  "Failed to delete post",
			"detail": err.Error(),
		})
		log.Printf("Delete Post Failed: %v", err.Error())
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Post deleted successfully",
	})
}

func UpdatePost(c *gin.Context, db *pg.DB) {
	postID := c.Param("post_id")
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var existingPost Models.Posts
	err := db.Model(&existingPost).Where("id = ?", postID).Select()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":  "Failed to retrieve existing post",
			"detail": err.Error(),
		})
		return
	}

	if existingPost.UserID != userID.(uuid.UUID) {
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

	_, err = db.Model(&post).Column("title", "body", "updated_at").Where("id = ?", postID).Update()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":  "Failed to update post",
			"detail": err.Error(),
		})
		log.Printf("Update Post Failed: %v", err.Error())
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Post updated successfully",
		"post":    post,
	})
}

func CreateComment(c *gin.Context, db *pg.DB) {
	var comment Models.Comments
	if err := c.ShouldBindJSON(&comment); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	comment.UserID = userID.(uuid.UUID)

	if comment.ParentID != 0 {
		var parentComment Models.Comments
		err := db.Model(&parentComment).
			Where("id = ?", comment.ParentID).
			Where("post_id = ?", comment.PostID).
			Select()
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Parent comment not found"})
			return
		}
		if parentComment.ParentID != 0 {
			comment.ParentID = parentComment.ParentID
		}
	}

	_, err := db.Model(&comment).Returning("*").Insert()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Comment created",
		"comment": comment,
	})
}

func DeleteComment(c *gin.Context, db *pg.DB) {
	commentID := c.Param("comment_id")
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var comment Models.Comments
	err := db.Model(&comment).Where("id = ?", commentID).Select()
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Comment not found"})
		return
	}

	if comment.UserID != userID.(uuid.UUID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "You are not allowed to delete this comment"})
		return
	}

	_, err = db.Model(&comment).Where("id = ?", commentID).Delete()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":  "Failed to delete comment",
			"detail": err.Error(),
		})
		log.Printf("Delete Comment Failed: %v", err.Error())
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Comment deleted successfully",
	})
}

func GetPostComments(c *gin.Context, db *pg.DB) {
	postID := c.Param("post_id")
	var comments []Models.Comments

	err := db.Model(&comments).Where("post_id = ?", postID).Order("created_at ASC").Select()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":  "Failed to retrieve comments",
			"detail": err.Error(),
		})
		log.Printf("Get Post Comments Failed: %v", err.Error())
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"comments": comments,
	})
}
