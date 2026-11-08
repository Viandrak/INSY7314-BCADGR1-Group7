import { useEffect, useState } from 'react';
import {
  fetchAllUsers,
  fetchAllGigsAdmin,
  fetchAllBookingsAdmin,
  fetchAuditLogs,
  unlockUser,
} from '../api/admin';

// A lock is active while its end time is still in the future
function isLocked(user) {
  return !!user.lockUntil && new Date(user.lockUntil).getTime() > Date.now();
}

const EVENT_LABELS = {
  login_success: 'Login',
  login_failure: 'Failed login',
  account_locked: 'Account locked',
  account_unlocked: 'Account unlocked',
  logout: 'Logout',
  access_denied: 'Access denied (403)',
};

function AdminPage() {
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [gigs, setGigs] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoaded, setAuditLoaded] = useState(false);
  const [auditError, setAuditError] = useState('');

  // loading starts as true and error as '', so the effect only needs to update state once the requests finish
  useEffect(() => {
    Promise.all([fetchAllUsers(), fetchAllGigsAdmin(), fetchAllBookingsAdmin()])
      .then(([usersData, gigsData, bookingsData]) => {
        setUsers(usersData);
        setGigs(gigsData);
        setBookings(bookingsData);
      })
      .catch((err) => setError(err.friendlyMessage || 'Could not load admin data.'))
      .finally(() => setLoading(false));
  }, []);

  // The audit log is only requested when its tab is opened
  function openAuditTab() {
    setTab('audit');
    loadAuditLogs();
  }

  function loadAuditLogs() {
    setAuditError('');
    fetchAuditLogs()
      .then((logs) => setAuditLogs(logs))
      .catch((err) => setAuditError(err.friendlyMessage || 'Could not load the audit log.'))
      .finally(() => setAuditLoaded(true));
  }

  async function handleUnlock(userId) {
    setError('');
    setMessage('');
    try {
      await unlockUser(userId);
      // The account is no longer locked, so clear it in the list straight away
      setUsers((current) =>
        current.map((u) => (u.id === userId ? { ...u, failedLoginAttempts: 0, lockUntil: null } : u))
      );
      setMessage('Account unlocked.');
    } catch (err) {
      setError(err.friendlyMessage || 'Could not unlock the account.');
    }
  }

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
        <button onClick={openAuditTab} className={tab === 'audit' ? 'active' : ''}>
          Audit log
        </button>
      </div>

      {error && <p className="error-message" role="alert">{error}</p>}
      {message && <p className="hint" role="status">{message}</p>}

      {tab === 'users' && (
        <table className="admin-table">
          <thead>
            <tr><th>Email</th><th>Role</th><th>Joined</th><th>Status</th></tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.email}</td>
                <td>{u.role}</td>
                <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                <td>
                  {isLocked(u) ? (
                    <>
                      Locked until {new Date(u.lockUntil).toLocaleTimeString()}{' '}
                      <button className="secondary" onClick={() => handleUnlock(u.id)}>
                        Unlock {u.email}
                      </button>
                    </>
                  ) : (
                    'Active'
                  )}
                </td>
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

      {tab === 'audit' && (
        <>
          {auditError && <p className="error-message" role="alert">{auditError}</p>}
          {!auditLoaded && !auditError && <p>Loading audit log...</p>}
          {auditLoaded && !auditError && (
            <table className="admin-table">
              <thead>
                <tr><th>Time</th><th>Event</th><th>Email</th><th>IP address</th><th>Details</th></tr>
              </thead>
              <tbody>
                {auditLogs.map((entry) => (
                  <tr key={entry.id}>
                    <td>{new Date(entry.createdAt).toLocaleString()}</td>
                    <td>{EVENT_LABELS[entry.event] || entry.event}</td>
                    <td>{entry.email || '-'}</td>
                    <td>{entry.ip || '-'}</td>
                    <td>{entry.details || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {auditLoaded && !auditError && auditLogs.length === 0 && <p>No security events yet.</p>}
        </>
      )}
    </div>
  );
}

export default AdminPage;