import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { fetchGigs, fetchGigById } from './api/gigs';

// Replace the gigs API with a fake so no real requests are made
vi.mock('./api/gigs', () => ({
  fetchGigs: vi.fn(),
  fetchGigById: vi.fn(),
  fetchMyGigs: vi.fn(),
  createGig: vi.fn(),
  updateGig: vi.fn(),
  deleteGig: vi.fn(),
}));

function renderAt(path) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('Browse gigs routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    fetchGigs.mockResolvedValue([]);
  });

  it('sends a logged-out visitor on /gigs to the login page without calling the API', () => {
    renderAt('/gigs');
    expect(screen.getByRole('heading', { name: /log in/i })).toBeInTheDocument();
    expect(screen.queryByText(/authentication token missing/i)).not.toBeInTheDocument();
    expect(fetchGigs).not.toHaveBeenCalled();
    expect(screen.getByRole('status')).toHaveTextContent('Please log in or register to browse gigs.');
  });

  it('sends a logged-out visitor on a gig detail page to the login page', () => {
    renderAt('/gigs/6acb834eb21771fe989d0778');
    expect(screen.getByRole('heading', { name: /log in/i })).toBeInTheDocument();
    expect(fetchGigById).not.toHaveBeenCalled();
  });

  it('does not show the browse gigs message when the login page is opened directly', () => {
    renderAt('/login');
    expect(screen.getByRole('heading', { name: /log in/i })).toBeInTheDocument();
    expect(screen.queryByText(/please log in or register to browse gigs/i)).not.toBeInTheDocument();
  });

  it('shows the browse page to a logged-in user', async () => {
    localStorage.setItem('token', 'fake-token');
    localStorage.setItem('user', JSON.stringify({ id: '1', email: 'client1@hustlehub.com', role: 'client' }));
    renderAt('/gigs');
    expect(await screen.findByRole('heading', { name: /browse gigs/i })).toBeInTheDocument();
    expect(fetchGigs).toHaveBeenCalled();
  });
});