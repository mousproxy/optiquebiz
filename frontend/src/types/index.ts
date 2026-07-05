// =====================================================
// TYPES GLOBAUX - OptiGest
// =====================================================

export type UserRole =
  | 'admin'
  | 'manager'
  | 'optician'
  | 'ophthalmologist'
  | 'secretary'
  | 'seller'
  | 'cashier'
  | 'commercial';

export type Gender = 'M' | 'F' | 'Autre';
export type AppointmentStatus = 'scheduled' | 'confirmed' | 'present' | 'in_progress' | 'completed' | 'absent' | 'cancelled' | 'rescheduled';
export type SaleStatus = 'draft' | 'pending' | 'completed' | 'cancelled' | 'refunded' | 'partial';
export type PaymentMethod = 'cash' | 'card' | 'orange_money' | 'mtn_money' | 'moov_money' | 'transfer' | 'check' | 'mixed';
export type ProductCategory = 'frame' | 'lens' | 'contact_lens' | 'accessory' | 'service';
export type OrderStatus = 'draft' | 'sent' | 'confirmed' | 'partial' | 'received' | 'cancelled';
export type MovementType = 'in' | 'out' | 'adjustment' | 'transfer' | 'return';
export type CampaignType = 'sms' | 'email' | 'whatsapp';

// =====================================================
// USER
// =====================================================

export interface User {
  id: string;
  email: string;
  username?: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  phone?: string;
  avatarUrl?: string;
  mustChangePassword?: boolean;
  company?: Company;
  warehouse?: Warehouse;
}

export interface Company {
  id: string;
  name: string;
  currency?: string;
  logoUrl?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  taxRate?: number;
  invoicePrefix?: string;
}

export interface Warehouse {
  id: string;
  name: string;
  code?: string;
}

// =====================================================
// PATIENT
// =====================================================

export interface Patient {
  id: string;
  code: string;
  firstName: string;
  lastName: string;
  gender?: Gender;
  dateOfBirth?: string;
  age?: number;
  profession?: string;
  address?: string;
  city?: string;
  phone: string;
  phone2?: string;
  email?: string;
  bloodGroup?: string;
  allergies?: string;
  insuranceName?: string;
  insuranceNumber?: string;
  mutualName?: string;
  mutualNumber?: string;
  mutualRate?: number;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  photoUrl?: string;
  observations?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    consultations: number;
    prescriptions: number;
    sales: number;
    appointments: number;
  };
}

// =====================================================
// APPOINTMENT
// =====================================================

export interface Appointment {
  id: string;
  patientId: string;
  doctorId?: string;
  opticianId?: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  duration: number;
  reason?: string;
  room?: string;
  status: AppointmentStatus;
  notes?: string;
  isFirstVisit?: boolean;
  patient?: { id: string; firstName: string; lastName: string; phone: string; photoUrl?: string };
  doctor?: { id: string; firstName: string; lastName: string };
  optician?: { id: string; firstName: string; lastName: string };
}

// =====================================================
// CONSULTATION
// =====================================================

export interface Consultation {
  id: string;
  patientId: string;
  doctorId?: string;
  appointmentId?: string;
  consultationDate: string;
  vaOdSc?: string;
  vaOdCc?: string;
  vaOgSc?: string;
  vaOgCc?: string;
  odSph?: number;
  odCyl?: number;
  odAxe?: number;
  odAdd?: number;
  odPrism?: number;
  ogSph?: number;
  ogCyl?: number;
  ogAxe?: number;
  ogAdd?: number;
  ogPrism?: number;
  iopOd?: number;
  iopOg?: number;
  fundusOd?: string;
  fundusOg?: string;
  diagnosis?: string;
  treatment?: string;
  comments?: string;
  signatureUrl?: string;
  patient?: Pick<Patient, 'firstName' | 'lastName' | 'phone'>;
  doctor?: { firstName: string; lastName: string };
}

// =====================================================
// PRESCRIPTION
// =====================================================

export interface Prescription {
  id: string;
  reference: string;
  patientId: string;
  consultationId?: string;
  doctorId?: string;
  prescriptionDate: string;
  odSph?: number;
  odCyl?: number;
  odAxe?: number;
  odAdd?: number;
  ogSph?: number;
  ogCyl?: number;
  ogAxe?: number;
  ogAdd?: number;
  pupillaryDistanceOd?: number;
  pupillaryDistanceOg?: number;
  pupillaryDistanceTotal?: number;
  nearPupillaryDistance?: number;
  heightOd?: number;
  heightOg?: number;
  isProgressive?: boolean;
  distanceVision?: boolean;
  nearVision?: boolean;
  comments?: string;
  validityMonths?: number;
  expiryDate?: string;
  qrCode?: string;
  isPrinted?: boolean;
  isUsed?: boolean;
  patient?: Pick<Patient, 'firstName' | 'lastName' | 'phone'>;
  doctor?: { firstName: string; lastName: string };
}

