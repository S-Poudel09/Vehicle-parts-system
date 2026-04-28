import { useEffect, useState } from "react";
import "./StaffPendingCredits.css";

type PendingCredit = {
  customerName: string;
  phone: string;
  dueAmount: number;
  saleDate: string;
};

export default function StaffPendingCredits() {
  const [credits, setCredits] = useState<PendingCredit[]>([]);

  useEffect(() => {
    fetch("https://localhost:7134/api/staff/pending-credits")
      .then((res) => res.json())
      .then((data) => setCredits(data))
      .catch((err) => console.error("Error loading data:", err));
  }, []);

  return (
    <div className="pending-page">
      <div className="pending-card">
        <h1>Pending Credit Customers</h1>
        

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
            {credits.length === 0 ? (
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
                  <td className="due">Rs. {item.dueAmount}</td>
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