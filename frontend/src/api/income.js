import apiClient from './client';

export async function fetchIncomeSummary(expenses) {
  const params = expenses === undefined || expenses === '' ? {} : { expenses };
  const response = await apiClient.get('/income/summary', { params });
  return response.data.income;
}