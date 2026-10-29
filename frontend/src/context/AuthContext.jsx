import { useState } from 'react';
import apiClient from '../api/client';
import { AuthContext } from './AuthContextInstance';

// Reads a saved session from localStorage. Returns empty values if nothing
// is saved or the saved user data is not valid JSON
function readStoredSession() {
  const storedToken = localStorage.getItem('token');
  const storedUser = localStorage.getItem('user');
  if (!storedToken || !storedUser) {
    return { token: null, user: null };
  }
  try {
    return { token: storedToken, user: JSON.parse(storedUser) };
  } catch {
    return { token: null, user: null };
  }
}

export function AuthProvider({ children }) {

  // Token and user are kept together so they always stay in sync
  const [session, setSession] = useState(readStoredSession);
  const { token, user } = session;

  async function login(email, password) {
    const response = await apiClient.post('/auth/login', { email, password });
    const { token: newToken, user: newUser } = response.data;
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setSession({ token: newToken, user: newUser });
    return newUser;
  }

  async function register(email, password, role) {
    await apiClient.post('/auth/register', { email, password, role });
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setSession({ token: null, user: null });
  }

  // loading is always false now because the session is read synchronously
  const value = { user, token, loading: false, login, register, logout, isAuthenticated: !!token };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}