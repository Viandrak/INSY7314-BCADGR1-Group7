import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <nav className="navbar">
      <Link to="/" className="brand">HustleHub<span className="accent">+</span></Link>
      <div className="nav-links">
        <Link to="/gigs">Browse Gigs</Link>
        {isAuthenticated && user.role === 'client' && <Link to="/bookings">My Bookings</Link>}
        {isAuthenticated && user.role === 'freelancer' && <Link to="/dashboard">My Dashboard</Link>}
        {isAuthenticated && user.role === 'admin' && <Link to="/admin">Admin</Link>}
        {isAuthenticated ? (
          <>
            <span className="user-email">{user.email}</span>
            <button onClick={handleLogout} className="secondary">Log out</button>
          </>
        ) : (
          <>
            <Link to="/login">Log in</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;