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