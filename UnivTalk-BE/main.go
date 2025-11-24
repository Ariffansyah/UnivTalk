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
		// GET
		protected.GET("/profile", func(c *gin.Context) {
			Handlers.GetProfile(c, db)
		})

		protected.GET("/categories", func(c *gin.Context) {
			Handlers.GetCategories(c, db)
		})

		protected.GET("/forums", func(c *gin.Context) {
			Handlers.GetForums(c, db)
		})

		// POST
		protected.POST("/forums/create", func(c *gin.Context) {
			Handlers.CreateForum(c, db)
		})

		// PUT
		protected.PUT("/forums/update", func(c *gin.Context) {
			Handlers.UpdateForum(c, db)
		})

		// DELETE
		protected.DELETE("/forums/delate", func(c *gin.Context) {
			Handlers.DeleteForum(c, db)
		})
	}

	router.Run()
}
