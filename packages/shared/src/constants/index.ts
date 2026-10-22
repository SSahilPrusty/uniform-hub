export const APP_NAME = "UNIFORM HUB";
export const APP_TAGLINE = "Your School. Your Uniform. One Hub.";
export const CURRENCY = "INR";
export const CURRENCY_SYMBOL = "₹";

export const USER_ROLES = {
  CUSTOMER: "CUSTOMER",
  SCHOOL_ADMIN: "SCHOOL_ADMIN",
  FRANCHISE_ADMIN: "FRANCHISE_ADMIN",
  TAILOR: "TAILOR",
  ADMIN: "ADMIN",
  SUPER_ADMIN: "SUPER_ADMIN",
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const ORDER_STATUS = {
  PENDING: "PENDING",
  PAYMENT_PENDING: "PAYMENT_PENDING",
  CONFIRMED: "CONFIRMED",
  PROCESSING: "PROCESSING",
  READY_FOR_DISPATCH: "READY_FOR_DISPATCH",
  SHIPPED: "SHIPPED",
  OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
  RETURN_REQUESTED: "RETURN_REQUESTED",
  RETURNED: "RETURNED",
  REFUNDED: "REFUNDED",
} as const;

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

export const TAILORING_STATUS = {
  NEW: "NEW",
  ASSIGNED: "ASSIGNED",
  ACCEPTED: "ACCEPTED",
  MEASUREMENTS_REQUIRED: "MEASUREMENTS_REQUIRED",
  IN_PROGRESS: "IN_PROGRESS",
  QUALITY_CHECK: "QUALITY_CHECK",
  READY: "READY",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;

export type TailoringStatus = (typeof TAILORING_STATUS)[keyof typeof TAILORING_STATUS];

export const PRODUCTION_STATUS = {
  PENDING: "PENDING",
  AWAITING_TAILOR_ASSIGNMENT: "AWAITING_TAILOR_ASSIGNMENT",
  ASSIGNED: "ASSIGNED",
  ACCEPTED: "ACCEPTED",
  IN_PROGRESS: "IN_PROGRESS",
  QUALITY_CHECK: "QUALITY_CHECK",
  READY_FOR_DISPATCH: "READY_FOR_DISPATCH",
  DISPATCHED: "DISPATCHED",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
} as const;

export type ProductionStatus = (typeof PRODUCTION_STATUS)[keyof typeof PRODUCTION_STATUS];

export const ASSIGNMENT_STATUS = {
  ASSIGNED: "ASSIGNED",
  ACCEPTED: "ACCEPTED",
  REJECTED: "REJECTED",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;

export type AssignmentStatus = (typeof ASSIGNMENT_STATUS)[keyof typeof ASSIGNMENT_STATUS];

export const ASSIGNMENT_METHOD = {
  AUTOMATIC: "AUTOMATIC",
  MANUAL: "MANUAL",
} as const;

export type AssignmentMethod = (typeof ASSIGNMENT_METHOD)[keyof typeof ASSIGNMENT_METHOD];

export const ORDER_PRIORITY = {
  LOW: "LOW",
  NORMAL: "NORMAL",
  HIGH: "HIGH",
  URGENT: "URGENT",
} as const;

export type OrderPriority = (typeof ORDER_PRIORITY)[keyof typeof ORDER_PRIORITY];

export const TAILOR_APPROVAL_STATUS = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;

export type TailorApprovalStatus = (typeof TAILOR_APPROVAL_STATUS)[keyof typeof TAILOR_APPROVAL_STATUS];

export const PRODUCT_STATUS = {
  DRAFT: "DRAFT",
  PENDING_APPROVAL: "PENDING_APPROVAL",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  INACTIVE: "INACTIVE",
} as const;

export type ProductStatus = (typeof PRODUCT_STATUS)[keyof typeof PRODUCT_STATUS];

export const DEFAULT_CATEGORIES = [
  { name: "School Uniforms", slug: "school-uniforms", icon: "GraduationCap" },
  { name: "College Uniforms", slug: "college-uniforms", icon: "BookOpen" },
  { name: "Sports Uniforms", slug: "sports-uniforms", icon: "Activity" },
  { name: "Shirts", slug: "shirts", icon: "Shirt" },
  { name: "Trousers", slug: "trousers", icon: "Scissors" },
  { name: "Skirts", slug: "skirts", icon: "Layers" },
  { name: "T-shirts", slug: "t-shirts", icon: "Sparkles" },
  { name: "Track Suits", slug: "track-suits", icon: "Flame" },
  { name: "Blazers", slug: "blazers", icon: "Award" },
  { name: "Sweaters", slug: "sweaters", icon: "CloudRain" },
  { name: "Shoes", slug: "shoes", icon: "Footprints" },
  { name: "Socks", slug: "socks", icon: "Box" },
  { name: "Belts", slug: "belts", icon: "Circle" },
  { name: "Ties", slug: "ties", icon: "Bookmark" },
  { name: "School Bags", slug: "school-bags", icon: "Briefcase" },
  { name: "Uniform Accessories", slug: "uniform-accessories", icon: "CheckCircle" },
] as const;

export const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
] as const;
