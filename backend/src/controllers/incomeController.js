const mongoose = require('mongoose');
const Transaction = require('../models/transactionModel');
const Booking = require('../models/bookingModel');
const { calculateTax, parseExpenses } = require('../services/taxService');
const { sendSuccess, sendError } = require('../utils/responseHandler');


const TAX_YEAR_START_DATE = new Date('2026-03-01T00:00:00+02:00');
const TAX_YEAR_END_DATE = new Date('2027-03-01T00:00:00+02:00');
const TIME_ZONE = 'Africa/Johannesburg';

const TAX_YEAR_MONTHS = [
  { month: '2026-03', label: 'Mar 2026' },
  { month: '2026-04', label: 'Apr 2026' },
  { month: '2026-05', label: 'May 2026' },
  { month: '2026-06', label: 'Jun 2026' },
  { month: '2026-07', label: 'Jul 2026' },
  { month: '2026-08', label: 'Aug 2026' },
  { month: '2026-09', label: 'Sep 2026' },
  { month: '2026-10', label: 'Oct 2026' },
  { month: '2026-11', label: 'Nov 2026' },
  { month: '2026-12', label: 'Dec 2026' },
  { month: '2027-01', label: 'Jan 2027' },
  { month: '2027-02', label: 'Feb 2027' },
];

function roundCurrency(value) {
  return Math.round(value * 100) / 100;
}

function buildIncomePerMonth(rows) {
  const incomeByMonth = new Map(rows.map((row) => [row._id, row.income]));
  return TAX_YEAR_MONTHS.map(({ month, label }) => ({
    month,
    label,
    income: roundCurrency(incomeByMonth.get(month) || 0),
  }));
}

function buildIncomePerGig(rows) {
  return rows.map((row) => ({
    gigId: row._id ? String(row._id) : null,
    gigTitle: row.gigTitle || 'Unknown gig',
    income: roundCurrency(row.income),
    bookings: row.bookings,
  }));
}

async function getIncomeSummary(req, res) {
  let expenses;
  try {
    expenses = parseExpenses(req.query.expenses);
  } catch (err) {
    return sendError(res, 400, err.message);
  }

  try {
    const [result] = await Transaction.aggregate([
      {
        $match: {
          freelancer: new mongoose.Types.ObjectId(req.user.id),
          status: 'completed',
          createdAt: { $gte: TAX_YEAR_START_DATE, $lt: TAX_YEAR_END_DATE },
        },
      },

      {
        $lookup: {
          from: Booking.collection.name,
          localField: 'booking',
          foreignField: '_id',
          as: 'booking',
        },
      },
      { $unwind: { path: '$booking', preserveNullAndEmptyArrays: true } },
      {
        $facet: {
          totals: [
            {
              $group: {
                _id: null,
                totalIncome: { $sum: '$amount' },
                transactionCount: { $sum: 1 },
              },
            },
          ],
          byMonth: [
            {
              $group: {
                _id: {
                  $dateToString: { format: '%Y-%m', date: '$createdAt', timezone: TIME_ZONE },
                },
                income: { $sum: '$amount' },
              },
            },
          ],
          byGig: [
            {
              $group: {
                _id: '$booking.gig',
                gigTitle: { $first: '$booking.gigTitle' },
                income: { $sum: '$amount' },
                bookings: { $sum: 1 },
              },
            },
            { $sort: { income: -1 } },
          ],
        },
      },
    ]);

    const totals = result && result.totals[0];
    const grossIncome = totals ? totals.totalIncome : 0;
    const transactionCount = totals ? totals.transactionCount : 0;

    const estimate = calculateTax(grossIncome, expenses);

    return sendSuccess(res, 200, 'Income summary retrieved successfully.', {
      income: {
        currency: 'ZAR',
        transactionCount,
        ...estimate,
        incomePerMonth: buildIncomePerMonth(result ? result.byMonth : []),
        incomePerGig: buildIncomePerGig(result ? result.byGig : []),
      },
    });
  } catch (err) {
    return sendError(res, 500, 'An unexpected error occurred while calculating income.');
  }
}

module.exports = { getIncomeSummary, buildIncomePerMonth, buildIncomePerGig };

