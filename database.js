const Database = require('better-sqlite3');
const path = require('path');

// create database file
const db = new Database(path.join(__dirname, 'chronogonk.db'));

db.pragma('foreign_keys = ON');

// init tables
function initializeDatabase() {
    // stores users timezones
    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            user_id TEXT PRIMARY KEY,
            username TEXT NOT NULL,
            timezone TEXT NOT NULL,
            created_at INTEGER DEFAULT (strftime('%s', 'now')),
            updated_at INTEGER DEFAULT (strftime('%s', 'now'))
        )
    `);

    // store user statuses
    db.exec(`
        CREATE TABLE IF NOT EXISTS statuses (
            user_id TEXT PRIMARY KEY,
            status TEXT NOT NULL CHECK(status IN ('free', 'busy', 'dnd')),
            note TEXT,
            expires_at INTEGER,
            created_at INTEGER DEFAULT (strftime('%s', 'now')),
            FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
        )
    `);

    console.log('[DATABASE] Tables initialized successfully');
}

// user timezone functions
const userTimezones = {
    // set users timezone
    set: (userId, username, timezone) => {
        const stmt = db.prepare(`
            INSERT INTO users (user_id, username, timezone, updated_at)
            VALUES (?, ?, ?, strftime('%s', 'now'))
            ON CONFLICT(user_id) DO UPDATE SET
                timezone = excluded.timezone,
                username = excluded.username,
                updated_at = strftime('%s', 'now')
        `);
        return stmt.run(userId, username, timezone);
    },

    // get user's timezone
    get: (userId) => {
        const stmt = db.prepare('SELECT * FROM users WHERE user_id = ?');
        return stmt.get(userId);
    },

    // get all users with timezones
    getAll: () => {
        const stmt = db.prepare('SELECT * FROM users ORDER BY username');
        return stmt.all();
    },

    // delete user's timezone
    delete: (userId) => {
        const stmt = db.prepare('DELETE FROM users WHERE user_id = ?');
        return stmt.run(userId);
    }
};

// user status functions
const userStatuses = {
    // set user's status
    set: (userId, status, note = null, expiresInMinutes = null) => {
        const expiresAt = expiresInMinutes 
            ? Math.floor(Date.now() / 1000) + (expiresInMinutes * 60)
            : null;

        const stmt = db.prepare(`
            INSERT INTO statuses (user_id, status, note, expires_at)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(user_id) DO UPDATE SET
                status = excluded.status,
                note = excluded.note,
                expires_at = excluded.expires_at,
                created_at = strftime('%s', 'now')
        `);
        return stmt.run(userId, status, note, expiresAt);
    },

    // get user's status
    get: (userId) => {
        const stmt = db.prepare('SELECT * FROM statuses WHERE user_id = ?');
        const status = stmt.get(userId);

        // check if status has expired
        if (status && status.expires_at) {
            const now = Math.floor(Date.now() / 1000);
            if (now > status.expires_at) {
                // status expired, delete it
                userStatuses.delete(userId);
                return null;
            }
        }

        return status;
    },

    // delete user's status
    delete: (userId) => {
        const stmt = db.prepare('DELETE FROM statuses WHERE user_id = ?');
        return stmt.run(userId);
    },

    // clean up expired statuses
    cleanExpired: () => {
        const now = Math.floor(Date.now() / 1000);
        const stmt = db.prepare('DELETE FROM statuses WHERE expires_at IS NOT NULL AND expires_at < ?');
        return stmt.run(now);
    }
};

// initialize database on load
initializeDatabase();

module.exports = {
    db,
    userTimezones,
    userStatuses
};
