import { useState } from "react";
import API from "../../services/api";
import "./SellParts.css";

const SellParts = () => {
  const [form, setForm] = useState({
    customerId: "",
    paidAmount: "",
    partId: "",
    quantity: "",
  });

  const [message, setMessage] = useState("");
  const [invoice, setInvoice] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setInvoice(null);

    try {
      setLoading(true);

      const payload = {
        customerId: Number(form.customerId),
        paidAmount: Number(form.paidAmount),
        items: [
          {
            partId: Number(form.partId),
            quantity: Number(form.quantity),
          },
        ],
      };

      const response = await API.post("/staff/sales", payload);

      setMessage("Sale invoice created successfully.");
      setInvoice(response.data);

      setForm({
        customerId: "",
        paidAmount: "",
        partId: "",
        quantity: "",
      });
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data || "Failed to create sale.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sell-page">
      <div className="sell-wrapper">
        <div className="sell-header">
          <h2>Create Sales Invoice</h2>
          <p>Sell vehicle parts to customers and generate invoice summary.</p>
        </div>

        {message && <p className="success-message">{message}</p>}
        {error && <p className="error-message">{error}</p>}

        <form className="sell-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <input
              name="customerId"
              type="number"
              placeholder="Customer ID"
              value={form.customerId}
              onChange={handleChange}
              required
            />

            <input
              name="paidAmount"
              type="number"
              placeholder="Paid Amount"
              value={form.paidAmount}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-row">
            <input
              name="partId"
              type="number"
              placeholder="Part ID"
              value={form.partId}
              onChange={handleChange}
              required
            />

            <input
              name="quantity"
              type="number"
              placeholder="Quantity"
              value={form.quantity}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Creating Invoice..." : "Create Invoice"}
          </button>
        </form>

        {invoice && (
          <div className="invoice-card">
            <h3>Invoice Summary</h3>
            <div className="invoice-row">
              <span>Sale ID</span>
              <strong>{invoice.saleId}</strong>
            </div>
            <div className="invoice-row">
              <span>Total Amount</span>
              <strong>Rs. {invoice.totalAmount}</strong>
            </div>
            <div className="invoice-row">
              <span>Discount</span>
              <strong>Rs. {invoice.discount}</strong>
            </div>
            <div className="invoice-row final">
              <span>Final Amount</span>
              <strong>Rs. {invoice.finalAmount}</strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SellParts;