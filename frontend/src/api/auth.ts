import axiosInstance from './axiosInstance';

export interface LoginResponse {
  id: number;
  name: string;
  email: string;
  role: string;
  token: string;
}

export interface RegisterResponse {
  message: string;
  requiresEmailVerification: boolean;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const { data } = await axiosInstance.post<LoginResponse>('/auth/login', { email, password });
  return data;
}

type RegisterApiResponse =
  | RegisterResponse
  | string
  | { message?: string; requiresEmailVerification?: boolean; RequiresEmailVerification?: boolean };

export async function register(
  name: string,
  email: string,
  password: string
): Promise<RegisterResponse> {
  const { data } = await axiosInstance.post<RegisterApiResponse>('/auth/register', {
    name,
    email,
    password,
  });

  if (typeof data === 'string') {
    return {
      message: data,
      requiresEmailVerification: true,
    };
  }

  return {
    message: data.message ?? 'Registration successful. Check your email to verify your account.',
    requiresEmailVerification:
      data.requiresEmailVerification ?? data.RequiresEmailVerification ?? true,
  };
}

export async function verifyEmail(token: string): Promise<{ message: string }> {
  const { data } = await axiosInstance.post<{ message: string }>('/auth/verify-email', {
    token,
  });
  return data;
}

export async function resendVerification(email: string): Promise<{ message: string }> {
  const { data } = await axiosInstance.post<{ message: string }>(
    '/auth/resend-verification',
    { email }
  );
  return data;
}

export async function forgotPassword(email: string): Promise<{ message: string }> {
  const { data } = await axiosInstance.post<{ message: string }>(
    '/auth/forgot-password',
    { email }
  );
  return data;
}

export async function resetPassword(
  token: string,
  newPassword: string,
  confirmPassword: string
): Promise<{ message: string }> {
  const { data } = await axiosInstance.post<{ message: string }>(
    '/auth/reset-password',
    { token, newPassword, confirmPassword }
  );
  return data;
}
