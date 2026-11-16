import { request } from './client'

export const wishlistApi = {
  list: () => request('/api/user/wishlist'),
  add: (productId) => request(`/api/user/wishlist/${productId}`, { method: 'POST' }),
  remove: (productId) => request(`/api/user/wishlist/${productId}`, { method: 'DELETE' }),
}

export const addressApi = {
  list: () => request('/api/user/addresses'),
  create: (body) => request('/api/user/addresses', { method: 'POST', body }),
  update: (id, body) => request(`/api/user/addresses/${id}`, { method: 'PUT', body }),
  setDefault: (id) => request(`/api/user/addresses/${id}/default`, { method: 'PUT' }),
  remove: (id) => request(`/api/user/addresses/${id}`, { method: 'DELETE' }),
}

export const cartApi = {
  get: () => request('/api/user/cart'),
  add: (variantItemId, quantity = 1) =>
    request('/api/user/cart/items', { method: 'POST', body: { variantItemId, quantity } }),
  setQuantity: (variantItemId, quantity) =>
    request(`/api/user/cart/items/${variantItemId}`, { method: 'PUT', body: { quantity } }),
  remove: (variantItemId) =>
    request(`/api/user/cart/items/${variantItemId}`, { method: 'DELETE' }),
  abandon: () => request('/api/user/cart', { method: 'DELETE' }),
  checkout: (shippingAddressId, billingAddressId = null) =>
    request('/api/user/cart/checkout', {
      method: 'POST',
      body: { shippingAddressId, billingAddressId: billingAddressId || null },
    }),
}

export const orderApi = {
  list: (page = 0, size = 10) => request(`/api/user/orders?page=${page}&size=${size}`),
  get: (id) => request(`/api/user/orders/${id}`),
  shipment: (id) => request(`/api/user/orders/${id}/shipment`),
  cancel: (id) => request(`/api/user/orders/${id}/cancel`, { method: 'PATCH' }),
}

export const reviewApi = {
  listPublic: (productId, page = 0, size = 5) =>
    request(`/api/public/products/${productId}/reviews?page=${page}&size=${size}`, { auth: false }),
  summary: (productId) =>
    request(`/api/public/products/${productId}/reviews/summary`, { auth: false }),
  listMine: (page = 0, size = 100) =>
    request(`/api/user/reviews?page=${page}&size=${size}`),
  create: (productId, body) =>
    request(`/api/user/products/${productId}/reviews`, { method: 'POST', body }),
  update: (reviewId, body) =>
    request(`/api/user/reviews/${reviewId}`, { method: 'PUT', body }),
  remove: (reviewId) =>
    request(`/api/user/reviews/${reviewId}`, { method: 'DELETE' }),
}
