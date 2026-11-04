const express = require('express');
const request = require('supertest');

// Replace the database model so no real database is needed
jest.mock('../src/models/transactionModel', () => ({ aggregate: jest.fn() }));

const Transaction = require('../src/models/transactionModel');
const { getIncomeSummary } = require('../src/controllers/incomeController');

const FREELANCER_ID = '6acb834eb21771fe989d0778';

function buildApp() {
  const app = express();
  app.get(
    '/summary',
    (req, res, next) => {
      req.user = { id: FREELANCER_ID, role: 'freelancer' };
      next();
    },
    getIncomeSummary
  );
  return app;
}

function mockIncome() {
  Transaction.aggregate.mockResolvedValue([
    {
      totals: [{ _id: null, totalIncome: 20000, transactionCount: 3 }],
      byMonth: [
        { _id: '2026-04', income: 12000 },
        { _id: '2026-10', income: 8000 },
      ],
      byGig: [
        { _id: '6acb834eb21771fe989d0801', gigTitle: 'Logo Design', income: 14000, bookings: 2 },
        { _id: '6acb834eb21771fe989d0802', gigTitle: 'Website Build', income: 6000, bookings: 1 },
      ],
    },
  ]);
}

describe('GET income summary', () => {
  test('returns the tax estimate with every required field', async () => {
    mockIncome();
    const res = await request(buildApp()).get('/summary');

    expect(res.status).toBe(200);
    expect(res.body.income).toEqual(
      expect.objectContaining({
        currency: 'ZAR',
        taxYear: '2026/27',
        transactionCount: 3,
        grossIncome: 20000,
        expensesUsed: 0,
        taxableIncome: 20000,
        estimatedTax: 0,
        effectiveTaxRate: 0,
        incomeAfterTax: 20000,
        taxBracket: expect.any(Object),
        assumptions: expect.any(Array),
        disclaimer: expect.stringMatching(/illustrative estimate/i),
      })
    );
  });

  test('deducts the expenses from the query string before calculating tax', async () => {
    mockIncome();
    const res = await request(buildApp()).get('/summary?expenses=5000');

    expect(res.body.income.grossIncome).toBe(20000);
    expect(res.body.income.expensesUsed).toBe(5000);
    expect(res.body.income.taxableIncome).toBe(15000);
  });

  test('taxable income is 0 when expenses are greater than income', async () => {
    mockIncome();
    const res = await request(buildApp()).get('/summary?expenses=50000');

    expect(res.status).toBe(200);
    expect(res.body.income.taxableIncome).toBe(0);
    expect(res.body.income.estimatedTax).toBe(0);
  });

  test.each([
    ['negative number', '-5'],
    ['text', 'abc'],
    ['number with letters', '12abc'],
    ['exponent', '1e5'],
    ['above the maximum', '999999999999'],
    ['array', '1&expenses=2'],
  ])('rejects expenses that are a %s with 400 and never queries the database', async (_name, value) => {
    const res = await request(buildApp()).get(`/summary?expenses=${value}`);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(Transaction.aggregate).not.toHaveBeenCalled();
  });

  test('returns income for all 12 months of the tax year, with 0 for empty months', async () => {
    mockIncome();
    const res = await request(buildApp()).get('/summary');
    const months = res.body.income.incomePerMonth;

    expect(months).toHaveLength(12);
    expect(months[0]).toEqual({ month: '2026-03', label: 'Mar 2026', income: 0 });
    expect(months[1]).toEqual({ month: '2026-04', label: 'Apr 2026', income: 12000 });
    expect(months[7]).toEqual({ month: '2026-10', label: 'Oct 2026', income: 8000 });
    expect(months[11].month).toBe('2027-02');

    const total = months.reduce((sum, m) => sum + m.income, 0);
    expect(total).toBe(res.body.income.grossIncome);
  });

  test('returns income per gig, highest first', async () => {
    mockIncome();
    const res = await request(buildApp()).get('/summary');

    expect(res.body.income.incomePerGig).toEqual([
      { gigId: '6acb834eb21771fe989d0801', gigTitle: 'Logo Design', income: 14000, bookings: 2 },
      { gigId: '6acb834eb21771fe989d0802', gigTitle: 'Website Build', income: 6000, bookings: 1 },
    ]);
  });

  test('a freelancer with no transactions gets zeros and empty lists', async () => {
    Transaction.aggregate.mockResolvedValue([{ totals: [], byMonth: [], byGig: [] }]);
    const res = await request(buildApp()).get('/summary');

    expect(res.status).toBe(200);
    expect(res.body.income.grossIncome).toBe(0);
    expect(res.body.income.estimatedTax).toBe(0);
    expect(res.body.income.incomePerMonth).toHaveLength(12);
    expect(res.body.income.incomePerGig).toEqual([]);
  });

  test('only counts completed transactions of the logged-in freelancer inside the tax year', async () => {
    mockIncome();
    await request(buildApp()).get('/summary?freelancer=someone-else');

    const match = Transaction.aggregate.mock.calls[0][0][0].$match;
    expect(String(match.freelancer)).toBe(FREELANCER_ID);
    expect(match.status).toBe('completed');
    expect(match.createdAt.$gte.toISOString()).toBe('2026-02-28T22:00:00.000Z');
    expect(match.createdAt.$lt.toISOString()).toBe('2027-02-28T22:00:00.000Z');
  });

  test('returns a safe 500 message when the database fails', async () => {
    Transaction.aggregate.mockRejectedValue(new Error('connection refused to 10.0.0.5'));
    const res = await request(buildApp()).get('/summary');

    expect(res.status).toBe(500);
    expect(res.body.message).toBe('An unexpected error occurred while calculating income.');
    expect(JSON.stringify(res.body)).not.toMatch(/10\.0\.0\.5/);
  });
});