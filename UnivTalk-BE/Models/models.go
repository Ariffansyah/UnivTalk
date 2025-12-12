package Models

import (
	"time"

	"github.com/google/uuid"
)

type Users struct {
	UID           uuid.UUID `pg:"uid,pk,type:uuid,default:gen_random_uuid()" json:"user_id"`
	Username      string    `pg:"username,unique" json:"username" binding:"required"`
	Email         string    `pg:"email,unique" json:"email" binding:"required"`
	FirstName     string    `pg:"first_name" json:"first_name" binding:"required"`
	LastName      string    `pg:"last_name" json:"last_name" binding:"required"`
	Password      string    `pg:"password" json:"password,omitempty" binding:"required"`
	FirstPassword string    `pg:"first_password" json:"-"`
	Salt          string    `pg:"salt" json:"-"`
	University    string    `pg:"university" json:"university" binding:"required"`
	Status        string    `pg:"status" json:"status" binding:"required"`
	IsAdmin       bool      `pg:"is_admin,default:false" json:"is_admin"`
	CreatedAt     time.Time `pg:"created_at,default:now()" json:"created_at"`
}

type Payload struct {
	AccessToken string `json:"access_token"`
}

type Forums struct {
	ID          int       `json:"id"`
	FID         uuid.UUID `json:"fid"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	CategoryID  int       `json:"category_id"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type ForumMembers struct {
	UserID  uuid.UUID `json:"user_id"`
	ForumID uuid.UUID `json:"forum_id"`
	Role    string    `json:"role"`
}

type Posts struct {
	ID        int       `json:"id"`
	ForumID   uuid.UUID `json:"forum_id" form:"forum_id"`
	UserID    uuid.UUID `json:"user_id"`
	Title     string    `json:"title" form:"title"`
	Body      string    `json:"body" form:"body"`
	MediaURL  string    `json:"media_url"`
	MediaType string    `json:"media_type"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	User      *Users    `pg:"rel:has-one,fk:user_id" json:"user"`
}

type PostWithCounts struct {
	Posts
	Upvotes   int  `json:"upvotes"`
	Downvotes int  `json:"downvotes"`
	MyVote    *int `json:"my_vote"`
}

type Comments struct {
	ID              int       `pg:",pk" json:"id"`
	PostID          int       `json:"post_id"`
	UserID          uuid.UUID `json:"user_id"`
	ParentCommentID int       `json:"parent_comment_id"`
	Body            string    `json:"body"`
	CreatedAt       time.Time `json:"created_at"`
	User            *Users    `pg:"rel:has-one,fk:user_id" json:"user"`
}

type Categories struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

type Votes struct {
	ID        int       `json:"id"`
	UserID    uuid.UUID `json:"user_id"`
	PostID    *int      `json:"post_id,omitempty"`
	CommentID *int      `json:"comment_id,omitempty"`
	Value     int       `json:"value"`
}
