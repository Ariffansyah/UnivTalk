package Models

import (
	"time"

	"github.com/google/uuid"
)

type Users struct {
	UID           uuid.UUID `json:"uid"`
	Username      string    `json:"username"`
	FirstName     string    `json:"first_name"`
	LastName      string    `json:"last_name"`
	University    string    `json:"university"`
	Email         string    `json:"email"`
	FirstPassword string    `json:"first_password"`
	Password      string    `json:"password"`
	Status        string    `json:"status"`
	Salt          string    `json:"salt"`
}

type Payload struct {
	AccessToken string `json:"access_token"`
}

type Forums struct {
	ID          int       `json:"id"`
	FID         uuid.UUID `json:"fid"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	CategoryID  string    `json:"category_id"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type ForumMembers struct {
	UserID  uuid.UUID `json:"user_id"`
	ForumID uuid.UUID `json:"forum_id"`
	Role    string    `json:"role"`
}

type Posts struct {
	ID        int       `json:"id"`
	ForumID   uuid.UUID `json:"forum_id"`
	UserID    uuid.UUID `json:"user_id"`
	Title     string    `json:"title"`
	Body      string    `json:"body"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type Comments struct {
	ID        int       `json:"id"`
	PostID    int       `json:"post_id"`
	UserID    uuid.UUID `json:"user_id"`
	Body      string    `json:"body"`
	ParentID  int       `json:"parent_comment_id"`
	CreatedAt time.Time `json:"created_at"`
}

type Categories struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}
