package main

import (
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/Ariffansyah/UnivTalk/Handlers"
	"github.com/Ariffansyah/UnivTalk/Models"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/go-pg/pg/v10"
	"github.com/joho/godotenv"
	"github.com/patrickmn/go-cache"
)

func AuthMiddleware(db *pg.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Authorization header missing",
			})
			c.Abort()
			return
		}
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Unauthorized",
			})
			c.Abort()
			return
		}

		token := parts[1]

		if err := Handlers.VerifyToken(token, db); err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": err.Error(),
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	router := gin.Default()

	db := pg.Connect(&pg.Options{
		Addr:     os.Getenv("DB_ADDR"),
		User:     os.Getenv("DB_USER"),
		Password: os.Getenv("DB_PASSWORD"),
		Database: os.Getenv("DB_NAME"),
	})

	if db == nil {
		log.Fatal("Failed to connect to the database")
	}

	defer db.Close()

	router.SetTrustedProxies([]string{"127.0.0.1"})

	cacheData := cache.New(15*time.Minute, 30*time.Minute)

	clientAddrEnv := os.Getenv("CLIENT_ADDR")
	allowedOrigins := []string{}
	if clientAddrEnv != "" {
		for _, origin := range strings.Split(clientAddrEnv, ",") {
			allowedOrigins = append(allowedOrigins, strings.TrimSpace(origin))
		}
	}
	router.Use(cors.New(cors.Config{
		AllowOrigins:     allowedOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * 60 * 60,
	}))

	// Public routes
	// GET
	router.GET("/universities", func(c *gin.Context) {
		Handlers.GetUniversities(c, cacheData)
	})

	// POST
	router.POST("/signup", func(c *gin.Context) {
		Handlers.SignUp(c, db)
	})
	router.POST("/signin", func(c *gin.Context) {
		Handlers.SignIn(c, db)
	})

	router.POST("/verifytoken", func(c *gin.Context) {
		var payload Models.Payload
		if err := c.ShouldBindBodyWithJSON(&payload); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":  "Access token not found",
				"detail": err.Error(),
			})
			return
		}

		if err := Handlers.VerifyToken(payload.AccessToken, db); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":  "Access token is invalid",
				"detail": err.Error(),
			})
			return
		}
		c.JSON(http.StatusOK, gin.H{
			"message": "Access token valid",
		})
	})

	// Protected routes
	protected := router.Group("/", AuthMiddleware(db))
	{
		protected.GET("/profile", func(c *gin.Context) { Handlers.GetProfile(c, db) })
		protected.GET("/categories", func(c *gin.Context) { Handlers.GetCategories(c, db) })

		// GROUP: FORUMS
		// Prefix URL: /forums
		forums := protected.Group("/forums")
		{
			forums.GET("/", func(c *gin.Context) { Handlers.GetForums(c, db) })
			forums.POST("/", func(c *gin.Context) { Handlers.CreateForum(c, db) })
			forums.GET("/:forum_id", func(c *gin.Context) { Handlers.GetForumByID(c, db) })
			forums.PUT("/:forum_id", func(c *gin.Context) { Handlers.UpdateForum(c, db) })
			forums.DELETE("/:forum_id", func(c *gin.Context) { Handlers.DeleteForum(c, db) })
			forums.POST("/:forum_id/join", func(c *gin.Context) { Handlers.JoinForum(c, db) })
			forums.POST("/:forum_id/leave", func(c *gin.Context) { Handlers.LeaveForum(c, db) })
			forums.GET("/:forum_id/posts", func(c *gin.Context) { Handlers.GetForumPosts(c, db) })
			forums.GET("/:forum_id/members", func(c *gin.Context) { Handlers.GetForumMembersByID(c, db) })
		}

		// GROUP: POSTS
		// Prefix URL: /posts
		posts := protected.Group("/posts")
		{
			posts.POST("/", func(c *gin.Context) { Handlers.CreatePost(c, db) })
			posts.GET("/:post_id", func(c *gin.Context) { Handlers.GetForumPostsByID(c, db) })
			posts.PUT("/:post_id", func(c *gin.Context) { Handlers.UpdatePost(c, db) })
			posts.DELETE("/:post_id", func(c *gin.Context) { Handlers.DeletePost(c, db) })
			posts.GET("/:post_id/comments", func(c *gin.Context) { Handlers.GetPostComments(c, db) })
		}

		// GROUP: COMMENTS
		// Prefix URL: /comments
		comments := protected.Group("/comments")
		{
			comments.POST("/", func(c *gin.Context) { Handlers.CreateComment(c, db) })
			comments.DELETE("/:comment_id", func(c *gin.Context) { Handlers.DeleteComment(c, db) })
		}
	}
	router.Run()
}
