import { useState, useEffect } from 'react';
import { getMyReviews, createReview, type Review } from '../../api/customer';

function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="star-row">
      {[1, 2, 3, 4, 5].map(n => (
        <span
          key={n}
          className={`star ${n <= (hover || value) ? 'filled' : ''}`}
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
        >★</span>
      ))}
    </div>
  );
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('en-NP', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function CustomerReviews() {
  const [reviews, setReviews]   = useState<Review[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error,   setError]     = useState('');

  // Form
  const [rating,  setRating]    = useState(0);
  const [comment, setComment]   = useState('');
  const [saving,  setSaving]    = useState(false);
  const [formErr, setFormErr]   = useState('');
  const [formOk,  setFormOk]    = useState('');

  useEffect(() => {
    getMyReviews()
      .then(setReviews)
      .catch(() => setError('Failed to load reviews.'))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) { setFormErr('Please select a star rating.'); return; }
    setSaving(true); setFormErr(''); setFormOk('');
    try {
      const created = await createReview({ rating, comment });
      setReviews(prev => [created, ...prev]);
      setRating(0); setComment('');
      setFormOk('Thank you for your feedback!');
    } catch {
      setFormErr('Failed to submit review. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="customer-page"><p>Loading...</p></div>;
  if (error)   return <div className="customer-page"><div className="c-alert-error">{error}</div></div>;

  return (
    <div className="customer-page">
      <h1>Reviews</h1>

      {/* ── Submit review ── */}
      <div className="section-card">
        <h2>Leave a Review</h2>
        <form className="c-form" onSubmit={handleSubmit}>
          <div className="c-field">
            <label>Rating *</label>
            <StarPicker value={rating} onChange={setRating} />
          </div>
          <div className="c-field">
            <label>Comment</label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Tell us about your experience…"
            />
          </div>
          {formErr && <div className="c-alert-error">{formErr}</div>}
          {formOk  && <div className="c-alert-success">{formOk}</div>}
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Submitting…' : 'Submit Review'}
          </button>
        </form>
      </div>

      {/* ── Past reviews ── */}
      <div className="section-card">
        <h2>My Reviews</h2>
        {reviews.length === 0 ? (
          <div className="empty-state"><p>You haven't submitted any reviews yet.</p></div>
        ) : (
          <div className="item-list">
            {reviews.map(r => (
              <div className="item-card" key={r.id}>
                <div className="item-card-body">
                  <div style={{ display: 'flex', gap: 2, marginBottom: 6 }}>
                    {[1, 2, 3, 4, 5].map(n => (
                      <span key={n} className={`star${n <= r.rating ? ' filled' : ''}`} style={{ fontSize: 16 }}>★</span>
                    ))}
                  </div>
                  {r.comment && <p className="item-card-meta" style={{ color: '#374151' }}>{r.comment}</p>}
                  <p className="item-card-meta">{fmt(r.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
