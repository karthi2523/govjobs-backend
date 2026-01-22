import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file
dotenv.config({ path: path.join(__dirname, '../.env') });

import pool from '../config/database.js';

async function createResultsTable() {
  try {
    console.log('Creating results table...');
    
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
    
    console.log('✅ Results table created successfully!');
  } catch (error) {
    console.error('❌ Error creating results table:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

createResultsTable();


