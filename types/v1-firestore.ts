import { Timestamp, FieldValue } from 'firebase/firestore';

/**
 * ============================================================================
 * ServiceLoop V1 - Primary Database Architecture (Cloud Firestore)
 * ============================================================================
 * Strongly typed TypeScript models for the 6 core entities:
 * 1. BUSINESS
 * 2. BUSINESS_VERIFICATION
 * 3. CUSTOMER
 * 4. SERVICE
 * 5. APPOINTMENT
 * 6. FOLLOW_UP
 *
 * Relationships:
 * - BUSINESS 1 → many CUSTOMER
 * - BUSINESS 1 → many SERVICE
 * - BUSINESS 1 → many APPOINTMENT
 * - BUSINESS 1 → many FOLLOW_UP
 * - BUSINESS → BUSINESS_VERIFICATION
 * - CUSTOMER 1 → many APPOINTMENT
 * - SERVICE 1 → many APPOINTMENT
 * - CUSTOMER 1 → many FOLLOW_UP
 * - APPOINTMENT 1 → many FOLLOW_UP
 *
 * All relationships are represented by string IDs.
 * Every business-owned document contains `businessId`.
 * ============================================================================
 */

// ----------------------------------------------------------------------------
// 1. BUSINESS
// Top-level collection: "businesses"
// Document ID convention: ownerId (Firebase Auth UID)
// ----------------------------------------------------------------------------
export type BusinessVerificationStatus =
  | 'PENDING_VERIFICATION'
  | 'VERIFIED'
  | 'REJECTED'
  | 'SUSPENDED';

export interface BUSINESS {
  ownerId: string;
  businessName: string;
  ownerName: string;
  businessType: string;
  verificationStatus: BusinessVerificationStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  // Optional profile metadata for tenant context
  location?: string | null;
  phone?: string | null;
  email?: string | null;
}

// ----------------------------------------------------------------------------
// 2. BUSINESS_VERIFICATION
// Top-level collection: "business_verifications"
// Document ID convention: auto-generated or businessId
// NOTE: Sensitive government identity information (like raw Aadhaar) is strictly
// forbidden. Safe / masked reference identifiers only.
// ----------------------------------------------------------------------------
export type VerificationDocumentStatus =
  | 'PENDING'
  | 'VERIFIED'
  | 'REJECTED';

export interface BUSINESS_VERIFICATION {
  businessId: string;
  verificationStatus: VerificationDocumentStatus;
  documentType: string;
  documentReference: string; // Safe/masked identifier (e.g. "GSTIN-XX***1234")
  submittedAt: Timestamp;
  reviewedBy: string | null;
  reviewedAt: Timestamp | null;
  rejectionReason: string | null;
}

// ----------------------------------------------------------------------------
// 3. CUSTOMER
// Top-level collection: "customers"
// ----------------------------------------------------------------------------
export interface CUSTOMER {
  businessId: string;
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ----------------------------------------------------------------------------
// 4. SERVICE
// Top-level collection: "services"
// ----------------------------------------------------------------------------
export interface SERVICE {
  businessId: string;
  serviceName: string;
  description: string | null;
  durationMinutes: number | null;
  typicalIntervalDays: number | null;
  basePrice: number | null;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ----------------------------------------------------------------------------
// 5. APPOINTMENT
// Top-level collection: "appointments"
// ----------------------------------------------------------------------------
export type AppointmentStatus =
  | 'SCHEDULED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

export interface APPOINTMENT {
  businessId: string;
  customerId: string;
  serviceId: string;
  appointmentDate: string; // ISO Date YYYY-MM-DD
  appointmentTime: string; // 24h format HH:mm
  endTime: string | null;
  status: AppointmentStatus;
  notes: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ----------------------------------------------------------------------------
// 6. FOLLOW_UP
// Top-level collection: "follow_ups"
// ----------------------------------------------------------------------------
export type FollowUpStatus =
  | 'PENDING'
  | 'COMPLETED'
  | 'CANCELLED';

export interface FOLLOW_UP {
  businessId: string;
  customerId: string;
  appointmentId: string;
  scheduledDate: string; // ISO Date YYYY-MM-DD
  status: FollowUpStatus;
  notes: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ----------------------------------------------------------------------------
// Collection Constants & Helper Types
// ----------------------------------------------------------------------------
export const V1_COLLECTIONS = {
  BUSINESSES: 'businesses',
  BUSINESS_VERIFICATIONS: 'business_verifications',
  CUSTOMERS: 'customers',
  SERVICES: 'services',
  APPOINTMENTS: 'appointments',
  FOLLOW_UPS: 'follow_ups',
} as const;

export type V1CollectionName = (typeof V1_COLLECTIONS)[keyof typeof V1_COLLECTIONS];

export type WithDocId<T> = T & { id: string };

export type CreateV1Input<T> = Omit<T, 'createdAt' | 'updatedAt'> & {
  createdAt?: Timestamp | FieldValue;
  updatedAt?: Timestamp | FieldValue;
};
