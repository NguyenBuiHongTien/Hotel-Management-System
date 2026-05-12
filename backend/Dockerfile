# ============================================
# Backend - Node.js + Express (hotel system)
# ============================================
FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm install --omit=dev

COPY . .

EXPOSE 5000

# Env vars injected by docker-compose: MONGODB_URL, FRONTEND_URL, JWT_SECRET, PORT
CMD ["node", "server.js"]
