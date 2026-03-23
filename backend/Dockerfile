# ============================================
# Backend - Node.js + Express (Hệ thống QLKS)
# ============================================
FROM node:20-alpine

# Thư mục làm việc trong container
WORKDIR /app

# Copy file dependency trước (tận dụng layer cache)
COPY package.json package-lock.json* ./

# Cài đặt dependencies (production)
RUN npm install --omit=dev

# Copy toàn bộ mã nguồn backend
COPY . .

# Backend chạy port 5000
EXPOSE 5000

# Biến môi trường sẽ được inject từ docker-compose
# MONGODB_URL, FRONTEND_URL, JWT_SECRET, PORT
CMD ["node", "server.js"]
