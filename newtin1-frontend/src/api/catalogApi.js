import { request } from './client'

const P = '/api/public'

export const catalogApi = {
  categories: () => request(`${P}/categories`, { auth: false }),
  products: ({ categoryId, type, page = 0, size = 12 } = {}) => {
    const query = new URLSearchParams({ page, size })
    if (categoryId) query.set('categoryId', categoryId)
    if (type) query.set('type', type)
    return request(`${P}/products?${query}`, { auth: false })
  },
  product: (id) => request(`${P}/products/${id}`, { auth: false }),
  promotions: (page = 0, size = 20) =>
    request(`${P}/promotions?page=${page}&size=${size}`, { auth: false }),
}
