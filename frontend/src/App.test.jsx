import { render, screen } from '@testing-library/react';
import App from './App.jsx';

test('renders login screen', () => {
  render(<App />);
  expect(screen.getByText(/HotelMaster/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Đăng nhập/i })).toBeInTheDocument();
});
