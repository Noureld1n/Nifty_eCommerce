import { request } from './client'

const pageQuery = (page, size) => new URLSearchParams({ page, size }).toString()

export const adminAnalyticsApi = {
  dashboard: (range = 'YEAR', offset = 0) =>
    request(`/api/admin/analytics?range=${range}&offset=${offset}`),
}

export const adminCatalogApi = {
  categories: () => request('/api/admin/categories'),
  createCategory: (body) => request('/api/admin/categories', { method: 'POST', body }),
  updateCategory: (id, body) => request(`/api/admin/categories/${id}`, { method: 'PUT', body }),
  setCategoryActive: (id, active) =>
    request(`/api/admin/categories/${id}/status`, { method: 'PATCH', body: { active } }),
  products: ({ categoryId, type, active, page = 0, size = 20 } = {}) => {
    const query = new URLSearchParams(pageQuery(page, size))
    if (categoryId) query.set('categoryId', categoryId)
    if (type) query.set('type', type)
    if (active !== '' && active != null) query.set('active', active)
    return request(`/api/admin/products?${query}`)
  },
  product: (id) => request(`/api/admin/products/${id}`),
  createProduct: (body) => request('/api/admin/products', { method: 'POST', body }),
  updateProduct: (id, body) => request(`/api/admin/products/${id}`, { method: 'PUT', body }),
  setProductActive: (id, active) =>
    request(`/api/admin/products/${id}/status`, { method: 'PATCH', body: { active } }),
  addVariant: (productId, body) =>
    request(`/api/admin/products/${productId}/variants`, { method: 'POST', body }),
  updateVariant: (productId, variantId, body) =>
    request(`/api/admin/products/${productId}/variants/${variantId}`, { method: 'PUT', body }),
  setVariantActive: (productId, variantId, active) =>
    request(`/api/admin/products/${productId}/variants/${variantId}/status`, { method: 'PATCH', body: { active } }),
  setDefaultVariant: (productId, variantId) =>
    request(`/api/admin/products/${productId}/variants/${variantId}/default`, { method: 'PUT' }),
  images: (productId, variantId) =>
    request(`/api/admin/products/${productId}/variants/${variantId}/images`),
  addImage: (productId, variantId, body) =>
    request(`/api/admin/products/${productId}/variants/${variantId}/images`, { method: 'POST', body }),
  updateImage: (productId, variantId, imageId, body) =>
    request(`/api/admin/products/${productId}/variants/${variantId}/images/${imageId}`, { method: 'PUT', body }),
  removeImage: (productId, variantId, imageId) =>
    request(`/api/admin/products/${productId}/variants/${variantId}/images/${imageId}`, { method: 'DELETE' }),
}

export const adminPromotionApi = {
  list: (page = 0, size = 20) => request(`/api/admin/promotions?${pageQuery(page, size)}`),
  get: (id) => request(`/api/admin/promotions/${id}`),
  create: (body) => request('/api/admin/promotions', { method: 'POST', body }),
  update: (id, body) => request(`/api/admin/promotions/${id}`, { method: 'PUT', body }),
  setActive: (id, active) =>
    request(`/api/admin/promotions/${id}/status`, { method: 'PATCH', body: { active } }),
}

export const adminOrderApi = {
  list: ({ status, paymentStatus, page = 0, size = 20 } = {}) => {
    const query = new URLSearchParams(pageQuery(page, size))
    if (status) query.set('status', status)
    if (paymentStatus) query.set('paymentStatus', paymentStatus)
    return request(`/api/admin/orders?${query}`)
  },
  get: (id) => request(`/api/admin/orders/${id}`),
  setStatus: (id, status) =>
    request(`/api/admin/orders/${id}/status`, { method: 'PATCH', body: { status } }),
  setPaymentStatus: (id, paymentStatus) =>
    request(`/api/admin/orders/${id}/payment-status`, { method: 'PATCH', body: { status: paymentStatus } }),
  updateShipment: (id, body) =>
    request(`/api/admin/orders/${id}/shipment`, { method: 'PUT', body }),
}

export const adminProcurementApi = {
  providers: (active) => request(`/api/admin/procurement/providers${active == null ? '' : `?active=${active}`}`),
  createProvider: (body) => request('/api/admin/procurement/providers', { method: 'POST', body }),
  updateProvider: (id, body) => request(`/api/admin/procurement/providers/${id}`, { method: 'PUT', body }),
  setProviderActive: (id, active) =>
    request(`/api/admin/procurement/providers/${id}/status`, { method: 'PATCH', body: { active } }),
  accountables: (active) => request(`/api/admin/procurement/accountables${active == null ? '' : `?active=${active}`}`),
  createAccountable: (body) => request('/api/admin/procurement/accountables', { method: 'POST', body }),
  updateAccountable: (id, body) => request(`/api/admin/procurement/accountables/${id}`, { method: 'PUT', body }),
  setAccountableActive: (id, active) =>
    request(`/api/admin/procurement/accountables/${id}/status`, { method: 'PATCH', body: { active } }),
  packages: (page = 0, size = 20) => request(`/api/admin/procurement/packages?${pageQuery(page, size)}`),
  receivePackage: (body) => request('/api/admin/procurement/packages', { method: 'POST', body }),
}
