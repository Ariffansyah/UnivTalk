package main

import (
	"log"
	"os"
	"strings"
	"time"

	"github.com/Ariffansyah/UnivTalk/Handlers"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/go-pg/pg/v10"
	"github.com/joho/godotenv"
	"github.com/patrickmn/go-cache"
)

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

	router.SetTrustedProxies([]string{"127.0.01"})

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

	// POST
	router.POST("/signup", func(c *gin.Context) {
		Handlers.SignUp(c, db)
	})

	router.POST("/signin", func(c *gin.Context) {
		Handlers.SignIn(c, db)
	})

	// GET
	router.GET("/universities", func(c *gin.Context) {
		Handlers.GetUniversities(c, cacheData)
	})

	router.Run()
}
