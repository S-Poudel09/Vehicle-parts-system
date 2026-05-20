import axiosInstance from './axiosInstance';

// ---- Types ----

export interface CustomerProfile {
  id: number;
  userId: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  vehicles: Vehicle[];
}

export interface Vehicle {
  id: number;
  vehicleNumber: string;
  model: string;
  brand: string;
  year: number | null;
}

export interface Appointment {
  id: number;
  appointmentDate: string;
  status: AppointmentStatus;
  description?: string;
  vehicle: {
    id: number;
    vehicleNumber: string;
    brand: string;
    model: string;
  };
}

export type AppointmentStatus = 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';

export interface Review {
  id: number;
  customerId: number;
  customerName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface PartRequest {
  id: number;
  customerId: number;
  customerName: string;
  partName: string;
  description: string;
  status: PartRequestStatus;
}

export type PartRequestStatus = 'Pending' | 'Approved' | 'Rejected' | 'Fulfilled';

export interface Sale {
  id: number;
  customerId: number;
  customerName: string;
  staffName: string;
  totalAmount: number;
  discount: number;
  finalAmount: number;
  saleDate: string;
  paymentStatus: PaymentStatus;
  saleItems: SaleItem[];
}

export interface SaleItem {
  id: number;
  partId: number;
  partName: string;
  quantity: number;
  price: number;
}

export type PaymentStatus = 'Pending' | 'Paid' | 'Failed' | 'Refunded';

// ---- Profile ----

export const getProfile = () =>
  axiosInstance.get<CustomerProfile>('/customer/profile').then(r => r.data);

export const updateProfile = (data: { phone: string; address: string }) =>
  axiosInstance.put<CustomerProfile>('/customer/profile', data).then(r => r.data);

// ---- Vehicles ----

export const addVehicle = (data: { vehicleNumber: string; model: string; brand: string; year: number | null }) =>
  axiosInstance.post<Vehicle>('/customer/vehicles', data).then(r => r.data);

export const deleteVehicle = (vehicleId: number) =>
  axiosInstance.delete(`/customer/vehicles/${vehicleId}`);

// ---- Appointments ----

export const getMyAppointments = () =>
  axiosInstance.get<Appointment[]>('/customer/appointments').then(r => r.data);

export const createAppointment = (data: { vehicleId: number; appointmentDate: string; description?: string }) =>
  axiosInstance.post<Appointment>('/customer/appointments', data).then(r => r.data);

export const cancelAppointment = (id: number) =>
  axiosInstance.delete(`/customer/appointments/${id}`);

// ---- Reviews ----

export const getMyReviews = () =>
  axiosInstance.get<Review[]>('/customer/reviews').then(r => r.data);

export const createReview = (data: { rating: number; comment: string }) =>
  axiosInstance.post<Review>('/customer/reviews', data).then(r => r.data);

// ---- Part Requests ----

export const getMyPartRequests = () =>
  axiosInstance.get<PartRequest[]>('/partrequest/my').then(r => r.data);

export const createPartRequest = (data: { partName: string; description: string }) =>
  axiosInstance.post<PartRequest>('/partrequest', data).then(r => r.data);

// ---- Sale History ----

export const getMySales = () =>
  axiosInstance.get<Sale[]>('/sale/my').then(r => r.data);
