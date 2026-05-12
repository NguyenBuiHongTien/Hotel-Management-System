import { render, screen, waitFor } from '@testing-library/react';
import App from './App.jsx';

test('renders login screen after session check', async () => {
  render(<App />);
  await waitFor(() => {
    expect(screen.getByText(/HotelMaster/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign in/i })).toBeInTheDocument();
  });
});
