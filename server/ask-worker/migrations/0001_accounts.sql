-- Accounts for sign-in. Assessment answers are never stored here; they stay on the user's device.

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,            -- trimmed and lower-cased
  password_hash TEXT NOT NULL,           -- base64 PBKDF2-SHA256
  password_salt TEXT NOT NULL,           -- base64, 16 random bytes
  password_iterations INTEGER NOT NULL,
  created_at INTEGER NOT NULL            -- unix ms
);

CREATE TABLE sessions (
  id TEXT PRIMARY KEY,                   -- hex SHA-256 of the session token; the token itself is never stored
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX sessions_user ON sessions(user_id);

-- Failed sign-ins per email, for lockout after repeated wrong passwords.
CREATE TABLE login_failures (
  email TEXT NOT NULL,
  at INTEGER NOT NULL
);
CREATE INDEX login_failures_email_at ON login_failures(email, at);

-- One row per Ask question, for the per-account hourly limit. No question text is stored.
CREATE TABLE ask_events (
  user_id TEXT NOT NULL,
  at INTEGER NOT NULL
);
CREATE INDEX ask_events_user_at ON ask_events(user_id, at);
