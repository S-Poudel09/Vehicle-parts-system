import { useState, useEffect } from 'react';
import { getMySales, type Sale, type PaymentStatus } from '../../api/customer';

const LOYALTY_THRESHOLD = 5000;
const CREDIT_OVERDUE_DAYS = 30;

const paymentBadge: Record<PaymentStatus, string> = {
  Pending:  'badge badge-pending',
  Paid:     'badge badge-paid',
  Failed:   'badge badge-failed',
  Refunded: 'badge badge-refunded',
};

function daysBetween(dateStr: string) {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('en-NP', { year: 'numeric', month: 'short', day: 'numeric' });
}

function SaleCard({ sale }: { sale: Sale }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="history-card">
      <div className="history-header" onClick={() => setOpen(o => !o)}>
        <div>
          <span className="history-id">Order #{sale.id}</span>
          <span className="history-date" style={{ marginLeft: 12 }}>{fmt(sale.saleDate)}</span>
          {sale.discount > 0 && (
            <span className="history-loyalty-tag">🎁 10% Loyalty Discount</span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className={paymentBadge[sale.paymentStatus]}>{sale.paymentStatus}</span>
          <span className="history-amount">Rs. {sale.finalAmount.toLocaleString()}</span>
          <span style={{ color: '#6b7280', fontSize: 13 }}>{open ? '▲' : '▼'}</span>
        </div>
      </div>

      {open && (
        <>
          <table className="history-items-table">
            <thead>
              <tr>
                <th>Part</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {sale.saleItems.map(item => (
                <tr key={item.id}>
                  <td>{item.partName}</td>
                  <td>{item.quantity}</td>
                  <td>Rs. {item.price.toLocaleString()}</td>
                  <td>Rs. {(item.price * item.quantity).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="history-footer">
            {sale.discount > 0 && (
              <div className="history-footer-item">
                <span className="history-footer-label">Discount</span>
                <span className="history-footer-value discount">− Rs. {sale.discount.toLocaleString()}</span>
              </div>
            )}
            <div className="history-footer-item">
              <span className="history-footer-label">Total</span>
              <span className="history-footer-value">Rs. {sale.totalAmount.toLocaleString()}</span>
            </div>
            <div className="history-footer-item">
              <span className="history-footer-label">Final Amount</span>
              <span className="history-footer-value">Rs. {sale.finalAmount.toLocaleString()}</span>
            </div>
            {sale.staffName && (
              <div className="history-footer-item">
                <span className="history-footer-label">Served by</span>
                <span className="history-footer-value">{sale.staffName}</span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function CustomerHistory() {
  const [sales,   setSales]   = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  // Filter
  const [filter, setFilter] = useState<PaymentStatus | 'All'>('All');

  useEffect(() => {
    getMySales()
      .then(setSales)
      .catch(() => setError('Failed to load purchase history.'))
      .finally(() => setLoading(false));
  }, []);

  const displayed = filter === 'All' ? sales : sales.filter(s => s.paymentStatus === filter);

  const totalSpent = sales
    .filter(s => s.paymentStatus === 'Paid')
    .reduce((sum, s) => sum + s.finalAmount, 0);

  const totalSaved = sales
    .filter(s => s.discount > 0)
    .reduce((sum, s) => sum + s.discount, 0);

  const overdueCredits = sales.filter(
    s => s.paymentStatus === 'Pending' && daysBetween(s.saleDate) >= CREDIT_OVERDUE_DAYS,
  );

  const loyaltyOrders = sales.filter(s => s.totalAmount >= LOYALTY_THRESHOLD && s.discount > 0);

  if (loading) return <div className="customer-page"><p>Loading...</p></div>;
  if (error)   return <div className="customer-page"><div className="c-alert-error">{error}</div></div>;

  return (
    <div className="customer-page">
      <h1>Purchase & Service History</h1>

      {/* ── Overdue credit warning ── */}
      {overdueCredits.length > 0 && (
        <div className="dash-credit-banner" style={{ marginBottom: 20 }}>
          <span className="dash-credit-banner-icon">⚠️</span>
          <div className="dash-credit-banner-body">
            <strong>
              {overdueCredits.length} unpaid order{overdueCredits.length > 1 ? 's' : ''} overdue by more than 30 days.
            </strong>
            <span>
              Orders #{overdueCredits.map(o => o.id).join(', #')} — an email reminder has been sent to you.
              Please settle your balance as soon as possible.
            </span>
          </div>
        </div>
      )}

      {/* ── Loyalty programme info ── */}
      <div className="history-loyalty-banner">
        <span className="history-loyalty-icon">🎁</span>
        <div>
          <strong>Loyalty Programme: </strong>
          Spend <strong>Rs. {LOYALTY_THRESHOLD.toLocaleString()}+</strong> in a single order to receive an automatic <strong>10% discount</strong>.
          {loyaltyOrders.length > 0
            ? ` You've benefited ${loyaltyOrders.length} time${loyaltyOrders.length > 1 ? 's' : ''} — saving Rs. ${totalSaved.toLocaleString()} total!`
            : ' Place a qualifying order to unlock your discount.'}
        </div>
      </div>

      {/* ── Summary strip ── */}
      {sales.length > 0 && (
        <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
          {[
            { label: 'Total Orders', value: sales.length },
            { label: 'Total Spent (Paid)', value: `Rs. ${totalSpent.toLocaleString()}` },
            { label: 'Pending Payment', value: sales.filter(s => s.paymentStatus === 'Pending').length },
            { label: 'Total Saved (Discounts)', value: `Rs. ${totalSaved.toLocaleString()}` },
          ].map(stat => (
            <div key={stat.label} style={{
              background: 'white', border: '1px solid #e5e7eb', borderRadius: 10,
              padding: '14px 20px', flex: '1 1 160px',
            }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#111827' }}>{stat.value}</div>
              <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Filter tabs ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {(['All', 'Paid', 'Pending', 'Failed', 'Refunded'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '6px 16px', borderRadius: 20, fontSize: 13, cursor: 'pointer',
              border: filter === f ? 'none' : '1px solid #d1d5db',
              background: filter === f ? '#2563eb' : 'white',
              color: filter === f ? 'white' : '#374151',
              fontWeight: filter === f ? 600 : 400,
            }}
          >{f}</button>
        ))}
      </div>

      {/* ── Sale cards (expandable) ── */}
      {displayed.length === 0 ? (
        <div className="empty-state">
          <p>{sales.length === 0 ? 'No purchase history found.' : `No ${filter.toLowerCase()} orders.`}</p>
        </div>
      ) : (
        displayed.map(s => <SaleCard key={s.id} sale={s} />)
      )}
    </div>
  );
}
