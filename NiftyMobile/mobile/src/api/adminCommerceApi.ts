import { request } from './client';
import type {
  AdminDashboard,
  AdminCategory,
  AdminOrder,
  AdminOrderPage,
  AdminProduct,
  AdminProductPage,
  AdminPromotion,
  AdminPromotionPage,
  CategoryPayload,
  ProcurementContact,
  ProcurementContactPayload,
  ProcurementPackage,
  ProcurementPackagePayload,
  ProductCreatePayload,
  ProductImagePayload,
  ProductPayload,
  ProductVariantPayload,
  PromotionPayload,
  ShipmentPayload,
} from './adminTypes';
import type { PageResponse, ProductImage } from './commerceTypes';

function pageQuery(page: number, size: number) {
  return new URLSearchParams({ page: String(page), size: String(size) });
}

export const adminAnalyticsApi = {
  dashboard: (range: 'DAY' | 'MONTH' | 'YEAR' = 'YEAR', offset = 0) =>
    request<AdminDashboard>(
      `/api/admin/analytics?range=${range}&offset=${offset}`,
    ),
};

export const adminCatalogApi = {
  categories: () => request<AdminCategory[]>('/api/admin/categories'),
  createCategory: (body: CategoryPayload) =>
    request<AdminCategory>('/api/admin/categories', {
      method: 'POST',
      body,
    }),
  updateCategory: (id: number, body: CategoryPayload) =>
    request<AdminCategory>(`/api/admin/categories/${id}`, {
      method: 'PUT',
      body,
    }),
  setCategoryActive: (id: number, active: boolean) =>
    request<AdminCategory>(`/api/admin/categories/${id}/status`, {
      method: 'PATCH',
      body: { active },
    }),
  products: ({
    categoryId,
    type,
    active,
    page = 0,
    size = 20,
  }: {
    categoryId?: string;
    type?: string;
    active?: string;
    page?: number;
    size?: number;
  } = {}) => {
    const query = pageQuery(page, size);
    if (categoryId) query.set('categoryId', categoryId);
    if (type) query.set('type', type);
    if (active !== '' && active != null) query.set('active', active);
    return request<AdminProductPage>(`/api/admin/products?${query}`);
  },
  product: (id: number) =>
    request<AdminProduct>(`/api/admin/products/${id}`),
  createProduct: (body: ProductCreatePayload) =>
    request<AdminProduct>('/api/admin/products', {
      method: 'POST',
      body,
    }),
  updateProduct: (id: number, body: ProductPayload) =>
    request<AdminProduct>(`/api/admin/products/${id}`, {
      method: 'PUT',
      body,
    }),
  setProductActive: (id: number, active: boolean) =>
    request<AdminProduct>(`/api/admin/products/${id}/status`, {
      method: 'PATCH',
      body: { active },
    }),
  addVariant: (productId: number, body: ProductVariantPayload) =>
    request<AdminProduct>(
      `/api/admin/products/${productId}/variants`,
      { method: 'POST', body },
    ),
  updateVariant: (
    productId: number,
    variantId: number,
    body: ProductVariantPayload,
  ) =>
    request<AdminProduct>(
      `/api/admin/products/${productId}/variants/${variantId}`,
      { method: 'PUT', body },
    ),
  setVariantActive: (
    productId: number,
    variantId: number,
    active: boolean,
  ) =>
    request<AdminProduct>(
      `/api/admin/products/${productId}/variants/${variantId}/status`,
      { method: 'PATCH', body: { active } },
    ),
  setDefaultVariant: (productId: number, variantId: number) =>
    request<AdminProduct>(
      `/api/admin/products/${productId}/variants/${variantId}/default`,
      { method: 'PUT' },
    ),
  images: (productId: number, variantId: number) =>
    request<ProductImage[]>(
      `/api/admin/products/${productId}/variants/${variantId}/images`,
    ),
  addImage: (
    productId: number,
    variantId: number,
    body: ProductImagePayload,
  ) =>
    request<ProductImage>(
      `/api/admin/products/${productId}/variants/${variantId}/images`,
      { method: 'POST', body },
    ),
  updateImage: (
    productId: number,
    variantId: number,
    imageId: number,
    body: ProductImagePayload,
  ) =>
    request<ProductImage>(
      `/api/admin/products/${productId}/variants/${variantId}/images/${imageId}`,
      { method: 'PUT', body },
    ),
  removeImage: (productId: number, variantId: number, imageId: number) =>
    request<void>(
      `/api/admin/products/${productId}/variants/${variantId}/images/${imageId}`,
      { method: 'DELETE' },
    ),
};

