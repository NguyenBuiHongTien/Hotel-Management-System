# Role-Based API Test Matrix

Tai lieu nay giup test nhanh quyen truy cap theo vai tro cho cac endpoint chinh.

## Roles

- `manager`
- `receptionist`
- `accountant`
- `housekeeper`
- `maintenance`

## Ky hieu ket qua

- `200/201`: duoc phep
- `400`: payload sai
- `401`: chua auth/token het han
- `403`: sai role

## Auth & Profile

| Endpoint | manager | receptionist | accountant | housekeeper | maintenance |
|---|---:|---:|---:|---:|---:|
| `POST /api/auth/login` | 200 | 200 | 200 | 200 | 200 |
| `GET /api/auth/profile` | 200 | 200 | 200 | 200 | 200 |

## Rooms

| Endpoint | manager | receptionist | accountant | housekeeper | maintenance |
|---|---:|---:|---:|---:|---:|
| `GET /api/rooms` | 200 | 200 | 200 | 200 | 200 |
| `POST /api/rooms` | 201 | 403 | 403 | 403 | 403 |
| `PUT /api/rooms/:roomId` | 200 | 403 | 403 | 403 | 403 |
| `PUT /api/rooms/:roomId/status` (`dirty/cleaning/maintenance`) | 403 | 200 | 403 | 200 | 200 |
| `PUT /api/rooms/:roomId/status` (`available`) | 403 | 403 | 403 | 200 | 403 |
| `PUT /api/rooms/:roomId/status` (`occupied`) | 403 | 403 | 403 | 403 | 403 |
| `GET /api/rooms/available` | 403 | 200 | 403 | 403 | 403 |
| `GET /api/rooms/cleaning` | 403 | 403 | 403 | 200 | 403 |
| `GET /api/rooms/maintenance` | 403 | 200 | 403 | 403 | 200 |

## Bookings & Checkin/Checkout

| Endpoint | manager | receptionist | accountant | housekeeper | maintenance |
|---|---:|---:|---:|---:|---:|
| `GET /api/bookings` | 200 | 200 | 200 | 403 | 403 |
| `POST /api/bookings` | 201 | 201 | 403 | 403 | 403 |
| `PUT /api/bookings/:bookingId` | 200 | 200 | 403 | 403 | 403 |
| `POST /api/bookings/:bookingId/cancel` | 200 | 200 | 403 | 403 | 403 |
| `POST /api/bookings/:bookingId/invoice` | 200/201 | 200/201 | 200/201 | 403 | 403 |
| `POST /api/checkin` | 403 | 200 | 403 | 403 | 403 |
| `POST /api/checkout` | 403 | 200 | 403 | 403 | 403 |

## Guests

| Endpoint | manager | receptionist | accountant | housekeeper | maintenance |
|---|---:|---:|---:|---:|---:|
| `GET /api/guests` | 200 | 200 | 403 | 403 | 403 |
| `POST /api/guests` | 403 | 201 | 403 | 403 | 403 |
| `PUT /api/guests/:guestId` | 403 | 200 | 403 | 403 | 403 |
| `DELETE /api/guests/:guestId` | 200 | 403 | 403 | 403 | 403 |

## Invoices & Payments

| Endpoint | manager | receptionist | accountant | housekeeper | maintenance |
|---|---:|---:|---:|---:|---:|---:|
| `GET /api/invoices` | 200 | 200 | 200 | 403 | 403 |
| `GET /api/invoices/:invoiceId` | 200 | 200 | 200 | 403 | 403 |
| `GET /api/invoices/guest/:bookingId` | 200 | 200 | 200 | 403 | 403 |
| `GET /api/invoices/financial/:bookingId` | 403 | 403 | 200 | 403 | 403 |
| `POST /api/payments` | 403 | 200 | 200 | 403 | 403 |
| `GET /api/transactions` | 200 | 403 | 200 | 403 | 403 |

## Reports

| Endpoint | manager | receptionist | accountant | housekeeper | maintenance |
|---|---:|---:|---:|---:|---:|
| `GET /api/reports/revenue` | 200 | 403 | 200 | 403 | 403 |
| `GET /api/reports/occupancy` | 200 | 403 | 200 | 403 | 403 |
| `GET /api/reports/comprehensive/export` | 200 | 403 | 200 | 403 | 403 |
| `POST /api/reports/revenue/save` | 200 | 403 | 200 | 403 | 403 |
| `POST /api/reports/occupancy/save` | 200 | 403 | 200 | 403 | 403 |
| `GET /api/reports` (danh sach bao cao da luu) | 200 | 403 | 200 | 403 | 403 |
| `GET /api/reports/:reportId` | 200 | 403 | 200 | 403 | 403 |

## Maintenance

| Endpoint | manager | receptionist | accountant | housekeeper | maintenance |
|---|---:|---:|---:|---:|---:|
| `POST /api/maintenance/issues` | 201 | 201 | 403 | 201 | 403 |
| `GET /api/maintenance/requests` | 200 | 403 | 403 | 403 | 200 |
| `GET /api/maintenance/requests/:requestId` | 200 | 403 | 403 | 403 | 200 |
| `PUT /api/maintenance/:requestId` | 200 | 403 | 403 | 403 | 200 |
| `PUT /api/maintenance/:requestId/complete` | 200 | 403 | 403 | 403 | 200 |

## Cach su dung matrix

1. Login voi tung role lay token.
2. Goi endpoint theo bang tren bang Postman/collection.
3. So sanh status code thuc te voi expected.
4. Neu sai, danh dau regression va tao issue/PR fix.

> Luu y: Matrix la baseline theo implementation hien tai. Khi thay doi policy role, cap nhat file nay cung luc voi code.
