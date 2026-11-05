import { useEffect, useRef, useState } from 'react';
import {
  BarChart,
  Bar,
  Cell,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { fetchIncomeSummary } from '../api/income';
import { validateExpenses } from '../utils/expenses';
import { formatPercent, formatRand } from '../utils/format';

const RECALCULATE_DELAY_MS = 400;

function useDebouncedValue(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function SummaryCard({ label, value, note }) {
  return (
    <div className="stat-card">
      <span className="stat-label">{label}</span>
      <strong className="stat-value">{value}</strong>
      {note && <span className="stat-note">{note}</span>}
    </div>
  );
}

function IncomeTaxTab({ initialIncome }) {
  const [income, setIncome] = useState(initialIncome);
  const [expenses, setExpenses] = useState('');
  const [fetchError, setFetchError] = useState('');
  const appliedExpenses = useRef('');

  const validationError = validateExpenses(expenses);
  const debouncedExpenses = useDebouncedValue(expenses, RECALCULATE_DELAY_MS);

  useEffect(() => {
    if (appliedExpenses.current === debouncedExpenses) return undefined;
    if (validateExpenses(debouncedExpenses)) return undefined;

    let cancelled = false;
    fetchIncomeSummary(debouncedExpenses.trim())
      .then((data) => {
        if (cancelled) return;
        appliedExpenses.current = debouncedExpenses;
        setIncome(data);
        setFetchError('');
      })
      .catch((err) => {
        if (!cancelled) setFetchError(err.friendlyMessage || 'Could not recalculate your estimate.');
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedExpenses]);

  const incomeVsTax = [
    { name: 'Gross income', amount: income.grossIncome, colour: '#ac367f' },
    { name: 'Taxable income', amount: income.taxableIncome, colour: '#d78bbd' },
    { name: 'Estimated tax', amount: income.estimatedTax, colour: '#c23e1f' },
    { name: 'Income after tax', amount: income.incomeAfterTax, colour: '#1f8a5b' },
  ];

  return (
    <div className="income-tax">
      <p className="estimate-banner">
        Illustrative estimate for the {income.taxYear} tax year (1 March 2026 to 28 February 2027).
        Not a guaranteed figure.
      </p>

      <div className="expenses-input">
        <label htmlFor="expenses">Estimated business expenses for {income.taxYear} (R)</label>
        <input
          id="expenses"
          type="text"
          inputMode="decimal"
          autoComplete="off"
          placeholder="0"
          value={expenses}
          onChange={(e) => setExpenses(e.target.value)}
          aria-invalid={validationError ? 'true' : 'false'}
          aria-describedby="expenses-help"
        />
        <p id="expenses-help" className="hint">
          Optional. Leave empty to use R0. Tax is calculated on your gross income minus these expenses.
        </p>
        {validationError && (
          <p className="error-message" role="alert">
            {validationError}
          </p>
        )}
        {fetchError && (
          <p className="error-message" role="alert">
            {fetchError}
          </p>
        )}
      </div>

      {income.transactionCount === 0 && (
        <p className="hint">
          You have no completed bookings in the {income.taxYear} tax year yet, so every figure is R0.
        </p>
      )}

      <div className="stat-grid">
        <SummaryCard label="Gross income" value={formatRand(income.grossIncome)} />
        <SummaryCard label="Business expenses" value={formatRand(income.expensesUsed)} />
        <SummaryCard label="Taxable income" value={formatRand(income.taxableIncome)} note="Gross income minus expenses" />
        <SummaryCard
          label="Estimated tax"
          value={formatRand(income.estimatedTax)}
          note={`Bracket ${income.taxBracket.number} (${Math.round(income.taxBracket.marginalRate * 100)}% on the top slice)`}
        />
        <SummaryCard label="Income after tax" value={formatRand(income.incomeAfterTax)} note="Gross income minus estimated tax" />
        <SummaryCard label="Effective tax rate" value={formatPercent(income.effectiveTaxRate)} note="Estimated tax as a share of gross income" />
      </div>

      <div className="chart-grid">
        <figure className="chart-card" data-testid="monthly-income-chart">
          <figcaption>Income per month ({income.taxYear} tax year)</figcaption>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={income.incomePerMonth} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `R${v}`} />
              <Tooltip formatter={(v) => formatRand(v)} />
              <Bar dataKey="income" name="Income" fill="#ac367f" />
            </BarChart>
          </ResponsiveContainer>
        </figure>

        <figure className="chart-card" data-testid="income-vs-tax-chart">
          <figcaption>Income vs tax</figcaption>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={incomeVsTax} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `R${v}`} />
              <Tooltip formatter={(v) => formatRand(v)} />
              <Bar dataKey="amount" name="Amount">
                {incomeVsTax.map((item) => (
                  <Cell key={item.name} fill={item.colour} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </figure>
      </div>

      <h2>Income per gig</h2>
      {income.incomePerGig.length === 0 ? (
        <p className="hint">No completed bookings to show yet.</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Gig</th>
              <th>Bookings</th>
              <th>Income</th>
            </tr>
          </thead>
          <tbody>
            {income.incomePerGig.map((gig) => (
              <tr key={gig.gigId || gig.gigTitle}>
                <td>{gig.gigTitle}</td>
                <td>{gig.bookings}</td>
                <td>{formatRand(gig.income)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <section className="how-we-estimate" aria-labelledby="how-we-estimate-heading">
        <h2 id="how-we-estimate-heading">How we estimate your tax</h2>
        <p>
          <strong>Tax year:</strong> {income.taxYear} (1 March 2026 to 28 February 2027). We use the
          SARS 2026/27 tax brackets for individuals and the primary rebate.
        </p>
        <p>This estimate is based on these assumptions:</p>
        <ul>
          {income.assumptions.map((assumption) => (
            <li key={assumption}>{assumption}</li>
          ))}
        </ul>
        <p>
          This is an <strong>illustrative estimate</strong>, not a guaranteed figure or an upper
          bound. Your actual tax may differ, for example if you have other income such as a salary
          (it could be higher) or deductions (it could be lower). This is not professional tax
          advice.
        </p>
        <p className="hint">
          Source:{' '}
          <a
            href="https://www.sars.gov.za/tax-rates/income-tax/rates-of-tax-for-individuals/"
            target="_blank"
            rel="noopener noreferrer"
          >
            SARS rates of tax for individuals
          </a>
        </p>
      </section>
    </div>
  );
}

export default IncomeTaxTab;