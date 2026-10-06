import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GigForm from './GigForm';

describe('GigForm', () => {
  it('renders all expected fields', () => {
    render(<GigForm onSubmit={vi.fn()} />);
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/price/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/delivery/i)).toBeInTheDocument();
  });

  it('shows a validation error and does not submit when the title is too short', async () => {
    const handleSubmit = vi.fn();
    const user = userEvent.setup();
    render(<GigForm onSubmit={handleSubmit} />);

    await user.type(screen.getByLabelText(/title/i), 'ab');
    await user.type(screen.getByLabelText(/description/i), 'A valid description here.');
    await user.type(screen.getByLabelText(/price/i), '100');
    await user.type(screen.getByLabelText(/delivery/i), '3');
    await user.click(screen.getByRole('button', { name: /save/i }));

    expect(screen.getByRole('alert')).toHaveTextContent(/title must be at least 3 characters/i);
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('shows a validation error when price is not positive', async () => {
    const handleSubmit = vi.fn();
    const user = userEvent.setup();
    render(<GigForm onSubmit={handleSubmit} />);

    await user.type(screen.getByLabelText(/title/i), 'Valid Title');
    await user.type(screen.getByLabelText(/description/i), 'A valid description here.');
    await user.type(screen.getByLabelText(/price/i), '0');
    await user.type(screen.getByLabelText(/delivery/i), '3');
    await user.click(screen.getByRole('button', { name: /save/i }));

    expect(screen.getByRole('alert')).toHaveTextContent(/price must be a positive number/i);
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('calls onSubmit with the entered values when the form is valid', async () => {
    const handleSubmit = vi.fn().mockResolvedValue();
    const user = userEvent.setup();
    render(<GigForm onSubmit={handleSubmit} submitLabel="Create Gig" />);

    await user.type(screen.getByLabelText(/title/i), 'Logo Design');
    await user.type(screen.getByLabelText(/description/i), 'A clean, modern logo design service.');
    await user.type(screen.getByLabelText(/price/i), '250');
    await user.type(screen.getByLabelText(/delivery/i), '5');
    await user.click(screen.getByRole('button', { name: /create gig/i }));

    expect(handleSubmit).toHaveBeenCalledWith({
      title: 'Logo Design',
      description: 'A clean, modern logo design service.',
      category: 'Design',
      price: 250,
      deliveryDays: 5,
    });
  });
});