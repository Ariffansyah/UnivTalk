package main

import (
	"os"

	"github.com/Ariffansyah/UnivTalk/signSystem"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/go-pg/pg/v10"
)

func main() {
	router := gin.Default()

	db := pg.Connect(&pg.Options{
		Addr:     os.Getenv("DB_ADDR"),
		User:     os.Getenv("DB_USER"),
		Password: os.Getenv("DB_PWD"),
		Database: os.Getenv("DB_NAME"),
	})

	router.SetTrustedProxies([]string{"127.0.01"})

	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{os.Getenv("CLIENT_ADDR")},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * 60 * 60,
	}))

	// POST
	router.POST("/signup", func(c *gin.Context) {
		signSystem.SignUp(c, db)
	})

	router.POST("/signin", func(c *gin.Context) {
		signSystem.SignIn(c, db)
	})

	// GET

	router.Run()
}
