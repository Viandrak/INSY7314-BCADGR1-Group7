import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import BrowseGigsPage from './pages/BrowseGigsPage';
import GigDetailPage from './pages/GigDetailPage';
import ClientBookingsPage from './pages/ClientBookingsPage';
import './App.css';

function HomePage() {
  return (
    <div>
      <h1>Welcome to HustleHub+</h1>
      <p>Browse gigs, book freelancers, and track your income — all in one place.</p>
    </div>
  );
}

function App() {
  return (
    <>
      <Navbar />
      <main className="page-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/gigs" element={<BrowseGigsPage />} />
          <Route path="/gigs/:id" element={<GigDetailPage />} />
          <Route
            path="/bookings"
            element={
              <ProtectedRoute allowedRoles={['client']}>
                <ClientBookingsPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </>
  );
}

export default App;