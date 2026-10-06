import { useEffect, useState } from 'react';
import { fetchAllUsers, fetchAllGigsAdmin, fetchAllBookingsAdmin } from '../api/admin';

function AdminPage() {
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [gigs, setGigs] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    Promise.all([fetchAllUsers(), fetchAllGigsAdmin(), fetchAllBookingsAdmin()])
      .then(([usersData, gigsData, bookingsData]) => {
        setUsers(usersData);
        setGigs(gigsData);
        setBookings(bookingsData);
      })
      .catch((err) => setError(err.friendlyMessage || 'Could not load admin data.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <h1>Admin</h1>

      <div className="tabs">
        <button onClick={() => setTab('users')} className={tab === 'users' ? 'active' : ''}>
          Users ({users.length})
        </button>
        <button onClick={() => setTab('gigs')} className={tab === 'gigs' ? 'active' : ''}>
          Gigs ({gigs.length})
        </button>
        <button onClick={() => setTab('bookings')} className={tab === 'bookings' ? 'active' : ''}>
          Bookings ({bookings.length})
        </button>
      </div>

      {error && <p className="error-message" role="alert">{error}</p>}

      {tab === 'users' && (
        <table className="admin-table">
          <thead>
            <tr><th>Email</th><th>Role</th><th>Joined</th></tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.email}</td>
                <td>{u.role}</td>
                <td>{new Date(u.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {tab === 'gigs' && (
        <table className="admin-table">
          <thead>
            <tr><th>Title</th><th>Category</th><th>Price</th><th>Freelancer</th></tr>
          </thead>
          <tbody>
            {gigs.map((g) => (
              <tr key={g.id}>
                <td>{g.title}</td>
                <td>{g.category}</td>
                <td>R{g.price}</td>
                <td>{g.freelancer?.email}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {tab === 'bookings' && (
        <table className="admin-table">
          <thead>
            <tr><th>Gig</th><th>Client</th><th>Freelancer</th><th>Amount</th><th>Reference</th></tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b.id}>
                <td>{b.gigTitle}</td>
                <td>{b.client?.email}</td>
                <td>{b.freelancer?.email}</td>
                <td>R{b.amount}</td>
                <td>{b.reference}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default AdminPage;