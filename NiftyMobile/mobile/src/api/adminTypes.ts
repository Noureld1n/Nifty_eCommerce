import type {
  Address,
  Category,
  Order,
  PageResponse,
  Product,
  ProductImage,
  ProductVariant,
  Promotion,
} from './commerceTypes';
import type { SessionUser } from './types';

export type AdminCategory = Category & {
  active: boolean;
};

export type AdminVariant = ProductVariant & {
  priceAdjustment: number;
};

export type AdminProduct = Omit<Product, 'variants'> & {
  active: boolean;
  basePrice: number;
  variants?: AdminVariant[];
};

export type AdminPromotion = Promotion & {
  active: boolean;
  currentlyEffective: boolean;
  startDate: string;
  endDate: string;
};

export type AdminOrder = Order & {
  customerName: string;
  customerEmail: string;
};

export type AdminDashboard = {
  summary: {
    salesRevenue: number;
    paidOrders: number;
    procurementSpend: number;
    grossProfit: number;
    costOfGoodsSold: number;
    inventoryUnits: number;
    inventoryRetailValue: number;
    lowStockVariants: number;
    outOfStockVariants: number;
    inventoryCost: number;
    totalOrders: number;
  };
  salesRange: 'DAY' | 'MONTH' | 'YEAR';
  salesOffset: number;
  salesAndPurchasing: {
    period: string;
    sales: number;
    procurementCost: number;
  }[];
  providers: {
    providerId: number;
    providerName: string;
    sellableUnits: number;
    sellableCost: number;
    sellableVariants: number;
    sellableRetailValue: number;
  }[];
  inventoryByType: {
    productType: string;
    units: number;
    retailValue: number;
  }[];
  providerSales: {
    providerName: string;
    unitsSold: number;
    productsSold: number;
  }[];
  ordersByStatus: {
    status: string;
    count: number;
  }[];
  topProducts: {
    productName: string;
    unitsSold: number;
    salesRevenue: number;
  }[];
};

export type CategoryPayload = {
  name: string;
  parentCategoryId: number | null;
};

export type ProductVariantPayload = {
  size: string | null;
  color: string | null;
  material: string | null;
  volumeMl: number | null;
  sizeLabel: string | null;
  formulation: string | null;
  priceAdjustment: number;
  additionalDescription: string | null;
  makeDefault: boolean;
};

export type ProductPayload = {
  type: 'CLOTHING' | 'ACCESSORY' | 'SKINCARE';
  categoryId: number | null;
  name: string;
  basePrice: number;
  description: string | null;
  details: string | null;
  clothingType: string | null;
  accessoryType: string | null;
  skincareType: string | null;
  material: string | null;
  skinType: string | null;
};

export type ProductCreatePayload = ProductPayload & {
  variants: ProductVariantPayload[];
};

export type ProductImagePayload = Omit<ProductImage, 'id'>;

export type PromotionPayload = {
  name: string;
  description: string | null;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  startDate: string;
  endDate: string;
  categoryIds: number[];
  productIds: number[];
};

export type ShipmentPayload = {
  status: string;
  trackingNumber: string | null;
  carrier: string | null;
  expectedDeliveryAt: string | null;
};

export type ProcurementContact = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  active: boolean;
};

export type ProcurementContactPayload = Omit<
  ProcurementContact,
  'id' | 'active'
>;

export type ProcurementPackageItemPayload = {
  variantItemId: number;
  quantity: number;
  unitCost: number;
  notes: string | null;
};

export type ProcurementPackagePayload = {
  providerId: number;
  accountableId: number;
  purchaseDate: string | null;
  referenceNumber: string | null;
  notes: string | null;
  items: ProcurementPackageItemPayload[];
};

export type ProcurementPackage = {
  id: number;
  purchaseDate: string;
  referenceNumber: string | null;
  providerName: string;
  accountableName: string;
  totalCost: number;
  notes: string | null;
  items: {
    variantItemId: number;
    quantity: number;
    unitCost: number;
    lineTotal: number;
  }[];
};

export type AdminFeedback = {
  id: number;
  customerName: string;
  customerEmail: string;
  text: string;
  satisfied: boolean | null;
  createdAt: string;
};

export type AdminUser = SessionUser;

export type AuditLog = {
  id: number;
  createdAt: string;
  adminName: string | null;
  adminEmail: string | null;
  action: string;
  entityType: string;
  entityId: number;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  ipAddress: string | null;
};

export type AdminOrderPage = PageResponse<AdminOrder>;
export type AdminProductPage = PageResponse<AdminProduct>;
export type AdminPromotionPage = PageResponse<AdminPromotion>;

export type AdminAddress = Address;
