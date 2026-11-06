import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import IncomeTaxTab from './IncomeTaxTab';
import { fetchIncomeSummary } from '../api/income';

vi.mock('../api/income', () => ({ fetchIncomeSummary: vi.fn() }));

const ASSUMPTIONS = [
  'The tax year is 2026/27 (1 March 2026 to 28 February 2027).',
  "Income is the gross total of the freelancer's completed bookings in that tax year.",
  "HustleHub+ income is treated as the freelancer's only taxable income.",
  'Only the business expenses the freelancer enters are deducted.',
  'Only the primary rebate (under 65) applies. There are no age rebates, medical credits or provisional tax timing.',
];

const MONTHS = [
  ['2026-03', 'Mar 2026'], ['2026-04', 'Apr 2026'], ['2026-05', 'May 2026'],
  ['2026-06', 'Jun 2026'], ['2026-07', 'Jul 2026'], ['2026-08', 'Aug 2026'],
  ['2026-09', 'Sep 2026'], ['2026-10', 'Oct 2026'], ['2026-11', 'Nov 2026'],
  ['2026-12', 'Dec 2026'], ['2027-01', 'Jan 2027'], ['2027-02', 'Feb 2027'],
];

function makeIncome(overrides = {}) {
  return {
    currency: 'ZAR',
    transactionCount: 4,
    taxYear: '2026/27',
    grossIncome: 400000,
    expensesUsed: 0,
    taxableIncome: 400000,
    estimatedTax: 67417.9,
    effectiveTaxRate: 0.1685,
    taxBracket: { number: 3, marginalRate: 0.31, from: 383100, to: 530200 },
    incomeAfterTax: 332582.1,
    assumptions: ASSUMPTIONS,
    incomePerMonth: MONTHS.map(([month, label], i) => ({ month, label, income: i === 1 ? 400000 : 0 })),
    incomePerGig: [{ gigId: 'g1', gigTitle: 'Logo Design', income: 400000, bookings: 4 }],
    ...overrides,
  };
}

