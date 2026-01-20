/**
 * Fix missing users in production database
 * This script ensures all email_connections have corresponding users
 */

import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import dotenv from 'dotenv';

dotenv.config();

const dbPath = process.env.DATABASE_PATH || './database/careerpulse.db';
const db = new sqlite3.Database(dbPath);

const dbRun = promisify(db.run.bind(db));
const dbAll = promisify(db.all.bind(db));
const dbGet = promisify(db.get.bind(db));

async function fixMissingUsers() {
  try {
    console.log('🔍 Checking for email connections without users...');
    
    // Get all email connections
    const connections = await dbAll('SELECT * FROM email_connections WHERE connected = 1');
    console.log(`📧 Found ${connections.length} email connections`);
    
    for (const conn of connections) {
      // Check if user exists
      const user = await dbGet('SELECT * FROM users WHERE id = ?', [conn.userId]);
      
      if (!user) {
        console.log(`❌ Missing user for connection: ${conn.userId} (${conn.email})`);
        
        // Create the missing user
        console.log(`📝 Creating user: ${conn.userId}`);
        await dbRun(`
          INSERT INTO users (id, email, password, name)
          VALUES (?, ?, NULL, ?)
        `, [conn.userId, conn.email, conn.email.split('@')[0]]);
        
        console.log(`✅ Created user: ${conn.userId}`);
      } else {
        console.log(`✅ User exists: ${conn.userId} (${user.email})`);
      }
    }
    
    console.log('\n✅ All email connections now have corresponding users');
    
  } catch (error) {
    console.error('❌ Error fixing users:', error);
    process.exit(1);
  } finally {
    db.close();
  }
}

fixMissingUsers();
