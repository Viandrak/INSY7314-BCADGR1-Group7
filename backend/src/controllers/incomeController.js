const mongoose = require('mongoose');
const Transaction = require('../models/transactionModel');
const { sendSuccess, sendError } = require('../utils/responseHandler');

const DEFAULT_TAX_RATE = 0.18;

// Reads the estimated tax rate from the environment, falling back to the
// default if it is missing or not a sensible value between 0 and 1.
function getTaxRate() {
  const rate = Number(process.env.ESTIMATED_TAX_RATE);
  return Number.isFinite(rate) && rate >= 0 && rate < 1 ? rate : DEFAULT_TAX_RATE;
}

// Rounds to 2 decimal places for currency values
function roundCurrency(value) {
  return Math.round(value * 100) / 100;
}

async function getIncomeSummary(req, res) {
  try {
    // Income is calculated only from the logged-in user's completed
    // transactions; the freelancer ID comes from the verified token.
    const [totals] = await Transaction.aggregate([
      {
        $match: {
          freelancer: new mongoose.Types.ObjectId(req.user.id),
          status: 'completed',
        },
      },
      {
        $group: {
          _id: null,
          totalIncome: { $sum: '$amount' },
          transactionCount: { $sum: 1 },
        },
      },
    ]);

    const totalIncome = totals ? totals.totalIncome : 0;
    const transactionCount = totals ? totals.transactionCount : 0;
    const taxRate = getTaxRate();
    const estimatedTax = roundCurrency(totalIncome * taxRate);

    return sendSuccess(res, 200, 'Income summary retrieved successfully.', {
      income: {
        currency: 'ZAR',
        totalIncome: roundCurrency(totalIncome),
        transactionCount,
        estimatedTaxRate: taxRate,
        estimatedTax,
        incomeAfterEstimatedTax: roundCurrency(totalIncome - estimatedTax),
        disclaimer: 'Estimated tax is an indication only and is not professional tax advice.',
      },
    });
  } catch (err) {
    return sendError(res, 500, 'An unexpected error occurred while calculating income.');
  }
}

module.exports = { getIncomeSummary };