describe('IncomeTaxTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows the six summary cards with clearly labelled figures', () => {
    render(<IncomeTaxTab initialIncome={makeIncome()} />);

    expect(screen.getByText('Gross income', { selector: '.stat-label' }).parentElement).toHaveTextContent('R400 000.00');
    expect(screen.getByText('Business expenses').parentElement).toHaveTextContent('R0.00');
    expect(screen.getByText('Taxable income', { selector: '.stat-label' }).parentElement).toHaveTextContent('R400 000.00');
    expect(screen.getByText('Estimated tax').parentElement).toHaveTextContent('R67 417.90');
    expect(screen.getByText('Income after tax', { selector: '.stat-label' }).parentElement).toHaveTextContent('R332 582.10');
    expect(screen.getByText('Effective tax rate').parentElement).toHaveTextContent('16.85%');
  });

  it('shows the illustrative estimate banner for the 2026/27 tax year', () => {
    render(<IncomeTaxTab initialIncome={makeIncome()} />);
    expect(screen.getByText(/illustrative estimate for the 2026\/27 tax year/i)).toBeInTheDocument();
  });

  it('draws a monthly income chart with all 12 months and an income vs tax chart', () => {
    render(<IncomeTaxTab initialIncome={makeIncome()} />);

    const monthly = JSON.parse(within(screen.getByTestId('monthly-income-chart')).getByTestId('chart-data').dataset.points);
    expect(monthly).toHaveLength(12);
    expect(monthly[1]).toMatchObject({ label: 'Apr 2026', income: 400000 });

    const compare = JSON.parse(within(screen.getByTestId('income-vs-tax-chart')).getByTestId('chart-data').dataset.points);
    expect(compare.map((p) => p.name)).toEqual(['Gross income', 'Taxable income', 'Estimated tax', 'Income after tax']);
    expect(compare[2].amount).toBe(67417.9);
  });

  it('lists income per gig', () => {
    render(<IncomeTaxTab initialIncome={makeIncome()} />);
    const row = screen.getByRole('cell', { name: 'Logo Design' }).closest('tr');
    expect(row).toHaveTextContent('4');
    expect(row).toHaveTextContent('R400 000.00');
  });

  it('explains how the tax is estimated, with the tax year, assumptions and disclaimer', () => {
    render(<IncomeTaxTab initialIncome={makeIncome()} />);
    const panel = screen.getByRole('region', { name: /how we estimate your tax/i });

    expect(panel).toHaveTextContent('2026/27');
    ASSUMPTIONS.forEach((a) => expect(within(panel).getByText(a)).toBeInTheDocument());
    expect(panel).toHaveTextContent(/illustrative estimate/i);
    expect(panel).toHaveTextContent(/not a guaranteed figure or an upper bound/i);
    expect(panel).toHaveTextContent(/other income such as a salary/i);
    expect(panel).toHaveTextContent(/deductions/i);
    expect(panel).toHaveTextContent(/not professional tax advice/i);
    expect(within(panel).getByRole('link', { name: /sars rates of tax/i })).toHaveAttribute(
      'href',
      'https://www.sars.gov.za/tax-rates/income-tax/rates-of-tax-for-individuals/'
    );
  });

  it('shows a friendly note and R0 figures when there is no income', () => {
    render(
      <IncomeTaxTab
        initialIncome={makeIncome({
          transactionCount: 0, grossIncome: 0, taxableIncome: 0, estimatedTax: 0,
          effectiveTaxRate: 0, incomeAfterTax: 0, incomePerGig: [],
          taxBracket: { number: 1, marginalRate: 0.18, from: 0, to: 245100 },
        })}
      />
    );
    expect(screen.getByText(/no completed bookings in the 2026\/27 tax year yet/i)).toBeInTheDocument();
    expect(screen.getByText(/no completed bookings to show yet/i)).toBeInTheDocument();
  });

  describe('expenses input', () => {
    it('starts empty, with a label, and does not call the API on first render', () => {
      render(<IncomeTaxTab initialIncome={makeIncome()} />);
      expect(screen.getByLabelText(/estimated business expenses/i)).toHaveValue('');
      expect(fetchIncomeSummary).not.toHaveBeenCalled();
    });

    it('recalculates the estimate when the expenses change', async () => {
      const user = userEvent.setup();
      fetchIncomeSummary.mockResolvedValue(
        makeIncome({ expensesUsed: 100000, taxableIncome: 300000, estimatedTax: 36300, incomeAfterTax: 363700, effectiveTaxRate: 0.0908 })
      );
      render(<IncomeTaxTab initialIncome={makeIncome()} />);

      await user.type(screen.getByLabelText(/estimated business expenses/i), '100000');

      await waitFor(() => expect(fetchIncomeSummary).toHaveBeenCalledWith('100000'));
      
      expect(fetchIncomeSummary).toHaveBeenCalledTimes(1);
      await waitFor(() =>
        expect(screen.getByText('Business expenses').parentElement).toHaveTextContent('R100 000.00')
      );
      expect(screen.getByText('Taxable income', { selector: '.stat-label' }).parentElement).toHaveTextContent('R300 000.00');
      expect(screen.getByText('Estimated tax').parentElement).toHaveTextContent('R36 300.00');
    });

    it.each([
      ['text', 'abc'],
      ['a negative number', '-5'],
      ['a number with letters', '12abc'],
      ['a number above the maximum', '999999999999'],
    ])('rejects %s and never calls the API', async (_name, value) => {
      const user = userEvent.setup();
      render(<IncomeTaxTab initialIncome={makeIncome()} />);

      const input = screen.getByLabelText(/estimated business expenses/i);
      await user.type(input, value);

      expect(await screen.findByRole('alert')).toBeInTheDocument();
      expect(input).toHaveAttribute('aria-invalid', 'true');

      // Wait longer than the recalculation delay to prove nothing is sent
      await new Promise((resolve) => setTimeout(resolve, 600));
      expect(fetchIncomeSummary).not.toHaveBeenCalled();
    });

    it('clears the error once the input is valid again', async () => {
      const user = userEvent.setup();
      render(<IncomeTaxTab initialIncome={makeIncome()} />);

      const input = screen.getByLabelText(/estimated business expenses/i);
      await user.type(input, 'abc');
      expect(await screen.findByRole('alert')).toBeInTheDocument();

      await user.clear(input);
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(input).toHaveAttribute('aria-invalid', 'false');
    });

    it('shows an error message if recalculating fails', async () => {
      const user = userEvent.setup();
      fetchIncomeSummary.mockRejectedValue({ friendlyMessage: 'Server unavailable.' });
      render(<IncomeTaxTab initialIncome={makeIncome()} />);

      await user.type(screen.getByLabelText(/estimated business expenses/i), '500');

      expect(await screen.findByText('Server unavailable.')).toBeInTheDocument();
    });
  });
});