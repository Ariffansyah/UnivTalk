package signSystem

import (
	"github.com/gin-gonic/gin"
	"github.com/go-pg/pg/v10"
)

type users struct {
	Username      string `json:"username"`
	FirstName     string `json:"first_name"`
	LastName      string `json:"last_name"`
	University    string `json:"university"`
	Email         string `json:"email"`
	FirstPassword string `json:"first_password"`
	Password      string `json:"password"`
}

func SignUp(c *gin.Context, db *pg.DB) {
}

func SignIn(c *gin.Context, db *pg.DB) {
}
