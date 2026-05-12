<h1 align="center">Hotel Management System (SOA)</h1>

<p align="center">
  Service-oriented hotel management with role-based dashboards,<br/>
  JWT-secured REST API, and full-stack Docker Compose deployment.
</p>

<p align="center">
  <img alt="Node.js" src="https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white">
  <img alt="Express" src="https://img.shields.io/badge/Express-5.x-000000?logo=express&logoColor=white">
  <img alt="React" src="https://img.shields.io/badge/React-19.x-61DAFB?logo=react&logoColor=000">
  <img alt="Vite" src="https://img.shields.io/badge/Vite-8.x-646CFF?logo=vite&logoColor=white">
  <img alt="MongoDB" src="https://img.shields.io/badge/MongoDB-7.x-47A248?logo=mongodb&logoColor=white">
  <img alt="Docker" src="https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white">
</p>

---

## Overview

The system includes:
- **Backend**: Node.js + Express + MongoDB, REST API for hotel operations.
- **Frontend**: React + Vite, role-specific dashboards.
- **Deployment**: Docker Compose with `dev` and `prod` profiles.

Supported roles: `manager`, `receptionist`, `accountant`, `housekeeper`, `maintenance`.

---

## Main features

- JWT authentication and role-based access.
- Bookings, rooms, room types, and guests.
- Check-in / check-out and payments.
- Invoices, transactions, revenue and occupancy reports.
- Staff accounts (manager).
- Maintenance requests and workflow status.
- Role-specific dashboards.
- Optional Gmail API for booking reminders.

---

## Tech stack

### Backend
- Node.js, Express
- MongoDB, Mongoose
- JWT, bcryptjs
- express-validator, express-rate-limit, helmet
- Google APIs (Gmail)
- Jest, Supertest

### Frontend
- React + Vite
- react-router-dom
- CSS Modules
- recharts, lucide-react
- Vitest + Testing Library

### DevOps
- Docker, Docker Compose
- GitHub Actions (CI: backend tests, frontend tests + build — see `.github/workflows/ci.yml`)

---

## Repository layout

```text
CK_SOA/
├─ backend/
│  ├─ config/
│  ├─ controllers/
│  ├─ middleware/
│  ├─ models/
│  ├─ routes/api/
│  ├─ scripts/seeders/
│  ├─ services/
│  ├─ tests/
│  └─ server.js
├─ frontend/
│  ├─ src/components/
│  ├─ src/pages/
│  ├─ src/services/
│  ├─ src/hooks/
│  ├─ src/config/api.js
│  ├─ vite.config.js
│  └─ Dockerfile
├─ .github/workflows/ci.yml
├─ mongo-init/rs-init.js
├─ docker-compose.yml
└─ Postman_Collection.json
```

---

## Prerequisites

- Node.js LTS (18+ recommended)
- npm
- MongoDB (if not using Docker locally)
- Docker Desktop (if using Docker)

---

## Environment configuration

### 1) Backend `backend/.env`

```env
MONGODB_URL=mongodb://localhost:27017/hotel_management
JWT_SECRET=your_strong_secret
FRONTEND_URL=http://localhost:5173
PORT=5000
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GMAIL_REFRESH_TOKEN=
GMAIL_SENDER_EMAIL=
```

> Security: do not commit real secrets to GitHub.  
> `JWT_SECRET` should be at least 16 characters.

### 2) Frontend `frontend/.env` (optional)

```env
VITE_API_URL=http://localhost:5000/api
```

---

## Local development

### Step 1: Install dependencies

```bash
cd backend
npm install

cd ../frontend
npm install
```

### Step 2: Run backend

```bash
cd backend
npm start
```

Backend: `http://localhost:5000`

### Step 3: Run frontend (Vite)

```bash
cd frontend
npm run dev
```

Frontend: `http://localhost:5173`

---

## Docker Compose (`dev` / `prod`)

