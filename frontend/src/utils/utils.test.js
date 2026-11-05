import { describe, it, expect } from 'vitest';
import { validateExpenses, MAX_EXPENSES } from './expenses';
import { formatRand, formatPercent } from './format';

describe('validateExpenses', () => {
  it.each(['', '   ', '0', '15000', '1500.5', '1500.50', String(MAX_EXPENSES)])(
    'accepts %j',
    (value) => {
      expect(validateExpenses(value)).toBe('');
    }
  );

  it.each(['-1', '-0.5', 'abc', '12abc', '1e5', '1,000', '1.234', '1.2.3', 'R500', '0x10'])(
    'rejects %j as not a plain number',
    (value) => {
      expect(validateExpenses(value)).toMatch(/enter a number of 0 or more/i);
    }
  );

  it('rejects a value above the maximum', () => {
    expect(validateExpenses(String(MAX_EXPENSES + 1))).toMatch(/can not be more than/i);
  });
});

describe('formatting', () => {
  it('formats rand with space-separated thousands and 2 decimals', () => {
    expect(formatRand(0)).toBe('R0.00');
    expect(formatRand(950)).toBe('R950.00');
    expect(formatRand(1234.5)).toBe('R1 234.50');
    expect(formatRand(1153149)).toBe('R1 153 149.00');
  });

  it('formats a rate as a percentage', () => {
    expect(formatPercent(0)).toBe('0.00%');
    expect(formatPercent(0.1234)).toBe('12.34%');
  });
});