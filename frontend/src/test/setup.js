import '@testing-library/jest-dom';
import { vi } from 'vitest';

vi.mock('recharts', async () => {
  const React = await import('react');
  const passThrough = ({ children }) => React.createElement('div', null, children);
  const nothing = () => null;
  return {
    ResponsiveContainer: passThrough,
    BarChart: ({ data }) =>
      React.createElement('div', { 'data-testid': 'chart-data', 'data-points': JSON.stringify(data) }),
    Bar: nothing,
    Cell: nothing,
    CartesianGrid: nothing,
    Tooltip: nothing,
    XAxis: nothing,
    YAxis: nothing,
  };
});