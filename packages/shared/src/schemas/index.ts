import { z } from "zod";

export const RegisterSchema = z.object({
  name: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional().or(z.literal("")),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
  role: z.enum(["CUSTOMER", "SCHOOL_ADMIN", "FRANCHISE_ADMIN", "TAILOR"]).optional().default("CUSTOMER"),
  shopName: z.string().optional(),
  specializations: z.string().optional(),
  skills: z.string().optional(),
  experience: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  documentsUrl: z.string().optional(),
}).passthrough().refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const AddressSchema = z.object({
  name: z.string().min(2, "Full name is required"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  addressLine1: z.string().min(5, "Address line 1 is required"),
  addressLine2: z.string().optional().or(z.literal("")),
  city: z.string().min(2, "City is required"),
  district: z.string().optional().or(z.literal("")),
  state: z.string().min(2, "State is required"),
  pincode: z.string().regex(/^\d{6}$/, "Pincode must be exactly 6 digits"),
  isDefault: z.boolean().optional().default(false),
});

export const AddToCartSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  variantId: z.string().min(1, "Variant ID is required"),
  quantity: z.number().int().positive().default(1),
  customMeasurementId: z.string().optional().nullable(),
});

export const UpdateCartItemSchema = z.object({
  quantity: z.number().int().positive(),
});

export const CheckoutSchema = z.object({
  addressId: z.string().optional(),
  newAddress: AddressSchema.optional(),
  paymentMethod: z.enum(["TEST_GATEWAY", "ONLINE", "COD"]).default("TEST_GATEWAY"),
  couponCode: z.string().optional(),
  customerNotes: z.string().optional(),
});

export const CustomMeasurementSchema = z.object({
  studentName: z.string().min(2, "Student name is required"),
  gender: z.enum(["BOYS", "GIRLS"]),
  chest: z.number().positive().optional().nullable(),
  waist: z.number().positive().optional().nullable(),
  shoulder: z.number().positive().optional().nullable(),
  sleeveLength: z.number().positive().optional().nullable(),
  shirtLength: z.number().positive().optional().nullable(),
  trouserLength: z.number().positive().optional().nullable(),
  hip: z.number().positive().optional().nullable(),
  skirtLength: z.number().positive().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const SchoolCatalogRequestSchema = z.object({
  schoolName: z.string().min(3, "School name is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  requesterName: z.string().min(2, "Your name is required"),
  requesterRole: z.string().min(2, "Role/Designation is required"),
  requesterEmail: z.string().email("Valid email required"),
  requesterPhone: z.string().min(10, "Phone number required"),
  uniformDescription: z.string().min(10, "Please describe the uniform details"),
  referenceImageUrl: z.string().optional().nullable(),
});

export const ProductImageAssignmentSchema = z.object({
  productId: z.string().min(1, "Product ID required"),
  url: z.string().min(1, "Image URL or path required"),
  altText: z.string().optional().nullable(),
  sortOrder: z.number().int().optional().default(0),
  isPrimary: z.boolean().optional().default(false),
  schoolId: z.string().optional().nullable(),
});

export const AssignTailorSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
  tailorId: z.string().min(1, "Tailor ID is required"),
  expectedCompletionDate: z.string().optional().nullable(),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).optional().default("NORMAL"),
  notes: z.string().optional().nullable(),
});

export const ReassignTailorSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
  newTailorId: z.string().min(1, "New Tailor ID is required"),
  reason: z.string().min(3, "Reason for reassignment is required (at least 3 characters)"),
  expectedCompletionDate: z.string().optional().nullable(),
});

export const RejectAssignmentSchema = z.object({
  reason: z.string().min(3, "Rejection reason is required (at least 3 characters)"),
});

export const UpdateProductionStatusSchema = z.object({
  newStatus: z.enum([
    "AWAITING_TAILOR_ASSIGNMENT",
    "ASSIGNED",
    "ACCEPTED",
    "IN_PROGRESS",
    "QUALITY_CHECK",
    "COMPLETED_BY_TAILOR",
    "RETURNED_FOR_CORRECTION",
    "AWAITING_FRANCHISE_ASSIGNMENT",
    "ASSIGNED_TO_FRANCHISE",
    "PACKAGE_PREPARED",
    "READY_FOR_DISPATCH",
    "DISPATCHED",
    "DELIVERED",
    "CANCELLED",
  ]),
  notes: z.string().optional().nullable(),
});

export const UpdateTailorAvailabilitySchema = z.object({
  isAvailable: z.boolean(),
  maxActiveOrders: z.number().int().min(1).max(100).optional(),
});

export const UpdateOrderPrioritySchema = z.object({
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]),
  expectedCompletionDate: z.string().optional().nullable(),
});

export const TailorCompleteOrderSchema = z.object({
  completionNotes: z.string().optional().nullable(),
});

export const VerifyCompletedOrderSchema = z.object({
  notes: z.string().optional().nullable(),
});

export const ReturnForCorrectionSchema = z.object({
  reason: z.string().min(5, "A detailed correction reason is required (at least 5 characters)"),
});

export const AssignFranchiseSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
  franchiseId: z.string().min(1, "Franchise ID is required"),
  notes: z.string().optional().nullable(),
});

export const FranchiseDispatchSchema = z.object({
  courierPartner: z.string().min(2, "Courier or logistics provider is required"),
  trackingNumber: z.string().min(3, "Tracking ID / Waybill number is required"),
  dispatchDate: z.string().min(4, "Dispatch date is required"),
  trackingUrl: z.string().url("Invalid URL format").optional().or(z.literal("")).nullable(),
  shippingNotes: z.string().optional().nullable(),
  packageReference: z.string().optional().nullable(),
});

export const UpdateTrackingInfoSchema = z.object({
  courierPartner: z.string().min(2, "Courier name required"),
  trackingNumber: z.string().min(3, "Tracking ID required"),
  trackingUrl: z.string().url("Invalid URL format").optional().or(z.literal("")).nullable(),
  shippingNotes: z.string().optional().nullable(),
  updateReason: z.string().min(3, "Reason for updating tracking information is required"),
});

export const ConfirmDeliverySchema = z.object({
  deliveryNotes: z.string().optional().nullable(),
});
