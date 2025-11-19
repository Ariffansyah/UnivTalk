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

Setup the `users` table in your PostgreSQL database using the following SQL commands:
```sql
-- Create enum type for user status
CREATE TYPE user_status AS ENUM ('active', 'inactive');

-- Create users table
CREATE TABLE users (
    id               SERIAL PRIMARY KEY,
    username         VARCHAR(32) NOT NULL UNIQUE,
    first_name       VARCHAR(64) NOT NULL,
    last_name        VARCHAR(64) NOT NULL,
    university       VARCHAR(128) NOT NULL,
    email            VARCHAR(128) NOT NULL UNIQUE,
    password         VARCHAR(128) NOT NULL,
    first_password   VARCHAR(128) NOT NULL,
    status           user_status NOT NULL DEFAULT 'active',
    salt             VARCHAR(64) NOT NUL
    is_admin         BOOLEAN NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

- `status` field uses the enum type `user_status` and can be either `'active'` or `'inactive'`.
- All fields are required except `is_admin` (defaults to false) and `created_at` (auto timestamp).

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
