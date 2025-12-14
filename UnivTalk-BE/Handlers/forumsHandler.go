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

func getUserIDFromContext(c *gin.Context) (uuid.UUID, error) {
	userIDInterface, exists := c.Get("user_id")
	if !exists {
		return uuid.Nil, fmt.Errorf("Unauthorized")
	}

	userIDStr, ok := userIDInterface.(string)
	if ok {
		return uuid.Parse(userIDStr)
	}

	if uid, ok := userIDInterface.(uuid.UUID); ok {
		return uid, nil
	}

	return uuid.Nil, fmt.Errorf("User ID format error")
}

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
			"data": saved,
		})
		return
	}

	categories := make([]Models.Categories, 0)

	err := db.Model(&categories).Order("id ASC").Select()
	if err != nil {
		log.Printf("Get Categories Failed: %v", err.Error())
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to retrieve categories",
		})
		return
	}

	ch.Set(cacheKey, categories, 1*time.Hour)

	c.JSON(http.StatusOK, gin.H{
		"data": categories,
	})
}

func CreateForum(c *gin.Context, db *pg.DB, ch *cache.Cache) {
	userID, err := getUserIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	var reqBody Models.Forums
	if err := c.ShouldBindJSON(&reqBody); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request", "detail": err.Error()})
		return
	}

	if reqBody.Title == "" || reqBody.Description == "" || reqBody.CategoryID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "All fields are required",
		})
		return
	}

	newForum := &Models.Forums{
		FID:         uuid.New(),
		Title:       reqBody.Title,
		Description: reqBody.Description,
		CategoryID:  reqBody.CategoryID,
	}

	err = db.RunInTransaction(c.Request.Context(), func(tx *pg.Tx) error {
		_, err := tx.Model(newForum).Insert()
		if err != nil {
			return err
		}

		forumMember := &Models.ForumMembers{
			UserID:  userID,
			ForumID: newForum.FID,
			Role:    "admin",
		}
		_, err = tx.Model(forumMember).Insert()
		return err
	})
	if err != nil {
		log.Printf("Create Forum Transaction Failed: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create forum"})
		return
	}

	ch.Delete("forums_all")

	c.JSON(http.StatusCreated, gin.H{
		"message": "Forum created successfully",
		"data":    newForum,
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
	forumIDStr := c.Param("forum_id")

	forumID, err := uuid.Parse(forumIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Forum ID format"})
		return
	}

	cacheKey := fmt.Sprintf("forum_%s", forumIDStr)

	if saved, found := ch.Get(cacheKey); found {
		c.JSON(http.StatusOK, gin.H{
			"forum": saved,
		})
		return
	}

	var forum Models.Forums
	err = db.Model(&forum).Where("fid = ?", forumID).Select()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":  "Failed to retrieve forum",
			"detail": err.Error(),
		})
		return
	}

	ch.Set(cacheKey, forum, 30*time.Minute)

	c.JSON(http.StatusOK, gin.H{
		"forum": forum,
	})
}

func UpdateForum(c *gin.Context, db *pg.DB, ch *cache.Cache) {
	forumIDStr := c.Param("forum_id")

	forumID, err := uuid.Parse(forumIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Forum ID format"})
		return
	}

	userID, err := getUserIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
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

	var reqBody Models.Forums
	if err := c.ShouldBindJSON(&reqBody); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request", "detail": err.Error()})
		return
	}

	if reqBody.Title == "" || reqBody.Description == "" || reqBody.CategoryID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":  "All fields are required",
			"detail": "One or more fields are empty",
		})
		return
	}

	res, err := db.Model(&reqBody).
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

	if res.RowsAffected() == 0 {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Forum not found or already deleted",
		})
		return
	}

	ch.Delete("forums_all")
	ch.Delete(fmt.Sprintf("forum_%s", forumIDStr))

	c.JSON(http.StatusOK, gin.H{
		"message": "Forum updated successfully",
	})
}

func DeleteForum(c *gin.Context, db *pg.DB, ch *cache.Cache) {
	forumIDStr := c.Param("forum_id")

	forumID, err := uuid.Parse(forumIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Forum ID format"})
		return
	}

	userID, err := getUserIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
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

	forum := &Models.Forums{FID: forumID}
	res, err := db.Model(forum).Where("fid = ?", forumID).Delete()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":  "Failed to delete forum",
			"detail": err.Error(),
		})
		return
	}

	if res.RowsAffected() == 0 {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Forum not found or already deleted",
		})
		return
	}

	ch.Delete("forums_all")
	ch.Delete(fmt.Sprintf("forum_%s", forumIDStr))

	c.JSON(http.StatusOK, gin.H{
		"message": "Forum deleted successfully",
	})
}

func GetForumMembersByID(c *gin.Context, db *pg.DB, ch *cache.Cache) {
	forumIDStr := c.Param("forum_id")

	forumID, err := uuid.Parse(forumIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Forum ID format"})
		return
	}

	var forumMembers []Models.ForumMembers

	err = db.Model(&forumMembers).Where("forum_id = ?", forumID).Select()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":  "Failed to retrieve forum members",
			"detail": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"forum_members": forumMembers,
	})
}

func JoinForum(c *gin.Context, db *pg.DB, ch *cache.Cache) {
	forumIDStr := c.Param("forum_id")

	forumID, err := uuid.Parse(forumIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Forum ID format"})
		return
	}

	userID, err := getUserIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	forumMember := &Models.ForumMembers{
		UserID:  userID,
		ForumID: forumID,
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

func GetForumsByUserID(c *gin.Context, db *pg.DB, ch *cache.Cache) {
	userID, err := getUserIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	var forumMembers []Models.ForumMembers
	err = db.Model(&forumMembers).Where("user_id = ?", userID).Select()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":  "Failed to retrieve user's forums",
			"detail": err.Error(),
		})
		return
	}

	forumIDs := make([]uuid.UUID, len(forumMembers))
	for i, member := range forumMembers {
		forumIDs[i] = member.ForumID
	}

	var forums []Models.Forums
	err = db.Model(&forums).Where("fid IN (?)", pg.In(forumIDs)).Select()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":  "Failed to retrieve forums",
			"detail": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"forums": forums,
	})
}

func LeaveForum(c *gin.Context, db *pg.DB, ch *cache.Cache) {
	forumIDStr := c.Param("forum_id")

	forumID, err := uuid.Parse(forumIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Forum ID format"})
		return
	}

	userID, err := getUserIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	forumMember := &Models.ForumMembers{
		UserID:  userID,
		ForumID: forumID,
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
