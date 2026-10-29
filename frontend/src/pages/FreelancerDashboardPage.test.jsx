import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FreelancerDashboardPage from './FreelancerDashboardPage';
import { fetchMyGigs, updateGig } from '../api/gigs';

// Replace the API modules with fakes so no real requests are made
vi.mock('../api/gigs', () => ({
  fetchMyGigs: vi.fn(),
  createGig: vi.fn(),
  updateGig: vi.fn(),
  deleteGig: vi.fn(),
}));
vi.mock('../api/bookings', () => ({ fetchReceivedBookings: vi.fn().mockResolvedValue([]) }));
vi.mock('../api/income', () => ({
  fetchIncomeSummary: vi.fn().mockResolvedValue({
    totalIncome: 0,
    transactionCount: 0,
    estimatedTaxRate: 0.18,
    estimatedTax: 0,
    incomeAfterEstimatedTax: 0,
    disclaimer: '',
  }),
}));

const gig = {
  id: '6acb834eb21771fe989d0778',
  title: 'Logo Design',
  description: 'I will design a professional logo for your brand.',
  category: 'Design',
  price: 600,
  deliveryDays: 3,
};

describe('FreelancerDashboardPage editing a gig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchMyGigs.mockResolvedValue([gig]);
    updateGig.mockResolvedValue({ ...gig, price: 750 });
  });

  it('shows an Edit button on each gig', async () => {
    render(<FreelancerDashboardPage />);
    expect(await screen.findByRole('button', { name: 'Edit' })).toBeInTheDocument();
  });

  it('opens the form filled with the gig details when Edit is clicked', async () => {
    const user = userEvent.setup();
    render(<FreelancerDashboardPage />);

    await user.click(await screen.findByRole('button', { name: 'Edit' }));

    expect(screen.getByLabelText(/title/i)).toHaveValue('Logo Design');
    expect(screen.getByLabelText(/price/i)).toHaveValue(600);
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
  });

  it('sends the changes to the update endpoint for that gig and refreshes the list', async () => {
    const user = userEvent.setup();
    render(<FreelancerDashboardPage />);

    await user.click(await screen.findByRole('button', { name: 'Edit' }));
    const price = screen.getByLabelText(/price/i);
    await user.clear(price);
    await user.type(price, '750');
    fetchMyGigs.mockResolvedValue([{ ...gig, price: 750 }]);
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    expect(updateGig).toHaveBeenCalledWith(gig.id, {
      title: 'Logo Design',
      description: 'I will design a professional logo for your brand.',
      category: 'Design',
      price: 750,
      deliveryDays: 3,
    });
    expect(await screen.findByRole('status')).toHaveTextContent('Gig updated successfully.');
    expect(await screen.findByText(/R750/)).toBeInTheDocument();
    expect(fetchMyGigs).toHaveBeenCalledTimes(2);
  });

  it('closes the edit form without saving when Cancel is clicked', async () => {
    const user = userEvent.setup();
    render(<FreelancerDashboardPage />);

    await user.click(await screen.findByRole('button', { name: 'Edit' }));
    const card = screen.getByLabelText(/title/i).closest('.gig-card');
    await user.click(within(card).getByRole('button', { name: /cancel/i }));

    expect(updateGig).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: /save changes/i })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Logo Design' })).toBeInTheDocument();
  });

  it('keeps the form open and shows the error if the update fails', async () => {
    updateGig.mockRejectedValue({ friendlyMessage: 'Invalid gig details. Please check all fields and try again.' });
    const user = userEvent.setup();
    render(<FreelancerDashboardPage />);

    await user.click(await screen.findByRole('button', { name: 'Edit' }));
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid gig details.');
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
  });
});