export const adminPromotionApi = {
  list: (page = 0, size = 20) =>
    request<AdminPromotionPage>(
      `/api/admin/promotions?${pageQuery(page, size)}`,
    ),
  get: (id: number) =>
    request<AdminPromotion>(`/api/admin/promotions/${id}`),
  create: (body: PromotionPayload) =>
    request<AdminPromotion>('/api/admin/promotions', {
      method: 'POST',
      body,
    }),
  update: (id: number, body: PromotionPayload) =>
    request<AdminPromotion>(`/api/admin/promotions/${id}`, {
      method: 'PUT',
      body,
    }),
  setActive: (id: number, active: boolean) =>
    request<AdminPromotion>(`/api/admin/promotions/${id}/status`, {
      method: 'PATCH',
      body: { active },
    }),
};

export const adminOrderApi = {
  list: ({
    status,
    paymentStatus,
    page = 0,
    size = 20,
  }: {
    status?: string;
    paymentStatus?: string;
    page?: number;
    size?: number;
  } = {}) => {
    const query = pageQuery(page, size);
    if (status) query.set('status', status);
    if (paymentStatus) query.set('paymentStatus', paymentStatus);
    return request<AdminOrderPage>(`/api/admin/orders?${query}`);
  },
  get: (id: number) => request<AdminOrder>(`/api/admin/orders/${id}`),
  setStatus: (id: number, status: string) =>
    request<AdminOrder>(`/api/admin/orders/${id}/status`, {
      method: 'PATCH',
      body: { status },
    }),
  setPaymentStatus: (id: number, paymentStatus: string) =>
    request<AdminOrder>(`/api/admin/orders/${id}/payment-status`, {
      method: 'PATCH',
      body: { status: paymentStatus },
    }),
  updateShipment: (id: number, body: ShipmentPayload) =>
    request<AdminOrder>(`/api/admin/orders/${id}/shipment`, {
      method: 'PUT',
      body,
    }),
};

export const adminProcurementApi = {
  providers: (active?: boolean) =>
    request<ProcurementContact[]>(
      `/api/admin/procurement/providers${
        active == null ? '' : `?active=${active}`
      }`,
    ),
  createProvider: (body: ProcurementContactPayload) =>
    request<ProcurementContact>('/api/admin/procurement/providers', {
      method: 'POST',
      body,
    }),
  updateProvider: (id: number, body: ProcurementContactPayload) =>
    request<ProcurementContact>(`/api/admin/procurement/providers/${id}`, {
      method: 'PUT',
      body,
    }),
  setProviderActive: (id: number, active: boolean) =>
    request<ProcurementContact>(
      `/api/admin/procurement/providers/${id}/status`,
      { method: 'PATCH', body: { active } },
    ),
  accountables: (active?: boolean) =>
    request<ProcurementContact[]>(
      `/api/admin/procurement/accountables${
        active == null ? '' : `?active=${active}`
      }`,
    ),
  createAccountable: (body: ProcurementContactPayload) =>
    request<ProcurementContact>('/api/admin/procurement/accountables', {
      method: 'POST',
      body,
    }),
  updateAccountable: (id: number, body: ProcurementContactPayload) =>
    request<ProcurementContact>(`/api/admin/procurement/accountables/${id}`, {
      method: 'PUT',
      body,
    }),
  setAccountableActive: (id: number, active: boolean) =>
    request<ProcurementContact>(
      `/api/admin/procurement/accountables/${id}/status`,
      { method: 'PATCH', body: { active } },
    ),
  packages: (page = 0, size = 20) =>
    request<PageResponse<ProcurementPackage>>(
      `/api/admin/procurement/packages?${pageQuery(page, size)}`,
    ),
  receivePackage: (body: ProcurementPackagePayload) =>
    request<ProcurementPackage>('/api/admin/procurement/packages', {
      method: 'POST',
      body,
    }),
};
