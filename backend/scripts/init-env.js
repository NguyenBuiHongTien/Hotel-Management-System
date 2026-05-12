/**
 * Create backend/.env from .env.example if missing (common after merges).
 * Run: npm run env:init
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const envPath = path.join(root, '.env');
const examplePath = path.join(root, '.env.example');

if (!fs.existsSync(examplePath)) {
  console.error('backend/.env.example not found');
  process.exit(1);
}

if (fs.existsSync(envPath)) {
  console.log('backend/.env already exists — skipping (delete the file to recreate from .env.example).');
  process.exit(0);
}

fs.copyFileSync(examplePath, envPath);
console.log('Created backend/.env from backend/.env.example — fill in JWT_SECRET and Gmail settings if needed.');