// =====================================================
// PRODUCTS
// =====================================================

export interface Frame {
  id: string;
  brandId?: string;
  reference: string;
  barcode?: string;
  name?: string;
  collection?: string;
  color?: string;
  material?: string;
  gender?: string;
  ageGroup?: string;
  purchasePrice: number;
  salePrice: number;
  marginPercent?: number;
  stockQuantity: number;
  minStock: number;
  photoUrl?: string;
  isActive: boolean;
  brand?: { id: string; name: string };
}

export interface Lens {
  id: string;
  brandId?: string;
  reference: string;
  name: string;
  lensType: string;
  material?: string;
  indexValue?: number;
  treatment?: string;
  coating?: string;
  purchasePrice: number;
  salePrice: number;
  stockQuantity: number;
  minStock: number;
  isActive: boolean;
  brand?: { name: string };
}

export interface ContactLens {
  id: string;
  brandId?: string;
  name: string;
  lensSubtype?: string;
  replacementFrequency?: string;
  correctionType?: string;
  sphere?: number;
  purchasePrice: number;
  salePrice: number;
  stockQuantity: number;
  minStock: number;
  isActive: boolean;
  brand?: { name: string };
}

export interface Accessory {
  id: string;
  reference?: string;
  barcode?: string;
  name: string;
  category?: string;
  brandName?: string;
  purchasePrice: number;
  salePrice: number;
  stockQuantity: number;
  minStock: number;
  isActive: boolean;
}

// =====================================================
// SALE
// =====================================================

export interface SaleItem {
  id?: string;
  lineNumber?: number;
  productType: ProductCategory;
  productId: string;
  productName: string;
  productRef?: string;
  eye?: 'OD' | 'OG' | 'OD+OG';
  quantity: number;
  unitPrice: number;
  discountPercent?: number;
  discountAmount?: number;
  taxRate?: number;
  taxAmount?: number;
  totalPrice: number;
  notes?: string;
}

export interface Payment {
  id?: string;
  amount: number;
  method: PaymentMethod;
  transactionRef?: string;
  notes?: string;
  paymentDate?: string;
}

export interface Sale {
  id: string;
  reference: string;
  saleType?: string;
  patientId?: string;
  prescriptionId?: string;
  sellerId?: string;
  cashierId?: string;
  saleDate: string;
  subtotal: number;
  discountPercent?: number;
  discountAmount?: number;
  taxRate?: number;
  taxAmount?: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: SaleStatus;
  isReady?: boolean;
  readyDate?: string;
  notes?: string;
  saleItems?: SaleItem[];
  payments?: Payment[];
  patient?: Pick<Patient, 'firstName' | 'lastName' | 'phone'>;
  seller?: { firstName: string; lastName: string };
  prescription?: Prescription;
}

// =====================================================
// SUPPLIER & PURCHASES
// =====================================================

export interface Supplier {
  id: string;
  code: string;
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  country?: string;
  paymentTerms?: number;
  isActive: boolean;
  _count?: { purchase_orders: number };
}

export interface PurchaseOrder {
  id: string;
  reference: string;
  supplierId: string;
  orderDate: string;
  expectedDate?: string;
  status: OrderStatus;
  totalAmount: number;
  paidAmount?: number;
  remainingAmount?: number;
  notes?: string;
  supplier?: Pick<Supplier, 'name' | 'phone'>;
  items?: PurchaseOrderItem[];
}

export interface PurchaseOrderItem {
  id?: string;
  productType: ProductCategory;
  productId?: string;
  productName: string;
  productRef?: string;
  quantityOrdered: number;
  quantityReceived?: number;
  unitPrice: number;
  totalPrice: number;
}

// =====================================================
// DASHBOARD
// =====================================================

export interface DashboardStats {
  todayRevenue: number;
  todaySalesCount: number;
  monthRevenue: number;
  monthSalesCount: number;
  todayAppointments: number;
  totalPatients: number;
  newPrescriptions: number;
  pendingOrders: number;
  stockAlerts: number;
  readyToPickup: number;
  pendingPaymentsAmount: number;
  pendingPaymentsCount: number;
}

export interface ChartData {
  date: string;
  revenue: number;
  count: number;
}

// =====================================================
// PAGINATION
// =====================================================

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// =====================================================
// FORMS
// =====================================================

export type FormMode = 'create' | 'edit' | 'view';

export interface SelectOption {
  value: string;
  label: string;
}

// =====================================================
// NOTIFICATIONS
// =====================================================

export interface Notification {
  id: string;
  title: string;
  message?: string;
  notificationType: 'info' | 'success' | 'warning' | 'error';
  relatedType?: string;
  relatedId?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}
