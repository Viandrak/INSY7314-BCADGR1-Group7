
export const MAX_EXPENSES = 100000000;

export function validateExpenses(value) {
  const text = String(value).trim();
  if (text === '') return '';

  const parts = text.split('.');
  const isPlainNumber =
    parts.length <= 2 &&
    /^\d{1,12}$/.test(parts[0]) &&
    (parts.length === 1 || /^\d{1,2}$/.test(parts[1]));

  if (!isPlainNumber) {
    return 'Enter a number of 0 or more, for example 15000 or 1500.50.';
  }
  if (Number(text) > MAX_EXPENSES) {
    return 'Expenses can not be more than R100 000 000.';
  }
  return '';
}