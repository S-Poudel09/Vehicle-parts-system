import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../../services/api";
import "./StaffPendingCredits.css";

type PendingCredit = {
  customerName: string;
  phone: string;
  dueAmount: number;
  saleDate: string;
};

export default function StaffPendingCredits() {
  const [credits, setCredits] = useState<PendingCredit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    API.get<PendingCredit[]>("/staff/pending-credits")
      .then((res) => setCredits(res.data))
      .catch(() => setError("Unable to load pending credits."))
      .finally(() => setLoading(false));
  }, []);

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
              <th>Customer Name</th>
              <th>Phone</th>
              <th>Due Amount</th>
              <th>Sale Date</th>
            </tr>
          </thead>

          <tbody>
            {!loading && credits.length === 0 ? (
              <tr>
                <td colSpan={4} className="empty-row">
                  No pending credits found.
                </td>
              </tr>
            ) : (
              credits.map((item, index) => (
                <tr key={index}>
                  <td>{item.customerName}</td>
                  <td>{item.phone}</td>
                  <td className="due">Rs. {item.dueAmount.toLocaleString()}</td>
                  <td>{new Date(item.saleDate).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
