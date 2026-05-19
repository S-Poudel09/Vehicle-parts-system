import { useState, useEffect } from 'react';
import {
  getMyAppointments, createAppointment, cancelAppointment, getProfile,
  type Appointment, type AppointmentStatus, type Vehicle,
} from '../../api/customer';

const statusBadge: Record<AppointmentStatus, string> = {
  Pending:   'badge badge-pending',
  Confirmed: 'badge badge-confirmed',
  Completed: 'badge badge-completed',
  Cancelled: 'badge badge-cancelled',
};

function fmt(iso: string) {
  return new Date(iso).toLocaleString('en-NP', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function CustomerAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [vehicles,     setVehicles]     = useState<Vehicle[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');

  // Form state
  const [vehicleId, setVehicleId]       = useState('');
  const [apptDate,  setApptDate]        = useState('');
  const [booking,   setBooking]         = useState(false);
  const [bookErr,   setBookErr]         = useState('');
  const [bookOk,    setBookOk]          = useState('');

  useEffect(() => {
    Promise.all([getMyAppointments(), getProfile()])
      .then(([appts, profile]) => { setAppointments(appts); setVehicles(profile.vehicles); })
      .catch(() => setError('Failed to load appointments.'))
      .finally(() => setLoading(false));
  }, []);

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleId) { setBookErr('Please select a vehicle.'); return; }
    setBooking(true); setBookErr(''); setBookOk('');
    try {
      const created = await createAppointment({
        vehicleId: parseInt(vehicleId),
        appointmentDate: new Date(apptDate).toISOString(),
      });
      setAppointments(prev => [created, ...prev]);
      setVehicleId(''); setApptDate('');
      setBookOk('Appointment booked successfully!');
    } catch {
      setBookErr('Failed to book appointment. Please try again.');
    } finally {
      setBooking(false);
    }
  };

  const handleCancel = async (id: number) => {
    if (!confirm('Cancel this appointment?')) return;
    try {
      await cancelAppointment(id);
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'Cancelled' } : a));
    } catch {
      alert('Failed to cancel appointment.');
    }
  };

  if (loading) return <div className="customer-page"><p>Loading...</p></div>;
  if (error)   return <div className="customer-page"><div className="c-alert-error">{error}</div></div>;

  return (
    <div className="customer-page">
      <h1>Appointments</h1>

      {/* ── Book new appointment ── */}
      <div className="section-card">
        <h2>Book an Appointment</h2>
        {vehicles.length === 0 ? (
          <p style={{ color: '#6b7280', fontSize: 14 }}>
            You need to add a vehicle in your profile before booking an appointment.
          </p>
        ) : (
          <form className="c-form" onSubmit={handleBook}>
            <div className="c-form-row">
              <div className="c-field">
                <label>Vehicle *</label>
                <select value={vehicleId} onChange={e => setVehicleId(e.target.value)} required>
                  <option value="">Select vehicle…</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.vehicleNumber} — {v.brand} {v.model}
                    </option>
                  ))}
                </select>
              </div>
              <div className="c-field">
                <label>Preferred Date & Time *</label>
                <input
                  type="datetime-local"
                  value={apptDate}
                  onChange={e => setApptDate(e.target.value)}
                  required
                />
              </div>
            </div>
            {bookErr && <div className="c-alert-error">{bookErr}</div>}
            {bookOk  && <div className="c-alert-success">{bookOk}</div>}
            <button type="submit" className="btn-primary" disabled={booking}>
              {booking ? 'Booking…' : 'Book Appointment'}
            </button>
          </form>
        )}
      </div>

      {/* ── Existing appointments ── */}
      <div className="section-card">
        <h2>My Appointments</h2>
        {appointments.length === 0 ? (
          <div className="empty-state"><p>No appointments found.</p></div>
        ) : (
          <div className="item-list">
            {appointments.map(a => (
              <div className="item-card" key={a.id}>
                <div className="item-card-body">
                  <p className="item-card-title">{a.vehicleNumber}</p>
                  <p className="item-card-meta">Date: {fmt(a.appointmentDate)}</p>
                </div>
                <div className="item-card-actions">
                  <span className={statusBadge[a.status]}>{a.status}</span>
                  {(a.status === 'Pending' || a.status === 'Confirmed') && (
                    <button className="btn-danger" onClick={() => handleCancel(a.id)}>Cancel</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
