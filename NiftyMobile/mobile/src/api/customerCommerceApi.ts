import { request } from './client';
import type {
  Address,
  AddressPayload,
  Cart,
  Order,
  PageResponse,
  ProductReview,
  ReviewSummary,
  Shipment,
  WishlistItem,
} from './commerceTypes';

export const wishlistApi = {
  list: () => request<WishlistItem[]>('/api/user/wishlist'),
  add: (productId: number) =>
    request<void>(`/api/user/wishlist/${productId}`, { method: 'POST' }),
  remove: (productId: number) =>
    request<void>(`/api/user/wishlist/${productId}`, { method: 'DELETE' }),
};

export const addressApi = {
  list: () => request<Address[]>('/api/user/addresses'),
  create: (body: AddressPayload) =>
    request<Address>('/api/user/addresses', { method: 'POST', body }),
  update: (id: number, body: AddressPayload) =>
    request<Address>(`/api/user/addresses/${id}`, { method: 'PUT', body }),
  setDefault: (id: number) =>
    request<void>(`/api/user/addresses/${id}/default`, { method: 'PUT' }),
  remove: (id: number) =>
    request<void>(`/api/user/addresses/${id}`, { method: 'DELETE' }),
};

export const cartApi = {
  get: () => request<Cart>('/api/user/cart'),
  add: (variantItemId: number, quantity = 1) =>
    request<Cart>('/api/user/cart/items', {
      method: 'POST',
      body: { variantItemId, quantity },
    }),
  setQuantity: (variantItemId: number, quantity: number) =>
    request<Cart>(`/api/user/cart/items/${variantItemId}`, {
      method: 'PUT',
      body: { quantity },
    }),
  remove: (variantItemId: number) =>
    request<void>(`/api/user/cart/items/${variantItemId}`, {
      method: 'DELETE',
    }),
  abandon: () => request<void>('/api/user/cart', { method: 'DELETE' }),
  checkout: (shippingAddressId: number, billingAddressId: number | null = null) =>
    request<Order>('/api/user/cart/checkout', {
      method: 'POST',
      body: {
        shippingAddressId,
        billingAddressId: billingAddressId || null,
      },
    }),
};

export const orderApi = {
  list: (page = 0, size = 10) =>
    request<PageResponse<Order>>(`/api/user/orders?page=${page}&size=${size}`),
  get: (id: number) => request<Order>(`/api/user/orders/${id}`),
  shipment: (id: number) =>
    request<Shipment | null>(`/api/user/orders/${id}/shipment`),
  cancel: (id: number) =>
    request<void>(`/api/user/orders/${id}/cancel`, { method: 'PATCH' }),
};

export const reviewApi = {
  listPublic: (productId: number, page = 0, size = 5) =>
    request<PageResponse<ProductReview>>(
      `/api/public/products/${productId}/reviews?page=${page}&size=${size}`,
      { auth: false },
    ),
  summary: (productId: number) =>
    request<ReviewSummary>(
      `/api/public/products/${productId}/reviews/summary`,
      { auth: false },
    ),
  listMine: (page = 0, size = 100) =>
    request<PageResponse<ProductReview>>(
      `/api/user/reviews?page=${page}&size=${size}`,
    ),
  create: (
    productId: number,
    body: Pick<ProductReview, 'title' | 'text' | 'rating' | 'recommended'>,
  ) =>
    request<ProductReview>(`/api/user/products/${productId}/reviews`, {
      method: 'POST',
      body,
    }),
  update: (
    reviewId: number,
    body: Pick<ProductReview, 'title' | 'text' | 'rating' | 'recommended'>,
  ) =>
    request<ProductReview>(`/api/user/reviews/${reviewId}`, {
      method: 'PUT',
      body,
    }),
  remove: (reviewId: number) =>
    request<void>(`/api/user/reviews/${reviewId}`, { method: 'DELETE' }),
};

