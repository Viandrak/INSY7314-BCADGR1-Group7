import apiClient from './client';

export async function fetchGigs(category) {
  const params = category ? { category } : {};
  const response = await apiClient.get('/gigs', { params });
  return response.data.gigs;
}

export async function fetchGigById(id) {
  const response = await apiClient.get(`/gigs/${id}`);
  return response.data.gig;
}

export async function fetchMyGigs() {
  const response = await apiClient.get('/gigs/mine');
  return response.data.gigs;
}

export async function createGig(gigData) {
  const response = await apiClient.post('/gigs', gigData);
  return response.data.gig;
}

export async function updateGig(id, updates) {
  const response = await apiClient.patch(`/gigs/${id}`, updates);
  return response.data.gig;
}

export async function deleteGig(id) {
  await apiClient.delete(`/gigs/${id}`);
}