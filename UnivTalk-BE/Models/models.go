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
