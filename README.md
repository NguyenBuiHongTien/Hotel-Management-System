## Hotel Management System (SOA)

Hệ thống quản lý khách sạn theo kiến trúc dịch vụ (SOA), gồm:
- **Backend**: Node.js + Express + MongoDB, cung cấp REST API theo nghiệp vụ khách sạn.
- **Frontend**: React, dashboard theo vai trò người dùng.
- **Triển khai**: Docker Compose cho toàn bộ stack.

Hệ thống hỗ trợ các vai trò: `manager`, `receptionist`, `accountant`, `housekeeper`, `maintenance`.

---

## Tính năng chính

- Xác thực bằng JWT, phân quyền theo vai trò.
- Quản lý đặt phòng, phòng, loại phòng, khách hàng.
- Nghiệp vụ check-in/check-out và thanh toán.
- Quản lý hóa đơn, giao dịch, báo cáo doanh thu/công suất.
- Quản lý yêu cầu bảo trì và trạng thái xử lý.
- Dashboard riêng theo vai trò người dùng.

---

## Công nghệ sử dụng

### Backend
- Node.js, Express
- MongoDB, Mongoose
- JWT, bcryptjs
- express-validator
- express-rate-limit

### Frontend
- React (Create React App)
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
REACT_APP_API_URL=http://localhost:5000/api
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
npm start
```

Frontend chạy tại: `http://localhost:3000`

---

## Chạy bằng Docker Compose

Từ thư mục gốc project:

```bash
docker compose up -d --build
```

Sau khi chạy:
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000/api`
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
- `npm start`: chạy dev server
- `npm run build`: build production
- `npm test`: chạy test

---

## Định hướng mở rộng

- Bổ sung tài liệu API tự động (Swagger/OpenAPI đầy đủ).
- Thêm test tích hợp cho backend và test UI cho frontend.
- Tách thêm service theo bounded context để tiến tới microservices hoàn chỉnh.
- Bổ sung CI/CD (lint, test, build, deploy tự động).

---



