import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file
dotenv.config({ path: path.join(__dirname, '../.env') });

console.log('🔍 Checking environment configuration...\n');

const requiredVars = [
  'JWT_SECRET',
  'DB_HOST',
  'DB_USER',
  'DB_PASSWORD',
  'DB_NAME'
];

let allGood = true;

requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    // Mask sensitive values
    if (varName === 'DB_PASSWORD' || varName === 'JWT_SECRET') {
      console.log(`✅ ${varName}: ${'*'.repeat(Math.min(value.length, 10))} (set)`);
    } else {
      console.log(`✅ ${varName}: ${value}`);
    }
  } else {
    console.log(`❌ ${varName}: NOT SET`);
    allGood = false;
  }
});

console.log('\n' + '='.repeat(50));
if (allGood) {
  console.log('✅ All required environment variables are set!');
} else {
  console.log('❌ Some environment variables are missing!');
  console.log('\nPlease create or update your .env file in the project root with:');
  console.log(`
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=govapp
JWT_SECRET=your-secret-key-here
  `);
  process.exit(1);
}