From the project root:

> Important: `docker-compose.yml` reads variables such as `JWT_SECRET`, `GOOGLE_CLIENT_ID`, … from **`.env` in the project root** (not `backend/.env`).  
> Create root `.env` before running Compose.

```bash
# Production profile (Nginx + optimized image)
docker compose --profile prod up -d --build

# Development profile (hot reload via volume mounts)
docker compose --profile dev up -d --build
```

After `prod` profile:
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000/api`

After `dev` profile:
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000/api`

MongoDB: `mongodb://localhost:27017` (container runs replica set `rs0`; on a fresh volume, `mongo-init/rs-init.js` runs `rs.initiate`).

Stop:

```bash
docker compose down
```

---

## Sample data (seed)

In `backend/`:

```bash
npm run seed:all
```

Or individual seeds:

```bash
npm run seed:users
npm run seed:room-types
npm run seed:rooms
```

### Test accounts (after seeding users)

- `manager@hotel.com`
- `receptionist@hotel.com`
- `accountant@hotel.com`
- `housekeeper@hotel.com`
- `maintenance@hotel.com`

Default password (after `npm run seed:users`): `HotelDemo1` (8+ chars, letter + number).

---

## Main API

**Base URL:** `http://localhost:5000/api` (paths below are relative to `/api`).

Most endpoints require `Authorization: Bearer <token>`; `POST /auth/login` is public.

- **Auth:** `POST /auth/login`, `GET /auth/profile`, `POST /auth/logout`
- **Bookings:** `GET|POST /bookings`, `GET|PUT /bookings/:bookingId`, `POST /bookings/:bookingId/cancel`, `POST /bookings/:bookingId/invoice`
- **Check-in/out:** `POST /checkin`, `POST /checkout`
- **Rooms:** `GET|POST /rooms`, `GET /rooms/:roomId`, `PUT /rooms/:roomId`, `PUT /rooms/:roomId/status` (plus helper `GET`s: available, cleaning, maintenance, …)
- **Room types:** `GET|POST /room-types`, `GET|PUT|DELETE /room-types/:id`
- **Guests:** `GET|POST /guests`, `GET|PUT|DELETE /guests/:guestId`
- **Employees (manager):** `GET|POST /employees`, `GET|PUT|DELETE /employees/:id`
- **Invoices / payments:** `GET /invoices`, `GET /invoices/:invoiceId`, `GET /invoices/guest/:bookingId`, `GET /invoices/financial/:bookingId`, `GET /transactions`, `POST /payments`
- **Reports:** `GET /reports/revenue`, `GET /reports/occupancy`, plus save/export routes (see `reportRoutes.js`)
- **Dashboard (manager):** `GET /dashboard/revenue`
- **Maintenance:** `POST /maintenance/issues`, `GET /maintenance/requests`, `GET /maintenance/requests/:requestId`, `PUT /maintenance/:requestId`, `PUT /maintenance/:requestId/complete`

Import `Postman_Collection.json` for quick API testing.

---

## Useful scripts

### Backend
- `npm start`: run server
- `npm test`: Jest tests
- `npm run seed:all`: run all seeds
- `npm run gmail:token`: obtain Gmail refresh token
- `npm run check-role`: inspect user role
- `npm run fix-accountant`: fix mis-typed accountant role

### Frontend
- `npm run dev`: Vite dev server
- `npm run build`: production build
- `npm test`: Vitest

---

## Roadmap

- [ ] Full API docs (Swagger/OpenAPI — dependency exists in `package.json` but UI not wired in `server.js`).
- [ ] More backend integration tests and frontend UI tests.
- [ ] Clearer service layer per bounded context.
- [x] Basic CI: GitHub Actions runs backend tests + frontend tests and build (see `.github/workflows/ci.yml`).
- [ ] Expand CI/CD: lint, artifacts, automated deploy.
- [ ] Finer-grained action-level authorization.
