<h1 align="center">Hotel Management System (SOA)</h1>

<p align="center">
  Hệ thống quản lý khách sạn theo kiến trúc dịch vụ (SOA) với dashboard theo vai trò,<br/>
  REST API bảo mật JWT và triển khai toàn stack bằng Docker Compose.
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

## Tổng quan

Hệ thống gồm:
- **Backend**: Node.js + Express + MongoDB, cung cấp REST API cho nghiệp vụ khách sạn.
- **Frontend**: React + Vite, giao diện dashboard riêng theo vai trò người dùng.
- **Triển khai**: Docker Compose với profile `dev` và `prod`.

Vai trò hỗ trợ: `manager`, `receptionist`, `accountant`, `housekeeper`, `maintenance`.

---

## Tính năng chính

- Xác thực JWT, phân quyền theo vai trò.
- Quản lý đặt phòng, phòng, loại phòng, khách hàng.
- Nghiệp vụ check-in/check-out và thanh toán.
- Quản lý hóa đơn, giao dịch, báo cáo doanh thu/công suất.
- Quản lý yêu cầu bảo trì và trạng thái xử lý.
- Dashboard riêng theo vai trò người dùng.
- Tích hợp gửi email nhắc lịch qua Gmail API.

---

## Công nghệ sử dụng

### Backend
- Node.js, Express
- MongoDB, Mongoose
- JWT, bcryptjs
- express-validator, express-rate-limit, helmet
- Google APIs (gmail)

### Frontend
- React + Vite
- react-router-dom
- CSS Modules
- recharts, lucide-react
- Vitest + Testing Library

### DevOps
- Docker, Docker Compose

---

## Cấu trúc thư mục

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
├─ mongo-init/rs-init.js
├─ docker-compose.yml
└─ Postman_Collection.json
```

---

## Yêu cầu môi trường

- Node.js LTS (khuyến nghị 18+)
- npm
- MongoDB (nếu chạy local không dùng Docker)
- Docker Desktop (nếu chạy bằng Docker)

---

## Cấu hình môi trường

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

> Lưu ý bảo mật: không commit giá trị secret thật lên GitHub.
> `JWT_SECRET` nên có tối thiểu 16 ký tự.

### 2) Frontend `frontend/.env` (tùy chọn)

```env
VITE_API_URL=http://localhost:5000/api
```

---

## Chạy dự án (Local Development)

### Bước 1: Cài dependencies

```bash
cd backend
npm install

cd ../frontend
npm install
```

### Bước 2: Chạy backend

```bash
cd backend
npm start
```

Backend chạy tại: `http://localhost:5000`

### Bước 3: Chạy frontend (Vite)

```bash
cd frontend
npm run dev
```

Frontend chạy tại: `http://localhost:5173`

---

## Chạy bằng Docker Compose (profiles dev/prod)

Từ thư mục gốc project:

> Quan trọng: file `docker-compose.yml` đọc biến như `JWT_SECRET`, `GOOGLE_CLIENT_ID`... từ **`.env` ở thư mục gốc project** (không phải `backend/.env`).
> Hãy tạo `.env` ở root trước khi chạy compose.

```bash
# Production profile (Nginx + image optimized)
docker compose --profile prod up -d --build

# Development profile (hot reload qua volume mount)
docker compose --profile dev up -d --build
```

Sau khi chạy profile `prod`:
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000/api`

Sau khi chạy profile `dev`:
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000/api`

MongoDB: `mongodb://localhost:27017`

Dừng hệ thống:

```bash
docker compose down
```

---

## Seed dữ liệu mẫu

Trong `backend/`:

```bash
npm run seed:all
```

Hoặc seed riêng:

```bash
npm run seed:users
npm run seed:room-types
npm run seed:rooms
```

### Tài khoản test (sau khi seed users)
- `manager@hotel.com`
- `receptionist@hotel.com`
- `accountant@hotel.com`
- `housekeeper@hotel.com`
- `maintenance@hotel.com`

Mật khẩu mặc định: `123456`

---

## API chính

Base URL: `/api`

- `POST /auth/login`
- `GET /auth/profile`
- `POST /auth/logout`
- `GET|POST /bookings`
- `POST /checkin`, `POST /checkout`
- `GET|POST /rooms`, `PUT /rooms/:roomId/status`
- `GET|POST /guests`
- `GET /invoices`, `GET /transactions`, `POST /payments`
- `GET /reports/revenue`, `GET /reports/occupancy`
- `GET /dashboard/revenue`
- `POST /maintenance/issues`, `GET /maintenance/requests`

Bạn có thể import `Postman_Collection.json` để test API nhanh.

---

## Scripts hữu ích

### Backend
- `npm start`: chạy server
- `npm test`: chạy test
- `npm run seed:all`: seed toàn bộ
- `npm run gmail:token`: lấy refresh token Gmail
- `npm run check-role`: kiểm tra role user
- `npm run fix-accountant`: sửa role accountant nếu sai

### Frontend
- `npm run dev`: chạy Vite dev server
- `npm run build`: build production
- `npm test`: chạy test (Vitest)

---

## Roadmap

- [ ] Bổ sung tài liệu API đầy đủ (Swagger/OpenAPI public).
- [ ] Thêm test tích hợp backend và test UI frontend.
- [ ] Hoàn thiện phân lớp service theo bounded context rõ hơn.
- [ ] Thiết lập CI/CD (lint, test, build, deploy).
- [ ] Thêm phân quyền chi tiết hơn theo action-level.
