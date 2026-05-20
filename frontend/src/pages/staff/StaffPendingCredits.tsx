import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import API from "../../services/api";
import "./StaffPendingCredits.css";

type PendingCredit = {
  id: number;
  customerName: string;
  phone: string;
  dueAmount: number;
  saleDate: string;
};

export default function StaffPendingCredits() {
  const [credits, setCredits] = useState<PendingCredit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [settlingId, setSettlingId] = useState<number | null>(null);

  const fetchCredits = useCallback(() => {
    setLoading(true);
    setError("");
    API.get<PendingCredit[]>("/staff/pending-credits")
      .then((res) => setCredits(res.data))
      .catch(() => setError("Unable to load pending credits."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  const handleSettle = async (id: number) => {
    if (!window.confirm("Are you sure you want to settle this pending invoice credit with Cash payment?")) {
      return;
    }

    setSettlingId(id);
    try {
      await API.post(`/staff/sales/${id}/settle`);
      alert("Payment settled successfully!");
      fetchCredits();
    } catch {
      alert("Failed to settle payment.");
    } finally {
      setSettlingId(null);
    }
  };

  return (
    <div className="pending-page">
      <div className="pending-card">
        <h1>Pending Credit Customers</h1>
        <p className="pending-hint">
          For a detailed report with sale items, use{" "}
          <Link to="/staff/reports">Customer Reports</Link>.
        </p>

        {error && <p className="pending-error">{error}</p>}
        {loading && <p>Loading…</p>}

        <table className="pending-table">
          <thead>
            <tr>
              <th>Invoice ID</th>
              <th>Customer Name</th>
              <th>Phone</th>
              <th>Due Amount</th>
              <th>Sale Date</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {!loading && credits.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-row">
                  No pending credits found.
                </td>
              </tr>
            ) : (
              credits.map((item) => (
                <tr key={item.id}>
                  <td>#{item.id}</td>
                  <td>{item.customerName}</td>
                  <td>{item.phone}</td>
                  <td className="due">Rs. {item.dueAmount.toLocaleString()}</td>
                  <td>{new Date(item.saleDate).toLocaleDateString()}</td>
                  <td style={{ textAlign: "right" }}>
                    <button
                      type="button"
                      disabled={settlingId === item.id}
                      onClick={() => handleSettle(item.id)}
                      className="settle-btn"
                    >
                      {settlingId === item.id ? "Settling..." : "Settle Payment"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
