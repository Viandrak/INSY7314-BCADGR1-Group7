import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('client');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await register(email, password, role);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err.friendlyMessage || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <h1>Register</h1>
      {success ? (
        <p>Account created! Redirecting to login...</p>
      ) : (
        <form onSubmit={handleSubmit}>
          <label htmlFor="email">Email</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />

          <label htmlFor="password">Password</label>
          <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <p className="hint">At least 8 characters, with an uppercase letter, a lowercase letter and a number.</p>

          <label htmlFor="role">I am a...</label>
          <select id="role" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="client">Client (hiring freelancers)</option>
            <option value="freelancer">Freelancer (offering services)</option>
          </select>

          {error && <p className="error-message" role="alert">{error}</p>}

          <button type="submit" disabled={submitting}>
            {submitting ? 'Creating account...' : 'Register'}
          </button>
        </form>
      )}
      <p>Already have an account? <Link to="/login">Log in</Link></p>
    </div>
  );
}

export default RegisterPage;