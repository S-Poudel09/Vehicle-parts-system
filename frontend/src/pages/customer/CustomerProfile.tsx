import { useState, useEffect } from 'react';
import {
  getProfile, updateProfile, addVehicle, deleteVehicle,
  type CustomerProfile, type Vehicle,
} from '../../api/customer';

export default function CustomerProfilePage() {
  const [profile, setProfile]       = useState<CustomerProfile | null>(null);
  const [editing, setEditing]       = useState(false);
  const [phone,   setPhone]         = useState('');
  const [address, setAddress]       = useState('');
  const [saveMsg, setSaveMsg]       = useState('');
  const [saveErr, setSaveErr]       = useState('');
  const [saving,  setSaving]        = useState(false);

  // Add vehicle form
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [vPlate,  setVPlate]  = useState('');
  const [vModel,  setVModel]  = useState('');
  const [vBrand,  setVBrand]  = useState('');
  const [vYear,   setVYear]   = useState('');
  const [vErr,    setVErr]    = useState('');
  const [vSaving, setVSaving] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    getProfile()
      .then(p => { setProfile(p); setPhone(p.phone); setAddress(p.address); })
      .catch(() => setError('Failed to load profile.'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setSaveErr(''); setSaveMsg('');
    try {
      const updated = await updateProfile({ phone, address });
      setProfile(updated);
      setSaveMsg('Profile updated successfully.');
      setEditing(false);
    } catch {
      setSaveErr('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setVSaving(true); setVErr('');
    try {
      const vehicle = await addVehicle({
        vehicleNumber: vPlate, model: vModel, brand: vBrand,
        year: vYear ? parseInt(vYear) : null,
      });
      setProfile(prev => prev ? { ...prev, vehicles: [...prev.vehicles, vehicle] } : prev);
      setVPlate(''); setVModel(''); setVBrand(''); setVYear('');
      setShowVehicleForm(false);
    } catch {
      setVErr('Failed to add vehicle. Please try again.');
    } finally {
      setVSaving(false);
    }
  };

  const handleDeleteVehicle = async (v: Vehicle) => {
    if (!confirm(`Remove ${v.vehicleNumber}?`)) return;
    try {
      await deleteVehicle(v.id);
      setProfile(prev => prev ? { ...prev, vehicles: prev.vehicles.filter(x => x.id !== v.id) } : prev);
    } catch {
      alert('Failed to remove vehicle.');
    }
  };

  if (loading) return <div className="customer-page"><p>Loading...</p></div>;
  if (error)   return <div className="customer-page"><div className="c-alert-error">{error}</div></div>;
  if (!profile) return null;

  return (
    <div className="customer-page">
      <h1>My Profile</h1>

      {/* ── Contact info ── */}
      <div className="section-card">
        <h2>Contact Information</h2>

        {!editing ? (
          <>
            <div className="profile-info-grid">
              <div className="profile-info-item">
                <span className="profile-info-label">Full Name</span>
                <span className="profile-info-value">{profile.name}</span>
              </div>
              <div className="profile-info-item">
                <span className="profile-info-label">Email</span>
                <span className="profile-info-value">{profile.email}</span>
              </div>
              <div className="profile-info-item">
                <span className="profile-info-label">Phone</span>
                <span className="profile-info-value">{profile.phone || '—'}</span>
              </div>
              <div className="profile-info-item">
                <span className="profile-info-label">Address</span>
                <span className="profile-info-value">{profile.address || '—'}</span>
              </div>
            </div>
            {saveMsg && <div className="c-alert-success" style={{ marginTop: 14 }}>{saveMsg}</div>}
            <div style={{ marginTop: 16 }}>
              <button className="btn-primary" onClick={() => { setEditing(true); setSaveMsg(''); }}>
                Edit Profile
              </button>
            </div>
          </>
        ) : (
          <form className="c-form" onSubmit={handleSave}>
            <div className="c-form-row">
              <div className="c-field">
                <label>Phone</label>
                <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="e.g. 9800000000" />
              </div>
              <div className="c-field">
                <label>Address</label>
                <input value={address} onChange={e => setAddress(e.target.value)} placeholder="e.g. Kathmandu, Nepal" />
              </div>
            </div>
            {saveErr && <div className="c-alert-error">{saveErr}</div>}
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
              <button type="button" className="btn-secondary" onClick={() => { setEditing(false); setPhone(profile.phone); setAddress(profile.address); }}>
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ── Vehicles ── */}
      <div className="section-card">
        <h2>My Vehicles</h2>

        {profile.vehicles.length > 0 ? (
          <div className="vehicle-grid">
            {profile.vehicles.map(v => (
              <div className="vehicle-card" key={v.id}>
                <span className="vehicle-card-plate">{v.vehicleNumber}</span>
                <span className="vehicle-card-model">{v.brand} {v.model}{v.year ? ` (${v.year})` : ''}</span>
                <div className="vehicle-card-footer">
                  <button className="btn-danger" onClick={() => handleDeleteVehicle(v)}>Remove</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 16 }}>No vehicles registered yet.</p>
        )}

        {!showVehicleForm ? (
          <button className="btn-secondary" onClick={() => setShowVehicleForm(true)}>+ Add Vehicle</button>
        ) : (
          <form className="c-form" onSubmit={handleAddVehicle} style={{ marginTop: 12, borderTop: '1px solid #e5e7eb', paddingTop: 16 }}>
            <h2 style={{ marginBottom: 4 }}>Add New Vehicle</h2>
            <div className="c-form-row">
              <div className="c-field">
                <label>Plate Number *</label>
                <input value={vPlate} onChange={e => setVPlate(e.target.value)} placeholder="e.g. BA 2 KHA 1234" required />
              </div>
              <div className="c-field">
                <label>Brand *</label>
                <input value={vBrand} onChange={e => setVBrand(e.target.value)} placeholder="e.g. Toyota" required />
              </div>
              <div className="c-field">
                <label>Model *</label>
                <input value={vModel} onChange={e => setVModel(e.target.value)} placeholder="e.g. Hilux" required />
              </div>
              <div className="c-field">
                <label>Year</label>
                <input type="number" value={vYear} onChange={e => setVYear(e.target.value)} placeholder="e.g. 2019" min="1900" max="2099" />
              </div>
            </div>
            {vErr && <div className="c-alert-error">{vErr}</div>}
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" className="btn-primary" disabled={vSaving}>
                {vSaving ? 'Adding…' : 'Add Vehicle'}
              </button>
              <button type="button" className="btn-secondary" onClick={() => { setShowVehicleForm(false); setVErr(''); }}>
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
