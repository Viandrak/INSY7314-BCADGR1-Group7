const TAX_YEAR = '2026/27';
const TAX_YEAR_START = '2026-03-01';
const TAX_YEAR_END = '2027-02-28';

// SARS 2026/27 rates for individuals (tax year 1 March 2026 - 28 February 2027)
const BRACKETS = [
  { from: 0, to: 245100, base: 0, rate: 0.18 },
  { from: 245100, to: 383100, base: 44118, rate: 0.26 },
  { from: 383100, to: 530200, base: 79998, rate: 0.31 },
  { from: 530200, to: 695800, base: 125599, rate: 0.36 },
  { from: 695800, to: 887000, base: 185215, rate: 0.39 },
  { from: 887000, to: 1878600, base: 259783, rate: 0.41 },
  { from: 1878600, to: Infinity, base: 666339, rate: 0.45 },
];

const PRIMARY_REBATE = 17820;

const MAX_EXPENSES = 100000000;

const ASSUMPTIONS = [
  'The tax year is 2026/27 (1 March 2026 to 28 February 2027).',
  "Income is the gross total of the freelancer's completed bookings in that tax year.",
  "HustleHub+ income is treated as the freelancer's only taxable income.",
  'Only the business expenses the freelancer enters are deducted.',
  'Only the primary rebate (under 65) applies. There are no age rebates, medical credits or provisional tax timing.',
];

const DISCLAIMER =
  'This is an illustrative estimate based on the stated assumptions, not a guaranteed figure or an upper bound. ' +
  'Actual tax may be higher (for example with other income) or lower (for example with deductions). ' +
  'It is not professional tax advice.';

// Rounds to 2 decimal places for currency values
function roundCurrency(value) {
  return Math.round(value * 100) / 100;
}

function isPlainDecimal(text) {
  const parts = text.split('.');
  const [whole, decimals = '0'] = parts;
  return (
    parts.length <= 2 &&
    /^\d{1,12}$/.test(whole) &&
    /^\d{1,2}$/.test(decimals)
  );
}

function parseExpenses(value) {
  if (value === undefined || value === null || value === '') return 0;

  if (typeof value === 'string' && !isPlainDecimal(value.trim())) {
    throw new Error('Expenses must be a number of 0 or more.');
  }
  if (typeof value !== 'string' && typeof value !== 'number') {
    throw new Error('Expenses must be a number of 0 or more.');
  }

  const expenses = Number(value);
  if (!Number.isFinite(expenses) || expenses < 0) {
    throw new Error('Expenses must be a number of 0 or more.');
  }
  if (expenses > MAX_EXPENSES) {
    throw new Error('Expenses must not be more than R100 000 000.');
  }
  return expenses;
}

function findBracket(taxableIncome) {
  const bracket = BRACKETS.find((b) => taxableIncome <= b.to);
  return { index: BRACKETS.indexOf(bracket), bracket };
}

function calculateTax(grossIncome, expensesInput) {
  const gross = Number(grossIncome);
  if (!Number.isFinite(gross) || gross < 0) {
    throw new Error('Gross income must be a number of 0 or more.');
  }
  const expenses = parseExpenses(expensesInput);

  const taxableIncome = Math.max(gross - expenses, 0);

  const { index, bracket } = findBracket(taxableIncome);
  const taxBeforeRebate = bracket.base + (taxableIncome - bracket.from) * bracket.rate;

  const estimatedTax = roundCurrency(Math.max(taxBeforeRebate - PRIMARY_REBATE, 0));
  const effectiveTaxRate = gross > 0 ? Math.round((estimatedTax / gross) * 10000) / 10000 : 0;

  return {
    taxYear: TAX_YEAR,
    taxYearStart: TAX_YEAR_START,
    taxYearEnd: TAX_YEAR_END,
    grossIncome: roundCurrency(gross),
    expensesUsed: roundCurrency(expenses),
    taxableIncome: roundCurrency(taxableIncome),
    estimatedTax,
    effectiveTaxRate,
    taxBracket: {
      number: index + 1,
      marginalRate: bracket.rate,
      from: bracket.from,
      to: bracket.to === Infinity ? null : bracket.to,
    },
    primaryRebate: PRIMARY_REBATE,
    incomeAfterTax: roundCurrency(gross - estimatedTax),
    assumptions: ASSUMPTIONS,
    disclaimer: DISCLAIMER,
  };
}

module.exports = {
  calculateTax,
  parseExpenses,
  BRACKETS,
  PRIMARY_REBATE,
  MAX_EXPENSES,
  TAX_YEAR,
  TAX_YEAR_START,
  TAX_YEAR_END,
  ASSUMPTIONS,
  DISCLAIMER,
};

/*
 * References:
 *
 * South African Revenue Service, 2026. Rates of Tax for Individuals. [Online] Available at: https://www.sars.gov.za/tax-rates/income-tax/rates-of-tax-for-individuals/ [Accessed 3 November 2026].
 */