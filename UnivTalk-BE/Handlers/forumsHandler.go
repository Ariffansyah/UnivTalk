package Handlers

import (
	"log"
	"net/http"

	"github.com/Ariffansyah/UnivTalk/Models"
	"github.com/gin-gonic/gin"
	"github.com/go-pg/pg/v10"
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
	var forums Models.Forums
	if err := c.ShouldBindBodyWithJSON(&forums); err != nil {
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
		log.Printf("Create Forum Failed: One or more fields are empty")
		return
	}

	forum := &Models.Forums{
		Title:       forums.Title,
		Description: forums.Description,
		CategoryID:  forums.CategoryID,
	}

	_, err := db.Model(forum).Insert()
	if err != nil {
		if pgErr, ok := err.(pg.Error); ok {
			code := pgErr.Field('C')
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Database error",
				"detail": map[string]any{
					"message": pgErr.Error(),
					"code":    code,
				},
			})
			log.Printf("Create Forum Failed: Database error - %v, code: %v", pgErr.Error(), code)
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":  "Failed to create forum",
			"detail": err.Error(),
		})
		log.Printf("Create Forum Failed: Failed to create forum - %v", err.Error())
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Forum created successfully",
	})
}

func GetForums(c *gin.Context, db *pg.DB) {
	var forums []Models.Forums

	// Fetch all forums from the database
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

func UpdateForum(c *gin.Context, db *pg.DB) {
	var forums Models.Forums
	if err := c.ShouldBindBodyWithJSON(&forums); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":  "Invalid request",
			"detail": err.Error(),
		})
		log.Printf("Update Forum Failed: %v", err.Error())
		return
	}

	if forums.Title == "" || forums.Description == "" || forums.CategoryID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":  "All fields are required",
			"detail": "One or more fields are empty",
		})
		log.Printf("Update Forum Failed: One or more fields are empty")
		return
	}

	forum := &Models.Forums{
		Title:       forums.Title,
		Description: forums.Description,
		CategoryID:  forums.CategoryID,
	}
	_, err := db.Model(forum).Where("id = ?", forums.ID).Update()
	if err != nil {
		if pgErr, ok := err.(pg.Error); ok {
			code := pgErr.Field('C')
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Database error",
				"detail": map[string]any{
					"message": pgErr.Error(),
					"code":    code,
				},
			})
			log.Printf("Update Forum Failed: Database error - %v, code: %v", pgErr.Error(), code)
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":  "Failed to update forum",
			"detail": err.Error(),
		})
		log.Printf("Update Forum Failed: Failed to update forum - %v", err.Error())
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Forum updated successfully",
	})
}
