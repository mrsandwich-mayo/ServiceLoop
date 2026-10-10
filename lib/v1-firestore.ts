import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  Timestamp,
  serverTimestamp,
  DocumentData,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  BUSINESS,
  BUSINESS_VERIFICATION,
  CUSTOMER,
  SERVICE,
  APPOINTMENT,
  FOLLOW_UP,
  V1_COLLECTIONS,
  WithDocId,
} from '@/types/v1-firestore';
import { handleFirestoreError, OperationType } from './firestoreErrors';

/**
 * Generic Firestore Data Converter for strongly typed entity operations
 */
function createConverter<T extends DocumentData>(): FirestoreDataConverter<T> {
  return {
    toFirestore(modelObject: T): DocumentData {
      return modelObject;
    },
    fromFirestore(snapshot: QueryDocumentSnapshot): T {
      return snapshot.data() as T;
    },
  };
}

// Typed Collection References
export const businessesCol = collection(
  db,
  V1_COLLECTIONS.BUSINESSES
).withConverter(createConverter<BUSINESS>());

export const verificationsCol = collection(
  db,
  V1_COLLECTIONS.BUSINESS_VERIFICATIONS
).withConverter(createConverter<BUSINESS_VERIFICATION>());

export const customersCol = collection(
  db,
  V1_COLLECTIONS.CUSTOMERS
).withConverter(createConverter<CUSTOMER>());

export const servicesCol = collection(
  db,
  V1_COLLECTIONS.SERVICES
).withConverter(createConverter<SERVICE>());

export const appointmentsCol = collection(
  db,
  V1_COLLECTIONS.APPOINTMENTS
).withConverter(createConverter<APPOINTMENT>());

export const followUpsCol = collection(
  db,
  V1_COLLECTIONS.FOLLOW_UPS
).withConverter(createConverter<FOLLOW_UP>());

// ============================================================================
// 1. BUSINESS ENTITY METHODS
// Primary Document ID is typically the user's Auth UID (ownerId)
// ============================================================================
export async function getBusiness(businessId: string): Promise<BUSINESS | null> {
  const ref = doc(businessesCol, businessId);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

/**
 * Finds the business entity belonging to the authenticated user UID (ownerId)
 */
export async function getBusinessByOwnerId(ownerId: string): Promise<WithDocId<BUSINESS> | null> {
  // 1. Direct document lookup by ownerId (UID)
  const ref = doc(businessesCol, ownerId);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return { id: snap.id, ...snap.data() };
  }

  // 2. Query lookup by ownerId field
  const q = query(businessesCol, where('ownerId', '==', ownerId));
  const querySnap = await getDocs(q);
  if (!querySnap.empty) {
    const docSnap = querySnap.docs[0];
    return { id: docSnap.id, ...docSnap.data() };
  }

  return null;
}

/**
 * Creates a brand new business profile in Firestore with PENDING_VERIFICATION
 */
