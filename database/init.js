/**
 * ONE-TIME DATABASE INITIALIZATION SCRIPT
 *
 * Run manually:
 *   node database/init.js
 *
 * DO NOT run automatically on server start.
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env
dotenv.config({ path: path.join(__dirname, '../.env') });

// Validate required env vars
const REQUIRED_ENVS = [
  'DB_HOST',
  'DB_USER',
  'DB_PASSWORD',
  'DB_NAME',
  'ADMIN_PASSWORD'
];

for (const key of REQUIRED_ENVS) {
  if (!process.env[key]) {
    console.error(`❌ Missing required env variable: ${key}`);
    process.exit(1);
  }
}

async function initDatabase() {
  let pool;

  try {
    /* -------------------------------------------------
       1. Ensure database exists
    ------------------------------------------------- */
    const tempConn = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD
    });

    await tempConn.execute(
      `CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\``
    );
    await tempConn.end();

    /* -------------------------------------------------
       2. Connect to target database
    ------------------------------------------------- */
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10
    });

    console.log('✅ Connected to database');

    /* -------------------------------------------------
       3. Create tables (idempotent)
    ------------------------------------------------- */

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS categories (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        slug VARCHAR(255) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id VARCHAR(36) PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS jobs (
        id VARCHAR(36) PRIMARY KEY,
        category_id VARCHAR(36) NOT NULL,
        organization VARCHAR(255) NOT NULL,
        post_name VARCHAR(255) NOT NULL,
        vacancies VARCHAR(100) NOT NULL,
        qualification VARCHAR(255) NOT NULL,
        last_date DATE NOT NULL,
        full_details_url TEXT,
        notification_url TEXT,
        apply_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
      )
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS results (
        id VARCHAR(36) PRIMARY KEY,
        exam_name VARCHAR(255) NOT NULL,
        organization VARCHAR(255) NOT NULL,
        result_date DATE NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
        download_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS admit_cards (
        id VARCHAR(36) PRIMARY KEY,
        exam_name VARCHAR(255) NOT NULL,
        organization VARCHAR(255) NOT NULL,
        exam_date DATE NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
        download_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS syllabus (
        id VARCHAR(36) PRIMARY KEY,
        exam_name VARCHAR(255) NOT NULL,
        organization VARCHAR(255) NOT NULL,
        download_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS previous_papers (
        id VARCHAR(36) PRIMARY KEY,
        exam_name VARCHAR(255) NOT NULL,
        organization VARCHAR(255) NOT NULL,
        year INT NOT NULL,
        paper_type VARCHAR(255) NOT NULL,
        download_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS materials (
        id VARCHAR(36) PRIMARY KEY,
        organization VARCHAR(255) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        download_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Tables verified');

    /* -------------------------------------------------
       4. Create admin user ONCE
    ------------------------------------------------- */
    const [admins] = await pool.execute(
      'SELECT id FROM admin_users WHERE username = ?',
      ['admin']
    );

    if (admins.length === 0) {
      const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);

      await pool.execute(
        'INSERT INTO admin_users (id, username, password_hash) VALUES (?, ?, ?)',
        [randomUUID(), 'admin', hash]
      );

      console.log('✅ Admin user created');
    } else {
      console.log('ℹ️ Admin user already exists (skipped)');
    }

    /* -------------------------------------------------
       5. Seed default categories ONCE
    ------------------------------------------------- */
    const categories = [
      'Admit Cards',
      'Results',
      'Syllabus',
      'Previous Papers',
      'Materials',
      '10th Jobs',
      '12th Jobs',
      'ITI Jobs',
      'Diploma Jobs',
      'Degree Jobs',
      'Engineering Jobs',
      'Railways',
      'Bank Jobs',
      'Defence Jobs',
      'Teaching Jobs'
    ];

    for (const name of categories) {
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      await pool.execute(
        `
        INSERT INTO categories (id, name, slug)
        SELECT ?, ?, ?
        WHERE NOT EXISTS (
          SELECT 1 FROM categories WHERE slug = ?
        )
        `,
        [randomUUID(), name, slug, slug]
      );
    }

    console.log('✅ Categories seeded');
    console.log('🎉 Database initialization complete');
  } catch (err) {
    console.error('❌ Init failed:', err);
    process.exit(1);
  } finally {
    if (pool) await pool.end();
  }
}

initDatabase();
