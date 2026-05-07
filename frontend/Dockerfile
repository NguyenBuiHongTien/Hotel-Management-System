# ============================================
# Frontend - React (build + Nginx serve)
# ============================================
# Giai đoạn 1: Build React
FROM node:20-alpine AS build

WORKDIR /app

# Địa chỉ API khi chạy bằng Docker (browser gọi tới backend qua localhost:5000)
ARG VITE_API_URL=http://localhost:5000/api
ENV VITE_API_URL=$VITE_API_URL

COPY package.json package-lock.json* ./
RUN npm ci 2>/dev/null || npm install

COPY . .
RUN npm run build

# Giai đoạn 2: Serve bằng Nginx
FROM nginx:alpine

# Copy file cấu hình Nginx (SPA: mọi route trả về index.html)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy thư mục dist từ giai đoạn 1
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
