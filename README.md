## Đề tài: Hệ thống Quản lý Khách sạn dựa trên kiến trúc dịch vụ (SOA)

Frontend của dự án được xây dựng bằng **React** (Create React App), đóng vai trò là client trong hệ thống **quản lý khách sạn** theo kiến trúc **Service-Oriented Architecture (SOA)**. Ứng dụng giao tiếp với backend Node.js/Express qua **RESTful API**, hỗ trợ nhiều vai trò người dùng (receptionist, accountant, housekeeper, maintenance, manager) với giao diện dashboard riêng cho từng vai trò.

---

## 1. Mục tiêu dự án

- **Xây dựng giao diện web** cho hệ thống quản lý khách sạn, trực quan, dễ sử dụng.
- **Hỗ trợ đầy đủ nghiệp vụ**: quản lý phòng, loại phòng, khách, đặt phòng, check-in/check-out, hóa đơn, thanh toán, bảo trì, báo cáo.
- **Tích hợp phân quyền & xác thực** với backend qua **JWT**, bảo vệ các trang nội bộ bằng `ProtectedRoute`.
- **Tổ chức mã nguồn rõ ràng**, dễ mở rộng: tách component, hooks, services, styles.

---

## 2. Chức năng chính của frontend

- **Xác thực & phân quyền**
  - Màn hình đăng nhập (`Login`) nhận token và thông tin người dùng từ backend.
  - Lưu trữ thông tin người dùng trong `localStorage`, tự động điều hướng theo `role`.
  - `ProtectedRoute` kiểm tra quyền truy cập từng dashboard.

- **Dashboard theo vai trò**
  - **Receptionist**: quản lý đặt phòng, check-in/check-out, khách, phòng, hóa đơn, thanh toán.
  - **Accountant**: theo dõi giao dịch, hóa đơn, lịch sử thanh toán.
  - **Housekeeping**: xem trạng thái phòng (available/occupied/dirty/cleaning/maintenance).
  - **Maintenance**: quản lý yêu cầu bảo trì, trạng thái phòng bảo trì.
  - **Manager**: xem báo cáo tổng quan, doanh thu, tình trạng phòng, thống kê hoạt động.

- **Quản lý & hiển thị dữ liệu**
  - Sử dụng **services** trong `src/services` để gọi REST API (booking, room, guest, invoice, payment, report, v.v.).
  - Dùng **custom hooks** (`useAuth`, `useBookings`, `useRooms`) để tách logic lấy dữ liệu và quản lý state.
  - Sử dụng các component như `RoomCard`, `StatCard`, các bảng (table) để hiển thị dữ liệu.

- **Giao diện & trải nghiệm người dùng**
  - Dùng **CSS Modules** trong thư mục `styles` (ví dụ: `Dashboard.module.css`, `NavBar.module.css`, `Login.module.css`) để tạo UI hiện đại.
  - Thanh điều hướng (`NavBar`) theo từng vai trò, hỗ trợ đăng xuất.

---

## 3. Kiến trúc thư mục frontend

```text
frontend/
  ├─ public/            # File tĩnh, template HTML
  ├─ src/
  │  ├─ components/     # Component dùng chung & theo vai trò
  │  │  ├─ receptionist/
  │  │  ├─ accountant/
  │  │  ├─ manager/
  │  │  ├─ ...
  │  ├─ pages/          # Các trang chính (Login, các Dashboard)
  │  ├─ services/       # Gọi API đến backend (auth, booking, room, ...)
  │  ├─ hooks/          # Custom hooks (useAuth, useBookings, useRooms)
  │  ├─ styles/         # CSS Modules cho từng phần UI
  │  ├─ App.js          # Định nghĩa route và ProtectedRoute
  │  └─ index.js        # Entry point của ứng dụng
  └─ package.json
```

---

## 4. Công nghệ sử dụng

- **Ngôn ngữ & thư viện chính**
  - React (Create React App)
  - React Router DOM
  - Axios (hoặc fetch) cho HTTP request (thông qua các service)

- **Quản lý style**
  - CSS Modules (`*.module.css`)
  - File CSS global `src/styles/index.css`, `src/App.css`

- **Bảo mật & phân quyền (phối hợp backend)**
  - JWT (lưu token trong `localStorage`)
  - `ProtectedRoute` cho các route cần đăng nhập

---

## 5. Cách chạy dự án

### 5.1. Chuẩn bị môi trường

- Cài đặt **Node.js** (phiên bản LTS khuyến nghị).
- Đảm bảo backend đã được cài đặt và cấu hình (thư mục `backend` trong cùng project).

### 5.2. Cài đặt dependencies

Trong thư mục `frontend`:

```bash
npm install
```

### 5.3. Chạy frontend ở môi trường development

```bash
npm start
```

Ứng dụng sẽ chạy tại `http://localhost:3000`.

> Lưu ý: Cần chạy **backend** (mặc định `http://localhost:5000` hoặc theo cấu hình `FRONTEND_URL`/CORS) trước để các API hoạt động đầy đủ.

### 5.4. Build cho môi trường production

```bash
npm run build
```

Thư mục `build` sẽ chứa mã frontend đã tối ưu để deploy.

---

## 6. Ghi chú triển khai & mở rộng

- Có thể cấu hình base URL của API trong `src/config/api.js` để phù hợp với môi trường (dev/staging/production).
- Có thể bổ sung:
  - Trang quản lý người dùng (users/roles) cho quản lý hệ thống.
  - Biểu đồ trực quan hơn cho dashboard (sử dụng chart libraries).
  - Đa ngôn ngữ (i18n) cho giao diện.

---

## 7. Tóm tắt (dùng cho báo cáo/CV)

Frontend hiện thực **ứng dụng quản lý khách sạn** theo kiến trúc **SOA**, với **dashboard theo vai trò, bảo vệ route bằng JWT, tách service gọi API, sử dụng custom hooks và CSS Modules**. Cấu trúc mã nguồn rõ ràng, dễ mở rộng, hỗ trợ đầy đủ nghiệp vụ chính trong vận hành khách sạn và sẵn sàng tích hợp/triển khai trong môi trường thực tế.

