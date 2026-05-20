import API from "../services/api";

export type StaffDashboardSummary = {
  totalCustomers: number;
  salesTodayCount: number;
  salesTodayRevenue: number;
  salesMonthCount: number;
  salesMonthRevenue: number;
  pendingCreditsCount: number;
  pendingCreditsAmount: number;
  pendingAppointments: number;
  confirmedAppointments: number;
  regularCustomersCount: number;
};

export type StaffSalesDayPoint = {
  label: string;
  date: string;
  count: number;
  revenue: number;
};

export type StaffPaymentBreakdown = {
  paidCount: number;
  pendingCount: number;
  paidAmount: number;
  pendingAmount: number;
};

export type StaffTopPart = {
  partName: string;
  quantitySold: number;
  revenue: number;
};

export type StaffDashboardData = {
  summary: StaffDashboardSummary;
  salesLast7Days: StaffSalesDayPoint[];
  paymentBreakdown: StaffPaymentBreakdown;
  topPartsThisMonth: StaffTopPart[];
};

export async function getStaffDashboard(): Promise<StaffDashboardData> {
  const res = await API.get<StaffDashboardData>("/staff/dashboard");
  return res.data;
}
