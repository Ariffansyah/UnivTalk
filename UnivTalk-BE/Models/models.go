package Models

type Users struct {
	Username      string `json:"username"`
	FirstName     string `json:"first_name"`
	LastName      string `json:"last_name"`
	University    string `json:"university"`
	Email         string `json:"email"`
	FirstPassword string `json:"first_password"`
	Password      string `json:"password"`
	Status        string `json:"status"`
}

type Payload struct {
	AccessToken string `json:"access_token"`
}

type Forums struct {
	ID          int    `json:"id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	CategoryID  string `json:"category_id"`
}

type Posts struct {
	ForumID     int    `json:"forum_id"`
	AuthorEmail string `json:"author_email"`
	Title       string `json:"title"`
	Body        string `json:"body"`
}

type Comments struct {
	PostID      int    `json:"post_id"`
	AuthorEmail string `json:"author_email"`
	Body        string `json:"body"`
	ParentID    int    `json:"parent_id"`
}

type Categories struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}
