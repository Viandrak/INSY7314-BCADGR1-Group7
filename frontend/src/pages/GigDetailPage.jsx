import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchGigById } from '../api/gigs';
import { createBooking } from '../api/bookings';

function GigDetailPage() {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [gig, setGig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [booking, setBooking] = useState(false);
  const [confirmation, setConfirmation] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchGigById(id)
      .then((data) => { if (!cancelled) setGig(data); })
      .catch((err) => { if (!cancelled) setError(err.friendlyMessage || 'Gig not found.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  async function handleBook() {
    setError('');
    setBooking(true);
    try {
      const result = await createBooking(id);
      setConfirmation(result);
    } catch (err) {
      setError(err.friendlyMessage || 'Could not complete booking.');
    } finally {
      setBooking(false);
    }
  }

  if (loading) return <p>Loading...</p>;
  if (error && !gig) return <p className="error-message" role="alert">{error}</p>;

  // Confirmation screen, shown after a successful booking
  if (confirmation) {
    return (
      <div className="confirmation-screen">
        <h1>Booking Confirmed</h1>
        <p>This is a simulated confirmation — no real payment was processed.</p>
        <dl>
          <dt>Reference</dt>
          <dd>{confirmation.booking.reference}</dd>
          <dt>Gig</dt>
          <dd>{confirmation.booking.gigTitle}</dd>
          <dt>Amount</dt>
          <dd>R{confirmation.booking.amount}</dd>
        </dl>
        <button onClick={() => navigate('/bookings')}>View My Bookings</button>
      </div>
    );
  }

  const canBook = isAuthenticated && user.role === 'client';
  const isOwnGig = isAuthenticated && user.role === 'freelancer' && gig.freelancer?._id === user.id;

  return (
    <div>
      <h1>{gig.title}</h1>
      <p className="gig-category">{gig.category}</p>
      <p>{gig.description}</p>
      <p><strong>R{gig.price}</strong> · {gig.deliveryDays} day delivery</p>
      <p className="gig-freelancer">By {gig.freelancer?.email}</p>

      {error && <p className="error-message" role="alert">{error}</p>}

      {!isAuthenticated && <p>Please <a href="/login">log in</a> as a client to book this gig.</p>}
      {isAuthenticated && !canBook && !isOwnGig && <p>Only client accounts can book gigs.</p>}
      {isOwnGig && <p>This is your own gig listing.</p>}

      {canBook && (
        <button onClick={handleBook} disabled={booking}>
          {booking ? 'Booking...' : 'Book Now'}
        </button>
      )}
    </div>
  );
}

export default GigDetailPage;