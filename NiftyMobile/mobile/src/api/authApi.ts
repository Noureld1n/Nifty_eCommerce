import { ApiError, publicPost, request } from './client';
import { isAuthResponse, type AuthResponse, type SessionUser } from './types';
import type {
  Feedback,
  PageResponse,
  PaymentMethod,
  PaymentMethodPayload,
} from './commerceTypes';
import type {
  AdminFeedback,
  AdminUser,
  AuditLog,
} from './adminTypes';

const AUTH_PATH = '/api/public/auth';

export type RegisterPayload = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
};

export type MessageResponse = {
  message?: string;
};

async function authResponse(
  promise: Promise<unknown>,
): Promise<AuthResponse> {
  const data = await promise;
  if (!isAuthResponse(data)) {
    throw new ApiError(502, 'The server returned an invalid authentication response.');
  }
  return data;
}

export const authApi = {
  login: (email: string, password: string) =>
    authResponse(publicPost(`${AUTH_PATH}/login`, { email, password })),
  logout: () => publicPost<void>(`${AUTH_PATH}/logout`),
  register: (body: RegisterPayload) =>
    publicPost<MessageResponse>(`${AUTH_PATH}/register`, body),
  verifyEmail: (token: string) =>
    publicPost<MessageResponse>(`${AUTH_PATH}/verify-email`, { token }),
  resendVerification: (email: string) =>
    publicPost<MessageResponse>(`${AUTH_PATH}/resend-verification`, { email }),
  forgotPassword: (email: string) =>
    publicPost<MessageResponse>(`${AUTH_PATH}/forgot-password`, { email }),
  resetPassword: (token: string, newPassword: string) =>
    publicPost<MessageResponse>(`${AUTH_PATH}/reset-password`, {
      token,
      newPassword,
    }),
};

export const userApi = {
  me: () => request<SessionUser>('/api/user/me'),
  updateProfile: (body: {
    firstName: string;
    lastName: string;
    phone: string;
    image: string;
  }) => request<SessionUser>('/api/user/me', { method: 'PUT', body }),
  changePassword: (currentPassword: string, newPassword: string) =>
    request<MessageResponse>('/api/user/me/password', {
      method: 'PUT',
      body: { currentPassword, newPassword },
    }),
  sendFeedback: (body: { text: string; satisfied: boolean | null }) =>
    request<MessageResponse>('/api/user/feedback', {
      method: 'POST',
      body,
    }),
  myFeedback: (page = 0, size = 10) =>
    request<PageResponse<Feedback>>(
      `/api/user/feedback?page=${page}&size=${size}`,
    ),
  listPaymentMethods: () =>
    request<PaymentMethod[] | PageResponse<PaymentMethod>>(
      '/api/user/payment-methods',
    ),
  addPaymentMethod: (body: PaymentMethodPayload) =>
    request<PaymentMethod>('/api/user/payment-methods', {
      method: 'POST',
      body,
    }),
  makeDefaultPaymentMethod: (id: number) =>
    request<void>(`/api/user/payment-methods/${id}/default`, {
      method: 'PUT',
    }),
  removePaymentMethod: (id: number) =>
    request<void>(`/api/user/payment-methods/${id}`, { method: 'DELETE' }),
};

export type AdminAuditFilters = {
  action?: string;
  entityType?: string;
  entityId?: string;
  adminId?: string;
};

export const adminApi = {
  listUsers: (page = 0, size = 20) =>
    request<PageResponse<AdminUser>>(
      `/api/admin/users?page=${page}&size=${size}`,
    ),
  setUserActive: (id: number, active: boolean) =>
    request<AdminUser>(`/api/admin/users/${id}/status`, {
      method: 'PATCH',
      body: { active },
    }),
  listFeedback: (satisfied = '', page = 0, size = 20) => {
    const query = new URLSearchParams({
      page: String(page),
      size: String(size),
    });
    if (satisfied !== '') {
      query.set('satisfied', satisfied);
    }
    return request<PageResponse<AdminFeedback>>(
      `/api/admin/feedback?${query}`,
    );
  },
  getUser: (id: number) =>
    request<AdminUser>(`/api/admin/users/${id}`),
  listAuditLogs: (
    page = 0,
    size = 20,
    filters: AdminAuditFilters = {},
  ) => {
    const query = new URLSearchParams({
      page: String(page),
      size: String(size),
    });
    for (const [key, value] of Object.entries(filters)) {
      if (value) {
        query.set(key, value);
      }
    }
    return request<PageResponse<AuditLog>>(
      `/api/admin/audit-logs?${query}`,
    );
  },
};
