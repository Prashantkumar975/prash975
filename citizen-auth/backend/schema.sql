-- SwachhLens Citizen Auth — SQLite Schema

CREATE TABLE IF NOT EXISTS citizens (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT    UNIQUE NOT NULL,
    phone         TEXT    UNIQUE NOT NULL,
    email         TEXT    UNIQUE,
    password_hash TEXT    NOT NULL,
    created_at    TEXT    DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS otp_requests (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    citizen_id  INTEGER NOT NULL REFERENCES citizens(id) ON DELETE CASCADE,
    otp_code    TEXT    NOT NULL,
    expires_at  TEXT    NOT NULL,
    verified    INTEGER DEFAULT 0,
    created_at  TEXT    DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_otp_citizen ON otp_requests(citizen_id);
