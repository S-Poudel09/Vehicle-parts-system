import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import API from "../../services/api";
import AdminPageHeader from "../../components/admin/AdminPageHeader";

type HistoryData = {
  customer: {
    id: number;
    fullName: string;
    email: string;
    phoneNumber: string;
    address: string;
  };
  vehicles: {
    id: number;
    vehicleNumber: string;
    brand: string;
    model: string;
  }[];
  purchaseHistory: {
    saleId: number;
    saleDate: string;
    totalAmount: number;
    discount: number;
    finalAmount: number;
    paymentStatus: string;
    items: {
      partName: string;
      quantity: number;
      price: number;
      lineTotal: number;
    }[];
  }[];
};

export default function CustomerHistory() {
  const location = useLocation();
  const prefillId = (location.state as { customerId?: number } | null)?.customerId;

  const [customerId, setCustomerId] = useState(
    prefillId != null ? String(prefillId) : ""
  );
  const [history, setHistory] = useState<HistoryData | null>(null);
  const [message, setMessage] = useState("");

  const loadHistory = async (id: string) => {
    if (!id.trim()) {
      setMessage("Enter a customer ID.");
      return;
    }
    try {
      const res = await API.get<HistoryData>(`/staff/customers/${id}/history`);
      setHistory(res.data);
      setMessage("");
    } catch {
      setHistory(null);
      setMessage("Customer history not found.");
    }
  };

  useEffect(() => {
    if (prefillId != null) {
      loadHistory(String(prefillId));
    }
  }, [prefillId]);

  return (
    <>
      <AdminPageHeader
        title="Customer History"
        description="View purchase history and vehicles for a customer."
      />

      <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
        <input
          className="input-field max-w-xs"
          type="number"
          placeholder="Customer ID"
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && loadHistory(customerId)}
        />
        <button
          type="button"
          className="btn-primary"
          onClick={() => loadHistory(customerId)}
        >
          View history
        </button>
        {history && (
          <Link
            to={`/staff/customers/${history.customer.id}`}
            className="btn-secondary"
          >
            Edit customer & vehicles
          </Link>
        )}
      </div>

      {message && (
        <p className="mb-4 text-sm text-red-600">{message}</p>
      )}

      {history && (
        <div className="space-y-6">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-4">
              <h3 className="font-semibold text-slate-900">Customer</h3>
            </div>
            <div className="space-y-1 p-6 text-sm text-slate-600">
              <p>
                <span className="font-medium text-slate-800">Name:</span>{" "}
                {history.customer.fullName}
              </p>
              <p>
                <span className="font-medium text-slate-800">Email:</span>{" "}
                {history.customer.email}
              </p>
              <p>
                <span className="font-medium text-slate-800">Phone:</span>{" "}
                {history.customer.phoneNumber}
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-4">
              <h3 className="font-semibold text-slate-900">Purchase history</h3>
            </div>
            {history.purchaseHistory.length === 0 ? (
              <p className="p-6 text-sm text-slate-400">No sales yet.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {history.purchaseHistory.map((sale) => (
                  <div key={sale.saleId} className="px-6 py-4 text-sm">
                    <p className="font-semibold text-slate-900">
                      Sale #{sale.saleId} · {sale.paymentStatus}
                    </p>
                    <p className="text-slate-500">
                      {new Date(sale.saleDate).toLocaleString()} · Rs.{" "}
                      {sale.finalAmount}
                    </p>
                    <ul className="mt-2 list-inside list-disc text-slate-600">
                      {sale.items.map((item, i) => (
                        <li key={i}>
                          {item.partName} × {item.quantity} @ Rs. {item.price}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
