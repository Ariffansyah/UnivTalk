package Handlers

import (
	"encoding/base64"
	"fmt"
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
		"sub":  userID,
		"type": "access",
		"exp":  time.Now().Add(time.Hour * 72).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(AccessTokenSecret))
}

func generateSalt() string {
	return uuid.New().String()
}

func SignUp(c *gin.Context, db *pg.DB) {
	var newUser Models.Users
	if err := c.ShouldBindJSON(&newUser); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":  "Validasi gagal",
			"detail": "Semua field wajib diisi dengan format yang benar",
		})
		return
	}

	status := strings.ToLower(strings.TrimSpace(newUser.Status))
	if status != "active" && status != "inactive" {
		status = "active"
	}

	salt := generateSalt()
	hashedPassword := hashPassword(newUser.Password, salt)

	user := &Models.Users{
		UID:           uuid.New(),
		Username:      newUser.Username,
		FirstName:     newUser.FirstName,
		LastName:      newUser.LastName,
		University:    newUser.University,
		Email:         newUser.Email,
		Password:      hashedPassword,
		FirstPassword: hashedPassword,
		Status:        status,
		Salt:          salt,
		IsAdmin:       false,
		CreatedAt:     time.Now(),
	}

	_, err := db.Model(user).Insert()
	if err != nil {
		if pgErr, ok := err.(pg.Error); ok && pgErr.Field('C') == "23505" {
			c.JSON(http.StatusConflict, gin.H{
				"error":  "User sudah terdaftar",
				"detail": "Username atau Email sudah digunakan",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "User created successfully"})
}

func SignIn(c *gin.Context, db *pg.DB) {
	var input struct {
		Username string `json:"username"`
		Email    string `json:"email"`
		Password string `json:"password" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Format data tidak valid"})
		return
	}

	var dbUser Models.Users
	query := db.Model(&dbUser)

	if input.Email != "" {
		query.Where("email = ?", input.Email)
	} else if input.Username != "" {
		query.Where("username = ?", input.Username)
	} else {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Email atau Username wajib diisi"})
		return
	}

	if err := query.Select(); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Email/Username atau Password salah"})
		return
	}

	if !comparePassword(dbUser.Password, input.Password, dbUser.Salt) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Email/Username atau Password salah"})
		return
	}

	accessToken, err := generateAccessToken(dbUser.UID.String())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat sesi"})
		return
	}

	c.SetCookie("token", accessToken, 3600*72, "/", "", false, true)
	c.JSON(http.StatusOK, gin.H{"message": "Login Berhasil"})
}

func SignOut(c *gin.Context) {
	c.SetCookie("token", "", -1, "/", "", false, true)
	c.JSON(http.StatusOK, gin.H{"message": "Logged out successfully"})
}

func VerifyToken(token string, db *pg.DB) error {
	cleanToken := strings.TrimSpace(token)
	if cleanToken == "" {
		return fmt.Errorf("token kosong")
	}

	parsedToken, err := jwt.Parse(cleanToken, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return []byte(AccessTokenSecret), nil
	})
	if err != nil {
		return fmt.Errorf("invalid token: %v", err)
	}

	claims, ok := parsedToken.Claims.(jwt.MapClaims)
	if !ok || !parsedToken.Valid {
		return fmt.Errorf("token tidak valid")
	}

	if exp, ok := claims["exp"].(float64); ok {
		if int64(exp) < time.Now().Unix() {
			return fmt.Errorf("token expired")
		}
	}

	uidStr, ok := claims["sub"].(string)
	if !ok || uidStr == "" {
		return fmt.Errorf("invalid claims")
	}

	exists, err := db.Model((*Models.Users)(nil)).Where("uid = ?", uidStr).Exists()
	if err != nil || !exists {
		return fmt.Errorf("user tidak ditemukan")
	}

	return nil
}

func GetUserIDFromToken(token string, db *pg.DB) (uuid.UUID, error) {
	cleanToken := strings.TrimSpace(token)
	parsedToken, err := jwt.Parse(cleanToken, func(t *jwt.Token) (interface{}, error) {
		return []byte(AccessTokenSecret), nil
	})

	if err != nil || !parsedToken.Valid {
		return uuid.Nil, fmt.Errorf("token invalid")
	}

	claims, ok := parsedToken.Claims.(jwt.MapClaims)
	if !ok {
		return uuid.Nil, fmt.Errorf("invalid claims")
	}

	uidStr, ok := claims["sub"].(string)
	if !ok {
		return uuid.Nil, fmt.Errorf("uid missing")
	}

	return uuid.Parse(uidStr)
}

func GetProfile(c *gin.Context, db *pg.DB) {
	val, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	userID := val.(uuid.UUID)
	var user Models.Users
	if err := db.Model(&user).Where("uid = ?", userID).Select(); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"user_id":    user.UID,
		"username":   user.Username,
		"email":      user.Email,
		"first_name": user.FirstName,
		"last_name":  user.LastName,
		"university": user.University,
		"status":     user.Status,
		"is_admin":   user.IsAdmin,
	})
}

func GetUserByID(c *gin.Context, db *pg.DB) {
	userIDParam := c.Param("user_id")
	userID, err := uuid.Parse(userIDParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID format"})
		return
	}

	var user Models.Users
	if err := db.Model(&user).Where("uid = ?", userID).Select(); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"user_id":    user.UID,
		"username":   user.Username,
		"email":      user.Email,
		"first_name": user.FirstName,
		"last_name":  user.LastName,
		"university": user.University,
		"status":     user.Status,
		"is_admin":   user.IsAdmin,
	})
}

func UpdateProfile(c *gin.Context, db *pg.DB) {
	val, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userID := val.(uuid.UUID)

	var payload struct {
		FirstName  string `json:"first_name"`
		LastName   string `json:"last_name"`
		Username   string `json:"username"`
		University string `json:"university"`
		Status     string `json:"status"`
	}
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	status := strings.ToLower(strings.TrimSpace(payload.Status))
	if status != "" && status != "active" && status != "inactive" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Status must be 'active' or 'inactive'"})
		return
	}

	var user Models.Users
	if err := db.Model(&user).Where("uid = ?", userID).Select(); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	if payload.Username != "" && payload.Username != user.Username {
		exists, err := db.Model((*Models.Users)(nil)).Where("username = ?", payload.Username).Exists()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
			return
		}
		if exists {
			c.JSON(http.StatusConflict, gin.H{"error": "Username already taken"})
			return
		}
	}

	update := db.Model(&user).Where("uid = ?", userID)
	if payload.FirstName != "" {
		update.Set("first_name = ?", payload.FirstName)
	}
	if payload.LastName != "" {
		update.Set("last_name = ?", payload.LastName)
	}
	if payload.Username != "" {
		update.Set("username = ?", payload.Username)
	}
	if payload.University != "" {
		update.Set("university = ?", payload.University)
	}
	if status != "" {
		update.Set("status = ?", status)
	}

	if _, err := update.Update(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update profile"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Profile updated"})
}

func ChangePassword(c *gin.Context, db *pg.DB) {
	val, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userID := val.(uuid.UUID)

	var payload struct {
		CurrentPassword string `json:"current_password"`
		NewPassword     string `json:"new_password"`
	}
	if err := c.ShouldBindJSON(&payload); err != nil || strings.TrimSpace(payload.CurrentPassword) == "" || strings.TrimSpace(payload.NewPassword) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	var user Models.Users
	if err := db.Model(&user).Where("uid = ?", userID).Select(); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	if !comparePassword(user.Password, payload.CurrentPassword, user.Salt) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Current password is incorrect"})
		return
	}

	newHashed := hashPassword(payload.NewPassword, user.Salt)
	if _, err := db.Model(&user).Where("uid = ?", userID).Set("password = ?", newHashed).Update(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to change password"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Password changed successfully"})
}

func DeleteAccount(c *gin.Context, db *pg.DB) {
	val, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userID := val.(uuid.UUID)

	var payload struct {
		Password string `json:"password"`
	}
	if err := c.ShouldBindJSON(&payload); err != nil || strings.TrimSpace(payload.Password) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	var user Models.Users
	if err := db.Model(&user).Where("uid = ?", userID).Select(); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	if !comparePassword(user.Password, payload.Password, user.Salt) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Password is incorrect"})
		return
	}

	if _, err := db.Model(&user).Where("uid = ?", userID).Delete(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete account"})
		return
	}

	c.SetCookie("token", "", -1, "/", "", false, true)
	c.JSON(http.StatusOK, gin.H{"message": "Account deleted successfully"})
}
