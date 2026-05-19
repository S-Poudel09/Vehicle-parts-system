import { useState } from "react";
import API from "../services/api";
import "./SendInvoiceEmail.css";

function SendInvoiceEmail() {
  const [saleId, setSaleId] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSendInvoice = async () => {
    if (!saleId.trim()) {
      setMessage("Please enter a sale ID.");
      return;
    }

    try {
      setIsSending(true);
      setMessage("");

      const response = await API.post(`/staff/sales/${saleId}/send-invoice`);

      setMessage(
        `${response.data.message} Sent to ${response.data.customerEmail}.`
      );
    } catch (error: any) {
      console.error(error);

      const backendMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Invoice email could not be sent. Please check the sale ID or backend.";

      setMessage(backendMessage);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="send-invoice-page">
      <div className="send-invoice-card">
        <h1>Send Invoice Email</h1>
        <p>
          Enter a sale ID to send the saved sales invoice to the customer’s
          registered email address.
        </p>

        <div className="send-invoice-form">
          <input
            type="number"
            placeholder="Enter Sale ID"
            value={saleId}
            onChange={(e) => setSaleId(e.target.value)}
          />

          <button onClick={handleSendInvoice} disabled={isSending}>
            {isSending ? "Sending..." : "Send Invoice Email"}
          </button>
        </div>

        {message && <p className="send-invoice-message">{message}</p>}
      </div>
    </div>
  );
}

export default SendInvoiceEmail;