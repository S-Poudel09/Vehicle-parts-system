import axiosInstance from './axiosInstance';

export interface LoginResponse {
  id: number;
  name: string;
  email: string;
  role: string;
  token: string;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const { data } = await axiosInstance.post<LoginResponse>('/auth/login', { email, password });
  return data;
}

export async function register(name: string, email: string, password: string): Promise<string> {
  const { data } = await axiosInstance.post<string>('/auth/register', { name, email, password });
  return data;
}
