# UnivTalk
UnivTalk is a web application designed for university students to connect and collaborate.

## Backend Setup
Run the following command to install the necessary Go modules in the backend directory:

```bash
go mod tidy
````

Run the application using:

```bash
go run main.go
```

Setup `.env` file based on the provided `.envExample` file.

## Database Schema

Before running the application, please setup your PostgreSQL database with the following schema:

```sql
-- 1. Create enum for user status
CREATE TYPE user_status AS ENUM ('active', 'inactive');

-- 2. Categories table
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT
);

-- 3. Users table (keeping as original - backend generates UID)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    uid UUID NOT NULL UNIQUE,
    username VARCHAR(32) NOT NULL UNIQUE,
    first_name VARCHAR(64) NOT NULL,
    last_name VARCHAR(64) NOT NULL,
    university VARCHAR(128) NOT NULL,
    email VARCHAR(128) NOT NULL UNIQUE,
    password VARCHAR(128) NOT NULL,
    first_password VARCHAR(128) NOT NULL,
    status user_status NOT NULL DEFAULT 'active',
    salt VARCHAR(64) NOT NULL,
    is_admin BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Forums table
CREATE TABLE forums (
    id SERIAL PRIMARY KEY,
    fid UUID NOT NULL UNIQUE,
    title VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. Forum members table (role: 'admin' or 'member')
CREATE TABLE forum_members (
    user_id UUID NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
    forum_id UUID NOT NULL REFERENCES forums(fid) ON DELETE CASCADE,
    role VARCHAR(10) NOT NULL CHECK (role IN ('admin', 'member')),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, forum_id)
);

-- 6. Posts table
CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    forum_id UUID NOT NULL REFERENCES forums(fid) ON DELETE CASCADE,
    user_id UUID REFERENCES users(uid) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 7. Comments table (1-level deep via parent_comment_id)
CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(uid) ON DELETE SET NULL,
    body TEXT NOT NULL,
    parent_comment_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 8. Votes table (for posts or comments, only one of post_id or comment_id populated per row)
CREATE TABLE votes (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
    post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
    comment_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
    value SMALLINT NOT NULL CHECK (value IN (1, -1)),
    CONSTRAINT one_vote_per_user_on_target UNIQUE (user_id, post_id, comment_id),
    CHECK (
        (post_id IS NOT NULL AND comment_id IS NULL) OR 
        (post_id IS NULL AND comment_id IS NOT NULL)
    )
);
```

## Frontend Setup

Run the following command to install the necessary Node.js packages in the frontend directory:

```bash
npm install 
```

or

```bash
bun install
```

Run the application using:

```bash
npm run dev
```

or

```bash
bun run dev
```

Setup `.env` file based on the provided `.envExample` file.

-----

# API Documentation & Usage

**Base URL:** `http://localhost:8080` (Development)

## 🔐 Authentication & Headers

Most endpoints are **Protected Routes**.

  * **Public Routes:** Login, Register, Verify Token, Get Universities.
  * **Protected Routes:** Require `Authorization` header.

**Header Format:**

```
Authorization: Bearer <access_token_here>
```

-----

## 1\. User & Authentication

### Register (Sign Up)

  * **Endpoint:** `POST /signup`
  * **Auth:** Public
  * **Note:** `status` must be strictly `"active"` or `"inactive"` (database enum).
  * **Body (JSON):**
    ```json
    {
        "username": "budi_santoso",
        "first_name": "Budi",
        "last_name": "Santoso",
        "university": "Universitas Indonesia",
        "email": "budi@ui.ac.id",
        "password": "passwordStrong123",
        "status": "active"
    }
    ```

### Login (Sign In)

  * **Endpoint:** `POST /signin`
  * **Auth:** Public
  * **Body (JSON):** Can use `email` OR `username`.
    ```json
    {
        "email": "budi@ui.ac.id",
        "password": "passwordStrong123"
    }
    ```
  * **Response Success:**
    ```json
    {
        "message": "Login Successful",
        "accessToken": "eyJh... (save this token)"
    }
    ```

### Get Profile

  * **Endpoint:** `GET /profile`
  * **Auth:** Bearer Token
  * **Description:** Get currently logged-in user data.

### Verify Token

  * **Endpoint:** `POST /verifytoken`
  * **Auth:** Public
  * **Body (JSON):**
    ```json
    { 
        "access_token": "eyJh..." 
    }
    ```

-----

## 2\. General Data

### Get Universities

  * **Endpoint:** `GET /universities`
  * **Auth:** Public
  * **Query Param:** `?name=search_query` (Optional)

### Get Categories

  * **Endpoint:** `GET /categories`
  * **Auth:** Bearer Token
  * **Response:** List of forum categories. Note that `id` is an **Integer**.

-----

## 3\. Forums System

### Get All Forums

  * **Endpoint:** `GET /forums/`
  * **Auth:** Bearer Token

### Create Forum

  * **Endpoint:** `POST /forums/`
  * **Auth:** Bearer Token
  * **Body (JSON):**
    ```json
    {
        "title": "Golang Enthusiasts",
        "description": "Discuss everything about Go",
        "category_id": "1",
    }
    ```
  * `category_id`: String containing the Integer ID of the category.

### Get Forum Detail

  * **Endpoint:** `GET /forums/:forum_id`
  * **Param:** `:forum_id` is the **UUID** of the forum.
  * **Auth:** Bearer Token

### Get Forum Members

  * **Endpoint:** `GET /forums/:forum_id/members`
  * **Param:** `:forum_id` is the **UUID** of the forum.
  * **Auth:** Bearer Token

### Join Forum

  * **Endpoint:** `POST /forums/:forum_id/join`
  * **Auth:** Bearer Token

### Leave Forum

  * **Endpoint:** `POST /forums/:forum_id/leave`
  * **Auth:** Bearer Token

-----

## 4\. Posting System

### Get Posts (By Forum)

  * **Endpoint:** `GET /forums/:forum_id/posts`
  * **Auth:** Bearer Token

### Create Post

  * **Endpoint:** `POST /posts/`
  * **Auth:** Bearer Token
  * **Body (JSON):**
    ```json
    {
        "forum_id": "uuid-forum-id",
        "title": "How to handle cors in Gin?",
        "body": "I am having trouble with..."
    }
    ```

### Get Single Post

  * **Endpoint:** `GET /posts/:post_id`
  * **Param:** `:post_id` is an **Integer** (from database Serial ID).
  * **Auth:** Bearer Token

### Delete Post

  * **Endpoint:** `DELETE /posts/:post_id`
  * **Auth:** Bearer Token

-----

## 5\. Comment System

### Get Comments (By Post)

  * **Endpoint:** `GET /posts/:post_id/comments`
  * **Auth:** Bearer Token

### Create Comment

  * **Endpoint:** `POST /comments/`
  * **Auth:** Bearer Token
  * **Body (JSON):**
    ```json
    {
        "post_id": 123,
        "body": "This is my comment.",
        "parent_comment_id": 0
    }
    ```
  * `post_id`: Integer ID of the post.
  * `parent_comment_id`: `0` for top-level comments, or `Integer ID` of another comment to reply.

### Delete Comment

  * **Endpoint:** `DELETE /comments/:comment_id`
  * **Auth:** Bearer Token
