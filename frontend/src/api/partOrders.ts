import axiosInstance from './axiosInstance';

export type PartOrderStatus =
  | 'PendingApproval'
  | 'Approved'
  | 'AwaitingPayment'
  | 'PaymentVerificationPending'
  | 'PartiallyPaid'
  | 'Paid'
  | 'ReadyForPickup'
  | 'Completed'
  | 'Rejected';

export interface PartOrderListItem {
  id: number;
  partId: number;
  partName: string;
  quantity: number;
  unitPrice: number;
  finalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  status: PartOrderStatus | string;
  paymentReferenceId?: string | null;
  invoiceNumber?: string | null;
  saleId?: number | null;
  createdAt: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  staffName?: string | null;
}

export interface PartOrderPaymentLog {
  id: number;
  staffName: string;
  amountVerified: number;
  totalPaidAfter: number;
  pendingAfter: number;
  paymentReferenceId?: string | null;
  notes?: string | null;
  verifiedAt: string;
}

export interface PartOrderDetail extends PartOrderListItem {
  totalAmount: number;
  discount: number;
  customerDeclaredAmount: number;
  staffNotes?: string | null;
  approvedAt?: string | null;
  paymentSubmittedAt?: string | null;
  verifiedAt?: string | null;
  completedAt?: string | null;
  partImageUrl?: string | null;
  paymentLogs: PartOrderPaymentLog[];
}

export async function getMyPartOrders(): Promise<PartOrderListItem[]> {
  const { data } = await axiosInstance.get<PartOrderListItem[]>('/customer/part-orders');
  return data;
}

export async function getMyPartOrder(id: number): Promise<PartOrderDetail> {
  const { data } = await axiosInstance.get<PartOrderDetail>(`/customer/part-orders/${id}`);
  return data;
}

export async function createPartOrder(partId: number, quantity: number): Promise<PartOrderDetail> {
  const { data } = await axiosInstance.post<PartOrderDetail>('/customer/part-orders', {
    partId,
    quantity,
  });
  return data;
}

export async function submitPartOrderPayment(
  id: number,
  paymentReferenceId: string,
  declaredAmount: number
): Promise<{ message: string }> {
  const { data } = await axiosInstance.post<{ message: string }>(
    `/customer/part-orders/${id}/submit-payment`,
    { paymentReferenceId, declaredAmount }
  );
  return data;
}

export function getPartOrderInvoiceUrl(id: number): string {
  const base = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api';
  const token = localStorage.getItem('token');
  return `${base}/customer/part-orders/${id}/invoice-pdf?access_token=${token ?? ''}`;
}

export async function downloadPartOrderInvoice(id: number): Promise<Blob> {
  const { data } = await axiosInstance.get(`/customer/part-orders/${id}/invoice-pdf`, {
    responseType: 'blob',
  });
  return data;
}

export async function getStaffPartOrders(status?: string): Promise<PartOrderListItem[]> {
  const { data } = await axiosInstance.get<PartOrderListItem[]>('/staff/part-orders', {
    params: status ? { status } : undefined,
  });
  return data;
}

export async function getStaffPartOrder(id: number): Promise<PartOrderDetail> {
  const { data } = await axiosInstance.get<PartOrderDetail>(`/staff/part-orders/${id}`);
  return data;
}

export async function approvePartOrder(id: number, staffNotes?: string): Promise<void> {
  await axiosInstance.patch(`/staff/part-orders/${id}/approve`, { staffNotes });
}

export async function rejectPartOrder(id: number, staffNotes?: string): Promise<void> {
  await axiosInstance.patch(`/staff/part-orders/${id}/reject`, { staffNotes });
}

export async function verifyPartOrderPayment(
  id: number,
  paidAmount: number,
  paymentReferenceId?: string,
  notes?: string
): Promise<void> {
  await axiosInstance.patch(`/staff/part-orders/${id}/verify-payment`, {
    paidAmount,
    paymentReferenceId,
    notes,
  });
}

export async function completePartOrder(id: number): Promise<void> {
  await axiosInstance.patch(`/staff/part-orders/${id}/complete`);
}
