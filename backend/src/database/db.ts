import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const dbPath = process.env.DATABASE_PATH || path.resolve(__dirname, 'apaar_sentinel.sqlite');
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new Database(dbPath);

// Enable WAL mode for high concurrency and performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export default db;
