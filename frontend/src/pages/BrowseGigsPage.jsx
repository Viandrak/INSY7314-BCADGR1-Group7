import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchGigs } from '../api/gigs';

const CATEGORIES = ['Design', 'Development', 'Writing', 'Marketing', 'Tutoring', 'Other'];

function BrowseGigsPage() {
  const [gigs, setGigs] = useState([]);
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

   // Resets the loading and error state when the filter changes, so the effect itself only updates state after the request finishes
  function handleCategoryChange(event) {
    setCategory(event.target.value);
    setLoading(true);
    setError('');
  }

  useEffect(() => {
    let cancelled = false;

    fetchGigs(category || undefined)
      .then((data) => {
        if (!cancelled) setGigs(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.friendlyMessage || 'Could not load gigs.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [category]);

  return (
    <div>
      <h1>Browse Gigs</h1>

      <label htmlFor="category-filter">Filter by category</label>
           <select id="category-filter" value={category} onChange={handleCategoryChange}>
        <option value="">All categories</option>
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>

      {loading && <p>Loading gigs...</p>}
      {error && <p className="error-message" role="alert">{error}</p>}

      {!loading && !error && gigs.length === 0 && <p>No gigs found.</p>}

      <div className="gig-list">
        {gigs.map((gig) => (
          <div key={gig.id} className="gig-card">
            <h2>{gig.title}</h2>
            <p className="gig-category">{gig.category}</p>
            <p>{gig.description}</p>
            <p><strong>R{gig.price}</strong> · {gig.deliveryDays} day delivery</p>
            <p className="gig-freelancer">By {gig.freelancer?.email}</p>
            <Link to={`/gigs/${gig.id}`}>View & Book</Link>
          </div>
        ))}
      </div>
    </div>
  );
}

export default BrowseGigsPage;