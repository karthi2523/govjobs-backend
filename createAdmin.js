/**
 * One-time admin user creation script
 * Run: node createAdmin.js
 * Delete this file after successful execution
 */

import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// CHANGE THESE VALUES
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'Admin@123'; // choose a strong password

async function createAdmin() {
  let connection;

  try {
    // Create DB connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'govapp',
    });

    // Hash password
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

    // Insert admin user
    const [result] = await connection.execute(
      `
      INSERT INTO admin_users (id, username, password_hash)
      VALUES (UUID(), ?, ?)
      `,
      [ADMIN_USERNAME, passwordHash]
    );

    console.log('✅ Admin user created successfully');
    console.log('Username:', ADMIN_USERNAME);
    console.log('Affected rows:', result.affectedRows);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      console.error('❌ Admin user already exists');
    } else {
      console.error('❌ Failed to create admin user');
      console.error(error);
    }
  } finally {
    if (connection) await connection.end();
  }
}

createAdmin();
