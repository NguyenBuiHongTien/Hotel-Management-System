# ============================================
# Frontend - React (build + Nginx serve)
# ============================================
# Stage 1: build React
FROM node:20-alpine AS build

WORKDIR /app

# Public API URL when running in Docker (browser calls backend at localhost:5000)
ARG VITE_API_URL=http://localhost:5000/api
ENV VITE_API_URL=$VITE_API_URL

COPY package.json package-lock.json* ./
RUN npm ci 2>/dev/null || npm install

COPY . .
RUN npm run build

# Stage 2: serve with Nginx
FROM nginx:alpine

# Nginx config (SPA: all routes serve index.html)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy dist from build stage
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
