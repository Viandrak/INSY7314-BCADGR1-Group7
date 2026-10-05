import { useState } from 'react';

const CATEGORIES = ['Design', 'Development', 'Writing', 'Marketing', 'Tutoring', 'Other'];

function GigForm({ initialValues, onSubmit, submitLabel = 'Save' }) {
  const [title, setTitle] = useState(initialValues?.title || '');
  const [description, setDescription] = useState(initialValues?.description || '');
  const [category, setCategory] = useState(initialValues?.category || CATEGORIES[0]);
  const [price, setPrice] = useState(initialValues?.price || '');
  const [deliveryDays, setDeliveryDays] = useState(initialValues?.deliveryDays || '');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (title.trim().length < 3) {
      setError('Title must be at least 3 characters.');
      return;
    }
    if (description.trim().length < 10) {
      setError('Description must be at least 10 characters.');
      return;
    }
    if (!price || Number(price) <= 0) {
      setError('Price must be a positive number.');
      return;
    }
    if (!deliveryDays || Number(deliveryDays) <= 0) {
      setError('Delivery days must be a positive number.');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        category,
        price: Number(price),
        deliveryDays: Number(deliveryDays),
      });
    } catch (err) {
      setError(err.friendlyMessage || 'Could not save gig.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="gig-form">
      <label htmlFor="title">Title</label>
      <input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />

      <label htmlFor="description">Description</label>
      <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} required />

      <label htmlFor="category">Category</label>
      <select id="category" value={category} onChange={(e) => setCategory(e.target.value)}>
        {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>

      <label htmlFor="price">Price (ZAR)</label>
      <input id="price" type="number" min="1" value={price} onChange={(e) => setPrice(e.target.value)} required />

      <label htmlFor="deliveryDays">Delivery (days)</label>
      <input id="deliveryDays" type="number" min="1" value={deliveryDays} onChange={(e) => setDeliveryDays(e.target.value)} required />

      {error && <p className="error-message" role="alert">{error}</p>}

      <button type="submit" disabled={submitting}>
        {submitting ? 'Saving...' : submitLabel}
      </button>
    </form>
  );
}

export default GigForm;