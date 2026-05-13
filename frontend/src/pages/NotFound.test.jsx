import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NotFound from './NotFound.jsx';

describe('NotFound', () => {
  it('renders page not found and link to login', () => {
    render(
      <MemoryRouter>
        <NotFound />
      </MemoryRouter>
    );
    expect(screen.getByText(/Page not found/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Go to sign-in/i })).toHaveAttribute('href', '/login');
  });
});
