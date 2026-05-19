import { useState } from "react";
import { PrinterIcon, XMarkIcon, EnvelopeIcon } from "@heroicons/react/24/outline";
import API from "../../services/api";
import { formatDate, formatMoney, numberToWords } from "../../utils/invoiceFormat";

export type SaleInvoice = {
  id: number;
  customerId: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  totalAmount: number;
  discount: number;
  finalAmount: number;
  paidAmount: number;
  saleDate: string;
  paymentStatus: string;
  items: {
    id: number;
    partId: number;
    partName: string;
    quantity: number;
    price: number;
    lineTotal: number;
  }[];
};

type SalesInvoiceModalProps = {
  sale: SaleInvoice;
  onClose: () => void;
};

export default function SalesInvoiceModal({ sale, onClose }: SalesInvoiceModalProps) {
  const [emailMessage, setEmailMessage] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);

  const total = sale.finalAmount;
  const subtotal = total / 1.13;
  const vatAmount = total - subtotal;

  const handlePrint = () => {
    window.print();
  };

  const handleSendEmail = async () => {
    try {
      setSendingEmail(true);
      setEmailMessage("");
      const res = await API.post(`/staff/sales/${sale.id}/send-invoice`);
      setEmailMessage(
        `${res.data.message} Sent to ${res.data.customerEmail}.`
      );
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      setEmailMessage(
        ax.response?.data?.message ||
          "Invoice email could not be sent. Check email settings."
      );
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/45 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Sales Invoice</h3>
            <p className="text-xs text-slate-500">
              Invoice ID: GP-SAL-2026-{sale.id}
            </p>
          </div>
          <button type="button" onClick={onClose} className="btn-secondary !p-2">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          <style>{`
            @media print {
              body * { visibility: hidden; }
              .print-area, .print-area * { visibility: visible; }
              .print-area {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                border: none !important;
                box-shadow: none !important;
                padding: 20px !important;
                margin: 0 !important;
                background: white !important;
                color: black !important;
              }
              .print-btn { display: none !important; }
            }
          `}</style>

          <div className="mb-4 flex flex-wrap justify-end gap-2 print-btn">
            <button
              type="button"
              onClick={handleSendEmail}
              disabled={sendingEmail}
              className="btn-secondary inline-flex items-center gap-2"
            >
              <EnvelopeIcon className="h-4 w-4" />
              {sendingEmail ? "Sending…" : "Email PDF to customer"}
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="btn-primary inline-flex items-center gap-2"
            >
              <PrinterIcon className="h-4 w-4" />
              Print / Save PDF
            </button>
          </div>

          {emailMessage && (
            <p className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              {emailMessage}
            </p>
          )}

          <div className="print-area rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col justify-between border-b border-slate-200 pb-5 sm:flex-row sm:items-center">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900">
                  GADI PARTS SELLING & INVENTORY
                </h1>
                <p className="text-xs text-slate-500">
                  Kathmandu, Nepal | Phone: +977-1-4400000 | Email:
                  accounts@gadiparts.com
                </p>
              </div>
              <div className="mt-3 text-left sm:mt-0 sm:text-right">
                <h2 className="text-sm font-extrabold uppercase tracking-widest text-slate-400">
                  Sales Invoice
                </h2>
                <p className="font-mono text-sm text-slate-700">
                  GP-SAL-2026-{sale.id}
                </p>
                <p className="text-xs text-slate-500">
                  Date: {formatDate(sale.saleDate)}
                </p>
                <p className="text-xs text-slate-500">
                  Payment: {sale.paymentStatus}
                </p>
              </div>
            </div>

            <div className="my-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Bill To (Customer)
                </p>
                <p className="mt-1 font-bold text-slate-900">{sale.customerName}</p>
                <p className="text-xs text-slate-600">Tel: {sale.customerPhone}</p>
                <p className="text-xs text-slate-600">{sale.customerEmail}</p>
                <p className="text-xs text-slate-600">{sale.customerAddress}</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Sold By
                </p>
                <p className="mt-1 font-bold text-slate-900">GadiParts Staff</p>
                <p className="text-xs text-slate-600">Vehicle Parts Counter</p>
                <p className="text-xs text-slate-600">Kathmandu, Nepal</p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80">
                    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase text-slate-500">
                      S.N.
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase text-slate-500">
                      Part Description
                    </th>
                    <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase text-slate-500">
                      Qty
                    </th>
                    <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase text-slate-500">
                      Rate
                    </th>
                    <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase text-slate-500">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sale.items.map((item, idx) => (
                    <tr
                      key={item.id}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="px-4 py-3 text-xs text-slate-500">{idx + 1}</td>
                      <td className="px-4 py-3 text-sm font-medium text-slate-800">
                        {item.partName}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-slate-700">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-slate-700">
                        {formatMoney(item.price)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-slate-950">
                        {formatMoney(item.lineTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex flex-col justify-between gap-4 border-t border-slate-100 pt-5 sm:flex-row">
              <div className="max-w-md">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Amount in Words
                </p>
                <p className="mt-1 text-xs font-medium italic text-slate-700">
                  {numberToWords(total)}
                </p>
              </div>
              <div className="w-full sm:w-72">
                <div className="space-y-1.5 text-sm text-slate-600">
                  <div className="flex justify-between">
                    <span>Subtotal (excl. VAT):</span>
                    <span>{formatMoney(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>VAT (13% Incl.):</span>
                    <span>{formatMoney(vatAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Gross total:</span>
                    <span>{formatMoney(sale.totalAmount)}</span>
                  </div>
                  {sale.discount > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Discount (10%):</span>
                      <span>-{formatMoney(sale.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Paid amount:</span>
                    <span>{formatMoney(sale.paidAmount)}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-slate-900">
                    <span>Final amount:</span>
                    <span>{formatMoney(sale.finalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-12 flex items-end justify-between">
              <div className="text-xs text-slate-400">
                <p>1. Returns allowed only within 7 days of invoice date.</p>
                <p>2. Computer generated receipt. No signature required.</p>
              </div>
              <div className="w-48 border-t border-slate-300 pt-2 text-center text-xs font-semibold text-slate-600">
                Authorized Signature
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

