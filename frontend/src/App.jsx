import { Routes, Route, Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import BrowseGigsPage from './pages/BrowseGigsPage';
import GigDetailPage from './pages/GigDetailPage';
import ClientBookingsPage from './pages/ClientBookingsPage';
import './App.css';
import FreelancerDashboardPage from './pages/FreelancerDashboardPage';
import AdminPage from './pages/AdminPage';

function HomePage() {
  return (
    <div className="hero">
      <h1>Find the right <span className="accent">freelancer</span> for your project</h1>
      <p>Browse gigs, book freelancers, and track your income — all in one place.</p>
      <div className="hero-actions">
        <Link to="/gigs"><button>Browse Gigs</button></Link>
        <Link to="/register"><button className="secondary">Get Started</button></Link>
      </div>
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
          <Route
            path="/dashboard"
            element={
             <ProtectedRoute allowedRoles={['freelancer']}>
               <FreelancerDashboardPage />
             </ProtectedRoute>
            }
         />
         <Route
           path="/admin"
           element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminPage />
           </ProtectedRoute>
          }       
        />
        </Routes>
      </main>
    </>
  );
}

export default App;