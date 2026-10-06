import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import RegisterPage from './RegisterPage';
import { AuthProvider } from '../context/AuthContext';
import apiClient from '../api/client';

vi.mock('../api/client', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
  },
}));

function renderRegisterPage() {
  render(
    <MemoryRouter>
      <AuthProvider>
        <RegisterPage />
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders the registration form with a role selector', () => {
    renderRegisterPage();
    expect(screen.getByRole('heading', { name: /register/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/i am a/i)).toBeInTheDocument();
  });

  it('shows a clear error message when the email is already registered', async () => {
    apiClient.post.mockRejectedValueOnce({
      friendlyMessage: 'An account with this email already exists.',
    });
    const user = userEvent.setup();
    renderRegisterPage();

    await user.type(screen.getByLabelText(/email/i), 'taken@test.com');
    await user.type(screen.getByLabelText(/password/i), 'Test1234');
    await user.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('An account with this email already exists.');
    });
  });

  it('shows a success message and calls the register API with the chosen role', async () => {
    apiClient.post.mockResolvedValueOnce({ data: {} });
    const user = userEvent.setup();
    renderRegisterPage();

    await user.type(screen.getByLabelText(/email/i), 'newclient@test.com');
    await user.type(screen.getByLabelText(/password/i), 'Test1234');
    await user.selectOptions(screen.getByLabelText(/i am a/i), 'freelancer');
    await user.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/auth/register', {
        email: 'newclient@test.com',
        password: 'Test1234',
        role: 'freelancer',
      });
    });
    expect(await screen.findByText(/account created/i)).toBeInTheDocument();
  });
});