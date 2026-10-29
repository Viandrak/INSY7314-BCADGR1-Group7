import { useEffect, useState } from 'react';
import { fetchMyGigs, createGig, updateGig, deleteGig } from '../api/gigs';
import { fetchReceivedBookings } from '../api/bookings';
import { fetchIncomeSummary } from '../api/income';
import GigForm from '../components/GigForm';

function FreelancerDashboardPage() {
  const [tab, setTab] = useState('gigs');
  const [gigs, setGigs] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [income, setIncome] = useState(null);
  const [showForm, setShowForm] = useState(false);
  // ID of the gig currently being edited, or null when no gig is being edited
  const [editingGigId, setEditingGigId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Fetches all dashboard data. State is only updated once the requests finish
  // so this is safe to call from the effect below
  function loadAll() {
    Promise.all([fetchMyGigs(), fetchReceivedBookings(), fetchIncomeSummary()])
      .then(([gigsData, bookingsData, incomeData]) => {
        setGigs(gigsData);
        setBookings(bookingsData);
        setIncome(incomeData);
      })
      .then(() => setError(''))
      .catch((err) => setError(err.friendlyMessage || 'Could not load dashboard data.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadAll();
  }, []);

  // Opens the edit form for one gig. Only one gig form is open at a time
  // so the create form is closed and any old success message is cleared
  function startEditing(id) {
    setEditingGigId(id);
    setShowForm(false);
    setMessage('');
  }

  function toggleCreateForm() {
    setShowForm((v) => !v);
    setEditingGigId(null);
    setMessage('');
  }

  async function handleCreateGig(gigData) {
    await createGig(gigData);
    setShowForm(false);
    loadAll();
  }

  // Sends the edited details to PATCH /api/gigs/:id. If the request fails
  // the error is thrown back to GigForm, which shows it inside the form
  async function handleUpdateGig(id, gigData) {
    await updateGig(id, gigData);
    setEditingGigId(null);
    setMessage('Gig updated successfully.');
    loadAll();
  }

  async function handleDeleteGig(id) {
    if (!window.confirm('Delete this gig? This cannot be undone.')) return;
    setMessage('');
    try {
      await deleteGig(id);
      loadAll();
    } catch (err) {
      setError(err.friendlyMessage || 'Could not delete gig.');
    }
  }

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <h1>My Dashboard</h1>

      <div className="tabs">
        <button onClick={() => setTab('gigs')} className={tab === 'gigs' ? 'active' : ''}>My Gigs</button>
        <button onClick={() => setTab('bookings')} className={tab === 'bookings' ? 'active' : ''}>Bookings Received</button>
        <button onClick={() => setTab('income')} className={tab === 'income' ? 'active' : ''}>Income</button>
      </div>

      {error && <p className="error-message" role="alert">{error}</p>}
      {message && <p className="success-message" role="status">{message}</p>}

      {tab === 'gigs' && (
        <div>
          <button onClick={toggleCreateForm} className={showForm ? 'secondary' : ''}>
           {showForm ? 'Cancel' : 'Create New Gig'}
          </button>
          {showForm && <GigForm onSubmit={handleCreateGig} submitLabel="Create Gig" />}

          {gigs.length === 0 && <p>You haven't created any gigs yet.</p>}
          <div className="gig-list">
            {gigs.map((gig) => (
              <div key={gig.id} className="gig-card">
                {editingGigId === gig.id ? (
                  <GigForm
                    initialValues={gig}
                    onSubmit={(gigData) => handleUpdateGig(gig.id, gigData)}
                    onCancel={() => setEditingGigId(null)}
                    submitLabel="Save Changes"
                  />
                ) : (
                  <>
                    <h2>{gig.title}</h2>
                    <p className="gig-category">{gig.category}</p>
                    <p>R{gig.price} · {gig.deliveryDays} day delivery</p>
                    <button onClick={() => startEditing(gig.id)}>Edit</button>
                    <button onClick={() => handleDeleteGig(gig.id)} className="secondary">Delete</button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'bookings' && (
        <div>
          {bookings.length === 0 && <p>No bookings received yet.</p>}
          <div className="booking-list">
            {bookings.map((b) => (
              <div key={b.id} className="booking-card">
                <h2>{b.gigTitle}</h2>
                <p>Client: {b.client?.email}</p>
                <p>Amount: R{b.amount}</p>
                <p>Reference: {b.reference}</p>
                <p>Booked on: {new Date(b.createdAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'income' && income && (
        <div className="income-summary">
          <p>Total income: <strong>R{income.totalIncome}</strong></p>
          <p>Transactions: {income.transactionCount}</p>
          <p>Estimated tax ({(income.estimatedTaxRate * 100).toFixed(0)}%): R{income.estimatedTax}</p>
          <p>Income after estimated tax: <strong>R{income.incomeAfterEstimatedTax}</strong></p>
          <p className="hint">{income.disclaimer}</p>
        </div>
      )}
    </div>
  );
}

export default FreelancerDashboardPage;