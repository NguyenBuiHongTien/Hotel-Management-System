export const mockRooms = [
    { id: 1, number: '101', floor: 1, type: 'Deluxe', status: 'Available', price: 150 },
    { id: 2, number: '102', floor: 1, type: 'Suite', status: 'Occupied', price: 250 },
    { id: 3, number: '201', floor: 2, type: 'Standard', status: 'Maintenance', price: 100 },
    { id: 4, number: '202', floor: 2, type: 'Deluxe', status: 'Available', price: 150 },
  ];
  
  export const mockBookings = [
    { id: 1, customer: 'Nguyen Van A', room: '101', checkIn: '2025-11-10', checkOut: '2025-11-15', status: 'Confirmed', total: 750 },
    { id: 2, customer: 'Tran Thi B', room: '102', checkIn: '2025-11-09', checkOut: '2025-11-12', status: 'CheckedIn', total: 750 },
  ];
  
  export const maintenanceRequests = [
    { id: 1, room: '201', issue: 'Điều hòa không hoạt động', priority: 'High', status: 'Pending' },
    { id: 2, room: '105', issue: 'Vòi nước bị rò rỉ', priority: 'Medium', status: 'In Progress' },
    { id: 3, room: '302', issue: 'Đèn hỏng', priority: 'Low', status: 'Pending' },
  ];