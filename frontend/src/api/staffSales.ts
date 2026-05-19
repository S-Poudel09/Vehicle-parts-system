import API from "../services/api";
import type { SaleInvoice } from "../components/invoice/SalesInvoiceModal";

export async function getSaleInvoice(saleId: number): Promise<SaleInvoice> {
  const res = await API.get<SaleInvoice>(`/staff/sales/${saleId}`);
  return res.data;
}

export async function sendSaleInvoiceEmail(saleId: number): Promise<{
  message: string;
  customerEmail: string;
}> {
  const res = await API.post<{ message: string; customerEmail: string }>(
    `/staff/sales/${saleId}/send-invoice`
  );
  return res.data;
}
