<h1 align="center">Hotel Management System (SOA)</h1>

<p align="center">
  Hệ thống quản lý khách sạn theo kiến trúc dịch vụ (SOA) với dashboard theo vai trò,<br/>
  REST API bảo mật JWT và triển khai toàn stack bằng Docker Compose.
</p>

<p align="center">
  <img alt="Node.js" src="https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white">
  <img alt="Express" src="https://img.shields.io/badge/Express-5.x-000000?logo=express&logoColor=white">
  <img alt="React" src="https://img.shields.io/badge/React-19.x-61DAFB?logo=react&logoColor=000">
  <img alt="MongoDB" src="https://img.shields.io/badge/MongoDB-7.x-47A248?logo=mongodb&logoColor=white">
  <img alt="Docker" src="https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white">
  <img alt="License" src="https://img.shields.io/badge/License-Educational-blue">
</p>

---

## Tổng quan

Hệ thống gồm:
- **Backend**: Node.js + Express + MongoDB, cung cấp REST API cho nghiệp vụ khách sạn.
- **Frontend**: React, giao diện dashboard riêng theo vai trò người dùng.
- **Triển khai**: Docker Compose để chạy đồng bộ MongoDB + Backend + Frontend.

Vai trò hỗ trợ: `manager`, `receptionist`, `accountant`, `housekeeper`, `maintenance`.

---

## Tính năng chính

- Xác thực bằng JWT, phân quyền theo vai trò.
- Quản lý đặt phòng, phòng, loại phòng, khách hàng.
- Nghiệp vụ check-in/check-out và thanh toán.
- Quản lý hóa đơn, giao dịch, báo cáo doanh thu/công suất.
- Quản lý yêu cầu bảo trì và trạng thái xử lý.
- Dashboard riêng theo vai trò người dùng.

---

## Demo giao diện

> Cập nhật ảnh/GIF thật của bạn vào thư mục `docs/images` rồi thay link bên dưới.

### Screenshots

- Đăng nhập: `docs/images/login.png`
- Dashboard quản lý: `docs/images/manager-dashboard.png`
- Dashboard lễ tân: `docs/images/receptionist-dashboard.png`
- Dashboard kế toán: `docs/images/accountant-dashboard.png`

### Demo GIF (tùy chọn)

- Luồng đặt phòng -> check-in -> checkout -> thanh toán: `docs/images/demo-flow.gif`

Mẫu markdown để hiển thị ảnh:

```md
![Login](docs/images/login.png)
![Manager Dashboard](docs/images/manager-dashboard.png)
```

---

## Công nghệ sử dụng

### Backend
- Node.js, Express
- MongoDB, Mongoose
- JWT, bcryptjs
- express-validator
- express-rate-limit

### Frontend
- React + Vite
- react-router-dom
- CSS Modules
- recharts, lucide-react

### DevOps
- Docker, Docker Compose

---

## Cấu trúc thư mục

```text
CK_SOA/
├─ backend/
│  ├─ config/                 # Kết nối DB
│  ├─ controllers/            # Xử lý nghiệp vụ
│  ├─ middleware/             # Auth, lỗi, rate limit, validate
│  ├─ models/                 # Mongoose models
│  ├─ routes/api/             # REST API routes
│  ├─ scripts/seeders/        # Seed dữ liệu mẫu
│  └─ server.js               # Entry point backend
├─ frontend/
│  ├─ src/components/         # UI components theo vai trò
│  ├─ src/pages/              # Trang dashboard, login
│  ├─ src/services/           # API service layer
│  ├─ src/hooks/              # Custom hooks
│  ├─ src/config/api.js       # API base URL
│  └─ Dockerfile
├─ mongo-init/rs-init.js      # Mongo init script cho Docker
├─ docker-compose.yml
└─ Postman_Collection.json
```

---

## Kiến trúc hệ thống (SOA)

```text
[ React Frontend ]
        |
        | HTTP/JSON + JWT
        v
[ Express API Layer ]
  | Auth Service
  | Booking Service
  | Room Service
  | Invoice/Payment Service
  | Report Service
  v
[ MongoDB ]
```

Luồng chính:
- Frontend gọi API qua `frontend/src/services/*`.
- Backend xử lý theo route/controller, xác thực qua middleware JWT.
- Dữ liệu lưu tại MongoDB qua Mongoose models.

---

## Yêu cầu môi trường

- Node.js LTS (khuyến nghị 18+)
- npm
- MongoDB (nếu chạy local không dùng Docker)
- Docker Desktop (nếu chạy bằng Docker)

---

## Cấu hình môi trường

### 1) Backend `.env`

Tạo file `backend/.env`:

```env
MONGODB_URL=mongodb://localhost:27017/hotel_management
JWT_SECRET=your_strong_secret
FRONTEND_URL=http://localhost:3000
PORT=5000
```

> Lưu ý bảo mật: không commit giá trị secret thật lên GitHub.

### 2) Frontend `.env` (tùy chọn)

Tạo file `frontend/.env` nếu muốn đổi API URL:

```env
VITE_API_URL=http://localhost:5000/api
```

Nếu không có, hệ thống dùng mặc định giống trên.

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

### Bước 3: Chạy frontend

```bash
cd frontend
npm run dev
```

Frontend chạy tại: `http://localhost:5173`

---

## Chạy bằng Docker Compose (profiles dev/prod)

Từ thư mục gốc project:

```bash
# Production profile (Nginx + image optimized)
docker compose --profile prod up -d --build

# Development profile (hot reload qua volume mount)
docker compose --profile dev up -d --build
```

Sau khi chạy profile `prod`:
- Frontend: `http://localhost:3000` (Nginx)
- Backend API: `http://localhost:5000/api`

Sau khi chạy profile `dev`:
- Frontend: `http://localhost:5173` (Vite dev server)
- Backend API: `http://localhost:5000/api` (node --watch)
- MongoDB: `mongodb://localhost:27017`

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

Bạn có thể import file `Postman_Collection.json` để test API nhanh.

---

## Scripts hữu ích

### Backend
- `npm start`: chạy server
- `npm run seed:all`: seed toàn bộ
- `npm run check-role`: kiểm tra role user
- `npm run fix-accountant`: sửa role accountant nếu sai

### Frontend
- `npm run dev`: chạy Vite dev server
- `npm run build`: build production
- `npm test`: chạy test

---

## Roadmap

- [ ] Bổ sung tài liệu API đầy đủ (Swagger/OpenAPI public).
- [ ] Thêm test tích hợp backend và test UI frontend.
- [ ] Hoàn thiện phân lớp service theo bounded context rõ hơn.
- [ ] Thiết lập CI/CD (lint, test, build, deploy).
- [ ] Thêm phân quyền chi tiết hơn theo action-level.
