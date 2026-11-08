import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminPage from './AdminPage';
import {
  fetchAllUsers,
  fetchAllGigsAdmin,
  fetchAllBookingsAdmin,
  fetchAuditLogs,
  unlockUser,
} from '../api/admin';

// Replace the API module with fakes so no real requests are made
vi.mock('../api/admin', () => ({
  fetchAllUsers: vi.fn(),
  fetchAllGigsAdmin: vi.fn(),
  fetchAllBookingsAdmin: vi.fn(),
  fetchAuditLogs: vi.fn(),
  unlockUser: vi.fn(),
}));

const LOCKED_USER = {
  id: 'u1',
  email: 'locked@hustlehub.com',
  role: 'client',
  createdAt: '2026-11-01T10:00:00Z',
  failedLoginAttempts: 5,
  lockUntil: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
};
const ACTIVE_USER = {
  id: 'u2',
  email: 'active@hustlehub.com',
  role: 'freelancer',
  createdAt: '2026-11-01T10:00:00Z',
  failedLoginAttempts: 0,
  lockUntil: null,
};

describe('AdminPage', () => {
  beforeEach(() => {
    fetchAllUsers.mockResolvedValue([LOCKED_USER, ACTIVE_USER]);
    fetchAllGigsAdmin.mockResolvedValue([]);
    fetchAllBookingsAdmin.mockResolvedValue([]);
    fetchAuditLogs.mockResolvedValue([
      {
        id: 'a1',
        event: 'account_locked',
        email: 'locked@hustlehub.com',
        ip: '127.0.0.1',
        details: 'Locked after 5 failed logins',
        createdAt: '2026-11-07T10:00:00Z',
      },
    ]);
    unlockUser.mockResolvedValue({ success: true });
  });

  it('shows which accounts are locked and which are active', async () => {
    render(<AdminPage />);
    expect(await screen.findByText(/locked until/i)).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('only offers an Unlock button for the locked account', async () => {
    render(<AdminPage />);
    await screen.findByText(/locked until/i);
    expect(screen.getAllByRole('button', { name: /^unlock /i })).toHaveLength(1);
    expect(screen.getByRole('button', { name: /unlock locked@hustlehub.com/i })).toBeInTheDocument();
  });

  it('unlocks an account when the admin clicks Unlock', async () => {
    const user = userEvent.setup();
    render(<AdminPage />);
    await user.click(await screen.findByRole('button', { name: /unlock locked@hustlehub.com/i }));

    expect(unlockUser).toHaveBeenCalledWith('u1');
    expect(await screen.findByText('Account unlocked.')).toBeInTheDocument();
    expect(screen.queryByText(/locked until/i)).not.toBeInTheDocument();
  });

  it('shows a plain error message when the unlock fails', async () => {
    unlockUser.mockRejectedValue({ friendlyMessage: 'User not found.' });
    const user = userEvent.setup();
    render(<AdminPage />);
    await user.click(await screen.findByRole('button', { name: /unlock locked@hustlehub.com/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('User not found.');
  });

  it('loads the audit log only when its tab is opened, and shows the events', async () => {
    const user = userEvent.setup();
    render(<AdminPage />);
    await screen.findByText(/locked until/i);
    expect(fetchAuditLogs).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: /audit log/i }));

    const row = (await screen.findByText('Account locked')).closest('tr');
    expect(fetchAuditLogs).toHaveBeenCalledTimes(1);
    expect(within(row).getByText('127.0.0.1')).toBeInTheDocument();
    expect(within(row).getByText('Locked after 5 failed logins')).toBeInTheDocument();
  });

  it('shows a friendly message when the audit log cannot be loaded', async () => {
    fetchAuditLogs.mockRejectedValue({ friendlyMessage: 'You do not have permission to perform this action.' });
    const user = userEvent.setup();
    render(<AdminPage />);
    await screen.findByText(/locked until/i);
    await user.click(screen.getByRole('button', { name: /audit log/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('You do not have permission');
  });
});