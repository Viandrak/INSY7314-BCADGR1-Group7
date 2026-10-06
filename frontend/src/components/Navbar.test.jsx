import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Navbar from './Navbar';
import { AuthProvider } from '../context/AuthContext';

function renderNavbar() {
  render(
    <MemoryRouter>
      <AuthProvider>
        <Navbar />
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('Navbar', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('shows login and register links when logged out', () => {
    renderNavbar();
    expect(screen.getByRole('link', { name: /log in/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /register/i })).toBeInTheDocument();
  });

  it('shows the dashboard link and email for a logged-in freelancer', () => {
    localStorage.setItem('token', 'fake-token');
    localStorage.setItem('user', JSON.stringify({ id: '1', email: 'freelancer1@hustlehub.com', role: 'freelancer' }));
    renderNavbar();
    expect(screen.getByText('freelancer1@hustlehub.com')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /my dashboard/i })).toBeInTheDocument();
  });

  it('shows the admin link for a logged-in admin', () => {
    localStorage.setItem('token', 'fake-token');
    localStorage.setItem('user', JSON.stringify({ id: '1', email: 'admin@hustlehub.com', role: 'admin' }));
    renderNavbar();
    expect(screen.getByRole('link', { name: /admin/i })).toBeInTheDocument();
  });
});