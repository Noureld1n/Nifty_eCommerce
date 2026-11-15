import { request } from './client';
import type {
  Category,
  PageResponse,
  Product,
  Promotion,
} from './commerceTypes';

const PUBLIC_PATH = '/api/public';

type ProductFilters = {
  categoryId?: string | number;
  type?: string;
  page?: number;
  size?: number;
};

export const catalogApi = {
  categories: () =>
    request<Category[]>(`${PUBLIC_PATH}/categories`, { auth: false }),
  products: ({
    categoryId,
    type,
    page = 0,
    size = 12,
  }: ProductFilters = {}) => {
    const query = new URLSearchParams({ page: String(page), size: String(size) });
    if (categoryId) {
      query.set('categoryId', String(categoryId));
    }
    if (type) {
      query.set('type', type);
    }
    return request<PageResponse<Product>>(
      `${PUBLIC_PATH}/products?${query.toString()}`,
      { auth: false },
    );
  },
  product: (id: number) =>
    request<Product>(`${PUBLIC_PATH}/products/${id}`, { auth: false }),
  promotions: (page = 0, size = 20) =>
    request<PageResponse<Promotion>>(
      `${PUBLIC_PATH}/promotions?page=${page}&size=${size}`,
      { auth: false },
    ),
};
