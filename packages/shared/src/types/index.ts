import {
  UserRole,
  OrderStatus,
  TailoringStatus,
  ProductStatus,
  ProductionStatus,
  AssignmentStatus,
  AssignmentMethod,
  OrderPriority,
  TailorApprovalStatus,
} from "../constants/index.js";

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerProfile {
  id: string;
  userId: string;
  defaultAddressId?: string | null;
  loyaltyPoints: number;
}

export interface Address {
  id: string;
  userId: string;
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  district?: string | null;
  state: string;
  pincode: string;
  isDefault: boolean;
}

export interface School {
  id: string;
  name: string;
  slug: string;
  code?: string | null;
  logo?: string | null;
  address: string;
  city: string;
  district?: string | null;
  state: string;
  pincode: string;
  contactEmail?: string | null;
  contactPhone?: string | null;
  description?: string | null;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
}

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  size: string;
  color?: string | null;
  mrp: number;
  sellingPrice: number;
  stock: number;
  isAvailable: boolean;
}

export interface ProductImage {
  id: string;
  productId: string;
  url: string;
  altText?: string | null;
  sortOrder: number;
  isPrimary: boolean;
  schoolId?: string | null;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  category?: ProductCategory;
  schoolId?: string | null;
  school?: School | null;
  franchiseId?: string | null;
  gender: "BOYS" | "GIRLS" | "UNISEX";
  fabricDetails?: string | null;
  careInstructions?: string | null;
  status: ProductStatus;
  isFeatured: boolean;
  variants: ProductVariant[];
  images: ProductImage[];
  createdAt: string;
}

export interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  product: Product;
  variantId: string;
  variant: ProductVariant;
  quantity: number;
  customMeasurementId?: string | null;
}

export interface Cart {
  id: string;
  userId?: string | null;
  sessionId?: string | null;
  items: CartItem[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  couponCode?: string | null;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  variantId: string;
  variantSku: string;
  size: string;
  color?: string | null;
  price: number;
  quantity: number;
  subtotal: number;
  productImageUrl?: string | null;
  customMeasurementId?: string | null;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: Address;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  taxAmount: number;
  totalAmount: number;
  status: OrderStatus;
  paymentMethod: string;
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  paymentReference?: string | null;
  trackingNumber?: string | null;
  courierPartner?: string | null;
  productionStatus?: ProductionStatus;
  priority?: OrderPriority;
  expectedCompletionDate?: string | null;
  assignments?: OrderAssignment[];
  assignmentHistories?: AssignmentHistory[];
  productionHistory?: ProductionStatusHistory[];
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TailorProfile {
  id: string;
  userId: string;
  shopName: string;
  tailorName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  skills?: string | null;
  specializations?: string | null;
  serviceArea?: string | null;
  approvalStatus: TailorApprovalStatus;
  isVerified: boolean;
  isAvailable: boolean;
  maxActiveOrders: number;
  activeOrderCount: number;
  createdAt: string;
  updatedAt: string;
  user?: User;
}

export interface OrderAssignment {
  id: string;
  orderId: string;
  tailorId: string;
  assignedById?: string | null;
  assignmentMethod: AssignmentMethod;
  status: AssignmentStatus;
  rejectionReason?: string | null;
  reassignmentReason?: string | null;
  expectedCompletionDate?: string | null;
  notes?: string | null;
  assignedAt: string;
  acceptedAt?: string | null;
  rejectedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  order?: Order;
  tailor?: TailorProfile;
  assignedBy?: User | null;
}

export interface AssignmentHistory {
  id: string;
  orderId: string;
  previousTailorId?: string | null;
  newTailorId?: string | null;
  changedById?: string | null;
  action: string;
  reason?: string | null;
  createdAt: string;
  changedBy?: User | null;
}

export interface ProductionStatusHistory {
  id: string;
  orderId: string;
  previousStatus?: string | null;
  newStatus: string;
  changedById?: string | null;
  notes?: string | null;
  createdAt: string;
  changedBy?: User | null;
}

export interface CustomMeasurement {
  id: string;
  userId: string;
  studentName: string;
  gender: "BOYS" | "GIRLS";
  chest?: number | null;
  waist?: number | null;
  shoulder?: number | null;
  sleeveLength?: number | null;
  shirtLength?: number | null;
  trouserLength?: number | null;
  hip?: number | null;
  skirtLength?: number | null;
  notes?: string | null;
}

export interface TailoringJob {
  id: string;
  jobCode: string;
  orderId: string;
  orderItemId: string;
  tailorId?: string | null;
  status: TailoringStatus;
  customerMeasurementId: string;
  customerMeasurement?: CustomMeasurement;
  scheduledDate?: string | null;
  completedDate?: string | null;
  tailorNotes?: string | null;
  createdAt: string;
}

export interface SchoolCatalogRequest {
  id: string;
  schoolId?: string | null;
  schoolName: string;
  city: string;
  state: string;
  requesterName: string;
  requesterRole: string;
  requesterEmail: string;
  requesterPhone: string;
  uniformDescription: string;
  referenceImageUrl?: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  adminNotes?: string | null;
  createdAt: string;
}

export interface PlatformSetting {
  id: string;
  key: string;
  value: string;
  description?: string | null;
}

export interface AuditLog {
  id: string;
  userId?: string | null;
  userName?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: string | null;
  ipAddress?: string | null;
  createdAt: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}
