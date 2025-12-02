package Handlers

import (
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/Ariffansyah/UnivTalk/Models"
	"github.com/gin-gonic/gin"
	"github.com/go-pg/pg/v10"
	"github.com/google/uuid"
	"github.com/patrickmn/go-cache"
)

func isSystemAdmin(db *pg.DB, userID uuid.UUID) (bool, error) {
	var user Models.Users
	err := db.Model(&user).Column("is_admin").Where("uid = ?", userID).Select()
	if err != nil {
		return false, err
	}
	return user.IsAdmin, nil
}

func GetCategories(c *gin.Context, db *pg.DB, ch *cache.Cache) {
	cacheKey := "categories_all"

	if saved, found := ch.Get(cacheKey); found {
		c.JSON(http.StatusOK, gin.H{
			"categories": saved,
		})
		return
	}

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

	ch.Set(cacheKey, categories, 1*time.Hour)

	c.JSON(http.StatusOK, gin.H{
		"categories": categories,
	})
}

func CreateForum(c *gin.Context, db *pg.DB, ch *cache.Cache) {
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

	_, err = db.Model(forum).Insert()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":  "Failed to create forum",
			"detail": err.Error(),
		})
		return
	}

	forumMember := &Models.ForumMembers{
		UserID:  userID,
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

	ch.Delete("forums_all")

	c.JSON(http.StatusCreated, gin.H{
		"message": "Forum created successfully",
	})
}

func GetForums(c *gin.Context, db *pg.DB, ch *cache.Cache) {
	cacheKey := "forums_all"

	if saved, found := ch.Get(cacheKey); found {
		c.JSON(http.StatusOK, gin.H{
			"forums": saved,
		})
		return
	}

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

	ch.Set(cacheKey, forums, 10*time.Minute)

	c.JSON(http.StatusOK, gin.H{
		"forums": forums,
	})
}

func GetForumByID(c *gin.Context, db *pg.DB, ch *cache.Cache) {
	forumID := c.Param("forum_id")
	cacheKey := fmt.Sprintf("forum_%s", forumID)

	if saved, found := ch.Get(cacheKey); found {
		c.JSON(http.StatusOK, gin.H{
			"forum": saved,
		})
		return
	}

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

	ch.Set(cacheKey, forum, 30*time.Minute)

	c.JSON(http.StatusOK, gin.H{
		"forum": forum,
	})
}

func UpdateForum(c *gin.Context, db *pg.DB, ch *cache.Cache) {
	forumID := c.Param("forum_id")

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

	isSysAdmin, errSys := isSystemAdmin(db, userID)
	if errSys != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to verify user privileges"})
		return
	}

	hasAccess := isSysAdmin

	if !hasAccess {
		var forumMember Models.ForumMembers
		err := db.Model(&forumMember).
			Where("user_id = ?", userID).
			Where("forum_id = ?", forumID).
			Select()

		if err == nil && forumMember.Role == "admin" {
			hasAccess = true
		}
	}

	if !hasAccess {
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

	ch.Delete("forums_all")
	ch.Delete(fmt.Sprintf("forum_%s", forumID))

	c.JSON(http.StatusOK, gin.H{
		"message": "Forum updated successfully",
	})
}

func DeleteForum(c *gin.Context, db *pg.DB, ch *cache.Cache) {
	forumID := c.Param("forum_id")

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

	isSysAdmin, errSys := isSystemAdmin(db, userID)
	if errSys != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to verify user privileges"})
		return
	}

	hasAccess := isSysAdmin

	if !hasAccess {
		var forumMember Models.ForumMembers
		err := db.Model(&forumMember).
			Where("user_id = ?", userID).
			Where("forum_id = ?", forumID).
			Select()

		if err == nil && forumMember.Role == "admin" {
			hasAccess = true
		}
	}

	if !hasAccess {
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

	ch.Delete("forums_all")
	ch.Delete(fmt.Sprintf("forum_%s", forumID))

	c.JSON(http.StatusOK, gin.H{
		"message": "Forum deleted successfully",
	})
}

func GetForumMembersByID(c *gin.Context, db *pg.DB, ch *cache.Cache) {
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

func JoinForum(c *gin.Context, db *pg.DB, ch *cache.Cache) {
	forumID := c.Param("forum_id")

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

	forumMember := &Models.ForumMembers{
		UserID:  userID,
		ForumID: uuid.MustParse(forumID),
		Role:    "member",
	}

	_, err = db.Model(forumMember).Insert()
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

func LeaveForum(c *gin.Context, db *pg.DB, ch *cache.Cache) {
	forumID := c.Param("forum_id")

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

	forumMember := &Models.ForumMembers{
		UserID:  userID,
		ForumID: uuid.MustParse(forumID),
	}
	_, err = db.Model(forumMember).Where("user_id = ? AND forum_id = ?", forumMember.UserID, forumMember.ForumID).Delete()
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
