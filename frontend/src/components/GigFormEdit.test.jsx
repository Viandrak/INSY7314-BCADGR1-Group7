import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GigForm from './GigForm';

const existingGig = {
  id: '6acb834eb21771fe989d0778',
  title: 'Logo Design',
  description: 'I will design a professional logo for your brand.',
  category: 'Design',
  price: 600,
  deliveryDays: 3,
};

describe('GigForm when editing an existing gig', () => {
  it('fills every field with the existing gig details', () => {
    render(<GigForm initialValues={existingGig} onSubmit={vi.fn()} submitLabel="Save Changes" />);

    expect(screen.getByLabelText(/title/i)).toHaveValue('Logo Design');
    expect(screen.getByLabelText(/description/i)).toHaveValue(
      'I will design a professional logo for your brand.'
    );
    expect(screen.getByLabelText(/category/i)).toHaveValue('Design');
    expect(screen.getByLabelText(/price/i)).toHaveValue(600);
    expect(screen.getByLabelText(/delivery/i)).toHaveValue(3);
  });

  it('submits the edited values', async () => {
    const handleSubmit = vi.fn().mockResolvedValue();
    const user = userEvent.setup();
    render(<GigForm initialValues={existingGig} onSubmit={handleSubmit} submitLabel="Save Changes" />);

    const price = screen.getByLabelText(/price/i);
    await user.clear(price);
    await user.type(price, '750');
    await user.selectOptions(screen.getByLabelText(/category/i), 'Development');
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    expect(handleSubmit).toHaveBeenCalledWith({
      title: 'Logo Design',
      description: 'I will design a professional logo for your brand.',
      category: 'Development',
      price: 750,
      deliveryDays: 3,
    });
  });

  it('still validates edited values before submitting', async () => {
    const handleSubmit = vi.fn();
    const user = userEvent.setup();
    render(<GigForm initialValues={existingGig} onSubmit={handleSubmit} submitLabel="Save Changes" />);

    const title = screen.getByLabelText(/title/i);
    await user.clear(title);
    await user.type(title, 'ab');
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    expect(screen.getByRole('alert')).toHaveTextContent(/title must be at least 3 characters/i);
    expect(handleSubmit).not.toHaveBeenCalled();
  });

    it('shows the error message from a failed save (simulated API error)', async () => {
    const handleSubmit = vi.fn().mockRejectedValue({ friendlyMessage: 'You can only update your own gigs.' });
    const user = userEvent.setup();
    render(<GigForm initialValues={existingGig} onSubmit={handleSubmit} submitLabel="Save Changes" />);

    await user.click(screen.getByRole('button', { name: /save changes/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('You can only update your own gigs.');
  });

  it('shows a Cancel button that calls onCancel without submitting', async () => {
    const handleSubmit = vi.fn();
    const handleCancel = vi.fn();
    const user = userEvent.setup();
    render(
      <GigForm initialValues={existingGig} onSubmit={handleSubmit} onCancel={handleCancel} submitLabel="Save Changes" />
    );

    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(handleCancel).toHaveBeenCalledTimes(1);
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('does not show a Cancel button when onCancel is not given', () => {
    render(<GigForm onSubmit={vi.fn()} />);
    expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument();
  });
});