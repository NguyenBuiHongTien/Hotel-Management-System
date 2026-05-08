/**
 * Tạo backend/.env từ .env.example nếu chưa có (sau merge thường bị thiếu file .env local).
 * Chạy: npm run env:init
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const envPath = path.join(root, '.env');
const examplePath = path.join(root, '.env.example');

if (!fs.existsSync(examplePath)) {
  console.error('Không tìm thấy backend/.env.example');
  process.exit(1);
}

if (fs.existsSync(envPath)) {
  console.log('backend/.env đã tồn tại — bỏ qua (xóa file nếu muốn tạo lại từ .env.example).');
  process.exit(0);
}

fs.copyFileSync(examplePath, envPath);
console.log('Đã tạo backend/.env từ backend/.env.example — hãy điền JWT_SECRET và Gmail (nếu dùng).');
