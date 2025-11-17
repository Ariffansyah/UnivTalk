package Handlers

import (
	"encoding/base64"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/Ariffansyah/UnivTalk/Models"
	"github.com/gin-gonic/gin"
	"github.com/go-pg/pg/v10"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/argon2"
)

var AccessTokenSecret = os.Getenv("ACCESS_TOKEN_SECRET")

func hashPassword(password string) string {
	salt := []byte(os.Getenv("PASSWORD_SALT"))
	hash := argon2.IDKey([]byte(password), salt, 1, 64*1024, 4, 32)
	return base64.StdEncoding.EncodeToString(hash)
}

func comparePassword(hashedPwd, plainPwd string) bool {
	salt := []byte(os.Getenv("PASSWORD_SALT"))
	hash := argon2.IDKey([]byte(plainPwd), salt, 1, 64*1024, 4, 32)
	return hashedPwd == base64.StdEncoding.EncodeToString(hash)
}

func generateAccessToken(userID string) (string, error) {
	claims := jwt.MapClaims{
		"user_id": userID,
		"typ":     "access",
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(AccessTokenSecret))
}

func SignUp(c *gin.Context, db *pg.DB) {
	var newUser Models.Users
	if err := c.ShouldBindJSON(&newUser); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":  "Invalid request",
			"detail": err.Error(),
		})
		log.Println("Signup failed: Invalid request -", err.Error())
		return
	}

	if newUser.Email == "" || newUser.Password == "" || newUser.Username == "" ||
		newUser.FirstName == "" || newUser.LastName == "" ||
		newUser.University == "" || newUser.Status == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":  "All fields are required",
			"detail": "One or more required fields are empty.",
		})
		log.Println("Signup failed: Missing fields")
		return
	}

	hashedPassword := hashPassword(newUser.Password)

	user := &Models.Users{
		Username:      newUser.Username,
		FirstName:     newUser.FirstName,
		LastName:      newUser.LastName,
		University:    newUser.University,
		Email:         newUser.Email,
		FirstPassword: hashedPassword,
		Password:      hashedPassword,
		Status:        newUser.Status,
	}

	_, err := db.Model(user).Insert()
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
			log.Printf("Signup failed: Database error - %v, code: %v", pgErr.Error(), code)
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":  "Failed to create user",
			"detail": err.Error(),
		})
		log.Println("Signup failed: Failed to create user -", err.Error())
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "User created successfully"})
}

func SignIn(c *gin.Context, db *pg.DB) {
	var user Models.Users
	if err := c.ShouldBindJSON(&user); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":  "Invalid request",
			"detail": err.Error(),
		})
		log.Println("Signin failed: Invalid request -", err.Error())
		return
	}

	queryID := ""
	userID := ""

	if user.Email != "" {
		queryID = "email = ?"
		userID = user.Email
	}

	if user.Username != "" {
		queryID = "username = ?"
		userID = user.Username
	}

	if userID == "" || user.Password == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":  "Username/email and password are required",
			"detail": "One or more required fields are empty.",
		})
		log.Println("Signin failed: Missing email or password")
		return
	}

	var dbUser Models.Users
	err := db.Model(&dbUser).Where(queryID, userID).Select()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":  "Invalid email/username or password",
			"detail": err.Error(),
		})
		log.Println("Database query error.")
		return
	}

	if !comparePassword(dbUser.Password, user.Password) {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid email/username or password",
		})
		log.Println("Invalid email/username or password")
		return
	}

	accessToken, err := generateAccessToken(dbUser.Email)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":  "Failed to generate access token",
			"detail": err.Error(),
		})
		log.Println("Failed to generate access token")
		return

	}

	c.JSON(http.StatusCreated, gin.H{
		"message":     "Login Successful",
		"accessToken": accessToken,
	})
}

func VerifyToken(c *gin.Context, db *pg.DB) {
	var payload Models.Payload
	if err := c.ShouldBindBodyWithJSON(payload); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":  "Failed to retreive access token",
			"detail": err.Error(),
		})
		log.Println("Failed to retreive access token")
		return
	}

	cleanAccessToken := strings.TrimSpace(payload.AccessToken)

	AccessToken, err := jwt.ParseWithClaims(cleanAccessToken, &jwt.MapClaims{}, func(token *jwt.Token) (any, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("Unexpected signin method: %v", token.Header["alg"])
		}
		return []byte(AccessTokenSecret), nil
	})
	if err != nil {
		message := "Token parsing error: " + err.Error()
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":  message,
			"detail": err.Error(),
		})
		log.Print("Token parsing error: %v", err)
		return
	}

	claims, ok := AccessToken.Claims.(*jwt.MapClaims)
	if !ok || !AccessToken.Valid {
		log.Printf("Token are invalid or claims are malformed")
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Invalid token",
		})
		return
	}

	email, ok := (*claims)["email"].(string)
	if !ok || email == "" {
		log.Printf("Email claims are missing or invalid")
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Invalid token data",
		})
		return
	}

	exists, err := db.Model(new(Models.Users)).Where("email = ?", email).Exists()
	if err != nil {
		log.Printf("Database query error")
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Database query error",
		})
		return
	}

	if !exists {
		log.Printf("Email does not exist")
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Email does not exist",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Access token is valid",
	})
}
