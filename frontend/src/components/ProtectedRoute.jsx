import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

// loginMessage is optional: when given, it is passed to the login page so the
// visitor can see why they were sent there
function ProtectedRoute({ children, allowedRoles, loginMessage }) {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={loginMessage ? { message: loginMessage } : undefined} />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;