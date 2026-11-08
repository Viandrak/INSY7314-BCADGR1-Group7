import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Navbar from './Navbar';
import { AuthProvider } from '../context/AuthContext';
import apiClient from '../api/client';

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
describe('Navbar logout', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  function loginAsClient() {
    localStorage.setItem('token', 'fake-token');
    localStorage.setItem('user', JSON.stringify({ id: '1', email: 'client1@hustlehub.com', role: 'client' }));
  }

  it('revokes the token with the API, then clears the saved session', async () => {
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue({ data: { success: true } });
    loginAsClient();
    renderNavbar();

    await userEvent.setup().click(screen.getByRole('button', { name: /log out/i }));

    expect(post).toHaveBeenCalledWith('/auth/logout');
    await waitFor(() => expect(localStorage.getItem('token')).toBeNull());
    expect(localStorage.getItem('user')).toBeNull();
    expect(await screen.findByRole('link', { name: /log in/i })).toBeInTheDocument();
  });

  it('still logs the user out on this device if the API request fails', async () => {
    vi.spyOn(apiClient, 'post').mockRejectedValue({ friendlyMessage: 'Invalid or expired token.' });
    loginAsClient();
    renderNavbar();

    await userEvent.setup().click(screen.getByRole('button', { name: /log out/i }));

    await waitFor(() => expect(localStorage.getItem('token')).toBeNull());
    expect(await screen.findByRole('link', { name: /log in/i })).toBeInTheDocument();
  });
});
