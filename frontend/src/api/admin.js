import apiClient from './client';

export async function fetchAllUsers() {
  const response = await apiClient.get('/admin/users');
  return response.data.users;
}

export async function fetchAllGigsAdmin() {
  const response = await apiClient.get('/admin/gigs');
  return response.data.gigs;
}

export async function fetchAllBookingsAdmin() {
  const response = await apiClient.get('/admin/bookings');
  return response.data.bookings;
}


export async function unlockUser(userId) {
  const response = await apiClient.post(`/admin/users/${userId}/unlock`);
  return response.data;
}

export async function fetchAuditLogs() {
  const response = await apiClient.get('/admin/audit-logs');
  return response.data.logs;
}