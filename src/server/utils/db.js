import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let SQL = null;

async function getSQL() {
  if (!SQL) {
    SQL = await initSqlJs();
  }
  return SQL;
}

export async function initDatabase(dbPath) {
  // Ensure data directory exists
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const SQL = await getSQL();
  let db;
  
  // Load existing database or create new one
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }
  
  // Create users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      password TEXT NOT NULL,
      email TEXT,
      role TEXT DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create comments table (for XSS honeypot)
  db.run(`
    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content TEXT NOT NULL,
      author TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create chat_messages table (for LLM prompt injection)
  db.run(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_message TEXT NOT NULL,
      response TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Insert fake users if table is empty
  const userCountResult = db.exec('SELECT COUNT(*) as count FROM users');
  const userCount = userCountResult.length > 0 && userCountResult[0].values.length > 0 
    ? userCountResult[0].values[0][0] 
    : 0;
    
  if (userCount === 0) {
    const users = [
      ['admin', 'admin123', 'admin@truarch.tech', 'admin'],
      ['client_manager', 'password', 'manager@truarch.tech', 'manager'],
      ['devops_lead', 'letmein', 'devops@truarch.tech', 'engineer'],
      ['architect', 'test123', 'architect@truarch.tech', 'architect'],
      ['client_user', 'demo', 'client@truarch.tech', 'client'],
    ];

    const stmt = db.prepare('INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)');
    for (const user of users) {
      stmt.run(user);
    }
    stmt.free();
  }

  // Save database to disk
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);

  // Add save method to database object for convenience
  db.save = () => {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  };

  return db;
}
