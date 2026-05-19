import { useState } from "react";
import API from "../services/api";
import "./StaffReports.css";

type ReportType = "regular" | "high" | "pending";

function StaffReports() {
  const [activeReport, setActiveReport] = useState<ReportType>("regular");
  const [data, setData] = useState<any[]>([]);
  const [message, setMessage] = useState("");

  const loadReport = async (type: ReportType) => {
    setActiveReport(type);
    setMessage("");
    setData([]);

    try {
      let endpoint = "";

      if (type === "regular") {
        endpoint = "/staff/reports/regular-customers";
      } else if (type === "high") {
        endpoint = "/staff/reports/high-spenders?minAmount=5000";
      } else {
        endpoint = "/staff/reports/pending-credits";
      }

      const response = await API.get(endpoint);
      setData(response.data);

      if (response.data.length === 0) {
        setMessage("No report data found.");
      }
    } catch (error) {
      console.error(error);
      setMessage("Unable to load report. Please check backend or login token.");
    }
  };

  return (
    <div className="reports-page">
      <h1>Customer Reports</h1>
      <p>
        Generate customer-related reports for regular customers, high spenders,
        and pending credit payments.
      </p>

      <div className="report-buttons">
        <button onClick={() => loadReport("regular")}>Regular Customers</button>
        <button onClick={() => loadReport("high")}>High Spenders</button>
        <button onClick={() => loadReport("pending")}>Pending Credits</button>
      </div>

      {message && <p className="report-message">{message}</p>}

      {activeReport !== "pending" && data.length > 0 && (
        <table className="reports-table">
          <thead>
            <tr>
              <th>Customer ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Vehicles</th>
              <th>Total Purchases</th>
              <th>Total Spent</th>
            </tr>
          </thead>

          <tbody>
            {data.map((item) => (
              <tr key={item.customerId}>
                <td>{item.customerId}</td>
                <td>{item.fullName}</td>
                <td>{item.email}</td>
                <td>{item.phone}</td>
                <td>{item.vehicleNumbers?.join(", ") || "N/A"}</td>
                <td>{item.totalPurchases}</td>
                <td>Rs. {item.totalSpent}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {activeReport === "pending" && data.length > 0 && (
        <table className="reports-table">
          <thead>
            <tr>
              <th>Sale ID</th>
              <th>Customer</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Final Amount</th>
              <th>Status</th>
              <th>Sale Date</th>
              <th>Items</th>
            </tr>
          </thead>

          <tbody>
            {data.map((item) => (
              <tr key={item.saleId}>
                <td>{item.saleId}</td>
                <td>{item.fullName}</td>
                <td>{item.email}</td>
                <td>{item.phone}</td>
                <td>Rs. {item.finalAmount}</td>
                <td>{item.paymentStatus}</td>
                <td>{new Date(item.saleDate).toLocaleDateString()}</td>
                <td>
                  {item.items?.map((saleItem: any) => (
                    <div key={saleItem.partName}>
                      {saleItem.partName} x {saleItem.quantity}
                    </div>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default StaffReports;