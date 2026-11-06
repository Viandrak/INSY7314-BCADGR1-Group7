const {
  calculateTax,
  parseExpenses,
  PRIMARY_REBATE,
  MAX_EXPENSES,
  ASSUMPTIONS,
} = require('../src/services/taxService');

describe('Tax service (SARS 2026/27, illustrative estimate)', () => {
  test('zero income gives zero tax and a 0 effective rate', () => {
    const result = calculateTax(0);
    expect(result.estimatedTax).toBe(0);
    expect(result.taxableIncome).toBe(0);
    expect(result.effectiveTaxRate).toBe(0);
    expect(result.incomeAfterTax).toBe(0);
  });

  test('income below the tax threshold (R99 000) pays no tax', () => {
    expect(calculateTax(50000).estimatedTax).toBe(0);
    expect(calculateTax(99000).estimatedTax).toBe(0);
  });

  test('income just above the threshold pays a small amount of tax', () => {
    // 18% of 100 000 = 18 000, minus the 17 820 rebate = 180
    expect(calculateTax(100000).estimatedTax).toBe(180);
  });

  describe('exact bracket boundaries', () => {
    test.each([
      [245100, 1, 26298],   // 18% of 245 100 = 44 118, minus 17 820 rebate
      [245101, 2, 26298.26],
      [383100, 2, 62178],   // 44 118 + 26% of 138 000 = 79 998, minus rebate
      [383101, 3, 62178.31],
      [530200, 3, 107779], // 125 599 - 17 820
      [530201, 4, 107779.36],
      [695800, 4, 167395], // 185 215 - 17 820
      [695801, 5, 167395.39],
      [887000, 5, 241963], // 259 783 - 17 820
      [887001, 6, 241963.41],
      [1878600, 6, 648519], // 666 339 - 17 820
      [1878601, 7, 648519.45],
    ])('R%d is in bracket %d and pays R%d', (income, bracketNumber, tax) => {
      const result = calculateTax(income);
      expect(result.taxBracket.number).toBe(bracketNumber);
      expect(result.estimatedTax).toBeCloseTo(tax, 2);
    });
  });

  test('high income uses the top 45% bracket', () => {
    const result = calculateTax(3000000);
    expect(result.taxBracket.marginalRate).toBe(0.45);
    expect(result.taxBracket.to).toBeNull();
    expect(result.estimatedTax).toBe(1153149);
  });

  test('expenses reduce taxable income and therefore tax', () => {
    const withoutExpenses = calculateTax(400000);
    const withExpenses = calculateTax(400000, 100000);
    expect(withExpenses.grossIncome).toBe(400000);
    expect(withExpenses.expensesUsed).toBe(100000);
    expect(withExpenses.taxableIncome).toBe(300000);
    expect(withExpenses.estimatedTax).toBeLessThan(withoutExpenses.estimatedTax);
  });

  test('expenses greater than income give taxable income of 0, never negative', () => {
    const result = calculateTax(50000, 80000);
    expect(result.taxableIncome).toBe(0);
    expect(result.estimatedTax).toBe(0);
    expect(result.incomeAfterTax).toBe(50000);
  });

  test('expenses default to 0 when none are entered', () => {
    expect(calculateTax(200000).expensesUsed).toBe(0);
    expect(calculateTax(200000, '').expensesUsed).toBe(0);
    expect(calculateTax(200000, null).expensesUsed).toBe(0);
  });

  test('the result includes every required field', () => {
    const result = calculateTax(300000, 20000);
    expect(result).toEqual(
      expect.objectContaining({
        taxYear: '2026/27',
        grossIncome: 300000,
        expensesUsed: 20000,
        taxableIncome: 280000,
        estimatedTax: expect.any(Number),
        effectiveTaxRate: expect.any(Number),
        taxBracket: expect.any(Object),
        incomeAfterTax: expect.any(Number),
        assumptions: ASSUMPTIONS,
      })
    );
    expect(result.disclaimer).toMatch(/illustrative estimate/i);
    expect(result.disclaimer).toMatch(/not professional tax advice/i);
  });

  test('applies only the primary rebate', () => {
    expect(PRIMARY_REBATE).toBe(17820);
  });

  describe('invalid expense input is rejected', () => {
    test.each([-1, -0.01, 'abc', '12abc', NaN, Infinity, {}, [], true, '1e5'])(
      'rejects %p',
      (bad) => {
        expect(() => parseExpenses(bad)).toThrow(/expenses must be/i);
      }
    );

    test('rejects a value above the maximum', () => {
      expect(() => parseExpenses(MAX_EXPENSES + 1)).toThrow(/not be more than/i);
    });

    test('accepts 0, the maximum and numeric strings', () => {
      expect(parseExpenses(0)).toBe(0);
      expect(parseExpenses(MAX_EXPENSES)).toBe(MAX_EXPENSES);
      expect(parseExpenses('1500.50')).toBe(1500.5);
    });

    test('calculateTax rejects invalid expenses and negative income', () => {
      expect(() => calculateTax(100000, -5)).toThrow();
      expect(() => calculateTax(100000, 'text')).toThrow();
      expect(() => calculateTax(-1)).toThrow();
    });
  });
});