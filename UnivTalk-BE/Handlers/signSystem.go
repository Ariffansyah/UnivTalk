package Handlers

import (
	"encoding/base64"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/Ariffansyah/UnivTalk/Models"
	"github.com/gin-gonic/gin"
	"github.com/go-pg/pg/v10"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/argon2"
)

var AccessTokenSecret = os.Getenv("ACCESS_TOKEN_SECRET")

func hashPassword(password string, salt string) string {
	Salt := []byte(salt)
	hash := argon2.IDKey([]byte(password), Salt, 1, 64*1024, 4, 32)
	return base64.StdEncoding.EncodeToString(hash)
}

func comparePassword(hashedPwd, plainPwd string, salt string) bool {
	Salt := []byte(salt)
	hash := argon2.IDKey([]byte(plainPwd), Salt, 1, 64*1024, 4, 32)
	return hashedPwd == base64.StdEncoding.EncodeToString(hash)
}

func generateAccessToken(userID string) (string, error) {
	claims := jwt.MapClaims{
		"email": userID,
		"type":  "access",
		"exp":   time.Now().Add(time.Hour * 72).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(AccessTokenSecret))
}

func generateSalt() string {
	salt := uuid.New()
	return salt.String()
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

	salt := generateSalt()

	hashedPassword := hashPassword(newUser.Password, salt)

	uid, err := uuid.NewUUID()

	user := &Models.Users{
		UID:           uid,
		Username:      newUser.Username,
		FirstName:     newUser.FirstName,
		LastName:      newUser.LastName,
		University:    newUser.University,
		Email:         newUser.Email,
		FirstPassword: hashedPassword,
		Password:      hashedPassword,
		Status:        newUser.Status,
		Salt:          salt,
	}

	_, err = db.Model(user).Insert()
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

	salt := dbUser.Salt

	if !comparePassword(dbUser.Password, user.Password, salt) {
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

	c.JSON(http.StatusOK, gin.H{
		"message":     "Login Successful",
		"accessToken": accessToken,
	})
}

func VerifyToken(token string, db *pg.DB) error {
	cleanAccessToken := strings.TrimSpace(token)

	AccessToken, err := jwt.ParseWithClaims(cleanAccessToken, &jwt.MapClaims{}, func(token *jwt.Token) (any, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("Unexpected signin method: %v", token.Header["alg"])
		}
		return []byte(AccessTokenSecret), nil
	})
	if err != nil {
		log.Print("Token parsing error: %v", err)
		return err
	}

	claims, ok := AccessToken.Claims.(*jwt.MapClaims)
	if !ok || !AccessToken.Valid {
		log.Printf("Token are invalid or claims are malformed")
		return err
	}

	if exp, ok := (*claims)["exp"].(float64); ok {
		if int64(exp) < time.Now().Unix() {
			log.Printf("Token has expired")
			return err
		}
	} else {
		log.Printf("Expiration claim is missing or invalid")
		return err
	}

	email, ok := (*claims)["email"].(string)
	if !ok || email == "" {
		log.Printf("Email claims are missing or invalid")
		return err
	}

	exists, err := db.Model(new(Models.Users)).Where("email = ?", email).Exists()
	if err != nil {
		log.Printf("Database query error")
		return err
	}

	if !exists {
		log.Printf("Email does not exist")
		return err
	}
	return nil
}

func GetUserIDFromToken(token string, db *pg.DB) (string, error) {
	cleanAccessToken := strings.TrimSpace(token)

	AccessToken, err := jwt.ParseWithClaims(cleanAccessToken, &jwt.MapClaims{}, func(token *jwt.Token) (any, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("Unexpected signin method: %v", token.Header["alg"])
		}
		return []byte(AccessTokenSecret), nil
	})
	if err != nil {
		log.Print("Token parsing error: %v", err)
		return "", err
	}
	claims, ok := AccessToken.Claims.(*jwt.MapClaims)
	if !ok || !AccessToken.Valid {
		log.Printf("Token are invalid or claims are malformed")
		return "", err
	}

	email, ok := (*claims)["email"].(string)
	if !ok || email == "" {
		log.Printf("Email claims are missing or invalid")
		return "", err
	}

	var user Models.Users
	err = db.Model(&user).Column("uid").Where("email = ?", email).Select()
	if err != nil {
		log.Printf("Database query error")
		return "", err
	}

	return user.UID.String(), nil
}

func GetProfile(c *gin.Context, db *pg.DB) {
	authHeader := c.GetHeader("Authorization")
	if authHeader == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Authorization header missing",
		})
		return
	}
	parts := strings.SplitN(authHeader, " ", 2)
	if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Unauthorized",
		})
		return
	}

	cleanAccessToken := strings.TrimSpace(parts[1])

	AccessToken, err := jwt.ParseWithClaims(cleanAccessToken, &jwt.MapClaims{}, func(token *jwt.Token) (any, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("Unexpected signin method: %v", token.Header["akg"])
		}
		return []byte(AccessTokenSecret), nil
	})
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":  "Invalid access token",
			"detail": err.Error(),
		})
		log.Printf("Invalid access token")
		return
	}

	claims, ok := AccessToken.Claims.(*jwt.MapClaims)
	if !ok || !AccessToken.Valid {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid access token or claims are malformed",
		})
		log.Printf("Invalid access token")
		return
	}

	email, ok := (*claims)["email"].(string)
	if !ok || email == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Email claims are missing or invalid",
		})
		log.Printf("Email claims are missing or invalid")
		return
	}

	var dbUser Models.Users
	err = db.Model(&dbUser).Where("email = ?", email).Select()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":  "Invalid Email",
			"detail": err.Error(),
		})
		log.Printf("Database query error")
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":    "Profile query successful",
		"user_id":    dbUser.UID,
		"email":      dbUser.Email,
		"first_name": dbUser.FirstName,
		"last_name":  dbUser.LastName,
		"username":   dbUser.Username,
		"university": dbUser.University,
		"status":     dbUser.Status,
	})
}
