'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Logo } from '@/components/Logo';
import Link from 'next/link';
import { 
  LogOut, 
  Plus, 
  Users, 
  CheckCircle2, 
  Clock, 
  IndianRupee, 
  Trash2, 
  Search, 
  X, 
  Phone, 
  Mail, 
  Calendar, 
  MessageSquare, 
  Briefcase, 
  ShieldCheck, 
  Settings, 
  Sparkles, 
  Pencil,
  CalendarCheck,
  CalendarDays,
  AlertCircle
} from 'lucide-react';
import { doc, onSnapshot, updateDoc, serverTimestamp, collection, query, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { handleFirestoreError, OperationType } from '@/lib/firestoreErrors';
import { Business, Customer, TaskItem, InvoiceItem } from '@/types/business';
import { 
  CUSTOMER, 
  SERVICE, 
  APPOINTMENT, 
  AppointmentStatus, 
  FOLLOW_UP, 
  FollowUpStatus, 
  WithDocId 
} from '@/types/v1-firestore';
import { 
  createCustomer, 
  updateCustomer, 
  deleteCustomer, 
  createService, 
  updateService, 
  deleteService, 
  toggleServiceActive,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  createFollowUp,
  updateFollowUp,
  deleteFollowUp
} from '@/lib/v1-firestore';
import { motion, AnimatePresence } from 'motion/react';
import { ALL_BUSINESS_TYPES } from '@/lib/businessCategories';

export type CustomerRecord = WithDocId<CUSTOMER> & {
  company?: string | null;
  status?: string | null;
  totalValue?: number | null;
  ownerId?: string;
};

export type ServiceRecord = WithDocId<SERVICE>;

// Sample demo datasets loaded exclusively for 1-click Demo mode
const DEMO_SERVICES: ServiceRecord[] = [
  {
    id: 'demo_s1',
    businessId: 'demo_user_serviceloop',
    serviceName: 'Comprehensive Commercial AC Service & Gas Top-up',
    description: 'Complete coil deep chemical cleaning, suction pressure testing, filter sterilization, and R410a gas charge.',
    durationMinutes: 90,
    typicalIntervalDays: 90,
    basePrice: 2800,
    isActive: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  },
  {
    id: 'demo_s2',
    businessId: 'demo_user_serviceloop',
    serviceName: '3-Phase Commercial Distribution Board Overhaul',
    description: 'Copper busbar tightening, MCB & RCCB trip threshold testing, balance load distribution analysis, and safety earthing test.',
    durationMinutes: 180,
    typicalIntervalDays: 180,
    basePrice: 6500,
    isActive: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  },
  {
    id: 'demo_s3',
    businessId: 'demo_user_serviceloop',
    serviceName: 'Emergency Electrical Short-Circuit Diagnosis',
    description: 'Thermal imaging scan of conduit runs, megger insulation resistance check, and immediate safety circuit reinstatement.',
    durationMinutes: 60,
    typicalIntervalDays: null,
    basePrice: 1500,
    isActive: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  },
  {
    id: 'demo_s4',
    businessId: 'demo_user_serviceloop',
    serviceName: 'Inverter & Battery Backup Preventative Health Check',
    description: 'Specific gravity electrolyte check, distilled water top-up, terminal desulfation, and transfer switch cutover testing.',
    durationMinutes: 45,
    typicalIntervalDays: 120,
    basePrice: 1200,
    isActive: false,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  },
];

// Sample demo datasets loaded exclusively for 1-click Demo mode
const DEMO_CUSTOMERS: Customer[] = [
  {
    id: 'demo_c1',
    ownerId: 'demo_user_serviceloop',
    name: 'Rajesh Sharma',
    company: 'Sharma Residency & Commercial',
    email: 'rajesh.sharma@example.in',
    phone: '+91 98201 45678',
    status: 'active',
    totalValue: 38500,
    notes: 'Commercial meter panel upgrade and annual AC maintenance contract.',
    createdAt: '2026-09-15',
  },
  {
    id: 'demo_c2',
    ownerId: 'demo_user_serviceloop',
    name: 'Pooja Verma',
    company: 'Verma Tech Hub',
    email: 'pooja@vermatech.in',
    phone: '+91 98765 23456',
    status: 'active',
    totalValue: 24000,
    notes: 'Three server room AC units requiring seasonal gas refilling and filter check.',
    createdAt: '2026-09-22',
  },
  {
    id: 'demo_c3',
    ownerId: 'demo_user_serviceloop',
    name: 'Dr. Suresh Mehta',
    company: 'Mehta Dental & Care Clinic',
    email: 'dr.mehta@dentalcare.in',
    phone: '+91 98111 89012',
    status: 'lead',
    totalValue: 12500,
    notes: 'Requested estimate for complete backup inverter wiring setup.',
    createdAt: '2026-10-01',
  },
];

const DEMO_APPOINTMENTS: WithDocId<APPOINTMENT>[] = [
  {
    id: 'demo_apt1',
    businessId: 'demo_user_serviceloop',
    customerId: 'demo_c1',
    serviceId: 'demo_s1',
    appointmentDate: '2026-10-12',
    appointmentTime: '10:00',
    endTime: '11:30',
    status: 'SCHEDULED',
    notes: 'Commercial distribution overhaul and power load test',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  },
  {
    id: 'demo_apt2',
    businessId: 'demo_user_serviceloop',
    customerId: 'demo_c2',
    serviceId: 'demo_s2',
    appointmentDate: '2026-10-14',
    appointmentTime: '14:30',
    endTime: '16:00',
    status: 'SCHEDULED',
    notes: 'Server room HVAC air flow and ducting check',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  },
  {
    id: 'demo_apt3',
    businessId: 'demo_user_serviceloop',
    customerId: 'demo_c3',
    serviceId: 'demo_s3',
    appointmentDate: '2026-10-06',
    appointmentTime: '09:00',
    endTime: '10:30',
    status: 'COMPLETED',
    notes: 'Conduit inspection and emergency safety isolator installation',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  },
];

const DEMO_V1_FOLLOWUPS: WithDocId<FOLLOW_UP>[] = [
  {
    id: 'demo_f1',
    businessId: 'demo_user_serviceloop',
    customerId: 'demo_c3',
    appointmentId: 'demo_apt3',
    scheduledDate: '2026-10-15',
    status: 'PENDING',
    notes: 'Follow-up inspection after emergency safety isolator installation',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  },
  {
    id: 'demo_f2',
    businessId: 'demo_user_serviceloop',
    customerId: 'demo_c1',
    appointmentId: 'demo_apt1',
    scheduledDate: '2026-10-20',
    status: 'PENDING',
    notes: 'Routine service review and customer satisfaction check',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  },
];

const DEMO_TASKS: TaskItem[] = [
  {
    id: 'demo_t1',
    ownerId: 'demo_user_serviceloop',
    title: 'Install 63A 3-phase commercial distribution box',
    customerName: 'Sharma Residency & Commercial',
    dueDate: '2026-10-12',
    priority: 'high',
    status: 'in-progress',
    amount: 18500,
    createdAt: '2026-10-02',
  },
  {
    id: 'demo_t2',
    ownerId: 'demo_user_serviceloop',
    title: 'Quarterly split-AC motor capacitor replacement',
    customerName: 'Verma Tech Hub',
    dueDate: '2026-10-16',
    priority: 'medium',
    status: 'pending',
    amount: 8200,
    createdAt: '2026-10-04',
  },
  {
    id: 'demo_t3',
    ownerId: 'demo_user_serviceloop',
    title: 'Wiring conduits & emergency safety isolator',
    customerName: 'Mehta Dental & Care Clinic',
    dueDate: '2026-10-06',
    priority: 'high',
    status: 'completed',
    amount: 12500,
    createdAt: '2026-10-01',
  },
];

const DEMO_INVOICES: InvoiceItem[] = [
  {
    id: 'demo_inv1',
    ownerId: 'demo_user_serviceloop',
    customerName: 'Sharma Residency & Commercial',
    description: 'Initial advance for main distribution gear & cables',
    amount: 20000,
    status: 'paid',
    date: '2026-09-28',
    createdAt: '2026-09-28',
  },
  {
    id: 'demo_inv2',
    ownerId: 'demo_user_serviceloop',
    customerName: 'Verma Tech Hub',
    description: 'Deposit for HVAC server cooling maintenance visit',
    amount: 15800,
    status: 'paid',
    date: '2026-10-02',
    createdAt: '2026-10-02',
  },
  {
    id: 'demo_inv3',
    ownerId: 'demo_user_serviceloop',
    customerName: 'Mehta Dental & Care Clinic',
    description: 'Safety isolator installation & copper piping labour',
    amount: 12500,
    status: 'pending',
    date: '2026-10-05',
    createdAt: '2026-10-05',
  },
];

export default function DashboardPage() {
  const { user, signOut, business: authBusiness } = useAuth();

  // State scoped strictly per user
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [customersLoading, setCustomersLoading] = useState(true);
  const [customersError, setCustomersError] = useState<string | null>(null);

  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [servicesError, setServicesError] = useState<string | null>(null);

  // Appointments (Cloud Firestore)
  const [appointments, setAppointments] = useState<WithDocId<APPOINTMENT>[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [appointmentsError, setAppointmentsError] = useState<string | null>(null);

  // Follow-ups (Cloud Firestore)
  const [followups, setFollowups] = useState<WithDocId<FOLLOW_UP>[]>([]);
  const [followupsLoading, setFollowupsLoading] = useState(true);
  const [followupsError, setFollowupsError] = useState<string | null>(null);

  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [business, setBusiness] = useState<Business | null>(null);

  // Active view tab
  const [activeTab, setActiveTab] = useState<'overview' | 'clients' | 'services' | 'appointments' | 'followups' | 'tasks' | 'invoices' | 'settings'>('overview');

  // Search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchServiceTerm, setSearchServiceTerm] = useState('');
  const [serviceStatusFilter, setServiceStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [searchAppointmentTerm, setSearchAppointmentTerm] = useState('');
  const [appointmentStatusFilter, setAppointmentStatusFilter] = useState<'all' | AppointmentStatus>('all');
  const [searchFollowupTerm, setSearchFollowupTerm] = useState('');
  const [followupStatusFilter, setFollowupStatusFilter] = useState<'all' | FollowUpStatus>('all');

  // Modals state
  const [modalType, setModalType] = useState<
    'customer' | 'edit_customer' | 'service' | 'edit_service' | 'appointment' | 'edit_appointment' | 'followup' | 'edit_followup' | 'task' | 'invoice' | null
  >(null);

  // Forms state
  // 1. Add / Edit Customer
  const [newCustName, setNewCustName] = useState('');
  const [newCustCompany, setNewCustCompany] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('+91 ');
  const [newCustValue, setNewCustValue] = useState('');
  const [newCustNotes, setNewCustNotes] = useState('');
  const [newCustStatus, setNewCustStatus] = useState<'lead' | 'active' | 'completed'>('lead');

  const [editingCustomer, setEditingCustomer] = useState<CustomerRecord | null>(null);
  const [editCustName, setEditCustName] = useState('');
  const [editCustPhone, setEditCustPhone] = useState('');
  const [editCustEmail, setEditCustEmail] = useState('');
  const [editCustNotes, setEditCustNotes] = useState('');
  const [custActionLoading, setCustActionLoading] = useState(false);
  const [custModalError, setCustModalError] = useState<string | null>(null);

  // 2. Add / Edit Service
  const [newServName, setNewServName] = useState('');
  const [newServDesc, setNewServDesc] = useState('');
  const [newServDuration, setNewServDuration] = useState('');
  const [newServInterval, setNewServInterval] = useState('');
  const [newServPrice, setNewServPrice] = useState('');
  const [newServActive, setNewServActive] = useState(true);

  const [editingService, setEditingService] = useState<ServiceRecord | null>(null);
  const [editServName, setEditServName] = useState('');
  const [editServDesc, setEditServDesc] = useState('');
  const [editServDuration, setEditServDuration] = useState('');
  const [editServInterval, setEditServInterval] = useState('');
  const [editServPrice, setEditServPrice] = useState('');
  const [editServActive, setEditServActive] = useState(true);
  const [servActionLoading, setServActionLoading] = useState(false);
  const [servModalError, setServModalError] = useState<string | null>(null);

  // 3. Add / Edit Appointment (Cloud Firestore)
  const [aptCustomerId, setAptCustomerId] = useState('');
  const [aptServiceId, setAptServiceId] = useState('');
  const [aptDate, setAptDate] = useState('');
  const [aptTime, setAptTime] = useState('10:00');
  const [aptEndTime, setAptEndTime] = useState('');
  const [aptStatus, setAptStatus] = useState<AppointmentStatus>('SCHEDULED');
  const [aptNotes, setAptNotes] = useState('');
  const [aptActionLoading, setAptActionLoading] = useState(false);
  const [aptModalError, setAptModalError] = useState<string | null>(null);
  const [editingAppointment, setEditingAppointment] = useState<WithDocId<APPOINTMENT> | null>(null);

  // 4. Add / Edit Follow-up (Cloud Firestore)
  const [fupCustomerId, setFupCustomerId] = useState('');
  const [fupAppointmentId, setFupAppointmentId] = useState('');
  const [fupDate, setFupDate] = useState('');
  const [fupStatus, setFupStatus] = useState<FollowUpStatus>('PENDING');
  const [fupNotes, setFupNotes] = useState('');
  const [fupActionLoading, setFupActionLoading] = useState(false);
  const [fupModalError, setFupModalError] = useState<string | null>(null);
  const [editingFollowup, setEditingFollowup] = useState<WithDocId<FOLLOW_UP> | null>(null);

  // Follow-up suggestion modal on appointment completion
  const [suggestedFollowup, setSuggestedFollowup] = useState<{
    appointment: WithDocId<APPOINTMENT>;
    customerName: string;
    serviceName: string;
    intervalDays: number;
    suggestedDate: string;
  } | null>(null);

  // 5. Add Work Order
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCustomer, setNewTaskCustomer] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newTaskAmount, setNewTaskAmount] = useState('');

  // 6. Add Invoice
  const [newInvCustomer, setNewInvCustomer] = useState('');
  const [newInvDesc, setNewInvDesc] = useState('');
  const [newInvAmount, setNewInvAmount] = useState('');
  const [newInvStatus, setNewInvStatus] = useState<'paid' | 'pending'>('pending');

  // 7. Settings form states
  const [editBizName, setEditBizName] = useState('');
  const [editOwnerName, setEditOwnerName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editBizType, setEditBizType] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);

  // Synchronize non-Firestore demo/mock modules (tasks, invoices)
  useEffect(() => {
    let active = true;

    queueMicrotask(() => {
      if (!active || !user) return;

      const userStorageKey = `serviceloop_crm_${user.uid}`;
      const cached = typeof window !== 'undefined' ? localStorage.getItem(userStorageKey) : null;

      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed.tasks) setTasks(parsed.tasks);
          if (parsed.invoices) setInvoices(parsed.invoices);
        } catch {
          // invalid cache fallback
        }
      } else if (user.isDemo) {
        setTasks(DEMO_TASKS);
        setInvoices(DEMO_INVOICES);

        const demoBiz = typeof window !== 'undefined' ? localStorage.getItem('serviceloop_demo_business') : null;
        if (demoBiz) {
          try {
            const parsed = JSON.parse(demoBiz);
            setBusiness(parsed);
            setEditBizName(parsed.businessName || 'Apex Electrical & Facility Services');
            setEditOwnerName(parsed.ownerName || 'Rajesh Kumar');
            setEditPhone(parsed.phone || '+91 98765 43210');
            setEditBizType(parsed.businessType || 'Electrical & Facility Care');
            setEditLocation(parsed.location || 'Bengaluru, Karnataka');
          } catch {}
        } else {
          setEditBizName('Apex Electrical & Facility Services');
          setEditOwnerName('Rajesh Kumar');
          setEditPhone('+91 98765 43210');
          setEditBizType('Electrical & Facility Care');
          setEditLocation('Bengaluru, Karnataka');
        }
      } else {
        setTasks([]);
        setInvoices([]);
      }
    });

    return () => {
      active = false;
    };
  }, [user]);

  // Real-Time Cloud Firestore Listeners for Customers, Services, Appointments, and Follow-ups (Primary Database)
  useEffect(() => {
    if (!user) return;

    if (user.isDemo) {
      queueMicrotask(() => {
        if (user.uid === 'demo_user_serviceloop') {
          setCustomers(DEMO_CUSTOMERS as unknown as CustomerRecord[]);
          setServices(DEMO_SERVICES);
          setAppointments(DEMO_APPOINTMENTS);
          setFollowups(DEMO_V1_FOLLOWUPS);
        } else {
          // Dedicated storage for registered business user
          if (typeof window !== 'undefined') {
            const savedCust = localStorage.getItem(`serviceloop_customers_${user.uid}`);
            const savedServ = localStorage.getItem(`serviceloop_services_${user.uid}`);
            const savedApt = localStorage.getItem(`serviceloop_appointments_${user.uid}`);
            const savedFup = localStorage.getItem(`serviceloop_followups_${user.uid}`);

            setCustomers(savedCust ? JSON.parse(savedCust) : []);
            setServices(savedServ ? JSON.parse(savedServ) : []);
            setAppointments(savedApt ? JSON.parse(savedApt) : []);
            setFollowups(savedFup ? JSON.parse(savedFup) : []);
          }
        }
        setCustomersLoading(false);
        setServicesLoading(false);
        setAppointmentsLoading(false);
        setFollowupsLoading(false);
      });
      return;
    }

    const targetBizId = authBusiness?.id || business?.id || user.uid;
    if (!targetBizId) return;

    let active = true;
    queueMicrotask(() => {
      if (active) {
        setCustomersLoading(true);
        setCustomersError(null);
        setServicesLoading(true);
        setServicesError(null);
        setAppointmentsLoading(true);
        setAppointmentsError(null);
        setFollowupsLoading(true);
        setFollowupsError(null);
      }
    });

    const qCustomers = query(
      collection(db, 'customers'),
      where('businessId', '==', targetBizId)
    );
    const unsubCust = onSnapshot(
      qCustomers,
      (snapshot) => {
        const docs = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as CUSTOMER),
        }));
        setCustomers(docs);
        setCustomersLoading(false);
      },
      (err) => {
        console.error('Firestore customers listener error:', err);
        setCustomersError('Failed to load customers from Firestore.');
        setCustomersLoading(false);
        handleFirestoreError(err, OperationType.LIST, 'customers');
      }
    );

    const qServices = query(
      collection(db, 'services'),
      where('businessId', '==', targetBizId)
    );
    const unsubServ = onSnapshot(
      qServices,
      (snapshot) => {
        const docs = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as SERVICE),
        }));
        setServices(docs);
        setServicesLoading(false);
      },
      (err) => {
        console.error('Firestore services listener error:', err);
        setServicesError('Failed to load services from Firestore.');
        setServicesLoading(false);
        handleFirestoreError(err, OperationType.LIST, 'services');
      }
    );

    const qAppointments = query(
      collection(db, 'appointments'),
      where('businessId', '==', targetBizId)
    );
    const unsubApt = onSnapshot(
      qAppointments,
      (snapshot) => {
        const docs = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as APPOINTMENT),
        }));
        setAppointments(docs);
        setAppointmentsLoading(false);
      },
      (err) => {
        console.error('Firestore appointments listener error:', err);
        setAppointmentsError('Failed to load appointments from Firestore.');
        setAppointmentsLoading(false);
        handleFirestoreError(err, OperationType.LIST, 'appointments');
      }
    );

    const qFollowups = query(
      collection(db, 'follow_ups'),
      where('businessId', '==', targetBizId)
    );
    const unsubFup = onSnapshot(
      qFollowups,
      (snapshot) => {
        const docs = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as FOLLOW_UP),
        }));
        setFollowups(docs);
        setFollowupsLoading(false);
      },
      (err) => {
        console.error('Firestore follow-ups listener error:', err);
        setFollowupsError('Failed to load follow-ups from Firestore.');
        setFollowupsLoading(false);
        handleFirestoreError(err, OperationType.LIST, 'follow_ups');
      }
    );

    return () => {
      active = false;
      unsubCust();
      unsubServ();
      unsubApt();
      unsubFup();
    };
  }, [user, authBusiness?.id, business?.id]);

  // Firestore Real-Time listener for business profile with local registration fallback
  useEffect(() => {
    if (!user || user.isDemo) return;

    let active = true;

    // Check cached registered business profile asynchronously
    queueMicrotask(() => {
      if (!active) return;
      if (typeof window !== 'undefined') {
        const cachedBiz = localStorage.getItem(`serviceloop_registered_business_${user.uid}`);
        if (cachedBiz) {
          try {
            const data = JSON.parse(cachedBiz);
            setBusiness(data);
            setEditBizName(data.businessName || '');
            setEditOwnerName(data.ownerName || '');
            setEditPhone(data.phone || '');
            setEditBizType(data.businessType || '');
            setEditLocation(data.location || '');
          } catch {}
        }
      }
    });

    const unsubscribe = onSnapshot(
      doc(db, 'businesses', user.uid),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as Business;
          setBusiness(data);
          setEditBizName(data.businessName || '');
          setEditOwnerName(data.ownerName || '');
          setEditPhone(data.phone || '');
          setEditBizType(data.businessType || '');
          setEditLocation(data.location || '');
        }
      },
      (error) => {
        console.warn(`Firestore business listener notice for businesses/${user.uid}:`, error);
      }
    );

    return () => {
      active = false;
      unsubscribe();
    };
  }, [user]);

  // Persist non-Firestore mock data (tasks, invoices)
  const persistCRMData = (
    newTsk: TaskItem[], 
    newInv: InvoiceItem[]
  ) => {
    if (!user) return;

    // Cache locally scoped to this specific user UID for mock modules
    if (typeof window !== 'undefined') {
      const storageKey = `serviceloop_crm_${user.uid}`;
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          tasks: newTsk,
          invoices: newInv,
        })
      );
    }
  };

  // Automatically persist local datasets for registered users operating in client mode
  useEffect(() => {
    if (!user || !user.isDemo || user.uid === 'demo_user_serviceloop' || customersLoading) return;
    if (typeof window !== 'undefined') {
      localStorage.setItem(`serviceloop_customers_${user.uid}`, JSON.stringify(customers));
    }
  }, [customers, user, customersLoading]);

  useEffect(() => {
    if (!user || !user.isDemo || user.uid === 'demo_user_serviceloop' || servicesLoading) return;
    if (typeof window !== 'undefined') {
      localStorage.setItem(`serviceloop_services_${user.uid}`, JSON.stringify(services));
    }
  }, [services, user, servicesLoading]);

  useEffect(() => {
    if (!user || !user.isDemo || user.uid === 'demo_user_serviceloop' || appointmentsLoading) return;
    if (typeof window !== 'undefined') {
      localStorage.setItem(`serviceloop_appointments_${user.uid}`, JSON.stringify(appointments));
    }
  }, [appointments, user, appointmentsLoading]);

  useEffect(() => {
    if (!user || !user.isDemo || user.uid === 'demo_user_serviceloop' || followupsLoading) return;
    if (typeof window !== 'undefined') {
      localStorage.setItem(`serviceloop_followups_${user.uid}`, JSON.stringify(followups));
    }
  }, [followups, user, followupsLoading]);

  const resetCustomerForm = () => {
    setNewCustName('');
    setNewCustCompany('');
    setNewCustEmail('');
    setNewCustPhone('+91 ');
    setNewCustValue('');
    setNewCustNotes('');
    setNewCustStatus('lead');
    setCustModalError(null);
    setEditingCustomer(null);
  };

  const resetServiceForm = () => {
    setNewServName('');
    setNewServDesc('');
    setNewServDuration('');
    setNewServInterval('');
    setNewServPrice('');
    setNewServActive(true);
    setServModalError(null);
    setEditingService(null);
  };

  const resetAppointmentForm = () => {
    setAptCustomerId('');
    setAptServiceId('');
    setAptDate('');
    setAptTime('10:00');
    setAptEndTime('');
    setAptStatus('SCHEDULED');
    setAptNotes('');
    setAptModalError(null);
    setEditingAppointment(null);
  };

  const resetFollowupForm = () => {
    setFupCustomerId('');
    setFupAppointmentId('');
    setFupDate('');
    setFupStatus('PENDING');
    setFupNotes('');
    setFupModalError(null);
    setEditingFollowup(null);
  };

  const openEditAppointment = (apt: WithDocId<APPOINTMENT>) => {
    setEditingAppointment(apt);
    setAptCustomerId(apt.customerId);
    setAptServiceId(apt.serviceId);
    setAptDate(apt.appointmentDate);
    setAptTime(apt.appointmentTime);
    setAptEndTime(apt.endTime || '');
    setAptStatus(apt.status);
    setAptNotes(apt.notes || '');
    setAptModalError(null);
    setModalType('edit_appointment');
  };

  const openEditFollowup = (fup: WithDocId<FOLLOW_UP>) => {
    setEditingFollowup(fup);
    setFupCustomerId(fup.customerId);
    setFupAppointmentId(fup.appointmentId || '');
    setFupDate(fup.scheduledDate);
    setFupStatus(fup.status);
    setFupNotes(fup.notes || '');
    setFupModalError(null);
    setModalType('edit_followup');
  };

  // Handlers for Customer Operations (Cloud Firestore)
  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newCustName.trim()) return;

    const targetBizId = authBusiness?.id || business?.id || user.uid;

    if (user.isDemo) {
      const demoCust: CustomerRecord = {
        id: `c_${Date.now()}`,
        businessId: targetBizId,
        ownerId: user.uid,
        name: newCustName.trim(),
        phone: newCustPhone.trim() || null,
        email: newCustEmail.trim() || null,
        notes: newCustNotes.trim() || null,
        company: newCustCompany.trim() || null,
        status: newCustStatus,
        totalValue: Number(newCustValue) || 0,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      setCustomers((prev) => [demoCust, ...prev]);
      resetCustomerForm();
      setModalType(null);
      return;
    }

    try {
      setCustActionLoading(true);
      setCustModalError(null);
      await createCustomer({
        businessId: targetBizId,
        name: newCustName.trim(),
        phone: newCustPhone.trim() || null,
        email: newCustEmail.trim() || null,
        notes: newCustNotes.trim() || null,
      });
      resetCustomerForm();
      setModalType(null);
    } catch (err: unknown) {
      console.error('Failed to create customer in Firestore:', err);
      setCustModalError(err instanceof Error ? err.message : 'Failed to create client in Firestore.');
    } finally {
      setCustActionLoading(false);
    }
  };

  const handleEditCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !editingCustomer || !editCustName.trim()) return;

    if (user.isDemo) {
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === editingCustomer.id
            ? {
                ...c,
                name: editCustName.trim(),
                phone: editCustPhone.trim() || null,
                email: editCustEmail.trim() || null,
                notes: editCustNotes.trim() || null,
              }
            : c
        )
      );
      setEditingCustomer(null);
      setModalType(null);
      return;
    }

    try {
      setCustActionLoading(true);
      setCustModalError(null);
      await updateCustomer(editingCustomer.id, {
        name: editCustName.trim(),
        phone: editCustPhone.trim() || null,
        email: editCustEmail.trim() || null,
        notes: editCustNotes.trim() || null,
      });
      setEditingCustomer(null);
      setModalType(null);
    } catch (err: unknown) {
      console.error('Failed to update customer in Firestore:', err);
      setCustModalError(err instanceof Error ? err.message : 'Failed to update client in Firestore.');
    } finally {
      setCustActionLoading(false);
    }
  };

  const handleDeleteCustomer = async (customerId: string) => {
    if (typeof window !== 'undefined' && !window.confirm('Are you sure you want to delete this client?')) return;
    if (user?.isDemo) {
      setCustomers((prev) => prev.filter((c) => c.id !== customerId));
      return;
    }
    try {
      await deleteCustomer(customerId);
    } catch (err: unknown) {
      console.error('Failed to delete customer:', err);
      alert('Failed to delete client from Firestore.');
    }
  };

  const openEditCustomer = (c: CustomerRecord) => {
    setEditingCustomer(c);
    setEditCustName(c.name || '');
    setEditCustPhone(c.phone || '+91 ');
    setEditCustEmail(c.email || '');
    setEditCustNotes(c.notes || '');
    setCustModalError(null);
    setModalType('edit_customer');
  };

  // Handlers for Service Operations (Cloud Firestore)
  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newServName.trim()) return;

    const targetBizId = authBusiness?.id || business?.id || user.uid;

    if (user.isDemo) {
      const demoServ: ServiceRecord = {
        id: `s_${Date.now()}`,
        businessId: targetBizId,
        serviceName: newServName.trim(),
        description: newServDesc.trim() || null,
        durationMinutes: newServDuration ? Number(newServDuration) : null,
        typicalIntervalDays: newServInterval ? Number(newServInterval) : null,
        basePrice: newServPrice ? Number(newServPrice) : null,
        isActive: newServActive,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      setServices((prev) => [demoServ, ...prev]);
      resetServiceForm();
      setModalType(null);
      return;
    }

    try {
      setServActionLoading(true);
      setServModalError(null);
      await createService({
        businessId: targetBizId,
        serviceName: newServName.trim(),
        description: newServDesc.trim() || null,
        durationMinutes: newServDuration ? Number(newServDuration) : null,
        typicalIntervalDays: newServInterval ? Number(newServInterval) : null,
        basePrice: newServPrice ? Number(newServPrice) : null,
        isActive: newServActive,
      });
      resetServiceForm();
      setModalType(null);
    } catch (err: unknown) {
      console.error('Failed to create service in Firestore:', err);
      setServModalError(err instanceof Error ? err.message : 'Failed to create service in Firestore.');
    } finally {
      setServActionLoading(false);
    }
  };

  const handleEditService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !editingService || !editServName.trim()) return;

    if (user.isDemo) {
      setServices((prev) =>
        prev.map((s) =>
          s.id === editingService.id
            ? {
                ...s,
                serviceName: editServName.trim(),
                description: editServDesc.trim() || null,
                durationMinutes: editServDuration ? Number(editServDuration) : null,
                typicalIntervalDays: editServInterval ? Number(editServInterval) : null,
                basePrice: editServPrice ? Number(editServPrice) : null,
                isActive: editServActive,
              }
            : s
        )
      );
      setEditingService(null);
      setModalType(null);
      return;
    }

    try {
      setServActionLoading(true);
      setServModalError(null);
      await updateService(editingService.id, {
        serviceName: editServName.trim(),
        description: editServDesc.trim() || null,
        durationMinutes: editServDuration ? Number(editServDuration) : null,
        typicalIntervalDays: editServInterval ? Number(editServInterval) : null,
        basePrice: editServPrice ? Number(editServPrice) : null,
        isActive: editServActive,
      });
      setEditingService(null);
      setModalType(null);
    } catch (err: unknown) {
      console.error('Failed to update service in Firestore:', err);
      setServModalError(err instanceof Error ? err.message : 'Failed to update service in Firestore.');
    } finally {
      setServActionLoading(false);
    }
  };

  const handleToggleServiceActive = async (s: ServiceRecord) => {
    if (user?.isDemo) {
      setServices((prev) =>
        prev.map((item) =>
          item.id === s.id ? { ...item, isActive: !item.isActive } : item
        )
      );
      return;
    }
    try {
      await toggleServiceActive(s.id, s.isActive);
    } catch (err: unknown) {
      console.error('Failed to toggle service status:', err);
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (typeof window !== 'undefined' && !window.confirm('Are you sure you want to delete this service?')) return;
    if (user?.isDemo) {
      setServices((prev) => prev.filter((s) => s.id !== serviceId));
      return;
    }
    try {
      await deleteService(serviceId);
    } catch (err: unknown) {
      console.error('Failed to delete service:', err);
      alert('Failed to delete service from Firestore.');
    }
  };

  const openEditService = (s: ServiceRecord) => {
    setEditingService(s);
    setEditServName(s.serviceName || '');
    setEditServDesc(s.description || '');
    setEditServDuration(s.durationMinutes ? String(s.durationMinutes) : '');
    setEditServInterval(s.typicalIntervalDays ? String(s.typicalIntervalDays) : '');
    setEditServPrice(s.basePrice ? String(s.basePrice) : '');
    setEditServActive(s.isActive ?? true);
    setServModalError(null);
    setModalType('edit_service');
  };

  // Handlers for Appointment Operations (Cloud Firestore)
  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!aptCustomerId || !aptServiceId || !aptDate.trim() || !aptTime.trim()) {
      setAptModalError('Please select a client, service, date, and start time.');
      return;
    }

    const targetBizId = authBusiness?.id || business?.id || user.uid;

    // Validate relationships: client and service must belong to the current business
    const customerBelongs = customers.some((c) => c.id === aptCustomerId);
    const serviceBelongs = services.some((s) => s.id === aptServiceId);

    if (!customerBelongs) {
      setAptModalError('Invalid client: selected client does not belong to your business.');
      return;
    }
    if (!serviceBelongs) {
      setAptModalError('Invalid service: selected service does not belong to your business.');
      return;
    }

    if (user.isDemo) {
      const demoApt: WithDocId<APPOINTMENT> = {
        id: `demo_apt_${Date.now()}`,
        businessId: targetBizId,
        customerId: aptCustomerId,
        serviceId: aptServiceId,
        appointmentDate: aptDate.trim(),
        appointmentTime: aptTime.trim(),
        endTime: aptEndTime.trim() || null,
        status: 'SCHEDULED',
        notes: aptNotes.trim() || null,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      setAppointments((prev) => [demoApt, ...prev]);
      resetAppointmentForm();
      setModalType(null);
      return;
    }

    try {
      setAptActionLoading(true);
      setAptModalError(null);
      await createAppointment({
        businessId: targetBizId,
        customerId: aptCustomerId,
        serviceId: aptServiceId,
        appointmentDate: aptDate.trim(),
        appointmentTime: aptTime.trim(),
        endTime: aptEndTime.trim() || null,
        status: 'SCHEDULED',
        notes: aptNotes.trim() || null,
      });
      resetAppointmentForm();
      setModalType(null);
    } catch (err: unknown) {
      console.error('Failed to create appointment in Firestore:', err);
      setAptModalError(err instanceof Error ? err.message : 'Failed to create appointment in Firestore.');
    } finally {
      setAptActionLoading(false);
    }
  };

  const handleEditAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !editingAppointment) return;
    if (!aptCustomerId || !aptServiceId || !aptDate.trim() || !aptTime.trim()) {
      setAptModalError('Please select a client, service, date, and start time.');
      return;
    }

    const customerBelongs = customers.some((c) => c.id === aptCustomerId);
    const serviceBelongs = services.some((s) => s.id === aptServiceId);

    if (!customerBelongs || !serviceBelongs) {
      setAptModalError('Selected client or service does not belong to this business.');
      return;
    }

    if (user.isDemo) {
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === editingAppointment.id
            ? {
                ...a,
                customerId: aptCustomerId,
                serviceId: aptServiceId,
                appointmentDate: aptDate.trim(),
                appointmentTime: aptTime.trim(),
                endTime: aptEndTime.trim() || null,
                status: aptStatus,
                notes: aptNotes.trim() || null,
                updatedAt: Timestamp.now(),
              }
            : a
        )
      );
      resetAppointmentForm();
      setModalType(null);
      return;
    }

    try {
      setAptActionLoading(true);
      setAptModalError(null);
      await updateAppointment(editingAppointment.id, {
        customerId: aptCustomerId,
        serviceId: aptServiceId,
        appointmentDate: aptDate.trim(),
        appointmentTime: aptTime.trim(),
        endTime: aptEndTime.trim() || null,
        status: aptStatus,
        notes: aptNotes.trim() || null,
      });
      resetAppointmentForm();
      setModalType(null);
    } catch (err: unknown) {
      console.error('Failed to update appointment:', err);
      setAptModalError(err instanceof Error ? err.message : 'Failed to update appointment in Firestore.');
    } finally {
      setAptActionLoading(false);
    }
  };

  const handleStatusChangeAppointment = async (
    apt: WithDocId<APPOINTMENT>,
    newStatus: AppointmentStatus
  ) => {
    if (!user) return;

    if (user.isDemo) {
      setAppointments((prev) =>
        prev.map((a) => (a.id === apt.id ? { ...a, status: newStatus, updatedAt: Timestamp.now() } : a))
      );
    } else {
      try {
        await updateAppointment(apt.id, { status: newStatus });
      } catch (err) {
        console.error('Failed to update appointment status:', err);
        alert('Failed to update appointment status in Firestore.');
        return;
      }
    }

    // Follow-up suggestion trigger on COMPLETED
    if (newStatus === 'COMPLETED') {
      const linkedService = services.find((s) => s.id === apt.serviceId);
      const linkedCustomer = customers.find((c) => c.id === apt.customerId);
      const interval = linkedService?.typicalIntervalDays;

      if (typeof interval === 'number' && interval > 0) {
        // Prevent duplicate follow-up
        const alreadyScheduled = followups.some(
          (f) => f.appointmentId === apt.id && f.status !== 'CANCELLED'
        );

        if (!alreadyScheduled) {
          const baseDate = apt.appointmentDate ? new Date(apt.appointmentDate) : new Date();
          const targetDate = isNaN(baseDate.getTime()) ? new Date() : baseDate;
          targetDate.setDate(targetDate.getDate() + interval);
          const suggestedDateStr = targetDate.toISOString().split('T')[0];

          setSuggestedFollowup({
            appointment: apt,
            customerName: linkedCustomer?.name || 'Client',
            serviceName: linkedService?.serviceName || 'Service',
            intervalDays: interval,
            suggestedDate: suggestedDateStr,
          });
        }
      }
    }
  };

  const handleDeleteAppointment = async (appointmentId: string) => {
    if (typeof window !== 'undefined' && !window.confirm('Are you sure you want to delete this appointment?')) return;
    if (user?.isDemo) {
      setAppointments((prev) => prev.filter((a) => a.id !== appointmentId));
      return;
    }
    try {
      await deleteAppointment(appointmentId);
    } catch (err: unknown) {
      console.error('Failed to delete appointment:', err);
      alert('Failed to delete appointment from Firestore.');
    }
  };

  const handleConfirmSuggestedFollowup = async () => {
    if (!suggestedFollowup || !user) return;
    const targetBizId = authBusiness?.id || business?.id || user.uid;

    if (user.isDemo) {
      const demoFup: WithDocId<FOLLOW_UP> = {
        id: `demo_fup_${Date.now()}`,
        businessId: targetBizId,
        customerId: suggestedFollowup.appointment.customerId,
        appointmentId: suggestedFollowup.appointment.id,
        scheduledDate: suggestedFollowup.suggestedDate,
        status: 'PENDING',
        notes: `Suggested routine follow-up after ${suggestedFollowup.serviceName} (${suggestedFollowup.intervalDays}-day service interval)`,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      setFollowups((prev) => [demoFup, ...prev]);
      setSuggestedFollowup(null);
      return;
    }

    try {
      await createFollowUp({
        businessId: targetBizId,
        customerId: suggestedFollowup.appointment.customerId,
        appointmentId: suggestedFollowup.appointment.id,
        scheduledDate: suggestedFollowup.suggestedDate,
        status: 'PENDING',
        notes: `Suggested routine follow-up after ${suggestedFollowup.serviceName} (${suggestedFollowup.intervalDays}-day service interval)`,
      });
      setSuggestedFollowup(null);
    } catch (err) {
      console.error('Failed to schedule suggested follow-up:', err);
      alert('Failed to schedule suggested follow-up in Firestore.');
    }
  };

  // Handlers for Follow-up Operations (Cloud Firestore)
  const handleCreateFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!fupCustomerId || !fupDate.trim()) {
      setFupModalError('Please select a client and scheduled date.');
      return;
    }

    const targetBizId = authBusiness?.id || business?.id || user.uid;

    const customerBelongs = customers.some((c) => c.id === fupCustomerId);
    if (!customerBelongs) {
      setFupModalError('Selected client does not belong to this business.');
      return;
    }

    if (fupAppointmentId) {
      const apt = appointments.find((a) => a.id === fupAppointmentId);
      if (!apt) {
        setFupModalError('Selected appointment does not exist.');
        return;
      }
      if (apt.customerId !== fupCustomerId) {
        setFupModalError('The selected appointment belongs to a different client.');
        return;
      }
    }

    if (user.isDemo) {
      const demoFup: WithDocId<FOLLOW_UP> = {
        id: `demo_fup_${Date.now()}`,
        businessId: targetBizId,
        customerId: fupCustomerId,
        appointmentId: fupAppointmentId || '',
        scheduledDate: fupDate.trim(),
        status: 'PENDING',
        notes: fupNotes.trim() || null,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      setFollowups((prev) => [demoFup, ...prev]);
      resetFollowupForm();
      setModalType(null);
      return;
    }

    try {
      setFupActionLoading(true);
      setFupModalError(null);
      await createFollowUp({
        businessId: targetBizId,
        customerId: fupCustomerId,
        appointmentId: fupAppointmentId || '',
        scheduledDate: fupDate.trim(),
        status: 'PENDING',
        notes: fupNotes.trim() || null,
      });
      resetFollowupForm();
      setModalType(null);
    } catch (err: unknown) {
      console.error('Failed to create follow-up in Firestore:', err);
      setFupModalError(err instanceof Error ? err.message : 'Failed to create follow-up in Firestore.');
    } finally {
      setFupActionLoading(false);
    }
  };

  const handleEditFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !editingFollowup) return;
    if (!fupCustomerId || !fupDate.trim()) {
      setFupModalError('Please select a client and scheduled date.');
      return;
    }

    const customerBelongs = customers.some((c) => c.id === fupCustomerId);
    if (!customerBelongs) {
      setFupModalError('Selected client does not belong to this business.');
      return;
    }

    if (fupAppointmentId) {
      const apt = appointments.find((a) => a.id === fupAppointmentId);
      if (!apt || apt.customerId !== fupCustomerId) {
        setFupModalError('The linked appointment belongs to a different client.');
        return;
      }
    }

    if (user.isDemo) {
      setFollowups((prev) =>
        prev.map((f) =>
          f.id === editingFollowup.id
            ? {
                ...f,
                customerId: fupCustomerId,
                appointmentId: fupAppointmentId || '',
                scheduledDate: fupDate.trim(),
                status: fupStatus,
                notes: fupNotes.trim() || null,
                updatedAt: Timestamp.now(),
              }
            : f
        )
      );
      resetFollowupForm();
      setModalType(null);
      return;
    }

    try {
      setFupActionLoading(true);
      setFupModalError(null);
      await updateFollowUp(editingFollowup.id, {
        customerId: fupCustomerId,
        appointmentId: fupAppointmentId || '',
        scheduledDate: fupDate.trim(),
        status: fupStatus,
        notes: fupNotes.trim() || null,
      });
      resetFollowupForm();
      setModalType(null);
    } catch (err: unknown) {
      console.error('Failed to update follow-up:', err);
      setFupModalError(err instanceof Error ? err.message : 'Failed to update follow-up in Firestore.');
    } finally {
      setFupActionLoading(false);
    }
  };

  const handleStatusChangeFollowUp = async (
    fup: WithDocId<FOLLOW_UP>,
    newStatus: FollowUpStatus
  ) => {
    if (!user) return;
    if (user.isDemo) {
      setFollowups((prev) =>
        prev.map((f) => (f.id === fup.id ? { ...f, status: newStatus, updatedAt: Timestamp.now() } : f))
      );
      return;
    }
    try {
      await updateFollowUp(fup.id, { status: newStatus });
    } catch (err) {
      console.error('Failed to change follow-up status:', err);
      alert('Failed to update follow-up status in Firestore.');
    }
  };

  const handleDeleteFollowUp = async (followUpId: string) => {
    if (typeof window !== 'undefined' && !window.confirm('Are you sure you want to delete this follow-up?')) return;
    if (user?.isDemo) {
      setFollowups((prev) => prev.filter((f) => f.id !== followUpId));
      return;
    }
    try {
      await deleteFollowUp(followUpId);
    } catch (err) {
      console.error('Failed to delete follow-up:', err);
      alert('Failed to delete follow-up from Firestore.');
    }
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newTaskTitle.trim() || !newTaskCustomer.trim()) return;

    const newTask: TaskItem = {
      id: `t_${Date.now()}`,
      ownerId: user.uid,
      title: newTaskTitle.trim(),
      customerName: newTaskCustomer.trim(),
      dueDate: newTaskDueDate || new Date().toISOString().split('T')[0],
      priority: newTaskPriority,
      status: 'pending',
      amount: Number(newTaskAmount) || 0,
      createdAt: new Date().toISOString().split('T')[0],
    };

    const updated = [newTask, ...tasks];
    setTasks(updated);
    persistCRMData(updated, invoices);

    setNewTaskTitle('');
    setNewTaskCustomer('');
    setNewTaskDueDate('');
    setNewTaskPriority('medium');
    setNewTaskAmount('');
    setModalType(null);
  };

  const handleAddInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newInvCustomer.trim() || !newInvAmount) return;

    const newInvoice: InvoiceItem = {
      id: `inv_${Date.now()}`,
      ownerId: user.uid,
      customerName: newInvCustomer.trim(),
      description: newInvDesc.trim() || 'Service & labour charge',
      amount: Number(newInvAmount) || 0,
      status: newInvStatus,
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString().split('T')[0],
    };

    const updated = [newInvoice, ...invoices];
    setInvoices(updated);
    persistCRMData(tasks, updated);

    setNewInvCustomer('');
    setNewInvDesc('');
    setNewInvAmount('');
    setNewInvStatus('pending');
    setModalType(null);
  };

  // Toggle & Delete Helpers
  const toggleTaskStatus = (id: string) => {
    const updated = tasks.map((t) => {
      if (t.id === id) {
        let nextStatus: 'pending' | 'in-progress' | 'completed' = 'in-progress';
        if (t.status === 'pending') nextStatus = 'in-progress';
        else if (t.status === 'in-progress') nextStatus = 'completed';
        else nextStatus = 'pending';
        return { ...t, status: nextStatus };
      }
      return t;
    });
    setTasks(updated);
    persistCRMData(updated, invoices);
  };

  const deleteTask = (id: string) => {
    const updated = tasks.filter((t) => t.id !== id);
    setTasks(updated);
    persistCRMData(updated, invoices);
  };

  const toggleInvoiceStatus = (id: string) => {
    const updated = invoices.map((inv) => {
      if (inv.id === id) {
        return {
          ...inv,
          status: inv.status === 'paid' ? ('pending' as const) : ('paid' as const),
        };
      }
      return inv;
    });
    setInvoices(updated);
    persistCRMData(tasks, updated);
  };

  // Save Settings Changes
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSettingsLoading(true);
    setSettingsSaved(false);

    if (user.isDemo) {
      const updatedBiz: Business = {
        ...(business || {
          ownerId: user.uid,
          createdAt: new Date().toISOString(),
        }),
        ownerId: user.uid,
        businessName: editBizName.trim(),
        ownerName: editOwnerName.trim(),
        phone: editPhone.trim(),
        businessType: editBizType.trim(),
        location: editLocation.trim(),
        updatedAt: new Date().toISOString(),
      };
      setBusiness(updatedBiz);
      if (typeof window !== 'undefined') {
        localStorage.setItem('serviceloop_demo_business', JSON.stringify(updatedBiz));
      }
      setSettingsLoading(false);
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 3000);
      return;
    }

    try {
      const docRef = doc(db, 'businesses', user.uid);
      // Strictly update authorized profile fields:
      // businessName, ownerName, businessType, location, phone.
      // Prohibited from updating: ownerId, verificationStatus, createdAt.
      await updateDoc(docRef, {
        businessName: editBizName.trim().slice(0, 100),
        ownerName: editOwnerName.trim().slice(0, 100),
        businessType: editBizType.trim().slice(0, 100),
        location: editLocation.trim().slice(0, 120),
        phone: editPhone.trim().slice(0, 50),
        updatedAt: serverTimestamp(),
      });

      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 3000);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `businesses/${user.uid}`);
    } finally {
      setSettingsLoading(false);
    }
  };

  // Reset to fresh empty workspace
  const handleResetWorkspace = () => {
    if (!user) return;
    const confirmReset = window.confirm(
      'Are you sure you want to clear your current workspace? This will reset your clients, services, appointments, tasks, and follow-ups to a completely fresh dashboard.'
    );
    if (!confirmReset) return;

    setCustomers([]);
    setServices([]);
    setAppointments([]);
    setFollowups([]);
    setTasks([]);
    setInvoices([]);
    persistCRMData([], []);
  };

  // Quick Load Sample Data (available in settings or when empty)
  const handleLoadSampleData = () => {
    if (!user) return;
    setCustomers(DEMO_CUSTOMERS as unknown as CustomerRecord[]);
    setServices(DEMO_SERVICES);
    setAppointments(DEMO_APPOINTMENTS);
    setFollowups(DEMO_V1_FOLLOWUPS);
    setTasks(DEMO_TASKS);
    setInvoices(DEMO_INVOICES);
    persistCRMData(DEMO_TASKS, DEMO_INVOICES);
  };

  // Metrics Calculations (all in Indian Rupees ₹)
  const totalClosedRevenue = invoices
    .filter((i) => i.status === 'paid')
    .reduce((sum, i) => sum + i.amount, 0);

  const pendingRevenue = invoices
    .filter((i) => i.status === 'pending')
    .reduce((sum, i) => sum + i.amount, 0);

  const activeClientsCount = customers.filter((c) => c.status === 'active' || c.status === 'lead').length;
  const scheduledAppointmentsCount = appointments.filter((a) => a.status === 'SCHEDULED').length;
  const pendingFollowupsCount = followups.filter((f) => f.status === 'PENDING').length;
  const activeTasksCount = tasks.filter((t) => t.status !== 'completed').length;

  // Filtered lists (strictly defensive against undefined strings)
  const filteredCustomers = customers.filter((c) => {
    const term = (searchTerm || '').toLowerCase();
    const matchesSearch =
      (c.name || '').toLowerCase().includes(term) ||
      (c.company && c.company.toLowerCase().includes(term)) ||
      (c.phone && c.phone.includes(searchTerm)) ||
      (c.email && c.email.toLowerCase().includes(term)) ||
      (c.notes && c.notes.toLowerCase().includes(term));
    if (!matchesSearch) return false;
    if (statusFilter === 'all') return true;
    return c.status === statusFilter;
  });

  const filteredServices = services.filter((s) => {
    const term = (searchServiceTerm || '').toLowerCase();
    const matchesSearch =
      (s.serviceName || '').toLowerCase().includes(term) ||
      (s.description && s.description.toLowerCase().includes(term));
    if (!matchesSearch) return false;
    if (serviceStatusFilter === 'all') return true;
    if (serviceStatusFilter === 'active') return s.isActive;
    if (serviceStatusFilter === 'inactive') return !s.isActive;
    return true;
  });

  const filteredAppointments = appointments.filter((apt) => {
    const term = (searchAppointmentTerm || '').toLowerCase();
    const cust = customers.find((c) => c.id === apt.customerId);
    const serv = services.find((s) => s.id === apt.serviceId);
    const custName = cust?.name || '';
    const servName = serv?.serviceName || '';
    const matchesSearch =
      custName.toLowerCase().includes(term) ||
      servName.toLowerCase().includes(term) ||
      (apt.notes && apt.notes.toLowerCase().includes(term)) ||
      (apt.appointmentDate && apt.appointmentDate.includes(searchAppointmentTerm)) ||
      (apt.appointmentTime && apt.appointmentTime.includes(searchAppointmentTerm));
    if (!matchesSearch) return false;
    if (appointmentStatusFilter === 'all') return true;
    return apt.status === appointmentStatusFilter;
  });

  const filteredFollowups = followups.filter((f) => {
    const term = (searchFollowupTerm || '').toLowerCase();
    const cust = customers.find((c) => c.id === f.customerId);
    const custName = cust?.name || '';
    const matchesSearch =
      custName.toLowerCase().includes(term) ||
      (f.notes && f.notes.toLowerCase().includes(term)) ||
      (f.scheduledDate && f.scheduledDate.includes(searchFollowupTerm));
    if (!matchesSearch) return false;
    if (followupStatusFilter === 'all') return true;
    return f.status === followupStatusFilter;
  });

  const filteredTasks = tasks.filter((t) => {
    const term = (searchTerm || '').toLowerCase();
    const matchesSearch =
      (t.title || '').toLowerCase().includes(term) ||
      (t.customerName || '').toLowerCase().includes(term);
    if (!matchesSearch) return false;
    if (statusFilter === 'all') return true;
    return t.status === statusFilter;
  });

  const businessDisplayName = business?.businessName || (user?.isDemo ? 'Apex Electrical & Facility Services' : 'My Business Workspace');
  const ownerDisplayName = business?.ownerName || user?.displayName || 'Business Owner';
  const businessType = business?.businessType || (user?.isDemo ? 'Electrical & Facility Care' : 'Service Contractor');
  const locationDisplay = business?.location || (user?.isDemo ? 'Bengaluru, Karnataka' : 'India');

  return (
    <div className="min-h-screen bg-zinc-50/60 text-zinc-900 flex flex-col selection:bg-zinc-900 selection:text-white">
      
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-zinc-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-17 flex items-center justify-between">
          <div className="flex items-center gap-4 sm:gap-6">
            <Logo href="/" size="sm" />
            <div className="h-6 w-px bg-zinc-200 hidden sm:block"></div>
            
            <div className="flex items-center gap-2">
              <span className="font-sans font-bold text-base text-zinc-950 truncate max-w-[180px] sm:max-w-xs">
                {businessDisplayName}
              </span>
              {user?.isDemo && user.uid === 'demo_user_serviceloop' ? (
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700 border border-zinc-200">
                  Demo Mode
                </span>
              ) : (
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                    business?.verificationStatus === 'VERIFIED'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : business?.verificationStatus === 'REJECTED'
                      ? 'bg-red-50 text-red-700 border border-red-200'
                      : business?.verificationStatus === 'SUSPENDED'
                      ? 'bg-zinc-100 text-zinc-700 border border-zinc-300'
                      : 'bg-amber-50 text-amber-800 border border-amber-200'
                  }`}
                >
                  {business?.verificationStatus === 'VERIFIED' ? (
                    <>
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      <span>Verified Business</span>
                    </>
                  ) : business?.verificationStatus === 'REJECTED' ? (
                    <>
                      <X className="w-3 h-3 text-red-600" />
                      <span>Verification rejected</span>
                    </>
                  ) : business?.verificationStatus === 'SUSPENDED' ? (
                    <span>Suspended</span>
                  ) : (
                    <>
                      <Clock className="w-3 h-3 text-amber-600" />
                      <span>Verification pending</span>
                    </>
                  )}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Admin Console Shortcut for Authorized Administrator */}
            {(user?.email?.toLowerCase() === 'abdullah.csc2004@gmail.com' || (typeof window !== 'undefined' && localStorage.getItem('serviceloop_admin_session'))) && (
              <Link
                href="/admin"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition-all shadow-2xs cursor-pointer"
                title="ServiceLoop Admin Console"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                <span>Admin Console</span>
              </Link>
            )}

            {/* Business Isolation badge */}
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 border border-zinc-200 text-xs font-semibold text-zinc-700">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>Isolated Workspace · {locationDisplay}</span>
            </div>

            <button
              onClick={() => {
                if (business) {
                  setEditBizName(business.businessName || '');
                  setEditOwnerName(business.ownerName || '');
                  setEditPhone(business.phone || '');
                  setEditBizType(business.businessType || '');
                  setEditLocation(business.location || '');
                }
                setActiveTab('settings');
              }}
              className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'settings' 
                  ? 'bg-zinc-900 text-white shadow-xs' 
                  : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950'
              }`}
              title="Business Settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            <button
              onClick={() => signOut()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-zinc-700 hover:text-red-700 rounded-xl hover:bg-red-50 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>

        {/* Verification Status Notification Notice */}
        {business?.verificationStatus === 'PENDING_VERIFICATION' && (!user?.isDemo || user.uid !== 'demo_user_serviceloop') && (
          <div className="bg-amber-50/90 border-t border-b border-amber-200/70 px-4 sm:px-6 py-2">
            <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-amber-900">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>
                  <strong>Authenticity Audit Pending:</strong> Your business registration is under review by ServiceLoop Platform Administrators. All CRM tools are active.
                </span>
              </div>
            </div>
          </div>
        )}
        {business?.verificationStatus === 'VERIFIED' && (!user?.isDemo || user.uid !== 'demo_user_serviceloop') && (
          <div className="bg-emerald-50/70 border-t border-b border-emerald-200/70 px-4 sm:px-6 py-1.5">
            <div className="max-w-7xl mx-auto flex items-center gap-2 text-xs text-emerald-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>
                <strong>Verified Authentic Business:</strong> Certified operator status active on the ServiceLoop network.
              </span>
            </div>
          </div>
        )}
        {business?.verificationStatus === 'REJECTED' && (
          <div className="bg-rose-50 border-t border-b border-rose-200 px-4 sm:px-6 py-2">
            <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-rose-900">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>
                  <strong>Verification Action Required:</strong> Your business verification was declined. Please verify and update your trade details.
                </span>
              </div>
              <button
                onClick={() => setActiveTab('settings')}
                className="underline font-semibold hover:text-rose-950 cursor-pointer"
              >
                Review in Settings
              </button>
            </div>
          </div>
        )}

        {/* View Tabs */}
        <div className="border-t border-zinc-200/80 bg-zinc-50/80 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto flex items-center gap-2 sm:gap-3 overflow-x-auto scrollbar-none py-2 text-xs sm:text-sm font-semibold">
            <button
              onClick={() => { setActiveTab('overview'); setStatusFilter('all'); }}
              className={`px-3.5 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'overview' 
                  ? 'bg-zinc-900 text-white font-bold shadow-xs' 
                  : 'text-zinc-600 hover:text-zinc-950 hover:bg-white'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => { setActiveTab('clients'); setStatusFilter('all'); }}
              className={`px-3.5 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'clients' 
                  ? 'bg-zinc-900 text-white font-bold shadow-xs' 
                  : 'text-zinc-600 hover:text-zinc-950 hover:bg-white'
              }`}
            >
              <span>Clients</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-zinc-200 text-zinc-800 font-bold">
                {customers.length}
              </span>
            </button>
            <button
              onClick={() => { setActiveTab('services'); setServiceStatusFilter('all'); }}
              className={`px-3.5 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'services' 
                  ? 'bg-zinc-900 text-white font-bold shadow-xs' 
                  : 'text-zinc-600 hover:text-zinc-950 hover:bg-white'
              }`}
            >
              <span>Services</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-zinc-200 text-zinc-800 font-bold">
                {services.length}
              </span>
            </button>
            <button
              onClick={() => { setActiveTab('appointments'); setAppointmentStatusFilter('all'); }}
              className={`px-3.5 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'appointments' 
                  ? 'bg-zinc-900 text-white font-bold shadow-xs' 
                  : 'text-zinc-600 hover:text-zinc-950 hover:bg-white'
              }`}
            >
              <span>Appointments</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 text-blue-900 font-bold">
                {appointments.length}
              </span>
            </button>
            <button
              onClick={() => { setActiveTab('followups'); setFollowupStatusFilter('all'); }}
              className={`px-3.5 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'followups' 
                  ? 'bg-zinc-900 text-white font-bold shadow-xs' 
                  : 'text-zinc-600 hover:text-zinc-950 hover:bg-white'
              }`}
            >
              <span>Follow-ups</span>
              {pendingFollowupsCount > 0 ? (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-200 text-amber-900 font-extrabold">
                  {pendingFollowupsCount}
                </span>
              ) : (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-zinc-200 text-zinc-800 font-bold">
                  {followups.length}
                </span>
              )}
            </button>
            <button
              onClick={() => { setActiveTab('tasks'); setStatusFilter('all'); }}
              className={`px-3.5 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'tasks' 
                  ? 'bg-zinc-900 text-white font-bold shadow-xs' 
                  : 'text-zinc-600 hover:text-zinc-950 hover:bg-white'
              }`}
            >
              <span>Work Orders</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-zinc-200 text-zinc-800 font-bold">
                {tasks.length}
              </span>
            </button>
            <button
              onClick={() => { setActiveTab('invoices'); setStatusFilter('all'); }}
              className={`px-3.5 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'invoices' 
                  ? 'bg-zinc-900 text-white font-bold shadow-xs' 
                  : 'text-zinc-600 hover:text-zinc-950 hover:bg-white'
              }`}
            >
              <span>Revenue & Invoices</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-zinc-200 text-zinc-800 font-bold">
                {invoices.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-3.5 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'settings' 
                  ? 'bg-zinc-900 text-white font-bold shadow-xs' 
                  : 'text-zinc-600 hover:text-zinc-950 hover:bg-white'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Settings</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* Quick Action Toolbar */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-zinc-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
              {businessType} · {locationDisplay}
            </span>
            <span className="text-sm sm:text-base font-bold text-zinc-950 mt-0.5">
              Welcome, {ownerDisplayName}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            <button
              onClick={() => {
                resetCustomerForm();
                setModalType('customer');
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-zinc-900 text-white text-xs font-bold hover:bg-zinc-800 transition-all cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" /> Add Client
            </button>
            <button
              onClick={() => {
                resetServiceForm();
                setModalType('service');
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-zinc-900 text-white text-xs font-bold hover:bg-zinc-800 transition-all cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" /> Add Service
            </button>
            <button
              onClick={() => {
                resetAppointmentForm();
                setModalType('appointment');
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              <CalendarDays className="w-3.5 h-3.5" /> Schedule Appointment
            </button>
            <button
              onClick={() => {
                resetFollowupForm();
                setModalType('followup');
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-zinc-950 text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              <Clock className="w-3.5 h-3.5" /> Schedule Follow-up
            </button>
            <button
              onClick={() => setModalType('task')}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Work Order
            </button>
            <button
              onClick={() => setModalType('invoice')}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
            >
              <IndianRupee className="w-3.5 h-3.5" /> Record ₹ Payment
            </button>
          </div>
        </div>

        {/* 1. OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            
            {/* Stat Cards in Indian Rupees ₹ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-6 rounded-3xl bg-white border border-zinc-200 shadow-2xs relative overflow-hidden">
                <div className="flex items-center justify-between text-xs font-bold text-zinc-500">
                  <span>Collected Revenue</span>
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
                    <IndianRupee className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 text-3xl font-extrabold text-zinc-950 tracking-tight">
                  ₹{totalClosedRevenue.toLocaleString('en-IN')}
                </div>
                <div className="mt-1.5 text-xs text-indigo-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Pending: ₹{pendingRevenue.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-white border border-zinc-200 shadow-2xs relative overflow-hidden">
                <div className="flex items-center justify-between text-xs font-bold text-zinc-500">
                  <span>Scheduled Appointments</span>
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-800 flex items-center justify-center">
                    <CalendarCheck className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 text-3xl font-extrabold text-zinc-950 tracking-tight">
                  {scheduledAppointmentsCount}
                </div>
                <div className="mt-1.5 text-xs text-zinc-500 font-medium">
                  Total in CRM: {appointments.length}
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-white border border-zinc-200 shadow-2xs relative overflow-hidden">
                <div className="flex items-center justify-between text-xs font-bold text-zinc-500">
                  <span>Scheduled Follow-ups</span>
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 text-3xl font-extrabold text-zinc-950 tracking-tight">
                  {pendingFollowupsCount}
                </div>
                <div className="mt-1.5 text-xs text-amber-800 font-semibold">
                  Pending service reviews & check-ins
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-white border border-zinc-200 shadow-2xs relative overflow-hidden">
                <div className="flex items-center justify-between text-xs font-bold text-zinc-500">
                  <span>Active Clients</span>
                  <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-800 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 text-3xl font-extrabold text-zinc-950 tracking-tight">
                  {activeClientsCount}
                </div>
                <div className="mt-1.5 text-xs text-zinc-500 font-medium">
                  Total in CRM: {customers.length}
                </div>
              </div>
            </div>

            {/* Fresh Account Welcoming Empty State */}
            {customers.length === 0 && appointments.length === 0 && followups.length === 0 && tasks.length === 0 && (
              <div className="p-8 sm:p-14 rounded-3xl bg-white border border-zinc-200 text-center max-w-2xl mx-auto shadow-xs">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-zinc-900 text-white flex items-center justify-center mb-5 shadow-xs">
                  <Sparkles className="w-7 h-7 text-indigo-400" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-zinc-950">
                  Your Fresh Workspace Is Ready
                </h3>
                <p className="mt-2 text-sm text-zinc-600 leading-relaxed max-w-lg mx-auto">
                  Welcome, <strong className="text-zinc-900">{ownerDisplayName}</strong>. Your workspace for{' '}
                  <strong className="text-zinc-900">{businessDisplayName}</strong> in {locationDisplay} is 100% private and ready to track clients, appointments, follow-ups, and jobs.
                </p>

                <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-left">
                  <button
                    onClick={() => {
                      resetCustomerForm();
                      setModalType('customer');
                    }}
                    className="p-4 rounded-2xl border border-zinc-200 hover:border-zinc-900 bg-zinc-50/50 hover:bg-white transition-all text-xs cursor-pointer"
                  >
                    <span className="font-bold text-zinc-950 block mb-1">1. Add First Client</span>
                    <span className="text-zinc-500">Log customer name, Indian phone number, and address notes.</span>
                  </button>

                  <button
                    onClick={() => {
                      resetAppointmentForm();
                      setModalType('appointment');
                    }}
                    className="p-4 rounded-2xl border border-zinc-200 hover:border-zinc-900 bg-zinc-50/50 hover:bg-white transition-all text-xs cursor-pointer"
                  >
                    <span className="font-bold text-zinc-950 block mb-1">2. Schedule Appointment</span>
                    <span className="text-zinc-500">Book customer service visits with exact dates and time slots.</span>
                  </button>

                  <button
                    onClick={() => {
                      resetFollowupForm();
                      setModalType('followup');
                    }}
                    className="p-4 rounded-2xl border border-zinc-200 hover:border-zinc-900 bg-zinc-50/50 hover:bg-white transition-all text-xs cursor-pointer"
                  >
                    <span className="font-bold text-zinc-950 block mb-1">3. Schedule Follow-up</span>
                    <span className="text-zinc-500">Keep leads warm with post-service check-in visits or calls.</span>
                  </button>
                </div>

                <div className="mt-6 pt-6 border-t border-zinc-100 flex items-center justify-center gap-3">
                  <button
                    onClick={handleLoadSampleData}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
                  >
                    Or load sample data to explore in 1 click
                  </button>
                </div>
              </div>
            )}

            {/* Content Grids */}
            {(customers.length > 0 || appointments.length > 0 || followups.length > 0 || tasks.length > 0) && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Upcoming Appointments Column */}
                <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-2xs flex flex-col">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-100">
                    <div className="flex items-center gap-2">
                      <CalendarCheck className="w-4 h-4 text-blue-600" />
                      <h3 className="font-bold text-base text-zinc-950">Upcoming Appointments</h3>
                    </div>
                    <button
                      onClick={() => {
                        resetAppointmentForm();
                        setModalType('appointment');
                      }}
                      className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add
                    </button>
                  </div>

                  <div className="space-y-3 flex-1">
                    {appointments.slice(0, 4).map((apt) => {
                      const cust = customers.find((c) => c.id === apt.customerId);
                      const serv = services.find((s) => s.id === apt.serviceId);
                      return (
                        <div
                          key={apt.id}
                          className={`p-4 rounded-2xl border transition-all ${
                            apt.status === 'COMPLETED'
                              ? 'bg-zinc-50/80 border-zinc-200 opacity-60'
                              : 'bg-white border-zinc-200 hover:border-zinc-400 shadow-2xs'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="text-xs font-bold text-zinc-900">{cust?.name || 'Customer'}</div>
                              <div className="text-[11px] text-zinc-600 mt-0.5 font-medium">
                                {serv?.serviceName || 'Service'}
                              </div>
                              <div className="text-[11px] text-zinc-500 mt-0.5">
                                {apt.appointmentDate} · {apt.appointmentTime}
                                {apt.endTime ? ` - ${apt.endTime}` : ''}
                              </div>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                                apt.status === 'COMPLETED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : apt.status === 'CANCELLED'
                                  ? 'bg-red-100 text-red-800'
                                  : apt.status === 'NO_SHOW'
                                  ? 'bg-zinc-100 text-zinc-700'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {apt.status}
                            </span>
                          </div>
                          {apt.notes && (
                            <p className="text-xs text-zinc-600 mt-2 line-clamp-2">{apt.notes}</p>
                          )}
                        </div>
                      );
                    })}

                    {appointments.length === 0 && (
                      <div className="text-center py-8 text-xs text-zinc-400">
                        No appointments scheduled. Click Add to book one.
                      </div>
                    )}
                  </div>
                </div>

                {/* Scheduled Follow-ups Column */}
                <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-2xs flex flex-col">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-100">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-600" />
                      <h3 className="font-bold text-base text-zinc-950">Scheduled Follow-ups</h3>
                    </div>
                    <button
                      onClick={() => {
                        resetFollowupForm();
                        setModalType('followup');
                      }}
                      className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add
                    </button>
                  </div>

                  <div className="space-y-3 flex-1">
                    {followups.slice(0, 4).map((fup) => {
                      const cust = customers.find((c) => c.id === fup.customerId);
                      const linkedApt = appointments.find((a) => a.id === fup.appointmentId);
                      return (
                        <div
                          key={fup.id}
                          className={`p-4 rounded-2xl border transition-all ${
                            fup.status === 'COMPLETED'
                              ? 'bg-zinc-50/80 border-zinc-200 opacity-60'
                              : 'bg-white border-zinc-200 hover:border-zinc-400 shadow-2xs'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="text-xs font-bold text-zinc-900">{cust?.name || 'Client'}</div>
                              <div className="text-[11px] text-zinc-500 mt-0.5">
                                Due: {fup.scheduledDate}
                              </div>
                              {linkedApt && (
                                <div className="text-[10px] text-indigo-600 font-semibold mt-0.5">
                                  Linked to Apt ({linkedApt.appointmentDate})
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() =>
                                handleStatusChangeFollowUp(
                                  fup,
                                  fup.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED'
                                )
                              }
                              className={`p-1.5 rounded-lg text-xs cursor-pointer ${
                                fup.status === 'COMPLETED'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                              }`}
                              title="Toggle status"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          </div>
                          {fup.notes && (
                            <p className="text-xs text-zinc-600 mt-2 line-clamp-2">{fup.notes}</p>
                          )}
                          
                          {cust?.phone && (
                            <div className="mt-2.5 pt-2 border-t border-zinc-100 flex items-center gap-2 text-[11px]">
                              <a
                                href={`tel:${cust.phone}`}
                                className="inline-flex items-center gap-1 text-zinc-800 hover:text-black font-bold"
                              >
                                <Phone className="w-3 h-3 text-zinc-600" /> Call
                              </a>
                              <a
                                href={`https://wa.me/${cust.phone.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-green-600 hover:text-green-700 font-bold"
                              >
                                <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                              </a>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {followups.length === 0 && (
                      <div className="text-center py-8 text-xs text-zinc-400">
                        No follow-ups scheduled. Click Add to schedule one.
                      </div>
                    )}
                  </div>
                </div>

                {/* Active Work Orders */}
                <div className="bg-white p-6 rounded-3xl border border-zinc-200/80 shadow-2xs flex flex-col">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-100">
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-indigo-600" />
                      <h3 className="font-bold text-base text-zinc-950">Active Work Orders</h3>
                    </div>
                    <button
                      onClick={() => setModalType('task')}
                      className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add
                    </button>
                  </div>

                  <div className="space-y-3 flex-1">
                    {tasks.slice(0, 4).map((tsk) => (
                      <div
                        key={tsk.id}
                        className="p-4 rounded-2xl border border-zinc-200/80 bg-white hover:border-zinc-400 transition-all shadow-2xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs font-bold text-zinc-900">{tsk.title}</span>
                          <button
                            onClick={() => toggleTaskStatus(tsk.id)}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider cursor-pointer ${
                              tsk.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : tsk.status === 'in-progress'
                                ? 'bg-blue-100 text-blue-900'
                                : 'bg-zinc-100 text-zinc-800'
                            }`}
                          >
                            {tsk.status}
                          </button>
                        </div>
                        <div className="text-[11px] text-zinc-500 mt-1">
                          Client: <span className="font-semibold text-zinc-700">{tsk.customerName}</span> · Due: {tsk.dueDate}
                        </div>
                        {tsk.amount !== undefined && tsk.amount > 0 && (
                          <div className="text-xs font-bold text-zinc-900 mt-2">
                            Estimate: ₹{tsk.amount.toLocaleString('en-IN')}
                          </div>
                        )}
                      </div>
                    ))}

                    {tasks.length === 0 && (
                      <div className="text-center py-8 text-xs text-zinc-400">
                        No active work orders yet.
                      </div>
                    )}
                  </div>
                </div>

                {/* Clients Quick Peek */}
                <div className="bg-white p-6 rounded-3xl border border-zinc-200/80 shadow-2xs flex flex-col">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-100">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-700" />
                      <h3 className="font-bold text-base text-zinc-950">Recent Clients</h3>
                    </div>
                    <button
                      onClick={() => setModalType('customer')}
                      className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add
                    </button>
                  </div>

                  <div className="space-y-3 flex-1">
                    {customers.slice(0, 4).map((cust) => (
                      <div
                        key={cust.id}
                        className="p-4 rounded-2xl border border-zinc-200/80 bg-white hover:border-zinc-400 transition-all shadow-2xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-zinc-900">{cust.name}</span>
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-800">
                            {cust.status}
                          </span>
                        </div>
                        {cust.company && (
                          <div className="text-[11px] text-zinc-500 mt-0.5">{cust.company}</div>
                        )}
                        <div className="mt-2 flex items-center justify-between text-xs">
                          <span className="font-mono text-zinc-600 text-[11px]">{cust.phone || '—'}</span>
                          <span className="font-bold text-zinc-950">
                            {cust.totalValue ? `₹${cust.totalValue.toLocaleString('en-IN')}` : 'Active'}
                          </span>
                        </div>
                      </div>
                    ))}

                    {customers.length === 0 && (
                      <div className="text-center py-8 text-xs text-zinc-400">
                        No clients saved yet.
                      </div>
                    )}
                  </div>
                </div>

              </div>
            )}
          </div>
        )}

        {/* 2. CLIENTS TAB (Cloud Firestore) */}
        {activeTab === 'clients' && (
          <div className="space-y-4">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-3xl border border-zinc-200/80 shadow-2xs">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search clients by name, phone..."
                  className="w-full pl-10 pr-3 py-2.5 text-xs sm:text-sm rounded-xl border border-zinc-300 focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 outline-none"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-xs font-bold rounded-xl border border-zinc-300 px-3 py-2.5 outline-none bg-white"
                >
                  <option value="all">All Clients ({customers.length})</option>
                  <option value="lead">Leads</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                </select>

                <button
                  onClick={() => {
                    resetCustomerForm();
                    setModalType('customer');
                  }}
                  className="ml-auto sm:ml-0 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-zinc-900 text-white text-xs font-bold hover:bg-zinc-800 transition-colors whitespace-nowrap cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Client
                </button>
              </div>
            </div>

            {customersLoading && (
              <div className="bg-white p-12 text-center rounded-3xl border border-zinc-200/80 shadow-2xs">
                <div className="w-8 h-8 border-3 border-zinc-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs font-semibold text-zinc-600">Loading clients from Cloud Firestore...</p>
              </div>
            )}

            {customersError && (
              <div className="bg-red-50 p-4 rounded-2xl border border-red-200 text-red-800 text-xs">
                <p className="font-bold">Firestore Error: {customersError}</p>
              </div>
            )}

            {/* Clients List */}
            {!customersLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCustomers.map((c) => (
                  <div key={c.id} className="bg-white p-5 rounded-3xl border border-zinc-200/80 shadow-2xs flex flex-col justify-between hover:border-zinc-400 transition-all">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-base text-zinc-950">{c.name}</h4>
                          {c.company && <p className="text-xs text-zinc-500 mt-0.5">{c.company}</p>}
                        </div>
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md ${
                          c.status === 'active' ? 'bg-green-100 text-green-800' :
                          c.status === 'lead' ? 'bg-amber-100 text-amber-800' : 'bg-zinc-100 text-zinc-700'
                        }`}>
                          {c.status || 'Client'}
                        </span>
                      </div>

                      <div className="mt-3.5 space-y-1.5 text-xs text-zinc-600">
                        {c.phone && (
                          <div className="flex items-center gap-2 font-mono">
                            <Phone className="w-3.5 h-3.5 text-zinc-400" />
                            <span>{c.phone}</span>
                          </div>
                        )}
                        {c.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-3.5 h-3.5 text-zinc-400" />
                            <span className="truncate">{c.email}</span>
                          </div>
                        )}
                        {c.notes && (
                          <p className="mt-2 text-zinc-600 italic text-[11px] bg-zinc-50 p-2.5 rounded-xl border border-zinc-200/50">
                            &ldquo;{c.notes}&rdquo;
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-zinc-100 flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-950">
                        {c.totalValue ? `Value: ₹${c.totalValue.toLocaleString('en-IN')}` : 'Client Profile'}
                      </span>

                      <div className="flex items-center gap-1.5">
                        {c.phone && (
                          <>
                            <a
                              href={`tel:${c.phone}`}
                              className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 transition-colors"
                              title="Call Client"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                            <a
                              href={`https://wa.me/${c.phone.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-2 rounded-xl bg-green-50 hover:bg-green-100 text-green-700 transition-colors"
                              title="WhatsApp Client"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </a>
                          </>
                        )}
                        <button
                          onClick={() => {
                            resetFollowupForm();
                            setFupCustomerId(c.id);
                            setModalType('followup');
                          }}
                          className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 transition-colors cursor-pointer"
                          title="Schedule Follow-up"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openEditCustomer(c)}
                          className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 transition-colors cursor-pointer"
                          title="Edit Client"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCustomer(c.id)}
                          className="p-2 rounded-xl hover:bg-red-50 text-zinc-400 hover:text-red-600 transition-colors cursor-pointer"
                          title="Delete Client"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {filteredCustomers.length === 0 && (
                  <div className="col-span-full bg-white p-12 text-center rounded-3xl border border-zinc-200/80 shadow-2xs">
                    <Users className="w-10 h-10 text-zinc-400 mx-auto mb-3" />
                    <h4 className="font-bold text-base text-zinc-900">No clients match your criteria</h4>
                    <p className="text-xs text-zinc-500 mt-1">Add your clients or adjust the search filter.</p>
                    <button
                      onClick={() => {
                        resetCustomerForm();
                        setModalType('customer');
                      }}
                      className="mt-4 px-5 py-2.5 bg-zinc-900 text-white rounded-xl text-xs font-bold hover:bg-zinc-800 cursor-pointer"
                    >
                      Add Client Now
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 2B. SERVICES TAB (Cloud Firestore) */}
        {activeTab === 'services' && (
          <div className="space-y-4">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-3xl border border-zinc-200/80 shadow-2xs">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  value={searchServiceTerm}
                  onChange={(e) => setSearchServiceTerm(e.target.value)}
                  placeholder="Search services by name, description..."
                  className="w-full pl-10 pr-3 py-2.5 text-xs sm:text-sm rounded-xl border border-zinc-300 focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 outline-none"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={serviceStatusFilter}
                  onChange={(e) => setServiceStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                  className="text-xs font-bold rounded-xl border border-zinc-300 px-3 py-2.5 outline-none bg-white"
                >
                  <option value="all">All Services ({services.length})</option>
                  <option value="active">Active Only ({services.filter((s) => s.isActive).length})</option>
                  <option value="inactive">Inactive Only ({services.filter((s) => !s.isActive).length})</option>
                </select>

                <button
                  onClick={() => {
                    resetServiceForm();
                    setModalType('service');
                  }}
                  className="ml-auto sm:ml-0 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-zinc-900 text-white text-xs font-bold hover:bg-zinc-800 transition-colors whitespace-nowrap cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Service
                </button>
              </div>
            </div>

            {servicesLoading && (
              <div className="bg-white p-12 text-center rounded-3xl border border-zinc-200/80 shadow-2xs">
                <div className="w-8 h-8 border-3 border-zinc-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs font-semibold text-zinc-600">Loading services from Cloud Firestore...</p>
              </div>
            )}

            {servicesError && (
              <div className="bg-red-50 p-4 rounded-2xl border border-red-200 text-red-800 text-xs">
                <p className="font-bold">Firestore Error: {servicesError}</p>
              </div>
            )}

            {/* Services List Grid */}
            {!servicesLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredServices.map((s) => (
                  <div key={s.id} className="bg-white p-5 rounded-3xl border border-zinc-200/80 shadow-2xs flex flex-col justify-between hover:border-zinc-400 transition-all">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 pr-2">
                          <h4 className="font-bold text-base text-zinc-950">{s.serviceName}</h4>
                        </div>
                        <span className={`text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 ${
                          s.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-100 text-zinc-600'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${s.isActive ? 'bg-emerald-600' : 'bg-zinc-400'}`} />
                          {s.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>

                      {s.description ? (
                        <p className="mt-2.5 text-xs text-zinc-600 line-clamp-3 leading-relaxed">
                          {s.description}
                        </p>
                      ) : (
                        <p className="mt-2.5 text-xs text-zinc-400 italic">
                          No service description provided.
                        </p>
                      )}

                      <div className="mt-4 pt-3 border-t border-zinc-100 grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-zinc-50 p-2.5 rounded-xl border border-zinc-100">
                          <span className="text-[10px] uppercase font-bold text-zinc-500 block">Duration</span>
                          <span className="font-semibold text-zinc-900 mt-0.5 block">
                            {s.durationMinutes ? `${s.durationMinutes} mins` : 'Flexible'}
                          </span>
                        </div>
                        <div className="bg-zinc-50 p-2.5 rounded-xl border border-zinc-100">
                          <span className="text-[10px] uppercase font-bold text-zinc-500 block">Follow-up Cadence</span>
                          <span className="font-semibold text-zinc-900 mt-0.5 block">
                            {s.typicalIntervalDays ? `Every ${s.typicalIntervalDays} days` : 'On Demand'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-zinc-100 flex items-center justify-between">
                      <span className="text-sm font-extrabold text-zinc-950">
                        {s.basePrice ? `₹${s.basePrice.toLocaleString('en-IN')}` : 'Custom Quote'}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleToggleServiceActive(s)}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                            s.isActive 
                              ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700' 
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800'
                          }`}
                          title={s.isActive ? 'Deactivate Service' : 'Activate Service'}
                        >
                          {s.isActive ? 'Pause' : 'Activate'}
                        </button>
                        <button
                          onClick={() => openEditService(s)}
                          className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 transition-colors cursor-pointer"
                          title="Edit Service"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteService(s.id)}
                          className="p-2 rounded-xl hover:bg-red-50 text-zinc-400 hover:text-red-600 transition-colors cursor-pointer"
                          title="Delete Service"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {filteredServices.length === 0 && (
                  <div className="col-span-full bg-white p-12 text-center rounded-3xl border border-zinc-200/80 shadow-2xs">
                    <Briefcase className="w-10 h-10 text-zinc-400 mx-auto mb-3" />
                    <h4 className="font-bold text-base text-zinc-900">No services match your criteria</h4>
                    <p className="text-xs text-zinc-500 mt-1">Add your trade services, packages, and pricing to organize your offerings.</p>
                    <button
                      onClick={() => {
                        resetServiceForm();
                        setModalType('service');
                      }}
                      className="mt-4 px-5 py-2.5 bg-zinc-900 text-white rounded-xl text-xs font-bold hover:bg-zinc-800 cursor-pointer"
                    >
                      Add Service Now
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 2C. APPOINTMENTS TAB (Cloud Firestore) */}
        {activeTab === 'appointments' && (
          <div className="space-y-4">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-3xl border border-zinc-200/80 shadow-2xs">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  value={searchAppointmentTerm}
                  onChange={(e) => setSearchAppointmentTerm(e.target.value)}
                  placeholder="Search by client, service, date..."
                  className="w-full pl-10 pr-3 py-2.5 text-xs sm:text-sm rounded-xl border border-zinc-300 focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 outline-none"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={appointmentStatusFilter}
                  onChange={(e) => setAppointmentStatusFilter(e.target.value as 'all' | AppointmentStatus)}
                  className="text-xs font-bold rounded-xl border border-zinc-300 px-3 py-2.5 outline-none bg-white"
                >
                  <option value="all">All Statuses ({appointments.length})</option>
                  <option value="SCHEDULED">Scheduled ({appointments.filter(a => a.status === 'SCHEDULED').length})</option>
                  <option value="COMPLETED">Completed ({appointments.filter(a => a.status === 'COMPLETED').length})</option>
                  <option value="CANCELLED">Cancelled ({appointments.filter(a => a.status === 'CANCELLED').length})</option>
                  <option value="NO_SHOW">No Show ({appointments.filter(a => a.status === 'NO_SHOW').length})</option>
                </select>

                <button
                  onClick={() => {
                    resetAppointmentForm();
                    setModalType('appointment');
                  }}
                  className="ml-auto sm:ml-0 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors whitespace-nowrap cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" /> Schedule Appointment
                </button>
              </div>
            </div>

            {appointmentsLoading && (
              <div className="bg-white p-12 text-center rounded-3xl border border-zinc-200/80 shadow-2xs">
                <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs font-semibold text-zinc-600">Loading appointments from Cloud Firestore...</p>
              </div>
            )}

            {appointmentsError && (
              <div className="bg-red-50 p-4 rounded-2xl border border-red-200 text-red-800 text-xs">
                <p className="font-bold">Firestore Error: {appointmentsError}</p>
              </div>
            )}

            {!appointmentsLoading && (
              <div className="space-y-3">
                {filteredAppointments.map((apt) => {
                  const cust = customers.find((c) => c.id === apt.customerId);
                  const serv = services.find((s) => s.id === apt.serviceId);
                  return (
                    <div
                      key={apt.id}
                      className={`p-5 rounded-3xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                        apt.status === 'COMPLETED'
                          ? 'bg-zinc-50/80 border-zinc-200'
                          : apt.status === 'CANCELLED'
                          ? 'bg-red-50/20 border-zinc-200 opacity-75'
                          : 'bg-white border-zinc-200/80 hover:border-zinc-400 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex flex-col items-center justify-center shrink-0 border border-blue-100">
                          <CalendarDays className="w-5 h-5" />
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-bold text-sm sm:text-base text-zinc-950">
                              {cust?.name || 'Unknown Client'}
                            </h4>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                                apt.status === 'COMPLETED'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : apt.status === 'CANCELLED'
                                  ? 'bg-red-100 text-red-800 border border-red-200'
                                  : apt.status === 'NO_SHOW'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                  : 'bg-blue-100 text-blue-800 border border-blue-200'
                              }`}
                            >
                              {apt.status}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-zinc-600">
                            <span className="font-semibold text-zinc-900">
                              {serv?.serviceName || 'Custom Service'}
                            </span>
                            <span>
                              📅 {apt.appointmentDate} · ⏰ {apt.appointmentTime}
                              {apt.endTime ? ` – ${apt.endTime}` : ''}
                            </span>
                            {serv?.basePrice ? (
                              <span className="font-bold text-zinc-950">
                                ₹{serv.basePrice.toLocaleString('en-IN')}
                              </span>
                            ) : null}
                          </div>

                          {apt.notes && (
                            <p className="text-xs text-zinc-600 mt-2 bg-zinc-50 p-2.5 rounded-xl border border-zinc-100 leading-relaxed">
                              {apt.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 self-end md:self-center shrink-0">
                        {apt.status === 'SCHEDULED' && (
                          <button
                            onClick={() => handleStatusChangeAppointment(apt, 'COMPLETED')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
                            title="Mark as completed & check follow-up"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Mark Completed
                          </button>
                        )}

                        <select
                          value={apt.status}
                          onChange={(e) => handleStatusChangeAppointment(apt, e.target.value as AppointmentStatus)}
                          className="text-xs font-bold rounded-xl border border-zinc-300 px-2.5 py-1.5 bg-white text-zinc-800 outline-none cursor-pointer"
                        >
                          <option value="SCHEDULED">SCHEDULED</option>
                          <option value="COMPLETED">COMPLETED</option>
                          <option value="CANCELLED">CANCELLED</option>
                          <option value="NO_SHOW">NO_SHOW</option>
                        </select>

                        <button
                          onClick={() => openEditAppointment(apt)}
                          className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 transition-colors cursor-pointer"
                          title="Edit Appointment"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDeleteAppointment(apt.id)}
                          className="p-2 rounded-xl hover:bg-red-50 text-zinc-400 hover:text-red-600 transition-colors cursor-pointer"
                          title="Delete Appointment"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {filteredAppointments.length === 0 && (
                  <div className="bg-white p-12 text-center rounded-3xl border border-zinc-200/80 shadow-2xs">
                    <CalendarCheck className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
                    <h4 className="font-bold text-base text-zinc-900">No appointments found</h4>
                    <p className="text-xs text-zinc-500 mt-1">Book client service calls, on-site visits, and maintenance appointments.</p>
                    <button
                      onClick={() => {
                        resetAppointmentForm();
                        setModalType('appointment');
                      }}
                      className="mt-4 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Schedule Appointment Now
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 3. FOLLOW-UPS TAB (Cloud Firestore) */}
        {activeTab === 'followups' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-3xl border border-zinc-200/80 shadow-2xs">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  value={searchFollowupTerm}
                  onChange={(e) => setSearchFollowupTerm(e.target.value)}
                  placeholder="Search follow-ups by client, notes..."
                  className="w-full pl-10 pr-3 py-2.5 text-xs sm:text-sm rounded-xl border border-zinc-300 focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 outline-none"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={followupStatusFilter}
                  onChange={(e) => setFollowupStatusFilter(e.target.value as 'all' | FollowUpStatus)}
                  className="text-xs font-bold rounded-xl border border-zinc-300 px-3 py-2.5 outline-none bg-white"
                >
                  <option value="all">All Follow-ups ({followups.length})</option>
                  <option value="PENDING">Pending ({pendingFollowupsCount})</option>
                  <option value="COMPLETED">Completed ({followups.filter(f => f.status === 'COMPLETED').length})</option>
                  <option value="CANCELLED">Cancelled ({followups.filter(f => f.status === 'CANCELLED').length})</option>
                </select>

                <button
                  onClick={() => {
                    resetFollowupForm();
                    setModalType('followup');
                  }}
                  className="ml-auto sm:ml-0 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-zinc-950 text-xs font-bold transition-colors whitespace-nowrap shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Follow-up
                </button>
              </div>
            </div>

            {followupsLoading && (
              <div className="bg-white p-12 text-center rounded-3xl border border-zinc-200/80 shadow-2xs">
                <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs font-semibold text-zinc-600">Loading follow-ups from Cloud Firestore...</p>
              </div>
            )}

            {followupsError && (
              <div className="bg-red-50 p-4 rounded-2xl border border-red-200 text-red-800 text-xs">
                <p className="font-bold">Firestore Error: {followupsError}</p>
              </div>
            )}

            {!followupsLoading && (
              <div className="space-y-3">
                {filteredFollowups.map((fup) => {
                  const cust = customers.find((c) => c.id === fup.customerId);
                  const linkedApt = appointments.find((a) => a.id === fup.appointmentId);
                  const linkedServ = linkedApt ? services.find((s) => s.id === linkedApt.serviceId) : null;
                  return (
                    <div
                      key={fup.id}
                      className={`p-5 rounded-3xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                        fup.status === 'COMPLETED'
                          ? 'bg-zinc-50/80 border-zinc-200 opacity-60'
                          : fup.status === 'CANCELLED'
                          ? 'bg-red-50/20 border-zinc-200 opacity-75'
                          : 'bg-white border-zinc-200/80 hover:border-zinc-400 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-start gap-3.5">
                        <button
                          onClick={() =>
                            handleStatusChangeFollowUp(
                              fup,
                              fup.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED'
                            )
                          }
                          className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                            fup.status === 'COMPLETED'
                              ? 'bg-green-600 text-white'
                              : 'border border-zinc-300 text-transparent hover:border-zinc-900'
                          }`}
                          title="Toggle completed"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-sm text-zinc-950">
                              {cust?.name || 'Unknown Client'}
                            </span>
                            <span
                              className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md ${
                                fup.status === 'COMPLETED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : fup.status === 'CANCELLED'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-amber-100 text-amber-900'
                              }`}
                            >
                              {fup.status}
                            </span>
                            <span className="text-xs text-zinc-500 font-medium">
                              Scheduled: {fup.scheduledDate}
                            </span>
                          </div>

                          {linkedApt && (
                            <div className="text-[11px] text-indigo-700 font-medium mt-1 flex items-center gap-1">
                              <CalendarCheck className="w-3 h-3 text-indigo-600" />
                              <span>
                                Linked to appointment on {linkedApt.appointmentDate}
                                {linkedServ ? ` (${linkedServ.serviceName})` : ''}
                              </span>
                            </div>
                          )}

                          {fup.notes && (
                            <p className="text-xs text-zinc-600 mt-1 leading-relaxed">
                              {fup.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        {cust?.phone && (
                          <>
                            <a
                              href={`tel:${cust.phone}`}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-900 text-xs font-bold"
                            >
                              <Phone className="w-3.5 h-3.5" /> Call
                            </a>
                            <a
                              href={`https://wa.me/${cust.phone.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-green-50 hover:bg-green-100 text-green-800 text-xs font-bold"
                            >
                              <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                            </a>
                          </>
                        )}

                        <button
                          onClick={() => openEditFollowup(fup)}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 cursor-pointer"
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDeleteFollowUp(fup.id)}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {filteredFollowups.length === 0 && (
                  <div className="bg-white p-12 text-center rounded-3xl border border-zinc-200/80 shadow-2xs">
                    <Calendar className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
                    <h4 className="font-bold text-base text-zinc-900">No follow-ups found</h4>
                    <p className="text-xs text-zinc-500 mt-1">Keep client leads warm by scheduling timely follow-ups.</p>
                    <button
                      onClick={() => {
                        resetFollowupForm();
                        setModalType('followup');
                      }}
                      className="mt-4 px-5 py-2.5 bg-amber-500 text-zinc-950 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Add Follow-up Now
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 4. TASKS / WORK ORDERS TAB */}
        {activeTab === 'tasks' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-3xl border border-zinc-200 shadow-2xs">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search work orders..."
                  className="w-full pl-10 pr-3 py-2.5 text-xs sm:text-sm rounded-xl border border-zinc-300 focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 outline-none"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-xs font-bold rounded-xl border border-zinc-300 px-3 py-2.5 outline-none bg-white"
                >
                  <option value="all">All Statuses ({tasks.length})</option>
                  <option value="pending">Pending ({activeTasksCount})</option>
                  <option value="in-progress">In-Progress</option>
                  <option value="completed">Completed</option>
                </select>

                <button
                  onClick={() => setModalType('task')}
                  className="ml-auto sm:ml-0 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-zinc-900 text-white text-xs font-bold hover:bg-zinc-800 transition-colors whitespace-nowrap cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Work Order
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {filteredTasks.map((tsk) => (
                <div
                  key={tsk.id}
                  className="bg-white p-5 rounded-3xl border border-zinc-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-zinc-400 transition-all"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm text-zinc-950">{tsk.title}</span>
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md ${
                        tsk.priority === 'high' ? 'bg-red-100 text-red-800' :
                        tsk.priority === 'medium' ? 'bg-amber-100 text-amber-900' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {tsk.priority} Priority
                      </span>
                    </div>
                    <div className="text-xs text-zinc-500 mt-1">
                      Client: <span className="font-semibold text-zinc-700">{tsk.customerName}</span> · Due: {tsk.dueDate}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    {tsk.amount !== undefined && tsk.amount > 0 && (
                      <span className="text-xs font-bold text-zinc-950 whitespace-nowrap">
                        ₹{tsk.amount.toLocaleString('en-IN')}
                      </span>
                    )}

                    <button
                      onClick={() => toggleTaskStatus(tsk.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-colors cursor-pointer ${
                        tsk.status === 'completed'
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : tsk.status === 'in-progress'
                          ? 'bg-blue-100 text-blue-900 hover:bg-blue-200'
                          : 'bg-zinc-100 text-zinc-800 hover:bg-zinc-200'
                      }`}
                    >
                      {tsk.status}
                    </button>

                    <button
                      onClick={() => deleteTask(tsk.id)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {filteredTasks.length === 0 && (
                <div className="bg-white p-12 text-center rounded-3xl border border-zinc-200 shadow-2xs">
                  <Briefcase className="w-10 h-10 text-zinc-400 mx-auto mb-3" />
                  <h4 className="font-bold text-base text-zinc-900">No work orders recorded</h4>
                  <p className="text-xs text-zinc-500 mt-1">Create work orders to keep field jobs on track.</p>
                  <button
                    onClick={() => setModalType('task')}
                    className="mt-4 px-5 py-2.5 bg-zinc-900 text-white rounded-xl text-xs font-bold hover:bg-zinc-800 cursor-pointer"
                  >
                    Add Work Order
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 5. INVOICES / REVENUE TAB */}
        {activeTab === 'invoices' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-6 rounded-3xl bg-white border border-zinc-200 shadow-2xs">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Total Collected</span>
                <div className="text-3xl font-extrabold text-zinc-950 mt-1">
                  ₹{totalClosedRevenue.toLocaleString('en-IN')}
                </div>
              </div>
              <div className="p-6 rounded-3xl bg-white border border-zinc-200 shadow-2xs">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Pending Outstanding</span>
                <div className="text-3xl font-extrabold text-amber-700 mt-1">
                  ₹{pendingRevenue.toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between bg-white p-4 sm:p-5 rounded-3xl border border-zinc-200 shadow-2xs">
              <span className="text-sm font-bold text-zinc-950">Invoices & Payment Records</span>
              <button
                onClick={() => setModalType('invoice')}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-zinc-900 text-white text-xs font-bold hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Record Invoice
              </button>
            </div>

            <div className="space-y-3">
              {invoices.map((inv) => (
                <div
                  key={inv.id}
                  className="bg-white p-5 rounded-3xl border border-zinc-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-zinc-400 transition-all"
                >
                  <div>
                    <span className="font-bold text-sm text-zinc-950">{inv.customerName}</span>
                    <p className="text-xs text-zinc-600 mt-0.5">{inv.description}</p>
                    <span className="text-[11px] text-zinc-400 mt-1 block font-mono">Date: {inv.date}</span>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <span className="text-base font-bold text-zinc-950">
                      ₹{inv.amount.toLocaleString('en-IN')}
                    </span>

                    <button
                      onClick={() => toggleInvoiceStatus(inv.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-colors cursor-pointer ${
                        inv.status === 'paid'
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                      }`}
                    >
                      {inv.status}
                    </button>
                  </div>
                </div>
              ))}

              {invoices.length === 0 && (
                <div className="bg-white p-12 text-center rounded-3xl border border-zinc-200 shadow-2xs">
                  <IndianRupee className="w-10 h-10 text-zinc-400 mx-auto mb-3" />
                  <h4 className="font-bold text-base text-zinc-900">No invoices or payments logged</h4>
                  <p className="text-xs text-zinc-500 mt-1">Record client payments to track your closed revenue in ₹.</p>
                  <button
                    onClick={() => setModalType('invoice')}
                    className="mt-4 px-5 py-2.5 bg-zinc-900 text-white rounded-xl text-xs font-bold hover:bg-zinc-800 cursor-pointer"
                  >
                    Record First Invoice
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 6. SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="max-w-4xl mx-auto space-y-6">
            
            {/* Quick Actions Card */}
            <div className="bg-white p-6 sm:p-7 rounded-3xl border border-zinc-200 shadow-2xs">
              <h3 className="text-base font-bold text-zinc-950 mb-1">Quick Workspace Operations</h3>
              <p className="text-xs text-zinc-500 mb-4">Direct shortcuts to add records to your workspace.</p>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <button
                  onClick={() => setModalType('customer')}
                  className="p-4 rounded-2xl border border-zinc-200 hover:border-zinc-900 bg-zinc-50 text-left transition-all cursor-pointer"
                >
                  <Users className="w-4.5 h-4.5 text-blue-700 mb-2" />
                  <span className="text-xs font-bold text-zinc-900 block">+ Add Client</span>
                  <span className="text-[10px] text-zinc-500">Log new customer</span>
                </button>

                <button
                  onClick={() => setModalType('followup')}
                  className="p-4 rounded-2xl border border-zinc-200 hover:border-zinc-900 bg-zinc-50 text-left transition-all cursor-pointer"
                >
                  <Calendar className="w-4.5 h-4.5 text-amber-600 mb-2" />
                  <span className="text-xs font-bold text-zinc-900 block">+ Add Follow-up</span>
                  <span className="text-[10px] text-zinc-500">Calls & WhatsApp</span>
                </button>

                <button
                  onClick={() => setModalType('task')}
                  className="p-4 rounded-2xl border border-zinc-200 hover:border-zinc-900 bg-zinc-50 text-left transition-all cursor-pointer"
                >
                  <Briefcase className="w-4.5 h-4.5 text-purple-700 mb-2" />
                  <span className="text-xs font-bold text-zinc-900 block">+ Work Order</span>
                  <span className="text-[10px] text-zinc-500">Track field tasks</span>
                </button>

                <button
                  onClick={() => setModalType('invoice')}
                  className="p-4 rounded-2xl border border-zinc-200 hover:border-zinc-900 bg-zinc-50 text-left transition-all cursor-pointer"
                >
                  <IndianRupee className="w-4.5 h-4.5 text-indigo-600 mb-2" />
                  <span className="text-xs font-bold text-zinc-900 block">+ Record Invoice</span>
                  <span className="text-[10px] text-zinc-500">Log ₹ payments</span>
                </button>
              </div>
            </div>

            {/* Business Profile Settings Form */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-zinc-200 shadow-2xs">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-100">
                <div>
                  <h3 className="text-lg font-bold text-zinc-950">Business Profile & Credentials</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Update your business name, trade category, location, and owner contact details.
                  </p>
                </div>
                {settingsSaved && (
                  <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
                    Saved Successfully!
                  </span>
                )}
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">Business Name</label>
                    <input
                      type="text"
                      required
                      value={editBizName}
                      onChange={(e) => setEditBizName(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-zinc-300 focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">Owner / Contact Name</label>
                    <input
                      type="text"
                      required
                      value={editOwnerName}
                      onChange={(e) => setEditOwnerName(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-zinc-300 focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">Phone Number (+91)</label>
                    <input
                      type="tel"
                      required
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-zinc-300 focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">Business Type / Category</label>
                    <input
                      type="text"
                      required
                      list="settings-biz-types"
                      value={editBizType}
                      onChange={(e) => setEditBizType(e.target.value)}
                      placeholder="e.g. Dental Clinic & Oral Care, Painting & Wall Finishes..."
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-zinc-300 focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 outline-none"
                    />
                    <datalist id="settings-biz-types">
                      {ALL_BUSINESS_TYPES.map((type) => (
                        <option key={type} value={type} />
                      ))}
                    </datalist>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-zinc-700 mb-1">Business Location (City / State)</label>
                    <input
                      type="text"
                      required
                      value={editLocation}
                      onChange={(e) => setEditLocation(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-zinc-300 focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2 pt-2 border-t border-zinc-100">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-xl bg-zinc-50 border border-zinc-200">
                      <div>
                        <span className="block text-xs font-bold text-zinc-800">Verification Status</span>
                        <span className="text-[11px] text-zinc-500">Business credentials & license review</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {business?.verificationStatus === 'VERIFIED' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            Verified Business Account
                          </span>
                        ) : business?.verificationStatus === 'REJECTED' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                            <X className="w-3.5 h-3.5 text-red-600" />
                            Verification Rejected
                          </span>
                        ) : business?.verificationStatus === 'SUSPENDED' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-zinc-100 text-zinc-700 border border-zinc-300">
                            Account Suspended
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            Verification pending
                          </span>
                        )}
                        <span className="text-[10px] text-zinc-400 font-medium hidden sm:inline">(Managed by Administrator)</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3">
                  <button
                    type="submit"
                    disabled={settingsLoading}
                    className="px-6 py-3 rounded-xl bg-zinc-900 text-white text-xs font-bold hover:bg-zinc-800 transition-all disabled:opacity-60 cursor-pointer shadow-xs"
                  >
                    {settingsLoading ? 'Saving...' : 'Save Profile Changes'}
                  </button>
                </div>
              </form>
            </div>

            {/* Cryptographic Data Isolation Verification Card */}
            <div className="bg-white p-6 sm:p-7 rounded-3xl border border-indigo-200/80 shadow-2xs">
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-zinc-950">
                    Data Isolation & Multi-Tenant Security Status: ACTIVE
                  </h4>
                  <p className="text-xs text-zinc-600 mt-1 leading-relaxed">
                    Firestore security rules enforce that your documents (located at{' '}
                    <code className="bg-zinc-100 px-1 py-0.5 rounded text-[11px] font-mono text-zinc-900">
                      businesses/{user?.uid}
                    </code>
                    ) can only be read or written by your authenticated UID.
                  </p>
                  <p className="text-xs text-zinc-600 mt-2 leading-relaxed">
                    Even if another business is registered in the exact same location (<strong>{locationDisplay}</strong>) with the same trade type (<strong>{businessType}</strong>), they have zero read or query access to your clients, tasks, or revenue.
                  </p>
                </div>
              </div>
            </div>

            {/* Workspace Data Management */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-200/80 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-zinc-950">Reset Workspace Data</h4>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Clear all sample or current records to start with a fresh blank canvas.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleLoadSampleData}
                  className="px-4 py-2.5 rounded-xl border border-zinc-300 text-zinc-800 hover:bg-zinc-50 text-xs font-bold cursor-pointer"
                >
                  Load Sample Data
                </button>
                <button
                  onClick={handleResetWorkspace}
                  className="px-4 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold cursor-pointer"
                >
                  Clear Workspace
                </button>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* MODAL 1: ADD CLIENT (Cloud Firestore) */}
      <AnimatePresence>
        {modalType === 'customer' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-zinc-200"
            >
              <div className="flex items-center justify-between mb-5 pb-3 border-b border-zinc-100">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-lg text-zinc-950">Add New Client</h3>
                </div>
                <button onClick={() => setModalType(null)} className="p-1 rounded-lg hover:bg-zinc-100 text-zinc-400 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {custModalError && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs">
                  {custModalError}
                </div>
              )}

              <form onSubmit={handleAddCustomer} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Client Full Name *</label>
                  <input
                    type="text"
                    required
                    value={newCustName}
                    onChange={(e) => setNewCustName(e.target.value)}
                    placeholder="e.g. Suresh Patel"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-zinc-300 focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">Phone Number (+91)</label>
                    <input
                      type="tel"
                      value={newCustPhone}
                      onChange={(e) => setNewCustPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-zinc-300 focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={newCustEmail}
                      onChange={(e) => setNewCustEmail(e.target.value)}
                      placeholder="client@example.in"
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-zinc-300 focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Client Notes / Requirements</label>
                  <textarea
                    rows={3}
                    value={newCustNotes}
                    onChange={(e) => setNewCustNotes(e.target.value)}
                    placeholder="e.g. Commercial panel maintenance history, building supervisor contact..."
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-zinc-300 focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 outline-none resize-none"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-600 hover:bg-zinc-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={custActionLoading}
                    className="px-6 py-2.5 rounded-xl bg-zinc-900 text-white text-xs font-bold hover:bg-zinc-800 disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    {custActionLoading ? 'Saving...' : 'Save to Firestore'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 1B: EDIT CLIENT (Cloud Firestore) */}
      <AnimatePresence>
        {modalType === 'edit_customer' && editingCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-zinc-200"
            >
              <div className="flex items-center justify-between mb-5 pb-3 border-b border-zinc-100">
                <div className="flex items-center gap-2">
                  <Pencil className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-lg text-zinc-950">Edit Client Details</h3>
                </div>
                <button onClick={() => setModalType(null)} className="p-1 rounded-lg hover:bg-zinc-100 text-zinc-400 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {custModalError && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs">
                  {custModalError}
                </div>
              )}

              <form onSubmit={handleEditCustomer} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Client Full Name *</label>
                  <input
                    type="text"
                    required
                    value={editCustName}
                    onChange={(e) => setEditCustName(e.target.value)}
                    placeholder="e.g. Suresh Patel"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-zinc-300 focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">Phone Number (+91)</label>
                    <input
                      type="tel"
                      value={editCustPhone}
                      onChange={(e) => setEditCustPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-zinc-300 focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={editCustEmail}
                      onChange={(e) => setEditCustEmail(e.target.value)}
                      placeholder="client@example.in"
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-zinc-300 focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Client Notes / Requirements</label>
                  <textarea
                    rows={3}
                    value={editCustNotes}
                    onChange={(e) => setEditCustNotes(e.target.value)}
                    placeholder="e.g. Commercial panel maintenance history..."
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-zinc-300 focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 outline-none resize-none"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-600 hover:bg-zinc-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={custActionLoading}
                    className="px-6 py-2.5 rounded-xl bg-zinc-900 text-white text-xs font-bold hover:bg-zinc-800 disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    {custActionLoading ? 'Saving...' : 'Update Client'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: ADD SERVICE (Cloud Firestore) */}
      <AnimatePresence>
        {modalType === 'service' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-zinc-200"
            >
              <div className="flex items-center justify-between mb-5 pb-3 border-b border-zinc-100">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-lg text-zinc-950">Add New Service</h3>
                </div>
                <button onClick={() => setModalType(null)} className="p-1 rounded-lg hover:bg-zinc-100 text-zinc-400 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {servModalError && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs">
                  {servModalError}
                </div>
              )}

              <form onSubmit={handleAddService} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Service Display Name *</label>
                  <input
                    type="text"
                    required
                    value={newServName}
                    onChange={(e) => setNewServName(e.target.value)}
                    placeholder="e.g. 3-Phase Commercial DB Overhaul"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-zinc-300 focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Service Scope & Description</label>
                  <textarea
                    rows={2}
                    value={newServDesc}
                    onChange={(e) => setNewServDesc(e.target.value)}
                    placeholder="Detailed scope of service, parts inspection, and safety verification..."
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-zinc-300 focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 outline-none resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">Base Price (₹)</label>
                    <input
                      type="number"
                      value={newServPrice}
                      onChange={(e) => setNewServPrice(e.target.value)}
                      placeholder="e.g. 4500"
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-zinc-300 focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">Duration (Mins)</label>
                    <input
                      type="number"
                      value={newServDuration}
                      onChange={(e) => setNewServDuration(e.target.value)}
                      placeholder="e.g. 90"
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-zinc-300 focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">Interval (Days)</label>
                    <input
                      type="number"
                      value={newServInterval}
                      onChange={(e) => setNewServInterval(e.target.value)}
                      placeholder="e.g. 90"
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-zinc-300 focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="servActiveCheck"
                    checked={newServActive}
                    onChange={(e) => setNewServActive(e.target.checked)}
                    className="w-4 h-4 rounded text-zinc-900 focus:ring-zinc-900 cursor-pointer"
                  />
                  <label htmlFor="servActiveCheck" className="text-xs font-semibold text-zinc-800 cursor-pointer">
                    Service is active and available for bookings
                  </label>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-600 hover:bg-zinc-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={servActionLoading}
                    className="px-6 py-2.5 rounded-xl bg-zinc-900 text-white text-xs font-bold hover:bg-zinc-800 disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    {servActionLoading ? 'Saving...' : 'Save Service'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2B: EDIT SERVICE (Cloud Firestore) */}
      <AnimatePresence>
        {modalType === 'edit_service' && editingService && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-zinc-200"
            >
              <div className="flex items-center justify-between mb-5 pb-3 border-b border-zinc-100">
                <div className="flex items-center gap-2">
                  <Pencil className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-lg text-zinc-950">Edit Service Details</h3>
                </div>
                <button onClick={() => setModalType(null)} className="p-1 rounded-lg hover:bg-zinc-100 text-zinc-400 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {servModalError && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs">
                  {servModalError}
                </div>
              )}

              <form onSubmit={handleEditService} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Service Display Name *</label>
                  <input
                    type="text"
                    required
                    value={editServName}
                    onChange={(e) => setEditServName(e.target.value)}
                    placeholder="e.g. 3-Phase Commercial DB Overhaul"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-zinc-300 focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Service Scope & Description</label>
                  <textarea
                    rows={2}
                    value={editServDesc}
                    onChange={(e) => setEditServDesc(e.target.value)}
                    placeholder="Detailed scope of service, parts inspection, and safety verification..."
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-zinc-300 focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 outline-none resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">Base Price (₹)</label>
                    <input
                      type="number"
                      value={editServPrice}
                      onChange={(e) => setEditServPrice(e.target.value)}
                      placeholder="e.g. 4500"
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-zinc-300 focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">Duration (Mins)</label>
                    <input
                      type="number"
                      value={editServDuration}
                      onChange={(e) => setEditServDuration(e.target.value)}
                      placeholder="e.g. 90"
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-zinc-300 focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">Interval (Days)</label>
                    <input
                      type="number"
                      value={editServInterval}
                      onChange={(e) => setEditServInterval(e.target.value)}
                      placeholder="e.g. 90"
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-zinc-300 focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="editServActiveCheck"
                    checked={editServActive}
                    onChange={(e) => setEditServActive(e.target.checked)}
                    className="w-4 h-4 rounded text-zinc-900 focus:ring-zinc-900 cursor-pointer"
                  />
                  <label htmlFor="editServActiveCheck" className="text-xs font-semibold text-zinc-800 cursor-pointer">
                    Service is active and available for bookings
                  </label>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-600 hover:bg-zinc-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={servActionLoading}
                    className="px-6 py-2.5 rounded-xl bg-zinc-900 text-white text-xs font-bold hover:bg-zinc-800 disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    {servActionLoading ? 'Saving...' : 'Update Service'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2C: ADD APPOINTMENT (Cloud Firestore) */}
      <AnimatePresence>
        {modalType === 'appointment' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-zinc-200"
            >
              <div className="flex items-center justify-between mb-5 pb-3 border-b border-zinc-100">
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-lg text-zinc-950">Schedule New Appointment</h3>
                </div>
                <button onClick={() => setModalType(null)} className="p-1 rounded-lg hover:bg-zinc-100 text-zinc-400 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {aptModalError && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs">
                  {aptModalError}
                </div>
              )}

              <form onSubmit={handleCreateAppointment} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Select Client *</label>
                  <select
                    required
                    value={aptCustomerId}
                    onChange={(e) => setAptCustomerId(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-zinc-300 focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 outline-none bg-white"
                  >
                    <option value="">-- Choose a Client ({customers.length} available) --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.phone ? `(${c.phone})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Select Service *</label>
                  <select
                    required
                    value={aptServiceId}
                    onChange={(e) => setAptServiceId(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-zinc-300 focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 outline-none bg-white"
                  >
                    <option value="">-- Choose a Service ({services.length} available) --</option>
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.serviceName} {s.basePrice ? `· ₹${s.basePrice.toLocaleString('en-IN')}` : ''} {s.durationMinutes ? `(${s.durationMinutes}m)` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">Date *</label>
                    <input
                      type="date"
                      required
                      value={aptDate}
                      onChange={(e) => setAptDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-zinc-300 focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">Start Time *</label>
                    <input
                      type="time"
                      required
                      value={aptTime}
                      onChange={(e) => setAptTime(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-zinc-300 focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">End Time</label>
                    <input
                      type="time"
                      value={aptEndTime}
                      onChange={(e) => setAptEndTime(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-zinc-300 focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Notes / Instructions</label>
                  <textarea
                    rows={2}
                    value={aptNotes}
                    onChange={(e) => setAptNotes(e.target.value)}
                    placeholder="e.g. On-site panel inspection, bring testing equipment..."
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-zinc-300 focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 outline-none resize-none"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-600 hover:bg-zinc-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={aptActionLoading}
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    {aptActionLoading ? 'Saving...' : 'Schedule Appointment'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2D: EDIT APPOINTMENT (Cloud Firestore) */}
      <AnimatePresence>
        {modalType === 'edit_appointment' && editingAppointment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-zinc-200"
            >
              <div className="flex items-center justify-between mb-5 pb-3 border-b border-zinc-100">
                <div className="flex items-center gap-2">
                  <Pencil className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-lg text-zinc-950">Edit Appointment</h3>
                </div>
                <button onClick={() => setModalType(null)} className="p-1 rounded-lg hover:bg-zinc-100 text-zinc-400 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {aptModalError && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs">
                  {aptModalError}
                </div>
              )}

              <form onSubmit={handleEditAppointment} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Client *</label>
                  <select
                    required
                    value={aptCustomerId}
                    onChange={(e) => setAptCustomerId(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-zinc-300 focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 outline-none bg-white"
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.phone ? `(${c.phone})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Service *</label>
                  <select
                    required
                    value={aptServiceId}
                    onChange={(e) => setAptServiceId(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-zinc-300 focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 outline-none bg-white"
                  >
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.serviceName} {s.basePrice ? `· ₹${s.basePrice.toLocaleString('en-IN')}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">Date *</label>
                    <input
                      type="date"
                      required
                      value={aptDate}
                      onChange={(e) => setAptDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-zinc-300 focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">Start Time *</label>
                    <input
                      type="time"
                      required
                      value={aptTime}
                      onChange={(e) => setAptTime(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-zinc-300 focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">End Time</label>
                    <input
                      type="time"
                      value={aptEndTime}
                      onChange={(e) => setAptEndTime(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-zinc-300 focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Status</label>
                  <select
                    value={aptStatus}
                    onChange={(e) => setAptStatus(e.target.value as AppointmentStatus)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-zinc-300 focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 outline-none bg-white font-semibold"
                  >
                    <option value="SCHEDULED">SCHEDULED</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="CANCELLED">CANCELLED</option>
                    <option value="NO_SHOW">NO_SHOW</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Notes</label>
                  <textarea
                    rows={2}
                    value={aptNotes}
                    onChange={(e) => setAptNotes(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-zinc-300 focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 outline-none resize-none"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-600 hover:bg-zinc-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={aptActionLoading}
                    className="px-6 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    {aptActionLoading ? 'Saving...' : 'Update Appointment'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2E: SCHEDULE FOLLOW-UP (Cloud Firestore) */}
      <AnimatePresence>
        {modalType === 'followup' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-zinc-200"
            >
              <div className="flex items-center justify-between mb-5 pb-3 border-b border-zinc-100">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-600" />
                  <h3 className="font-bold text-lg text-zinc-950">Schedule Follow-up</h3>
                </div>
                <button onClick={() => setModalType(null)} className="p-1 rounded-lg hover:bg-zinc-100 text-zinc-400 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {fupModalError && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs">
                  {fupModalError}
                </div>
              )}

              <form onSubmit={handleCreateFollowUp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Select Client *</label>
                  <select
                    required
                    value={fupCustomerId}
                    onChange={(e) => {
                      setFupCustomerId(e.target.value);
                      setFupAppointmentId('');
                    }}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-zinc-300 focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 outline-none bg-white"
                  >
                    <option value="">-- Choose a Client ({customers.length} available) --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.phone ? `(${c.phone})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Link to Client Appointment (Optional)
                  </label>
                  <select
                    value={fupAppointmentId}
                    onChange={(e) => setFupAppointmentId(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-zinc-300 focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 outline-none bg-white"
                  >
                    <option value="">None (General Client Follow-up)</option>
                    {appointments
                      .filter((a) => !fupCustomerId || a.customerId === fupCustomerId)
                      .map((a) => {
                        const s = services.find((serv) => serv.id === a.serviceId);
                        return (
                          <option key={a.id} value={a.id}>
                            {a.appointmentDate} · {a.appointmentTime} - {s?.serviceName || 'Service'} ({a.status})
                          </option>
                        );
                      })}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Scheduled Date *</label>
                  <input
                    type="date"
                    required
                    value={fupDate}
                    onChange={(e) => setFupDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-zinc-300 focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Follow-up Notes / Agenda</label>
                  <textarea
                    rows={2}
                    value={fupNotes}
                    onChange={(e) => setFupNotes(e.target.value)}
                    placeholder="e.g. Call to check AC cooling performance and client satisfaction..."
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-zinc-300 focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 outline-none resize-none"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-600 hover:bg-zinc-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={fupActionLoading}
                    className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-zinc-950 text-xs font-bold disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    {fupActionLoading ? 'Saving...' : 'Schedule Follow-up'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2F: EDIT FOLLOW-UP (Cloud Firestore) */}
      <AnimatePresence>
        {modalType === 'edit_followup' && editingFollowup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-zinc-200"
            >
              <div className="flex items-center justify-between mb-5 pb-3 border-b border-zinc-100">
                <div className="flex items-center gap-2">
                  <Pencil className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-lg text-zinc-950">Edit Follow-up</h3>
                </div>
                <button onClick={() => setModalType(null)} className="p-1 rounded-lg hover:bg-zinc-100 text-zinc-400 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {fupModalError && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs">
                  {fupModalError}
                </div>
              )}

              <form onSubmit={handleEditFollowUp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Client *</label>
                  <select
                    required
                    value={fupCustomerId}
                    onChange={(e) => setFupCustomerId(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-zinc-300 focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 outline-none bg-white"
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.phone ? `(${c.phone})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Linked Appointment</label>
                  <select
                    value={fupAppointmentId}
                    onChange={(e) => setFupAppointmentId(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-zinc-300 focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 outline-none bg-white"
                  >
                    <option value="">None (General Client Follow-up)</option>
                    {appointments
                      .filter((a) => a.customerId === fupCustomerId)
                      .map((a) => {
                        const s = services.find((serv) => serv.id === a.serviceId);
                        return (
                          <option key={a.id} value={a.id}>
                            {a.appointmentDate} · {a.appointmentTime} - {s?.serviceName || 'Service'} ({a.status})
                          </option>
                        );
                      })}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">Scheduled Date *</label>
                    <input
                      type="date"
                      required
                      value={fupDate}
                      onChange={(e) => setFupDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-zinc-300 focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">Status</label>
                    <select
                      value={fupStatus}
                      onChange={(e) => setFupStatus(e.target.value as FollowUpStatus)}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-zinc-300 focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 outline-none bg-white font-semibold"
                    >
                      <option value="PENDING">PENDING</option>
                      <option value="COMPLETED">COMPLETED</option>
                      <option value="CANCELLED">CANCELLED</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Notes</label>
                  <textarea
                    rows={2}
                    value={fupNotes}
                    onChange={(e) => setFupNotes(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-zinc-300 focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 outline-none resize-none"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-600 hover:bg-zinc-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={fupActionLoading}
                    className="px-6 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    {fupActionLoading ? 'Saving...' : 'Update Follow-up'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2G: SUGGESTED FOLLOW-UP CONFIRMATION MODAL */}
      <AnimatePresence>
        {suggestedFollowup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-zinc-200"
            >
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-100">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <h3 className="font-bold text-lg text-zinc-950">Follow-up Suggested</h3>
                </div>
                <button
                  onClick={() => setSuggestedFollowup(null)}
                  className="p-1 rounded-lg hover:bg-zinc-100 text-zinc-400 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3.5">
                <p className="text-xs text-zinc-600 leading-relaxed">
                  Appointment for <strong className="text-zinc-900">{suggestedFollowup.customerName}</strong> was marked <strong className="text-emerald-700">COMPLETED</strong>.
                </p>

                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-2">
                  <div className="text-xs text-amber-900 font-bold flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-700" />
                    <span>Recommended Service Interval: {suggestedFollowup.intervalDays} Days</span>
                  </div>
                  <div className="text-xs text-zinc-700">
                    Service: <span className="font-semibold">{suggestedFollowup.serviceName}</span>
                  </div>
                  <div className="text-xs text-zinc-900 font-extrabold pt-1">
                    📅 Suggested Follow-up Date: <span className="text-amber-800 underline">{suggestedFollowup.suggestedDate}</span>
                  </div>
                </div>

                <p className="text-[11px] text-zinc-500">
                  Would you like to schedule this routine follow-up in Cloud Firestore now?
                </p>
              </div>

              <div className="mt-6 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setSuggestedFollowup(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-600 hover:bg-zinc-100 cursor-pointer"
                >
                  Skip for Now
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSuggestedFollowup}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-zinc-950 text-xs font-bold cursor-pointer shadow-xs"
                >
                  Confirm & Schedule
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: ADD WORK ORDER */}
      <AnimatePresence>
        {modalType === 'task' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-zinc-200"
            >
              <div className="flex items-center justify-between mb-5 pb-3 border-b border-zinc-100">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-lg text-zinc-950">Add Work Order / Task</h3>
                </div>
                <button onClick={() => setModalType(null)} className="p-1 rounded-lg hover:bg-zinc-100 text-zinc-400 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddTask} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Job / Task Title *</label>
                  <input
                    type="text"
                    required
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="e.g. Replace main isolator switch & copper busbar"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-zinc-300 focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Customer / Project *</label>
                  <input
                    type="text"
                    required
                    value={newTaskCustomer}
                    onChange={(e) => setNewTaskCustomer(e.target.value)}
                    placeholder="Select or enter customer"
                    list="tasks-clients-datalist"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-zinc-300 focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 outline-none"
                  />
                  <datalist id="tasks-clients-datalist">
                    {customers.map((c) => (
                      <option key={c.id} value={c.name} />
                    ))}
                  </datalist>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">Due Date</label>
                    <input
                      type="date"
                      value={newTaskDueDate}
                      onChange={(e) => setNewTaskDueDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-zinc-300 focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">Priority</label>
                    <select
                      value={newTaskPriority}
                      onChange={(e) => setNewTaskPriority(e.target.value as 'low' | 'medium' | 'high')}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-zinc-300 focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 outline-none bg-white"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">Amount (₹)</label>
                    <input
                      type="number"
                      value={newTaskAmount}
                      onChange={(e) => setNewTaskAmount(e.target.value)}
                      placeholder="e.g. 8500"
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-zinc-300 focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-600 hover:bg-zinc-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-zinc-900 text-white text-xs font-bold hover:bg-zinc-800 cursor-pointer"
                  >
                    Save Work Order
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 4: RECORD INVOICE */}
      <AnimatePresence>
        {modalType === 'invoice' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-zinc-200"
            >
              <div className="flex items-center justify-between mb-5 pb-3 border-b border-zinc-100">
                <div className="flex items-center gap-2">
                  <IndianRupee className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-lg text-zinc-950">Record Invoice / Payment</h3>
                </div>
                <button onClick={() => setModalType(null)} className="p-1 rounded-lg hover:bg-zinc-100 text-zinc-400 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddInvoice} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Customer Name *</label>
                  <input
                    type="text"
                    required
                    value={newInvCustomer}
                    onChange={(e) => setNewInvCustomer(e.target.value)}
                    placeholder="Select or enter customer"
                    list="inv-clients-datalist"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-zinc-300 focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 outline-none"
                  />
                  <datalist id="inv-clients-datalist">
                    {customers.map((c) => (
                      <option key={c.id} value={c.name} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Description</label>
                  <input
                    type="text"
                    value={newInvDesc}
                    onChange={(e) => setNewInvDesc(e.target.value)}
                    placeholder="e.g. Completed AC repair service and parts"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-zinc-300 focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">Amount (₹) *</label>
                    <input
                      type="number"
                      required
                      value={newInvAmount}
                      onChange={(e) => setNewInvAmount(e.target.value)}
                      placeholder="e.g. 14500"
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-zinc-300 focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">Payment Status</label>
                    <select
                      value={newInvStatus}
                      onChange={(e) => setNewInvStatus(e.target.value as 'paid' | 'pending')}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-zinc-300 focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 outline-none bg-white"
                    >
                      <option value="pending">Pending</option>
                      <option value="paid">Paid (Collected)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-600 hover:bg-zinc-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-zinc-900 text-white text-xs font-bold hover:bg-zinc-800 cursor-pointer shadow-xs"
                  >
                    Save Invoice
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
