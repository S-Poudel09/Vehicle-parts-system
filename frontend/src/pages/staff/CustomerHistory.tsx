import { useState } from "react";
import API from "../../services/api";
import "./CustomerHistory.css";

const CustomerHistory = () => {
  const [customerId, setCustomerId] = useState("");
  const [history, setHistory] = useState<any>(null);
  const [message, setMessage] = useState("");

  const handleSearch = async () => {
    if (!customerId.trim()) {
      setMessage("Enter customer ID.");
      return;
    }

    try {
      const res = await API.get(
        `/staff/customers/${customerId}/history`
      );

      setHistory(res.data);
      setMessage("");
    } catch (error) {
      console.error(error);
      setMessage("Customer history not found.");
      setHistory(null);
    }
  };

  return (
    <div className="history-page">
      <div className="history-wrapper">
        <h2>Customer History</h2>

        <p>
          View customer details, vehicle records,
          sales history and pending credits.
        </p>

        <div className="history-search">
          <input
            type="number"
            placeholder="Enter Customer ID"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
          />

          <button onClick={handleSearch}>
            View History
          </button>
        </div>

        {message && (
          <p className="history-message">
            {message}
          </p>
        )}

        {history && (
          <div className="history-results">

            <div className="history-card">
              <h3>Customer Information</h3>

              <p>
                <strong>Name:</strong>
                {history.customer.fullName}
              </p>

              <p>
                <strong>Email:</strong>
                {history.customer.email}
              </p>

              <p>
                <strong>Phone:</strong>
                {history.customer.phoneNumber}
              </p>

              <p>
                <strong>Address:</strong>
                {history.customer.address}
              </p>
            </div>

            <div className="history-card">
              <h3>Vehicle Information</h3>

              {history.vehicles?.map((vehicle: any) => (
                <div
                  key={vehicle.id}
                  className="vehicle-item"
                >
                  <p>
                    <strong>Vehicle Number:</strong>
                    {vehicle.vehicleNumber}
                  </p>

                  <p>
                    <strong>Brand:</strong>
                    {vehicle.brand}
                  </p>

                  <p>
                    <strong>Model:</strong>
                    {vehicle.model}
                  </p>
                </div>
              ))}
            </div>

            <div className="history-card">
              <h3>Sales History</h3>

              {history.sales?.map((sale: any) => (
                <div
                  key={sale.id}
                  className="sale-item"
                >
                  <p>
                    <strong>Sale ID:</strong>
                    {sale.id}
                  </p>

                  <p>
                    <strong>Total:</strong>
                    Rs. {sale.totalAmount}
                  </p>

                  <p>
                    <strong>Paid:</strong>
                    Rs. {sale.paidAmount}
                  </p>

                  <p>
                    <strong>Remaining:</strong>
                    Rs. {sale.remainingAmount}
                  </p>

                  <p>
                    <strong>Status:</strong>
                    {sale.paymentStatus}
                  </p>
                </div>
              ))}
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerHistory;