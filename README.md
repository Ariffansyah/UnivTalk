# UnivTalk

## Database Schema

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
    is_admin         BOOLEAN NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

- `status` field uses the enum type `user_status` and can be either `'active'` or `'inactive'`.
- All fields are required except `is_admin` (defaults to false) and `created_at` (auto timestamp).
