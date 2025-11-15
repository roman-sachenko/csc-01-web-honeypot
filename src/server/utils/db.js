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

  // Generate 2000 fake users on every server start (for consistent test data)
  // Import config to get company email domain
  const { config } = await import('../config.js');
  const emailDomain = config.companyEmail.split('@')[1] || 'example.com';
  
  // First, upsert the standard test users
  const testUsers = [
    { username: 'admin', password: 'admin123', email: `admin@${emailDomain}`, role: 'admin' },
    { username: 'client_manager', password: 'password', email: `manager@${emailDomain}`, role: 'manager' },
    { username: 'devops_lead', password: 'letmein', email: `devops@${emailDomain}`, role: 'engineer' },
    { username: 'architect', password: 'test123', email: `architect@${emailDomain}`, role: 'architect' },
    { username: 'client_user', password: 'demo', email: `client@${emailDomain}`, role: 'client' },
    { username: 'john_doe', password: 'password123', email: `john.doe@${emailDomain}`, role: 'user' },
    { username: 'jane_smith', password: 'securepass', email: `jane.smith@${emailDomain}`, role: 'user' },
    { username: 'bob_wilson', password: 'mypassword', email: `bob.wilson@${emailDomain}`, role: 'user' },
    { username: 'alice_brown', password: 'pass1234', email: `alice.brown@${emailDomain}`, role: 'user' },
    { username: 'charlie_davis', password: 'testpass', email: `charlie.davis@${emailDomain}`, role: 'user' },
  ];

  console.log('📊 Initializing test user data...');
  let insertedCount = 0;
  let updatedCount = 0;

  // Upsert standard test users
  for (const user of testUsers) {
    const stmt = db.prepare('SELECT id FROM users WHERE username = ?');
    stmt.bind([user.username]);
    const existingUser = [];
    while (stmt.step()) {
      existingUser.push(stmt.getAsObject());
    }
    stmt.free();
    const exists = existingUser.length > 0;

    if (exists) {
      const updateStmt = db.prepare('UPDATE users SET password = ?, email = ?, role = ? WHERE username = ?');
      updateStmt.run([user.password, user.email, user.role, user.username]);
      updateStmt.free();
      updatedCount++;
    } else {
      const insertStmt = db.prepare('INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)');
      insertStmt.run([user.username, user.password, user.email, user.role]);
      insertStmt.free();
      insertedCount++;
    }
  }

  // Generate 2000 fake users with random data
  const firstNames = ['John', 'Jane', 'Bob', 'Alice', 'Charlie', 'David', 'Emma', 'Frank', 'Grace', 'Henry', 'Ivy', 'Jack', 'Kate', 'Liam', 'Mia', 'Noah', 'Olivia', 'Paul', 'Quinn', 'Rachel', 'Sam', 'Tina', 'Uma', 'Victor', 'Wendy', 'Xavier', 'Yara', 'Zoe'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson'];
  const roles = ['user', 'admin', 'manager', 'engineer', 'architect', 'client', 'developer', 'analyst', 'designer', 'consultant'];
  const passwords = ['password123', 'securepass', 'mypassword', 'test123', 'demo123', 'pass1234', 'letmein', 'welcome123', 'default123', 'user123'];

  // Get current user count
  const countResult = db.exec('SELECT COUNT(*) as count FROM users');
  const currentCount = countResult.length > 0 && countResult[0].values.length > 0
    ? countResult[0].values[0][0]
    : 0;

  const targetCount = 2000;
  const usersToCreate = Math.max(0, targetCount - currentCount);

  if (usersToCreate > 0) {
    console.log(`   📝 Generating ${usersToCreate} fake users to reach ${targetCount} total...`);
    
    // Use batch insert for better performance
    const batchSize = 100;
    for (let batch = 0; batch < Math.ceil(usersToCreate / batchSize); batch++) {
      const batchStart = batch * batchSize;
      const batchEnd = Math.min(batchStart + batchSize, usersToCreate);
      
      // Prepare statement once per batch for better performance
      const insertStmt = db.prepare('INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)');
      
      for (let i = batchStart; i < batchEnd; i++) {
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        const username = `${firstName.toLowerCase()}_${lastName.toLowerCase()}_${i + 1}`;
        const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i + 1}@${emailDomain}`;
        const role = roles[Math.floor(Math.random() * roles.length)];
        const password = passwords[Math.floor(Math.random() * passwords.length)];

        insertStmt.run([username, password, email, role]);
        insertedCount++;
      }
      
      insertStmt.free();
      
      if ((batch + 1) % 10 === 0 || batch === Math.ceil(usersToCreate / batchSize) - 1) {
        console.log(`   ⏳ Progress: ${Math.min(batchEnd, usersToCreate)}/${usersToCreate} users created...`);
      }
    }
  }

  // Get final user count
  const finalCountResult = db.exec('SELECT COUNT(*) as count FROM users');
  const finalCount = finalCountResult.length > 0 && finalCountResult[0].values.length > 0
    ? finalCountResult[0].values[0][0]
    : 0;

  console.log(`   ✅ Users initialized: ${insertedCount} inserted, ${updatedCount} updated, ${finalCount} total users`);

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
