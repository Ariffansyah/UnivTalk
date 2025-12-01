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

func GetCategories(c *gin.Context, db *pg.DB) {
	var categories []Models.Categories

	err := db.Model(&categories).Select()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":  "Failed to retrieve categories",
			"detail": err.Error(),
		})
		log.Printf("Get Categories Failed: %v", err.Error())
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"categories": categories,
	})
}

func CreateForum(c *gin.Context, db *pg.DB) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var forums Models.Forums
	if err := c.ShouldBindJSON(&forums); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":  "Invalid request",
			"detail": err.Error(),
		})
		log.Printf("Create Forum Failed, Error: %v", err.Error())
		return
	}

	if forums.Title == "" || forums.Description == "" || forums.CategoryID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":  "All fields are required",
			"detail": "One or more fields are empty",
		})
		return
	}

	forum := &Models.Forums{
		FID:         uuid.New(),
		Title:       forums.Title,
		Description: forums.Description,
		CategoryID:  forums.CategoryID,
	}

	_, err := db.Model(forum).Insert()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":  "Failed to create forum",
			"detail": err.Error(),
		})
		return
	}

	forumMember := &Models.ForumMembers{
		UserID:  userID.(uuid.UUID),
		ForumID: forum.FID,
		Role:    "admin",
	}

	_, err = db.Model(forumMember).Insert()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":  "Failed to create forum member",
			"detail": err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Forum created successfully",
	})
}

func GetForums(c *gin.Context, db *pg.DB) {
	var forums []Models.Forums

	err := db.Model(&forums).Select()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":  "Failed to retrieve forums",
			"detail": err.Error(),
		})
		log.Printf("Get Forums Failed: %v", err.Error())
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"forums": forums,
	})
}

func GetForumByID(c *gin.Context, db *pg.DB) {
	forumID := c.Param("forum_id")
	var forum Models.Forums

	err := db.Model(&forum).Where("fid = ?", forumID).Select()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":  "Failed to retrieve forum",
			"detail": err.Error(),
		})

		log.Printf("Get Forum By ID Failed: %v", err.Error())
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"forum": forum,
	})
}

func UpdateForum(c *gin.Context, db *pg.DB) {
	forumID := c.Param("forum_id")
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var forumMember Models.ForumMembers
	err := db.Model(&forumMember).
		Where("user_id = ?", userID.(uuid.UUID)).
		Where("forum_id = ?", forumID).
		Select()

	if err != nil || forumMember.Role != "admin" {
		c.JSON(http.StatusForbidden, gin.H{
			"error":  "Forbidden",
			"detail": "You do not have permission to update this forum",
		})
		return
	}

	var forums Models.Forums
	if err := c.ShouldBindJSON(&forums); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":  "Invalid request",
			"detail": err.Error(),
		})
		return
	}

	if forums.Title == "" || forums.Description == "" || forums.CategoryID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":  "All fields are required",
			"detail": "One or more fields are empty",
		})
		return
	}

	forums.UpdatedAt = time.Now()

	_, err = db.Model(&forums).
		Column("title", "description", "category_id", "updated_at").
		Where("fid = ?", forumID).
		Update()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":  "Failed to update forum",
			"detail": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Forum updated successfully",
	})
}

func DeleteForum(c *gin.Context, db *pg.DB) {
	forumID := c.Param("forum_id")
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var forumMember Models.ForumMembers
	err := db.Model(&forumMember).
		Where("user_id = ?", userID.(uuid.UUID)).
		Where("forum_id = ?", forumID).
		Select()

	if err != nil || forumMember.Role != "admin" {
		c.JSON(http.StatusForbidden, gin.H{
			"error":  "Forbidden",
			"detail": "You do not have permission to delete this forum",
		})
		return
	}

	forum := &Models.Forums{FID: uuid.MustParse(forumID)}
	_, err = db.Model(forum).Where("fid = ?", forumID).Delete()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":  "Failed to delete forum",
			"detail": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Forum deleted successfully",
	})
}

func GetForumMembersByID(c *gin.Context, db *pg.DB) {
	forumID := c.Param("forum_id")
	var forumMembers []Models.ForumMembers

	err := db.Model(&forumMembers).Where("forum_id = ?", forumID).Select()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":  "Failed to retrieve forum members",
			"detail": err.Error(),
		})
		log.Printf("Get Forum Members By ID Failed: %v", err.Error())
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"forum_members": forumMembers,
	})
}

func JoinForum(c *gin.Context, db *pg.DB) {
	forumID := c.Param("forum_id")
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	forumMember := &Models.ForumMembers{
		UserID:  userID.(uuid.UUID),
		ForumID: uuid.MustParse(forumID),
		Role:    "member",
	}

	_, err := db.Model(forumMember).Insert()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":  "Failed to join forum",
			"detail": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Joined forum successfully",
	})
}

func LeaveForum(c *gin.Context, db *pg.DB) {
	forumID := c.Param("forum_id")
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	forumMember := &Models.ForumMembers{
		UserID:  userID.(uuid.UUID),
		ForumID: uuid.MustParse(forumID),
	}
	_, err := db.Model(forumMember).Where("user_id = ? AND forum_id = ?", forumMember.UserID, forumMember.ForumID).Delete()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":  "Failed to leave forum",
			"detail": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Left forum successfully",
	})
}
