import apiClient from './client';

export async function createBooking(gigId) {
  const response = await apiClient.post('/bookings', { gigId });
  return response.data; // { booking, transaction }
}

export async function fetchMyBookings() {
  const response = await apiClient.get('/bookings/mine');
  return response.data.bookings;
}

export async function fetchReceivedBookings() {
  const response = await apiClient.get('/bookings/received');
  return response.data.bookings;
}