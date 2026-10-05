import { useEffect, useState } from 'react';
import { fetchMyBookings } from '../api/bookings';

function ClientBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMyBookings()
      .then(setBookings)
      .catch((err) => setError(err.friendlyMessage || 'Could not load bookings.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="error-message" role="alert">{error}</p>;

  return (
    <div>
      <h1>My Bookings</h1>
      {bookings.length === 0 && <p>You haven't booked any gigs yet.</p>}
      <div className="booking-list">
        {bookings.map((b) => (
          <div key={b.id} className="booking-card">
            <h2>{b.gigTitle}</h2>
            <p>Freelancer: {b.freelancer?.email}</p>
            <p>Amount: R{b.amount}</p>
            <p>Reference: {b.reference}</p>
            <p>Status: {b.status}</p>
            <p>Booked on: {new Date(b.createdAt).toLocaleDateString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ClientBookingsPage;