export async function createBusinessProfile(
  ownerId: string,
  data: {
    businessName: string;
    ownerName: string;
    businessType: string;
    location?: string | null;
    phone?: string | null;
    email?: string | null;
  }
): Promise<void> {
  const ref = doc(db, 'businesses', ownerId);
  const payload = {
    ownerId,
    businessName: data.businessName.trim().slice(0, 100),
    ownerName: data.ownerName.trim().slice(0, 100),
    businessType: data.businessType.trim().slice(0, 100),
    verificationStatus: 'PENDING_VERIFICATION' as const,
    location: data.location ? data.location.trim().slice(0, 120) : null,
    phone: data.phone ? data.phone.trim().slice(0, 50) : null,
    email: data.email ? data.email.trim().slice(0, 120) : null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await setDoc(ref, payload);
}

/**
 * Updates an existing business profile.
 * Restricted: Cannot edit ownerId, verificationStatus, or createdAt.
 */
export async function updateBusinessProfile(
  ownerId: string,
  data: {
    businessName: string;
    ownerName: string;
    businessType: string;
    location?: string | null;
    phone?: string | null;
  }
): Promise<void> {
  const ref = doc(db, 'businesses', ownerId);
  await updateDoc(ref, {
    businessName: data.businessName.trim().slice(0, 100),
    ownerName: data.ownerName.trim().slice(0, 100),
    businessType: data.businessType.trim().slice(0, 100),
    location: data.location ? data.location.trim().slice(0, 120) : null,
    phone: data.phone ? data.phone.trim().slice(0, 50) : null,
    updatedAt: serverTimestamp(),
  });
}

export async function upsertBusiness(
  businessId: string,
  data: Partial<BUSINESS> & { ownerId: string; businessName: string; ownerName: string; businessType: string }
): Promise<void> {
  const ref = doc(businessesCol, businessId);
  const existing = await getDoc(ref);
  const now = Timestamp.now();

  if (existing.exists()) {
    await updateDoc(ref, {
      ...data,
      updatedAt: now,
    });
  } else {
    const payload: BUSINESS = {
      ownerId: data.ownerId,
      businessName: data.businessName,
      ownerName: data.ownerName,
      businessType: data.businessType,
      verificationStatus: data.verificationStatus || 'PENDING_VERIFICATION',
      location: data.location ?? null,
      phone: data.phone ?? null,
      email: data.email ?? null,
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(ref, payload);
  }
}

// ============================================================================
// 2. BUSINESS VERIFICATION ENTITY METHODS
// DocumentReference MUST NEVER contain real sensitive identity information.
// Use masked/safe demo or format-checked IDs.
// ============================================================================
export async function getVerificationByBusiness(
  businessId: string
): Promise<WithDocId<BUSINESS_VERIFICATION> | null> {
  const q = query(
    verificationsCol,
    where('businessId', '==', businessId)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const docSnap = snap.docs[0];
  return { id: docSnap.id, ...docSnap.data() };
}

export async function submitVerification(
  verification: {
    businessId: string;
    documentType: string;
    documentReference: string;
  }
): Promise<string> {
  const now = Timestamp.now();
  const payload: BUSINESS_VERIFICATION = {
    businessId: verification.businessId,
    verificationStatus: 'PENDING',
    documentType: verification.documentType,
    documentReference: verification.documentReference,
    submittedAt: now,
    reviewedBy: null,
    reviewedAt: null,
    rejectionReason: null,
  };

  const docRef = await addDoc(verificationsCol, payload);
  return docRef.id;
}

// ============================================================================
// 3. CUSTOMER ENTITY METHODS (BUSINESS 1 → many CUSTOMER)
// ============================================================================
export async function getCustomers(businessId: string): Promise<WithDocId<CUSTOMER>[]> {
  const path = 'customers';
  try {
    const q = query(
      collection(db, path),
      where('businessId', '==', businessId)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as CUSTOMER) }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function createCustomer(
  customer: {
    businessId: string;
    name: string;
    phone?: string | null;
    email?: string | null;
    notes?: string | null;
  }
): Promise<string> {
  const path = 'customers';
  try {
    const payload = {
      businessId: customer.businessId,
      name: customer.name.trim().slice(0, 100),
      phone: customer.phone ? customer.phone.trim().slice(0, 50) : null,
      email: customer.email ? customer.email.trim().slice(0, 120) : null,
      notes: customer.notes ? customer.notes.trim().slice(0, 1000) : null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const ref = await addDoc(collection(db, path), payload);
    return ref.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateCustomer(
  customerId: string,
  updates: {
    name?: string;
    phone?: string | null;
    email?: string | null;
    notes?: string | null;
  }
): Promise<void> {
  const path = `customers/${customerId}`;
  try {
    const ref = doc(db, 'customers', customerId);
    const cleanUpdates: Record<string, unknown> = {
      updatedAt: serverTimestamp(),
    };
    if (updates.name !== undefined) cleanUpdates.name = updates.name.trim().slice(0, 100);
    if (updates.phone !== undefined) cleanUpdates.phone = updates.phone ? updates.phone.trim().slice(0, 50) : null;
    if (updates.email !== undefined) cleanUpdates.email = updates.email ? updates.email.trim().slice(0, 120) : null;
    if (updates.notes !== undefined) cleanUpdates.notes = updates.notes ? updates.notes.trim().slice(0, 1000) : null;

    await updateDoc(ref, cleanUpdates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteCustomer(customerId: string): Promise<void> {
  const path = `customers/${customerId}`;
  try {
    const ref = doc(db, 'customers', customerId);
    await deleteDoc(ref);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ============================================================================
// 4. SERVICE ENTITY METHODS (BUSINESS 1 → many SERVICE)
// ============================================================================
export async function getServices(businessId: string): Promise<WithDocId<SERVICE>[]> {
  const path = 'services';
  try {
    const q = query(
      collection(db, path),
      where('businessId', '==', businessId)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as SERVICE) }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function createService(
  service: {
    businessId: string;
    serviceName: string;
    description?: string | null;
    durationMinutes?: number | null;
    typicalIntervalDays?: number | null;
    basePrice?: number | null;
    isActive?: boolean;
  }
): Promise<string> {
  const path = 'services';
  try {
    const payload = {
      businessId: service.businessId,
      serviceName: service.serviceName.trim().slice(0, 120),
      description: service.description ? service.description.trim().slice(0, 1000) : null,
      durationMinutes: typeof service.durationMinutes === 'number' && !isNaN(service.durationMinutes) ? service.durationMinutes : null,
      typicalIntervalDays: typeof service.typicalIntervalDays === 'number' && !isNaN(service.typicalIntervalDays) ? service.typicalIntervalDays : null,
      basePrice: typeof service.basePrice === 'number' && !isNaN(service.basePrice) ? service.basePrice : null,
      isActive: service.isActive ?? true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const ref = await addDoc(collection(db, path), payload);
    return ref.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateService(
  serviceId: string,
  updates: {
    serviceName?: string;
    description?: string | null;
    durationMinutes?: number | null;
    typicalIntervalDays?: number | null;
    basePrice?: number | null;
    isActive?: boolean;
  }
): Promise<void> {
  const path = `services/${serviceId}`;
  try {
    const ref = doc(db, 'services', serviceId);
    const cleanUpdates: Record<string, unknown> = {
      updatedAt: serverTimestamp(),
    };
    if (updates.serviceName !== undefined) cleanUpdates.serviceName = updates.serviceName.trim().slice(0, 120);
    if (updates.description !== undefined) cleanUpdates.description = updates.description ? updates.description.trim().slice(0, 1000) : null;
    if (updates.durationMinutes !== undefined) cleanUpdates.durationMinutes = typeof updates.durationMinutes === 'number' && !isNaN(updates.durationMinutes) ? updates.durationMinutes : null;
    if (updates.typicalIntervalDays !== undefined) cleanUpdates.typicalIntervalDays = typeof updates.typicalIntervalDays === 'number' && !isNaN(updates.typicalIntervalDays) ? updates.typicalIntervalDays : null;
    if (updates.basePrice !== undefined) cleanUpdates.basePrice = typeof updates.basePrice === 'number' && !isNaN(updates.basePrice) ? updates.basePrice : null;
    if (updates.isActive !== undefined) cleanUpdates.isActive = Boolean(updates.isActive);

    await updateDoc(ref, cleanUpdates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function toggleServiceActive(serviceId: string, currentStatus: boolean): Promise<void> {
  const path = `services/${serviceId}`;
  try {
    const ref = doc(db, 'services', serviceId);
    await updateDoc(ref, {
      isActive: !currentStatus,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteService(serviceId: string): Promise<void> {
  const path = `services/${serviceId}`;
  try {
    const ref = doc(db, 'services', serviceId);
    await deleteDoc(ref);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ============================================================================
// 5. APPOINTMENT ENTITY METHODS
// BUSINESS 1 → many APPOINTMENT
// CUSTOMER 1 → many APPOINTMENT
// SERVICE 1 → many APPOINTMENT
// ============================================================================
export async function getAppointments(businessId: string): Promise<WithDocId<APPOINTMENT>[]> {
  const path = 'appointments';
  try {
    const q = query(
      appointmentsCol,
      where('businessId', '==', businessId)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function getAppointmentsByCustomer(
  businessId: string,
  customerId: string
): Promise<WithDocId<APPOINTMENT>[]> {
  const path = 'appointments';
  try {
    const q = query(
      appointmentsCol,
      where('businessId', '==', businessId),
      where('customerId', '==', customerId)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function getAppointmentsByService(
  businessId: string,
  serviceId: string
): Promise<WithDocId<APPOINTMENT>[]> {
  const path = 'appointments';
  try {
    const q = query(
      appointmentsCol,
      where('businessId', '==', businessId),
      where('serviceId', '==', serviceId)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function createAppointment(
  appointment: {
    businessId: string;
    customerId: string;
    serviceId: string;
    appointmentDate: string;
    appointmentTime: string;
    endTime?: string | null;
    status?: APPOINTMENT['status'];
    notes?: string | null;
  }
): Promise<string> {
  const path = 'appointments';
  try {
    const payload = {
      businessId: appointment.businessId,
      customerId: appointment.customerId,
      serviceId: appointment.serviceId,
      appointmentDate: appointment.appointmentDate,
      appointmentTime: appointment.appointmentTime,
      endTime: appointment.endTime ? appointment.endTime.trim().slice(0, 20) : null,
      status: appointment.status ?? 'SCHEDULED',
      notes: appointment.notes ? appointment.notes.trim().slice(0, 1000) : null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const ref = await addDoc(appointmentsCol, payload);
    return ref.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateAppointment(
  appointmentId: string,
  updates: {
    customerId?: string;
    serviceId?: string;
    appointmentDate?: string;
    appointmentTime?: string;
    endTime?: string | null;
    status?: APPOINTMENT['status'];
    notes?: string | null;
  }
): Promise<void> {
  const path = `appointments/${appointmentId}`;
  try {
    const ref = doc(appointmentsCol, appointmentId);
    const cleanUpdates: Record<string, unknown> = {
      updatedAt: serverTimestamp(),
    };
    if (updates.customerId !== undefined) cleanUpdates.customerId = updates.customerId;
    if (updates.serviceId !== undefined) cleanUpdates.serviceId = updates.serviceId;
    if (updates.appointmentDate !== undefined) cleanUpdates.appointmentDate = updates.appointmentDate;
    if (updates.appointmentTime !== undefined) cleanUpdates.appointmentTime = updates.appointmentTime;
    if (updates.endTime !== undefined) cleanUpdates.endTime = updates.endTime ? updates.endTime.trim().slice(0, 20) : null;
    if (updates.status !== undefined) cleanUpdates.status = updates.status;
    if (updates.notes !== undefined) cleanUpdates.notes = updates.notes ? updates.notes.trim().slice(0, 1000) : null;

    await updateDoc(ref, cleanUpdates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteAppointment(appointmentId: string): Promise<void> {
  const path = `appointments/${appointmentId}`;
  try {
    const ref = doc(appointmentsCol, appointmentId);
    await deleteDoc(ref);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ============================================================================
// 6. FOLLOW_UP ENTITY METHODS
// BUSINESS 1 → many FOLLOW_UP
// CUSTOMER 1 → many FOLLOW_UP
// APPOINTMENT 1 → many FOLLOW_UP
// ============================================================================
export async function getFollowUps(businessId: string): Promise<WithDocId<FOLLOW_UP>[]> {
  const path = 'follow_ups';
  try {
    const q = query(
      followUpsCol,
      where('businessId', '==', businessId)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function getFollowUpsByCustomer(
  businessId: string,
  customerId: string
): Promise<WithDocId<FOLLOW_UP>[]> {
  const path = 'follow_ups';
  try {
    const q = query(
      followUpsCol,
      where('businessId', '==', businessId),
      where('customerId', '==', customerId)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function getFollowUpsByAppointment(
  businessId: string,
  appointmentId: string
): Promise<WithDocId<FOLLOW_UP>[]> {
  const path = 'follow_ups';
  try {
    const q = query(
      followUpsCol,
      where('businessId', '==', businessId),
      where('appointmentId', '==', appointmentId)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function createFollowUp(
  followUp: {
    businessId: string;
    customerId: string;
    appointmentId: string;
    scheduledDate: string;
    status?: FOLLOW_UP['status'];
    notes?: string | null;
  }
): Promise<string> {
  const path = 'follow_ups';
  try {
    const payload = {
      businessId: followUp.businessId,
      customerId: followUp.customerId,
      appointmentId: followUp.appointmentId,
      scheduledDate: followUp.scheduledDate,
      status: followUp.status ?? 'PENDING',
      notes: followUp.notes ? followUp.notes.trim().slice(0, 1000) : null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const ref = await addDoc(followUpsCol, payload);
    return ref.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateFollowUp(
  followUpId: string,
  updates: {
    scheduledDate?: string;
    status?: FOLLOW_UP['status'];
    notes?: string | null;
    customerId?: string;
    appointmentId?: string;
  }
): Promise<void> {
  const path = `follow_ups/${followUpId}`;
  try {
    const ref = doc(followUpsCol, followUpId);
    const cleanUpdates: Record<string, unknown> = {
      updatedAt: serverTimestamp(),
    };
    if (updates.scheduledDate !== undefined) cleanUpdates.scheduledDate = updates.scheduledDate;
    if (updates.status !== undefined) cleanUpdates.status = updates.status;
    if (updates.notes !== undefined) cleanUpdates.notes = updates.notes ? updates.notes.trim().slice(0, 1000) : null;
    if (updates.customerId !== undefined) cleanUpdates.customerId = updates.customerId;
    if (updates.appointmentId !== undefined) cleanUpdates.appointmentId = updates.appointmentId;

    await updateDoc(ref, cleanUpdates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteFollowUp(followUpId: string): Promise<void> {
  const path = `follow_ups/${followUpId}`;
  try {
    const ref = doc(followUpsCol, followUpId);
    await deleteDoc(ref);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
