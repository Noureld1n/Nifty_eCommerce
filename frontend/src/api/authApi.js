import { publicPost, request } from './client'

const P = '/api/public/auth'

export const authApi = {
  register: (body) => publicPost(`${P}/register`, body),
  login: (email, password) => publicPost(`${P}/login`, { email, password }),
  logout: () => publicPost(`${P}/logout`),
  verifyEmail: (token) => publicPost(`${P}/verify-email`, { token }),
  resendVerification: (email) => publicPost(`${P}/resend-verification`, { email }),
  forgotPassword: (email) => publicPost(`${P}/forgot-password`, { email }),
  resetPassword: (token, newPassword) => publicPost(`${P}/reset-password`, { token, newPassword }),
}

export const userApi = {
  me: () => request('/api/user/me'),
  updateProfile: (body) => request('/api/user/me', { method: 'PUT', body }),
  changePassword: (currentPassword, newPassword) =>
    request('/api/user/me/password', { method: 'PUT', body: { currentPassword, newPassword } }),
  sendFeedback: (body) => request('/api/user/feedback', { method: 'POST', body }),
  myFeedback: (page = 0, size = 10) => request(`/api/user/feedback?page=${page}&size=${size}`),

  // Payment methods (tokens only, never card numbers)
  listPaymentMethods: () => request('/api/user/payment-methods'),
  addPaymentMethod: (body) => request('/api/user/payment-methods', { method: 'POST', body }),
  makeDefaultPaymentMethod: (id) => request(`/api/user/payment-methods/${id}/default`, { method: 'PUT' }),
  removePaymentMethod: (id) => request(`/api/user/payment-methods/${id}`, { method: 'DELETE' }),
}

export const adminApi = {
  listUsers: (page = 0, size = 20) => request(`/api/admin/users?page=${page}&size=${size}`),
  setUserActive: (id, active) =>
    request(`/api/admin/users/${id}/status`, { method: 'PATCH', body: { active } }),
  listFeedback: (satisfied = '', page = 0, size = 20) =>
    request(`/api/admin/feedback?page=${page}&size=${size}${satisfied === '' ? '' : `&satisfied=${satisfied}`}`),
  getUser: (id) => request(`/api/admin/users/${id}`),
  /** filters: { action, entityType, entityId, adminId } - empty values are left out */
  listAuditLogs: (page = 0, size = 20, filters = {}) => {
    const q = new URLSearchParams({ page, size })
    Object.entries(filters).forEach(([k, v]) => { if (v !== '' && v != null) q.set(k, v) })
    return request(`/api/admin/audit-logs?${q}`)
  },
}
