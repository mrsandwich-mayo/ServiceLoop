'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Logo } from '@/components/Logo';
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
  Sparkles
} from 'lucide-react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { handleFirestoreError, OperationType } from '@/lib/firestoreErrors';
import { Business, Customer, FollowUpItem, TaskItem, InvoiceItem } from '@/types/business';
import { motion, AnimatePresence } from 'motion/react';
import { ALL_BUSINESS_TYPES } from '@/lib/businessCategories';

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

const DEMO_FOLLOWUPS: FollowUpItem[] = [
  {
    id: 'demo_f1',
    ownerId: 'demo_user_serviceloop',
    clientName: 'Dr. Suresh Mehta',
    clientPhone: '+91 98111 89012',
    scheduledDate: '2026-10-08',
    time: '11:30 AM',
    type: 'call',
    status: 'pending',
    notes: 'Call to review the backup inverter wiring quote sent on Tuesday.',
    createdAt: '2026-10-02',
  },
  {
    id: 'demo_f2',
    ownerId: 'demo_user_serviceloop',
    clientName: 'Pooja Verma',
    clientPhone: '+91 98765 23456',
    scheduledDate: '2026-10-09',
    time: '03:00 PM',
    type: 'visit',
    status: 'pending',
    notes: 'On-site technical inspection for Tech Hub server room temperature audit.',
    createdAt: '2026-10-04',
  },
  {
    id: 'demo_f3',
    ownerId: 'demo_user_serviceloop',
    clientName: 'Rajesh Sharma',
    clientPhone: '+91 98201 45678',
    scheduledDate: '2026-10-05',
    time: '04:00 PM',
    type: 'message',
    status: 'completed',
    notes: 'WhatsApp confirmation for scheduled meter panel dispatch.',
    createdAt: '2026-10-01',
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
  const { user, signOut } = useAuth();

  // State scoped strictly per user
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [followups, setFollowups] = useState<FollowUpItem[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [business, setBusiness] = useState<Business | null>(null);

  // Active view tab
  const [activeTab, setActiveTab] = useState<'overview' | 'clients' | 'followups' | 'tasks' | 'invoices' | 'settings'>('overview');

  // Search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals state
  const [modalType, setModalType] = useState<'customer' | 'followup' | 'task' | 'invoice' | null>(null);

  // Forms state
  // 1. Add Customer
  const [newCustName, setNewCustName] = useState('');
  const [newCustCompany, setNewCustCompany] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('+91 ');
  const [newCustValue, setNewCustValue] = useState('');
  const [newCustNotes, setNewCustNotes] = useState('');
  const [newCustStatus, setNewCustStatus] = useState<'lead' | 'active' | 'completed'>('lead');

  // 2. Add Follow-up
  const [newFClient, setNewFClient] = useState('');
  const [newFPhone, setNewFPhone] = useState('+91 ');
  const [newFDate, setNewFDate] = useState('');
  const [newFTime, setNewFTime] = useState('10:00 AM');
  const [newFType, setNewFType] = useState<'call' | 'message' | 'visit' | 'meeting'>('call');
  const [newFNotes, setNewFNotes] = useState('');

  // 3. Add Work Order
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCustomer, setNewTaskCustomer] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newTaskAmount, setNewTaskAmount] = useState('');

  // 4. Add Invoice
  const [newInvCustomer, setNewInvCustomer] = useState('');
  const [newInvDesc, setNewInvDesc] = useState('');
  const [newInvAmount, setNewInvAmount] = useState('');
  const [newInvStatus, setNewInvStatus] = useState<'paid' | 'pending'>('pending');

  // 5. Settings form states
  const [editBizName, setEditBizName] = useState('');
  const [editOwnerName, setEditOwnerName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editBizType, setEditBizType] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);

  // Synchronize data strictly scoped to the authenticated user's isolated UID
  useEffect(() => {
    let active = true;

    queueMicrotask(() => {
      if (!active || !user) return;

      const userStorageKey = `serviceloop_crm_${user.uid}`;
      const cached = typeof window !== 'undefined' ? localStorage.getItem(userStorageKey) : null;

      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed.customers) setCustomers(parsed.customers);
          if (parsed.followups) setFollowups(parsed.followups);
          if (parsed.tasks) setTasks(parsed.tasks);
          if (parsed.invoices) setInvoices(parsed.invoices);
        } catch {
          // invalid cache fallback
        }
      } else if (user.isDemo) {
        // If it's a demo account and nothing is cached yet, populate demo data
        setCustomers(DEMO_CUSTOMERS);
        setFollowups(DEMO_FOLLOWUPS);
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
        // Fresh registered user! Starts strictly empty with ZERO records from other businesses
        setCustomers([]);
        setFollowups([]);
        setTasks([]);
        setInvoices([]);
      }
    });

    return () => {
      active = false;
    };
  }, [user]);

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

  // Persist CRM data with strict UID scoping
  const persistCRMData = (
    newCust: Customer[], 
    newFup: FollowUpItem[], 
    newTsk: TaskItem[], 
    newInv: InvoiceItem[]
  ) => {
    if (!user) return;

    // Cache locally scoped to this specific user UID
    if (typeof window !== 'undefined') {
      const storageKey = `serviceloop_crm_${user.uid}`;
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          customers: newCust,
          followups: newFup,
          tasks: newTsk,
          invoices: newInv,
        })
      );
    }

    // Dual persist in Firestore if authenticated
    if (!user.isDemo && business) {
      const docPath = `businesses/${user.uid}`;
      setDoc(
        doc(db, 'businesses', user.uid),
        {
          ...business,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      ).catch((err: unknown) => {
        handleFirestoreError(err, OperationType.UPDATE, docPath);
      });
    }
  };

  // Handlers for Add Operations
  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newCustName.trim()) return;

    const newCustomer: Customer = {
      id: `c_${Date.now()}`,
      ownerId: user.uid,
      name: newCustName.trim(),
      company: newCustCompany.trim() || undefined,
      email: newCustEmail.trim() || `${newCustName.trim().toLowerCase().replace(/\s+/g, '')}@client.in`,
      phone: newCustPhone.trim() || '+91 98765 00000',
      status: newCustStatus,
      totalValue: Number(newCustValue) || 0,
      notes: newCustNotes.trim() || undefined,
      createdAt: new Date().toISOString().split('T')[0],
    };

    const updated = [newCustomer, ...customers];
    setCustomers(updated);
    persistCRMData(updated, followups, tasks, invoices);

    setNewCustName('');
    setNewCustCompany('');
    setNewCustEmail('');
    setNewCustPhone('+91 ');
    setNewCustValue('');
    setNewCustNotes('');
    setNewCustStatus('lead');
    setModalType(null);
  };

  const handleAddFollowup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newFClient.trim() || !newFDate.trim()) return;

    const newFollowup: FollowUpItem = {
      id: `f_${Date.now()}`,
      ownerId: user.uid,
      clientName: newFClient.trim(),
      clientPhone: newFPhone.trim() || undefined,
      scheduledDate: newFDate,
      time: newFTime || '10:00 AM',
      type: newFType,
      status: 'pending',
      notes: newFNotes.trim() || 'General service follow up',
      createdAt: new Date().toISOString().split('T')[0],
    };

    const updated = [newFollowup, ...followups];
    setFollowups(updated);
    persistCRMData(customers, updated, tasks, invoices);

    setNewFClient('');
    setNewFPhone('+91 ');
    setNewFDate('');
    setNewFTime('10:00 AM');
    setNewFNotes('');
    setModalType(null);
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
    persistCRMData(customers, followups, updated, invoices);

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
    persistCRMData(customers, followups, tasks, updated);

    setNewInvCustomer('');
    setNewInvDesc('');
    setNewInvAmount('');
    setNewInvStatus('pending');
    setModalType(null);
  };

  // Toggle & Delete Helpers
  const toggleFollowupStatus = (id: string) => {
    const updated = followups.map((f) => {
      if (f.id === id) {
        return {
          ...f,
          status: f.status === 'completed' ? ('pending' as const) : ('completed' as const),
        };
      }
      return f;
    });
    setFollowups(updated);
    persistCRMData(customers, updated, tasks, invoices);
  };

  const deleteFollowup = (id: string) => {
    const updated = followups.filter((f) => f.id !== id);
    setFollowups(updated);
    persistCRMData(customers, updated, tasks, invoices);
  };

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
    persistCRMData(customers, followups, updated, invoices);
  };

  const deleteTask = (id: string) => {
    const updated = tasks.filter((t) => t.id !== id);
    setTasks(updated);
    persistCRMData(customers, followups, updated, invoices);
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
    persistCRMData(customers, followups, tasks, updated);
  };

  const deleteCustomer = (id: string) => {
    const updated = customers.filter((c) => c.id !== id);
    setCustomers(updated);
    persistCRMData(updated, followups, tasks, invoices);
  };

  // Save Settings Changes
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSettingsLoading(true);
    setSettingsSaved(false);

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

    if (user.isDemo) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('serviceloop_demo_business', JSON.stringify(updatedBiz));
      }
      setSettingsLoading(false);
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 3000);
      return;
    }

    try {
      await setDoc(doc(db, 'businesses', user.uid), updatedBiz, { merge: true });
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
      'Are you sure you want to clear your current workspace? This will reset your clients, tasks, and follow-ups to a completely fresh dashboard.'
    );
    if (!confirmReset) return;

    setCustomers([]);
    setFollowups([]);
    setTasks([]);
    setInvoices([]);
    persistCRMData([], [], [], []);
  };

  // Quick Load Sample Data (available in settings or when empty)
  const handleLoadSampleData = () => {
    if (!user) return;
    setCustomers(DEMO_CUSTOMERS);
    setFollowups(DEMO_FOLLOWUPS);
    setTasks(DEMO_TASKS);
    setInvoices(DEMO_INVOICES);
    persistCRMData(DEMO_CUSTOMERS, DEMO_FOLLOWUPS, DEMO_TASKS, DEMO_INVOICES);
  };

  // Metrics Calculations (all in Indian Rupees ₹)
  const totalClosedRevenue = invoices
    .filter((i) => i.status === 'paid')
    .reduce((sum, i) => sum + i.amount, 0);

  const pendingRevenue = invoices
    .filter((i) => i.status === 'pending')
    .reduce((sum, i) => sum + i.amount, 0);

  const activeClientsCount = customers.filter((c) => c.status === 'active' || c.status === 'lead').length;
  const pendingFollowupsCount = followups.filter((f) => f.status === 'pending').length;
  const activeTasksCount = tasks.filter((t) => t.status !== 'completed').length;

  // Filtered lists
  const filteredCustomers = customers.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.company && c.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
      c.phone.includes(searchTerm);
    if (!matchesSearch) return false;
    if (statusFilter === 'all') return true;
    return c.status === statusFilter;
  });

  const filteredFollowups = followups.filter((f) => {
    const matchesSearch = f.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (f.notes && f.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    if (!matchesSearch) return false;
    if (statusFilter === 'all') return true;
    if (statusFilter === 'pending') return f.status === 'pending';
    if (statusFilter === 'completed') return f.status === 'completed';
    return true;
  });

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.customerName.toLowerCase().includes(searchTerm.toLowerCase());
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
              {user?.isDemo && (
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700 border border-zinc-200">
                  Demo Mode
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
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
              onClick={() => { setActiveTab('followups'); setStatusFilter('all'); }}
              className={`px-3.5 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'followups' 
                  ? 'bg-zinc-900 text-white font-bold shadow-xs' 
                  : 'text-zinc-600 hover:text-zinc-950 hover:bg-white'
              }`}
            >
              <span>Follow-ups</span>
              {pendingFollowupsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-200 text-amber-900 font-extrabold">
                  {pendingFollowupsCount}
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
              onClick={() => setModalType('customer')}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-zinc-900 text-white text-xs font-bold hover:bg-zinc-800 transition-all cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" /> Add Client
            </button>
            <button
              onClick={() => setModalType('followup')}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-zinc-950 text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              <Calendar className="w-3.5 h-3.5" /> Schedule Follow-up
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
                  <span>Active Clients</span>
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-800 flex items-center justify-center">
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
                  Phone calls & WhatsApp items
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-white border border-zinc-200 shadow-2xs relative overflow-hidden">
                <div className="flex items-center justify-between text-xs font-bold text-zinc-500">
                  <span>Active Work Orders</span>
                  <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-800 flex items-center justify-center">
                    <Briefcase className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 text-3xl font-extrabold text-zinc-950 tracking-tight">
                  {activeTasksCount}
                </div>
                <div className="mt-1.5 text-xs text-zinc-500 font-medium">
                  Completed: {tasks.filter(t => t.status === 'completed').length}
                </div>
              </div>
            </div>

            {/* Fresh Account Welcoming Empty State */}
            {customers.length === 0 && followups.length === 0 && tasks.length === 0 && (
              <div className="p-8 sm:p-14 rounded-3xl bg-white border border-zinc-200 text-center max-w-2xl mx-auto shadow-xs">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-zinc-900 text-white flex items-center justify-center mb-5 shadow-xs">
                  <Sparkles className="w-7 h-7 text-indigo-400" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-zinc-950">
                  Your Fresh Workspace Is Ready
                </h3>
                <p className="mt-2 text-sm text-zinc-600 leading-relaxed max-w-lg mx-auto">
                  Welcome, <strong className="text-zinc-900">{ownerDisplayName}</strong>. Your workspace for{' '}
                  <strong className="text-zinc-900">{businessDisplayName}</strong> in {locationDisplay} is 100% private and ready to track clients, follow-ups, and jobs.
                </p>

                <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-left">
                  <button
                    onClick={() => setModalType('customer')}
                    className="p-4 rounded-2xl border border-zinc-200 hover:border-zinc-900 bg-zinc-50/50 hover:bg-white transition-all text-xs cursor-pointer"
                  >
                    <span className="font-bold text-zinc-950 block mb-1">1. Add First Client</span>
                    <span className="text-zinc-500">Log customer name, Indian phone number, and service request.</span>
                  </button>

                  <button
                    onClick={() => setModalType('followup')}
                    className="p-4 rounded-2xl border border-zinc-200 hover:border-zinc-900 bg-zinc-50/50 hover:bg-white transition-all text-xs cursor-pointer"
                  >
                    <span className="font-bold text-zinc-950 block mb-1">2. Add Follow-up</span>
                    <span className="text-zinc-500">Schedule a call, WhatsApp check-in, or site inspection visit.</span>
                  </button>

                  <button
                    onClick={() => setModalType('task')}
                    className="p-4 rounded-2xl border border-zinc-200 hover:border-zinc-900 bg-zinc-50/50 hover:bg-white transition-all text-xs cursor-pointer"
                  >
                    <span className="font-bold text-zinc-950 block mb-1">3. Create Work Order</span>
                    <span className="text-zinc-500">Track tasks, job estimates, and completed repairs.</span>
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
            {(customers.length > 0 || followups.length > 0 || tasks.length > 0) && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Pending Follow-ups Column */}
                <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-2xs flex flex-col">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-100">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-600" />
                      <h3 className="font-bold text-base text-zinc-950">Scheduled Follow-ups</h3>
                    </div>
                    <button
                      onClick={() => setModalType('followup')}
                      className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add
                    </button>
                  </div>

                  <div className="space-y-3 flex-1">
                    {followups.slice(0, 4).map((fup) => (
                      <div
                        key={fup.id}
                        className={`p-4 rounded-2xl border transition-all ${
                          fup.status === 'completed'
                            ? 'bg-zinc-50/80 border-zinc-200 opacity-60'
                            : 'bg-white border-zinc-200 hover:border-zinc-400 shadow-2xs'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="text-xs font-bold text-zinc-900">{fup.clientName}</div>
                            <div className="text-[11px] text-zinc-500 mt-0.5">
                              {fup.scheduledDate} {fup.time ? `· ${fup.time}` : ''}
                            </div>
                          </div>
                          <button
                            onClick={() => toggleFollowupStatus(fup.id)}
                            className={`p-1.5 rounded-lg text-xs cursor-pointer ${
                              fup.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                            }`}
                            title="Toggle status"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-xs text-zinc-600 mt-2 line-clamp-2">{fup.notes}</p>
                        
                        {fup.clientPhone && (
                          <div className="mt-2.5 pt-2 border-t border-zinc-100 flex items-center gap-2 text-[11px]">
                            <a
                              href={`tel:${fup.clientPhone}`}
                              className="inline-flex items-center gap-1 text-zinc-800 hover:text-black font-bold"
                            >
                              <Phone className="w-3 h-3 text-zinc-600" /> Call
                            </a>
                            <a
                              href={`https://wa.me/${fup.clientPhone.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-green-600 hover:text-green-700 font-bold"
                            >
                              <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                            </a>
                          </div>
                        )}
                      </div>
                    ))}

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
                          <span className="font-mono text-zinc-600 text-[11px]">{cust.phone}</span>
                          <span className="font-bold text-zinc-950">₹{cust.totalValue.toLocaleString('en-IN')}</span>
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

        {/* 2. CLIENTS TAB */}
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
                  onClick={() => setModalType('customer')}
                  className="ml-auto sm:ml-0 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-zinc-900 text-white text-xs font-bold hover:bg-zinc-800 transition-colors whitespace-nowrap cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Client
                </button>
              </div>
            </div>

            {/* Clients List */}
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
                        {c.status}
                      </span>
                    </div>

                    <div className="mt-3.5 space-y-1.5 text-xs text-zinc-600">
                      <div className="flex items-center gap-2 font-mono">
                        <Phone className="w-3.5 h-3.5 text-zinc-400" />
                        <span>{c.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-zinc-400" />
                        <span className="truncate">{c.email}</span>
                      </div>
                      {c.notes && (
                        <p className="mt-2 text-zinc-600 italic text-[11px] bg-zinc-50 p-2.5 rounded-xl border border-zinc-200/50">
                          &ldquo;{c.notes}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-zinc-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-950">
                      Value: ₹{c.totalValue.toLocaleString('en-IN')}
                    </span>

                    <div className="flex items-center gap-1.5">
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
                      <button
                        onClick={() => {
                          setNewFClient(c.name);
                          setNewFPhone(c.phone);
                          setModalType('followup');
                        }}
                        className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 transition-colors cursor-pointer"
                        title="Add Follow-up"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteCustomer(c.id)}
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
                    onClick={() => setModalType('customer')}
                    className="mt-4 px-5 py-2.5 bg-zinc-900 text-white rounded-xl text-xs font-bold hover:bg-zinc-800 cursor-pointer"
                  >
                    Add Client Now
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. FOLLOW-UPS TAB */}
        {activeTab === 'followups' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-3xl border border-zinc-200/80 shadow-2xs">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search follow-ups..."
                  className="w-full pl-10 pr-3 py-2.5 text-xs sm:text-sm rounded-xl border border-zinc-300 focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 outline-none"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-xs font-bold rounded-xl border border-zinc-300 px-3 py-2.5 outline-none bg-white"
                >
                  <option value="all">All Follow-ups ({followups.length})</option>
                  <option value="pending">Pending ({pendingFollowupsCount})</option>
                  <option value="completed">Completed</option>
                </select>

                <button
                  onClick={() => setModalType('followup')}
                  className="ml-auto sm:ml-0 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-zinc-950 text-xs font-bold transition-colors whitespace-nowrap shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Follow-up
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {filteredFollowups.map((fup) => (
                <div
                  key={fup.id}
                  className={`p-5 rounded-3xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    fup.status === 'completed'
                      ? 'bg-zinc-50/80 border-zinc-200 opacity-60'
                      : 'bg-white border-zinc-200/80 hover:border-zinc-400 shadow-2xs'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <button
                      onClick={() => toggleFollowupStatus(fup.id)}
                      className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                        fup.status === 'completed'
                          ? 'bg-green-600 text-white'
                          : 'border border-zinc-300 text-transparent hover:border-zinc-900'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm text-zinc-950">{fup.clientName}</span>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-800">
                          {fup.type}
                        </span>
                        <span className="text-xs text-zinc-500 font-medium">
                          {fup.scheduledDate} {fup.time ? `· ${fup.time}` : ''}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-600 mt-1 leading-relaxed">{fup.notes}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {fup.clientPhone && (
                      <>
                        <a
                          href={`tel:${fup.clientPhone}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-900 text-xs font-bold"
                        >
                          <Phone className="w-3.5 h-3.5" /> Call
                        </a>
                        <a
                          href={`https://wa.me/${fup.clientPhone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-green-50 hover:bg-green-100 text-green-800 text-xs font-bold"
                        >
                          <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                        </a>
                      </>
                    )}
                    <button
                      onClick={() => deleteFollowup(fup.id)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {filteredFollowups.length === 0 && (
                <div className="bg-white p-12 text-center rounded-3xl border border-zinc-200/80 shadow-2xs">
                  <Calendar className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
                  <h4 className="font-bold text-base text-zinc-900">No follow-ups found</h4>
                  <p className="text-xs text-zinc-500 mt-1">Keep client leads warm by scheduling timely follow-ups.</p>
                  <button
                    onClick={() => setModalType('followup')}
                    className="mt-4 px-5 py-2.5 bg-amber-500 text-zinc-950 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Add Follow-up Now
                  </button>
                </div>
              )}
            </div>
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
                  <option value="pending">Pending</option>
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

      {/* MODAL 1: ADD CLIENT */}
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
                    <label className="block text-xs font-bold text-zinc-700 mb-1">Company / Facility</label>
                    <input
                      type="text"
                      value={newCustCompany}
                      onChange={(e) => setNewCustCompany(e.target.value)}
                      placeholder="e.g. Patel Towers"
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-zinc-300 focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">Phone Number (+91) *</label>
                    <input
                      type="tel"
                      required
                      value={newCustPhone}
                      onChange={(e) => setNewCustPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-zinc-300 focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={newCustEmail}
                      onChange={(e) => setNewCustEmail(e.target.value)}
                      placeholder="client@example.in"
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-zinc-300 focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">Estimated Value (₹)</label>
                    <input
                      type="number"
                      value={newCustValue}
                      onChange={(e) => setNewCustValue(e.target.value)}
                      placeholder="e.g. 15000"
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-zinc-300 focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Status</label>
                  <select
                    value={newCustStatus}
                    onChange={(e) => setNewCustStatus(e.target.value as 'lead' | 'active' | 'completed')}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-zinc-300 focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 outline-none bg-white"
                  >
                    <option value="lead">Lead (Enquiry)</option>
                    <option value="active">Active Client</option>
                    <option value="completed">Completed Contract</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Service Notes / Requirements</label>
                  <textarea
                    rows={2}
                    value={newCustNotes}
                    onChange={(e) => setNewCustNotes(e.target.value)}
                    placeholder="e.g. Needs wiring overhaul for 3-story property in Bandra"
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
                    className="px-6 py-2.5 rounded-xl bg-zinc-900 text-white text-xs font-bold hover:bg-zinc-800 cursor-pointer"
                  >
                    Save Client
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: ADD FOLLOW-UP */}
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
                  <Calendar className="w-5 h-5 text-amber-600" />
                  <h3 className="font-bold text-lg text-zinc-950">Schedule Follow-up</h3>
                </div>
                <button onClick={() => setModalType(null)} className="p-1 rounded-lg hover:bg-zinc-100 text-zinc-400 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddFollowup} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Client Name *</label>
                  <input
                    type="text"
                    required
                    value={newFClient}
                    onChange={(e) => setNewFClient(e.target.value)}
                    placeholder="Select or enter client name"
                    list="clients-datalist"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-zinc-300 focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 outline-none"
                  />
                  <datalist id="clients-datalist">
                    {customers.map((c) => (
                      <option key={c.id} value={c.name} />
                    ))}
                  </datalist>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">Client Phone (+91)</label>
                    <input
                      type="tel"
                      value={newFPhone}
                      onChange={(e) => setNewFPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-zinc-300 focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">Follow-up Type</label>
                    <select
                      value={newFType}
                      onChange={(e) => setNewFType(e.target.value as 'call' | 'message' | 'visit' | 'meeting')}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-zinc-300 focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 outline-none bg-white"
                    >
                      <option value="call">Phone Call (📞)</option>
                      <option value="message">WhatsApp Message (💬)</option>
                      <option value="visit">Site Inspection Visit (📍)</option>
                      <option value="meeting">Office Meeting (🤝)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">Scheduled Date *</label>
                    <input
                      type="date"
                      required
                      value={newFDate}
                      onChange={(e) => setNewFDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-zinc-300 focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">Time</label>
                    <input
                      type="text"
                      value={newFTime}
                      onChange={(e) => setNewFTime(e.target.value)}
                      placeholder="e.g. 11:30 AM"
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-zinc-300 focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Follow-up Notes / Agenda</label>
                  <textarea
                    rows={2}
                    required
                    value={newFNotes}
                    onChange={(e) => setNewFNotes(e.target.value)}
                    placeholder="e.g. Call to discuss quote approval for panel installation"
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
                    className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-zinc-950 text-xs font-bold cursor-pointer"
                  >
                    Schedule Follow-up
                  </button>
                </div>
              </form>
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
