import apiClient from './client';

export async function fetchIncomeSummary() {
  const response = await apiClient.get('/income/summary');
  return response.data.income;
}