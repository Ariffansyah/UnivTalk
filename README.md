# UnivTalk
UnivTalk is a web application designed for university students to connect, and collaborate.

## Backend Setup
Run the following command to install the necessary Go modules in the backend directory:

```bash
go mod tidy
```
Run the application using:

```bash
go run main.go
```

Setup .env file based on the provided .envExample file.


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
    forum_id UUID NOT NULL REFERENCES forums(id) ON DELETE CASCADE,
    role VARCHAR(10) NOT NULL CHECK (role IN ('admin', 'member')),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, forum_id)
);

-- 6. Posts table
CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    forum_id INTEGER NOT NULL REFERENCES forums(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(uid) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
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
run the following command to install the necessary Node.js packages in the frontend directory:

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

Setup .env file based on the provided .envExample file.
