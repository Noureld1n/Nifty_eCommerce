export type PageResponse<T> = {
  content: T[];
  page?: {
    number?: number;
    totalPages?: number;
    totalElements?: number;
  };
  number?: number;
  totalPages?: number;
  totalElements?: number;
};

export type Category = {
  id: number;
  name: string;
  parentCategoryId: number | null;
  active?: boolean;
};

export type ProductImage = {
  id: number;
  imageUrl: string;
  altText: string | null;
  displayOrder: number;
  main: boolean;
};

export type ProductVariant = {
  variantItemId: number;
  active: boolean;
  defaultVariant: boolean;
  currentPrice: number;
  regularPrice: number;
  stockQuantity: number;
  priceAdjustment?: number;
  size?: string | null;
  color?: string | null;
  material?: string | null;
  sizeLabel?: string | null;
  volumeMl?: number | null;
  formulation?: string | null;
  additionalDescription?: string | null;
  promotion?: {
    name: string;
  } | null;
  images?: ProductImage[];
};

export type Product = {
  id: number;
  name: string;
  type: string;
  categoryId: number | null;
  categoryName: string | null;
  description: string | null;
  details: string | null;
  active?: boolean;
  basePrice?: number;
  typeDetails?: Record<string, string | number | null>;
  variants?: ProductVariant[];
};

export type Promotion = {
  id: number;
  name: string;
  description: string | null;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FIXED';
  discountValue: number;
  productIds?: number[];
  categoryIds?: number[];
  startDate?: string;
  endDate?: string;
  active?: boolean;
  currentlyEffective?: boolean;
};

export type WishlistItem = {
  id: number;
  productId: number;
  productName: string;
  productType: string;
  basePrice: number;
  imageUrl: string | null;
};

export type Address = {
  id: number;
  street: string;
  city: string;
  state: string | null;
  zipcode: string | null;
  countryCode: string;
  addressType: 'HOME' | 'WORK' | 'OTHER' | string;
  defaultAddress: boolean;
};

export type AddressPayload = Omit<Address, 'id' | 'defaultAddress'>;

export type CartItem = {
  variantItemId: number;
  productId: number;
  productName: string;
  imageUrl: string | null;
  variantDescription: string | null;
  quantity: number;
  availableStock: number;
  unitPrice: number;
  regularUnitPrice: number;
  subtotal: number;
  promotion: { name: string } | null;
};

export type Cart = {
  items: CartItem[];
  total: number;
};

export type Shipment = {
  status: string;
  trackingNumber: string | null;
  carrier: string | null;
  expectedDeliveryAt: string | null;
  actualDeliveryAt: string | null;
  delivered: boolean;
};

export type OrderItem = {
  id: number;
  productName: string;
  variantDescription: string | null;
  quantity: number;
  priceAtPurchase: number;
};

export type Order = {
  id: number;
  createdAt: string;
  status: string;
  paymentStatus: string;
  totalPrice: number;
  currencyCode: string;
  items: OrderItem[];
  shipment: Shipment | null;
  shippingAddress: Address | null;
  billingAddress: Address | null;
};

export type ProductReview = {
  id: number;
  productId: number;
  customerName: string;
  title: string | null;
  text: string | null;
  rating: number;
  recommended: boolean | null;
};

export type ReviewSummary = {
  averageRating: number;
  reviewCount: number;
};

export type Feedback = {
  id: number;
  text: string;
  satisfied: boolean | null;
  createdAt: string;
};

export type PaymentMethod = {
  id: number;
  provider: string;
  cardBrand: string;
  last4: string;
  expiryMonth: number;
  expiryYear: number;
  isDefault?: boolean;
  default?: boolean;
  defaultMethod?: boolean;
  expired?: boolean;
};

export type PaymentMethodPayload = {
  provider: string;
  providerToken: string;
  cardBrand: string;
  last4: string;
  expiryMonth: number;
  expiryYear: number;
  makeDefault: boolean;
};

