import { useState, useEffect } from 'react';
import { getMyPartRequests, createPartRequest, type PartRequest, type PartRequestStatus } from '../../api/customer';

const statusBadge: Record<PartRequestStatus, string> = {
  Pending:   'badge badge-pending',
  Approved:  'badge badge-approved',
  Rejected:  'badge badge-rejected',
  Fulfilled: 'badge badge-fulfilled',
};

export default function CustomerPartRequests() {
  const [requests, setRequests]   = useState<PartRequest[]>([]);
  const [loading,  setLoading]    = useState(true);
  const [error,    setError]      = useState('');

  // Form
  const [partName,     setPartName]     = useState('');
  const [description,  setDescription]  = useState('');
  const [saving,       setSaving]       = useState(false);
  const [formErr,      setFormErr]      = useState('');
  const [formOk,       setFormOk]       = useState('');

  useEffect(() => {
    getMyPartRequests()
      .then(setRequests)
      .catch(() => setError('Failed to load part requests.'))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setFormErr(''); setFormOk('');
    try {
      const created = await createPartRequest({ partName, description });
      setRequests(prev => [created, ...prev]);
      setPartName(''); setDescription('');
      setFormOk('Part request submitted! We\'ll get back to you soon.');
    } catch {
      setFormErr('Failed to submit request. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="customer-page"><p>Loading...</p></div>;
  if (error)   return <div className="customer-page"><div className="c-alert-error">{error}</div></div>;

  return (
    <div className="customer-page">
      <h1>Part Requests</h1>

      {/* ── Submit request ── */}
      <div className="section-card">
        <h2>Request a Part</h2>
        <form className="c-form" onSubmit={handleSubmit}>
          <div className="c-field">
            <label>Part Name *</label>
            <input
              value={partName}
              onChange={e => setPartName(e.target.value)}
              placeholder="e.g. Front brake pad for Toyota Hilux 2019"
              required
            />
          </div>
          <div className="c-field">
            <label>Additional Details</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Any extra info: part number, condition, urgency…"
            />
          </div>
          {formErr && <div className="c-alert-error">{formErr}</div>}
          {formOk  && <div className="c-alert-success">{formOk}</div>}
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Submitting…' : 'Submit Request'}
          </button>
        </form>
      </div>

      {/* ── Past requests ── */}
      <div className="section-card">
        <h2>My Requests</h2>
        {requests.length === 0 ? (
          <div className="empty-state"><p>No part requests submitted yet.</p></div>
        ) : (
          <div className="item-list">
            {requests.map(r => (
              <div className="item-card" key={r.id}>
                <div className="item-card-body">
                  <p className="item-card-title">{r.partName}</p>
                  {r.description && <p className="item-card-meta">{r.description}</p>}
                </div>
                <div className="item-card-actions">
                  <span className={statusBadge[r.status]}>{r.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
