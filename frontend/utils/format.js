// Formats a number as South African Rand
export function formatRand(amount) {
  const [whole, decimals] = Number(amount).toFixed(2).split('.');
  const spaced = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `R${spaced}.${decimals}`;
}

// Formats a rate such as 0.1234 as 12.34%
export function formatPercent(rate) {
  return `${(Number(rate) * 100).toFixed(2)}%`;
}