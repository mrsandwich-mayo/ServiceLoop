'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { 
  db 
} from '@/lib/firebase';
import { 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc, 
  serverTimestamp, 
  getDocs
} from 'firebase/firestore';
import { 
  Business, 
  BusinessVerificationStatus 
} from '@/types/business';
import { 
  ShieldCheck, 
  ShieldAlert, 
  ShieldX, 
  CheckCircle2, 
  XCircle, 
  Building2, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Search, 
  LogOut, 
  Eye, 
  RotateCcw, 
  Check, 
  X, 
  ExternalLink, 
  BadgeCheck, 
  SlidersHorizontal, 
  AlertTriangle,
  FileCheck2,
  Lock,
  Layers,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';

interface EnhancedBusinessRecord extends Business {
  documentType?: string;
  documentReference?: string;
  rejectionReason?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  clientCount?: number;
  serviceCount?: number;
  source: 'firestore' | 'registered_local' | 'mock_directory';
}

const DEFAULT_SAMPLE_BUSINESSES: EnhancedBusinessRecord[] = [
  {
    id: 'biz_sample_1',
    ownerId: 'demo_user_serviceloop',
    businessName: 'Apex Electrical & Facility Services',
    ownerName: 'Rajesh Kumar',
    email: 'contact@apexelectrical.in',
    phone: '+91 98765 43210',
    businessType: 'Electrical & Facility Care',
    location: 'Bengaluru, Karnataka',
    verificationStatus: 'PENDING_VERIFICATION',
    createdAt: '2026-10-02T10:30:00Z',
    updatedAt: '2026-10-02T10:30:00Z',
    documentType: 'GSTIN Registration Certificate',
    documentReference: 'GSTIN-29AABCU9603R1ZM',
    clientCount: 14,
    serviceCount: 5,
    source: 'mock_directory',
  },
  {
    id: 'biz_sample_2',
    ownerId: 'usr_mehta_dental',
    businessName: 'Mehta Dental & Care Clinic',
    ownerName: 'Dr. Suresh Mehta',
    email: 'dr.mehta@dentalcare.in',
    phone: '+91 98111 89012',
    businessType: 'Healthcare & Clinical Services',
    location: 'Mumbai, Maharashtra',
    verificationStatus: 'VERIFIED',
    createdAt: '2026-09-18T14:20:00Z',
    updatedAt: '2026-09-20T09:15:00Z',
    documentType: 'Medical Council Trade License',
    documentReference: 'MCI-REG-849204-MH',
    reviewedBy: 'abdullah.csc2004@gmail.com',
    reviewedAt: '2026-09-20T09:15:00Z',
    clientCount: 28,
    serviceCount: 8,
    source: 'mock_directory',
  },
  {
    id: 'biz_sample_3',
    ownerId: 'usr_verma_tech',
    businessName: 'Verma Tech Hub',
    ownerName: 'Pooja Verma',
    email: 'pooja@vermatech.in',
    phone: '+91 98765 23456',
    businessType: 'IT Hardware & Network Support',
    location: 'Pune, Maharashtra',
    verificationStatus: 'PENDING_VERIFICATION',
    createdAt: '2026-10-05T11:45:00Z',
    updatedAt: '2026-10-05T11:45:00Z',
    documentType: 'MSME Udyam Registration',
    documentReference: 'UDYAM-MH-26-0038491',
    clientCount: 9,
    serviceCount: 4,
    source: 'mock_directory',
  },
  {
    id: 'biz_sample_4',
    ownerId: 'usr_sharma_plumbing',
    businessName: 'Sharma Hydro Care & Plumbing',
    ownerName: 'Sunil Sharma',
    email: 'sunil@sharmaplumbing.in',
    phone: '+91 98220 54321',
    businessType: 'Plumbing & Drainage Engineering',
    location: 'Delhi NCR, New Delhi',
    verificationStatus: 'REJECTED',
    rejectionReason: 'Invalid MSME certificate reference and unverified address.',
    createdAt: '2026-09-28T16:00:00Z',
    updatedAt: '2026-10-01T12:00:00Z',
    documentType: 'Shop & Establishment Act',
    documentReference: 'SHOP-DL-99410',
    reviewedBy: 'abdullah.csc2004@gmail.com',
    reviewedAt: '2026-10-01T12:00:00Z',
    clientCount: 2,
    serviceCount: 3,
    source: 'mock_directory',
  },
];

export default function AdminDashboardPage() {
  const { admin, loading: authLoading, logoutAdmin, primaryAdminEmail } = useAdminAuth(true);

  const [businesses, setBusinesses] = useState<EnhancedBusinessRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | BusinessVerificationStatus>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Modals & Inspection Drawer
  const [selectedBiz, setSelectedBiz] = useState<EnhancedBusinessRecord | null>(null);
  const [rejectModalBiz, setRejectModalBiz] = useState<EnhancedBusinessRecord | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Load and subscribe to businesses across Firestore & Registered Accounts
  const loadBusinesses = async () => {
    setRefreshing(true);
    try {
      const mergedMap = new Map<string, EnhancedBusinessRecord>();

      // 1. Preload sample benchmark businesses
      DEFAULT_SAMPLE_BUSINESSES.forEach((b) => mergedMap.set(b.id || b.ownerId, b));

      // 2. Load from localStorage registered accounts registry
      if (typeof window !== 'undefined') {
        try {
          const rawAccounts = localStorage.getItem('serviceloop_registered_accounts');
          if (rawAccounts) {
            const accounts = JSON.parse(rawAccounts);
            if (Array.isArray(accounts)) {
              accounts.forEach((acc) => {
                if (acc.business) {
                  const bId = acc.business.id || acc.uid;
                  mergedMap.set(bId, {
                    ...acc.business,
                    id: bId,
                    ownerId: acc.uid,
                    source: 'registered_local',
                    documentType: acc.business.documentType || 'MSME / Trade Registration',
                    documentReference: acc.business.documentReference || `REG-${bId.slice(0, 8).toUpperCase()}`,
                    verificationStatus: acc.business.verificationStatus || 'PENDING_VERIFICATION',
                  });
                }
              });
            }
          }
        } catch (e) {
          console.warn('Error reading local registered accounts:', e);
        }

        // Check standalone demo business
        try {
          const demoBizRaw = localStorage.getItem('serviceloop_demo_business');
          if (demoBizRaw) {
            const demoBiz = JSON.parse(demoBizRaw);
            if (demoBiz && demoBiz.businessName) {
              const bId = demoBiz.id || demoBiz.ownerId || 'demo_user_serviceloop';
              const existing = mergedMap.get(bId) || ({} as EnhancedBusinessRecord);
              mergedMap.set(bId, {
                ...existing,
                ...demoBiz,
                id: bId,
                source: 'registered_local',
              });
            }
          }
        } catch {}
      }

      // 3. Load from Cloud Firestore
      try {
        const snap = await getDocs(collection(db, 'businesses'));
        snap.forEach((docSnap) => {
          const data = docSnap.data();
          const bId = docSnap.id;
          mergedMap.set(bId, {
            id: bId,
            ownerId: data.ownerId || bId,
            businessName: data.businessName || 'Unnamed Business',
            ownerName: data.ownerName || 'Unknown Owner',
            businessType: data.businessType || 'General Services',
            location: data.location || 'Not Specified',
            phone: data.phone || '',
            email: data.email || '',
            verificationStatus: data.verificationStatus || 'PENDING_VERIFICATION',
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : new Date().toISOString(),
            source: 'firestore',
          });
        });
      } catch (fsErr) {
        console.warn('Firestore live fetch notice (handled gracefully):', fsErr);
      }

      const list = Array.from(mergedMap.values());
      // Sort: Pending verifications first, then newest
      list.sort((a, b) => {
        if (a.verificationStatus === 'PENDING_VERIFICATION' && b.verificationStatus !== 'PENDING_VERIFICATION') return -1;
        if (b.verificationStatus === 'PENDING_VERIFICATION' && a.verificationStatus !== 'PENDING_VERIFICATION') return 1;
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });

      setBusinesses(list);
    } catch (err) {
      console.error('Error compiling business directory:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!authLoading && admin) {
      let active = true;
      let unsub: (() => void) | undefined;

      queueMicrotask(() => {
        if (!active) return;
        loadBusinesses();
      });

      // Listen to real-time Firestore changes
      try {
        unsub = onSnapshot(collection(db, 'businesses'), () => {
          if (!active) return;
          loadBusinesses();
        }, (err) => {
          console.warn('Firestore real-time subscription notice:', err);
        });
      } catch {}

      return () => {
        active = false;
        if (unsub) unsub();
      };
    }
  }, [authLoading, admin]);

  // Statistics Calculation
  const stats = useMemo(() => {
    const total = businesses.length;
    const pending = businesses.filter((b) => b.verificationStatus === 'PENDING_VERIFICATION').length;
    const verified = businesses.filter((b) => b.verificationStatus === 'VERIFIED').length;
    const rejected = businesses.filter((b) => b.verificationStatus === 'REJECTED').length;
    const suspended = businesses.filter((b) => b.verificationStatus === 'SUSPENDED').length;
    return { total, pending, verified, rejected, suspended };
  }, [businesses]);

  // Filtered List
  const filteredBusinesses = useMemo(() => {
    return businesses.filter((b) => {
      // Status filter
      if (statusFilter !== 'ALL' && b.verificationStatus !== statusFilter) return false;

      // Category filter
      if (categoryFilter !== 'ALL' && !b.businessType.toLowerCase().includes(categoryFilter.toLowerCase())) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = (b.businessName || '').toLowerCase().includes(q);
        const matchesOwner = (b.ownerName || '').toLowerCase().includes(q);
        const matchesEmail = (b.email || '').toLowerCase().includes(q);
        const matchesPhone = (b.phone || '').toLowerCase().includes(q);
        const matchesLoc = (b.location || '').toLowerCase().includes(q);
        const matchesType = (b.businessType || '').toLowerCase().includes(q);
        const matchesRef = (b.documentReference || '').toLowerCase().includes(q);
        return matchesName || matchesOwner || matchesEmail || matchesPhone || matchesLoc || matchesType || matchesRef;
      }

      return true;
    });
  }, [businesses, statusFilter, categoryFilter, searchQuery]);

  // Unique categories for filter dropdown
  const categories = useMemo(() => {
    const set = new Set<string>();
    businesses.forEach((b) => {
      if (b.businessType) set.add(b.businessType.trim());
    });
    return Array.from(set);
  }, [businesses]);

  // Action: Update Verification Status
  const handleUpdateStatus = async (
    targetBiz: EnhancedBusinessRecord,
    newStatus: BusinessVerificationStatus,
    reason?: string
  ) => {
    setActionLoading(true);
    setActionSuccessMessage(null);

    const targetId = targetBiz.id || targetBiz.ownerId;
    const nowIso = new Date().toISOString();
    const reviewer = admin?.email || primaryAdminEmail;

    try {
      // 1. Update in Firestore if accessible
      try {
        const docRef = doc(db, 'businesses', targetId);
        await updateDoc(docRef, {
          verificationStatus: newStatus,
          updatedAt: serverTimestamp(),
        });
      } catch (fsErr) {
        console.warn('Firestore doc update notice (persisting locally):', fsErr);
      }

      // 2. Update local state
      setBusinesses((prev) =>
        prev.map((item) => {
          if ((item.id || item.ownerId) === targetId) {
            return {
              ...item,
              verificationStatus: newStatus,
              reviewedBy: reviewer,
              reviewedAt: nowIso,
              rejectionReason: newStatus === 'REJECTED' ? reason || 'Failed authenticity audit' : null,
              updatedAt: nowIso,
            };
          }
          return item;
        })
      );

      // 3. Update localStorage registered accounts
      if (typeof window !== 'undefined') {
        try {
          const rawAccounts = localStorage.getItem('serviceloop_registered_accounts');
          if (rawAccounts) {
            const accounts = JSON.parse(rawAccounts);
            const updated = accounts.map((acc: { uid: string; business?: Business }) => {
              if (acc.uid === targetId || acc.business?.id === targetId || acc.business?.ownerId === targetId) {
                return {
                  ...acc,
                  business: {
                    ...acc.business,
                    verificationStatus: newStatus,
                    rejectionReason: newStatus === 'REJECTED' ? reason || null : null,
                    updatedAt: nowIso,
                  },
                };
              }
              return acc;
            });
            localStorage.setItem('serviceloop_registered_accounts', JSON.stringify(updated));
          }

          // Also check demo business key if matched
          const demoBizRaw = localStorage.getItem('serviceloop_demo_business');
          if (demoBizRaw) {
            const demoBiz = JSON.parse(demoBizRaw);
            if (demoBiz && (demoBiz.id === targetId || demoBiz.ownerId === targetId)) {
              demoBiz.verificationStatus = newStatus;
              demoBiz.updatedAt = nowIso;
              localStorage.setItem('serviceloop_demo_business', JSON.stringify(demoBiz));
            }
          }

          // Dedicated key
          localStorage.setItem(`serviceloop_registered_business_${targetId}`, JSON.stringify({
            ...targetBiz,
            verificationStatus: newStatus,
            rejectionReason: newStatus === 'REJECTED' ? reason || null : null,
            updatedAt: nowIso,
          }));
        } catch (e) {
          console.warn('Error syncing localStorage:', e);
        }
      }

      // If drawer was open, update it
      if (selectedBiz && (selectedBiz.id || selectedBiz.ownerId) === targetId) {
        setSelectedBiz({
          ...selectedBiz,
          verificationStatus: newStatus,
          reviewedBy: reviewer,
          reviewedAt: nowIso,
          rejectionReason: newStatus === 'REJECTED' ? reason || null : null,
        });
      }

      const statusLabels: Record<BusinessVerificationStatus, string> = {
        VERIFIED: 'verified as an authentic business',
        REJECTED: 'marked as rejected',
        SUSPENDED: 'suspended from platform access',
        PENDING_VERIFICATION: 'reverted to pending review',
      };

      setActionSuccessMessage(`Successfully ${statusLabels[newStatus]}: "${targetBiz.businessName}"`);
      setTimeout(() => setActionSuccessMessage(null), 4000);
      setRejectModalBiz(null);
      setRejectionReasonInput('');
    } catch (err: unknown) {
      console.error('Failed to update verification status:', err);
      alert('Failed to update status. Check administrator permissions.');
    } finally {
      setActionLoading(false);
    }
  };

  if (authLoading || !admin) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400">Verifying administrator credentials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Administrative Header */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-inner">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm sm:text-base text-white tracking-tight">
                  ServiceLoop Control Console
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-950 border border-indigo-800 text-indigo-400">
                  Super Admin
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Authenticity Verification & Business Ecosystem Governance
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-slate-700/80 transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              View User App
            </Link>

            <button
              onClick={loadBusinesses}
              disabled={refreshing}
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-slate-700 transition-all cursor-pointer"
              title="Refresh Business Directory"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-indigo-400' : ''}`} />
            </button>

            {/* Admin Profile & Sign Out */}
            <div className="flex items-center gap-2.5 pl-3 border-l border-slate-800">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-white leading-tight">{admin.name}</p>
                <p className="text-[10px] text-slate-400 font-mono leading-tight">{admin.email}</p>
              </div>
              <button
                onClick={logoutAdmin}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 transition-all cursor-pointer"
                title="End Administrator Session"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Banner Alert if Successful Action */}
        <AnimatePresence>
          {actionSuccessMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-800/80 text-emerald-300 text-xs flex items-center justify-between shadow-lg"
            >
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span className="font-medium">{actionSuccessMessage}</span>
              </div>
              <button 
                onClick={() => setActionSuccessMessage(null)}
                className="text-emerald-400 hover:text-emerald-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Executive Metrics Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {/* Total */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium">All Businesses</span>
              <Building2 className="w-4 h-4 text-slate-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white">{stats.total}</span>
              <span className="text-[11px] text-slate-400 font-medium">registered</span>
            </div>
          </div>

          {/* Pending Verification - Critical Action Item */}
          <div 
            onClick={() => setStatusFilter('PENDING_VERIFICATION')}
            className={`border rounded-xl p-4 shadow-sm cursor-pointer transition-all ${
              statusFilter === 'PENDING_VERIFICATION' 
                ? 'bg-amber-950/50 border-amber-500 ring-1 ring-amber-500' 
                : 'bg-amber-950/20 border-amber-800/50 hover:bg-amber-950/30'
            }`}
          >
            <div className="flex items-center justify-between text-amber-300 mb-2">
              <span className="text-xs font-semibold">Pending Audit</span>
              <AlertTriangle className="w-4 h-4 text-amber-400 animate-pulse" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-amber-200">{stats.pending}</span>
              <span className="text-[11px] text-amber-300 font-medium">need review</span>
            </div>
          </div>

          {/* Verified */}
          <div 
            onClick={() => setStatusFilter('VERIFIED')}
            className={`border rounded-xl p-4 shadow-sm cursor-pointer transition-all ${
              statusFilter === 'VERIFIED' 
                ? 'bg-emerald-950/50 border-emerald-500 ring-1 ring-emerald-500' 
                : 'bg-emerald-950/20 border-emerald-800/50 hover:bg-emerald-950/30'
            }`}
          >
            <div className="flex items-center justify-between text-emerald-300 mb-2">
              <span className="text-xs font-semibold">Authentic Verified</span>
              <BadgeCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-emerald-200">{stats.verified}</span>
              <span className="text-[11px] text-emerald-300 font-medium">approved</span>
            </div>
          </div>

          {/* Rejected */}
          <div 
            onClick={() => setStatusFilter('REJECTED')}
            className={`border rounded-xl p-4 shadow-sm cursor-pointer transition-all ${
              statusFilter === 'REJECTED' 
                ? 'bg-rose-950/50 border-rose-500 ring-1 ring-rose-500' 
                : 'bg-rose-950/20 border-rose-800/50 hover:bg-rose-950/30'
            }`}
          >
            <div className="flex items-center justify-between text-rose-300 mb-2">
              <span className="text-xs font-semibold">Audit Rejected</span>
              <ShieldX className="w-4 h-4 text-rose-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-rose-200">{stats.rejected}</span>
              <span className="text-[11px] text-rose-300 font-medium">declined</span>
            </div>
          </div>

          {/* Suspended */}
          <div 
            onClick={() => setStatusFilter('SUSPENDED')}
            className={`border rounded-xl p-4 shadow-sm cursor-pointer transition-all col-span-2 sm:col-span-1 ${
              statusFilter === 'SUSPENDED' 
                ? 'bg-slate-800 border-indigo-500 ring-1 ring-indigo-500' 
                : 'bg-slate-900/90 border-slate-800 hover:bg-slate-850'
            }`}
          >
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium">Suspended</span>
              <Lock className="w-4 h-4 text-slate-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-200">{stats.suspended}</span>
              <span className="text-[11px] text-slate-400 font-medium">restricted</span>
            </div>
          </div>
        </div>

        {/* Verification Alert Banner if Pending Items Exist */}
        {stats.pending > 0 && statusFilter !== 'PENDING_VERIFICATION' && (
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-950/40 via-amber-900/30 to-amber-950/40 border border-amber-700/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-900/50 border border-amber-600/50 flex items-center justify-center text-amber-300">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-amber-200">
                  {stats.pending} New Business {stats.pending === 1 ? 'Registration' : 'Registrations'} Awaiting Authenticity Verification
                </p>
                <p className="text-[11px] text-amber-300/80">
                  Inspect trade licenses, verify government references, and approve authentic operators.
                </p>
              </div>
            </div>
            <button
              onClick={() => setStatusFilter('PENDING_VERIFICATION')}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all font-semibold cursor-pointer shadow-sm"
            >
              Review Queue
            </button>
          </div>
        )}

        {/* Filter and Control Bar */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search businesses by name, owner, license reference, phone, city, or trade..."
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <div className="relative min-w-[180px]">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-all cursor-pointer appearance-none pr-8"
                >
                  <option value="ALL">All Trade Verticals</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {(statusFilter !== 'ALL' || categoryFilter !== 'ALL' || searchQuery) && (
                <button
                  onClick={() => {
                    setStatusFilter('ALL');
                    setCategoryFilter('ALL');
                    setSearchQuery('');
                  }}
                  className="px-2.5 py-2 rounded-xl text-xs text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 transition-all cursor-pointer"
                  title="Reset filters"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-t border-slate-800/80 pt-3 text-xs">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === 'ALL'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              All Businesses ({stats.total})
            </button>

            <button
              onClick={() => setStatusFilter('PENDING_VERIFICATION')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                statusFilter === 'PENDING_VERIFICATION'
                  ? 'bg-amber-600 text-white shadow-sm font-semibold'
                  : 'bg-slate-800/60 text-amber-300 hover:text-amber-200 hover:bg-slate-800'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Pending Review ({stats.pending})
            </button>

            <button
              onClick={() => setStatusFilter('VERIFIED')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                statusFilter === 'VERIFIED'
                  ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                  : 'bg-slate-800/60 text-emerald-400 hover:text-emerald-300 hover:bg-slate-800'
              }`}
            >
              <BadgeCheck className="w-3.5 h-3.5" />
              Verified Authentic ({stats.verified})
            </button>

            <button
              onClick={() => setStatusFilter('REJECTED')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                statusFilter === 'REJECTED'
                  ? 'bg-rose-600 text-white shadow-sm font-semibold'
                  : 'bg-slate-800/60 text-rose-400 hover:text-rose-300 hover:bg-slate-800'
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              Rejected ({stats.rejected})
            </button>

            <button
              onClick={() => setStatusFilter('SUSPENDED')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                statusFilter === 'SUSPENDED'
                  ? 'bg-slate-700 text-white shadow-sm font-semibold'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              Suspended ({stats.suspended})
            </button>
          </div>
        </div>

        {/* Business Management Directory Table / Grid */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              Business Directory & Verification Registry ({filteredBusinesses.length})
            </h2>
            <span className="text-[11px] text-slate-500">
              Showing active platform tenants
            </span>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs text-slate-400">Compiling tenant ecosystem...</p>
            </div>
          ) : filteredBusinesses.length === 0 ? (
            <div className="p-12 text-center">
              <Building2 className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-300">No businesses match criteria</p>
              <p className="text-xs text-slate-500 mt-1">
                Try modifying your search or switching verification status filters.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/70 overflow-x-auto">
              {filteredBusinesses.map((b) => {
                const bId = b.id || b.ownerId;
                const isPending = b.verificationStatus === 'PENDING_VERIFICATION';
                const isVerified = b.verificationStatus === 'VERIFIED';
                const isRejected = b.verificationStatus === 'REJECTED';
                const isSuspended = b.verificationStatus === 'SUSPENDED';

                return (
                  <div
                    key={bId}
                    className="p-4 sm:p-5 hover:bg-slate-850/60 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                  >
                    {/* Left: Business Details & Verification Identity */}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm text-white">
                          {b.businessName}
                        </span>

                        {/* Trade Category Tag */}
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                          {b.businessType}
                        </span>

                        {/* Verification Status Pill */}
                        {isVerified && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
                            <BadgeCheck className="w-3.5 h-3.5" />
                            Authentic & Verified
                          </span>
                        )}
                        {isPending && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-950 text-amber-300 border border-amber-800 animate-pulse">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Pending Audit Review
                          </span>
                        )}
                        {isRejected && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-950 text-rose-400 border border-rose-800">
                            <XCircle className="w-3.5 h-3.5" />
                            Audit Rejected
                          </span>
                        )}
                        {isSuspended && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                            <Lock className="w-3.5 h-3.5" />
                            Suspended
                          </span>
                        )}
                      </div>

                      {/* Secondary Info Line */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                        <span className="flex items-center gap-1 text-slate-300">
                          <User className="w-3.5 h-3.5 text-slate-500" />
                          Owner: <strong className="font-medium text-white">{b.ownerName}</strong>
                        </span>

                        {b.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3.5 h-3.5 text-slate-500" />
                            {b.email}
                          </span>
                        )}

                        {b.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-slate-500" />
                            {b.phone}
                          </span>
                        )}

                        {b.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-500" />
                            {b.location}
                          </span>
                        )}
                      </div>

                      {/* Authenticity Credentials Reference & Rejection Note */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400 pt-1">
                        <span className="font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-slate-300 flex items-center gap-1.5">
                          <FileCheck2 className="w-3 h-3 text-indigo-400" />
                          {b.documentType || 'Trade License'}: <strong>{b.documentReference || `REF-${bId.slice(0, 8).toUpperCase()}`}</strong>
                        </span>

                        {b.reviewedBy && (
                          <span className="text-slate-400">
                            Audited by: <span className="font-mono text-slate-300">{b.reviewedBy}</span>
                          </span>
                        )}

                        {b.rejectionReason && (
                          <span className="text-rose-400 font-medium">
                            Reason: {b.rejectionReason}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: Administrative Actions */}
                    <div className="flex items-center gap-2 flex-wrap lg:flex-nowrap flex-shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800/60">
                      {/* One-Click Verify Action (if not verified) */}
                      {!isVerified && (
                        <button
                          onClick={() => handleUpdateStatus(b, 'VERIFIED')}
                          disabled={actionLoading}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                          title="Verify and approve this business as authentic"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve & Verify</span>
                        </button>
                      )}

                      {/* Reject Action (if pending or verified) */}
                      {!isRejected && (
                        <button
                          onClick={() => {
                            setRejectModalBiz(b);
                            setRejectionReasonInput('');
                          }}
                          disabled={actionLoading}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-rose-950/60 hover:bg-rose-900/60 border border-rose-800/60 text-rose-300 transition-all flex items-center gap-1 cursor-pointer"
                          title="Reject or decline verification"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      )}

                      {/* Suspend Action (if not suspended) */}
                      {!isSuspended && (
                        <button
                          onClick={() => handleUpdateStatus(b, 'SUSPENDED')}
                          disabled={actionLoading}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer"
                          title="Suspend business operations"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>Suspend</span>
                        </button>
                      )}

                      {/* Reopen / Reset to Pending if already decided */}
                      {(isVerified || isRejected || isSuspended) && (
                        <button
                          onClick={() => handleUpdateStatus(b, 'PENDING_VERIFICATION')}
                          disabled={actionLoading}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-amber-950/40 hover:bg-amber-900/40 border border-amber-800/40 text-amber-300 transition-all flex items-center gap-1 cursor-pointer"
                          title="Reset to Pending Review"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Reopen</span>
                        </button>
                      )}

                      {/* Inspect Profile Details Drawer */}
                      <button
                        onClick={() => setSelectedBiz(b)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Audit File</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Reject Reason Modal */}
      <AnimatePresence>
        {rejectModalBiz && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3 text-rose-400 border-b border-slate-800 pb-3">
                <div className="w-9 h-9 rounded-xl bg-rose-950/80 border border-rose-800/60 flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Decline Business Verification</h3>
                  <p className="text-xs text-slate-400">{rejectModalBiz.businessName}</p>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Specify the audit finding or discrepancy why this business does not meet authenticity criteria. This will be recorded in the audit trail and communicated to the business owner.
              </p>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Audit Rejection Finding / Reason *
                </label>
                <textarea
                  rows={3}
                  value={rejectionReasonInput}
                  onChange={(e) => setRejectionReasonInput(e.target.value)}
                  placeholder="e.g. Invalid MSME Udyam certificate format; Address could not be validated on commercial registrar; Trade license expired..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition-all"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setRejectModalBiz(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!rejectionReasonInput.trim() || actionLoading}
                  onClick={() => handleUpdateStatus(rejectModalBiz, 'REJECTED', rejectionReasonInput.trim())}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white transition-all cursor-pointer"
                >
                  Confirm Rejection
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Deep Business Inspection Audit File Modal / Drawer */}
      <AnimatePresence>
        {selectedBiz && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-indigo-950/80 border border-indigo-800/60 flex items-center justify-center text-indigo-400">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-white flex items-center gap-2">
                      {selectedBiz.businessName}
                      {selectedBiz.verificationStatus === 'VERIFIED' && (
                        <BadgeCheck className="w-4 h-4 text-emerald-400" />
                      )}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Tenant ID: <span className="font-mono text-slate-300">{selectedBiz.id || selectedBiz.ownerId}</span>
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedBiz(null)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status Header Block */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 font-medium block">Verification Decision</span>
                  <div className="mt-1">
                    {selectedBiz.verificationStatus === 'VERIFIED' && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                        <BadgeCheck className="w-4 h-4" />
                        Authentic Verified Business
                      </span>
                    )}
                    {selectedBiz.verificationStatus === 'PENDING_VERIFICATION' && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-300">
                        <AlertTriangle className="w-4 h-4" />
                        Awaiting Administrative Review
                      </span>
                    )}
                    {selectedBiz.verificationStatus === 'REJECTED' && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-400">
                        <XCircle className="w-4 h-4" />
                        Audit Failed / Rejected
                      </span>
                    )}
                    {selectedBiz.verificationStatus === 'SUSPENDED' && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400">
                        <Lock className="w-4 h-4" />
                        Platform Access Suspended
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {selectedBiz.verificationStatus !== 'VERIFIED' && (
                    <button
                      onClick={() => handleUpdateStatus(selectedBiz, 'VERIFIED')}
                      disabled={actionLoading}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Approve
                    </button>
                  )}
                  {selectedBiz.verificationStatus !== 'REJECTED' && (
                    <button
                      onClick={() => {
                        setRejectModalBiz(selectedBiz);
                        setRejectionReasonInput('');
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-950/80 hover:bg-rose-900 border border-rose-800/80 text-rose-300 transition-all cursor-pointer"
                    >
                      Reject
                    </button>
                  )}
                </div>
              </div>

              {/* Grid of Profile Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3">
                  <span className="text-[11px] text-slate-500 block mb-1">Business Owner</span>
                  <p className="font-semibold text-white flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-indigo-400" />
                    {selectedBiz.ownerName}
                  </p>
                </div>

                <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3">
                  <span className="text-[11px] text-slate-500 block mb-1">Trade Vertical</span>
                  <p className="font-semibold text-white">{selectedBiz.businessType}</p>
                </div>

                <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3">
                  <span className="text-[11px] text-slate-500 block mb-1">Contact Email</span>
                  <p className="font-mono text-slate-300 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    {selectedBiz.email || 'None provided'}
                  </p>
                </div>

                <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3">
                  <span className="text-[11px] text-slate-500 block mb-1">Contact Phone</span>
                  <p className="font-mono text-slate-300 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    {selectedBiz.phone || 'None provided'}
                  </p>
                </div>

                <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 sm:col-span-2">
                  <span className="text-[11px] text-slate-500 block mb-1">Physical Operating Base</span>
                  <p className="font-medium text-slate-200 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-400" />
                    {selectedBiz.location || 'Not Specified'}
                  </p>
                </div>
              </div>

              {/* Authenticity Credentials Box */}
              <div className="bg-indigo-950/30 border border-indigo-800/40 rounded-xl p-4 text-xs space-y-2">
                <div className="flex items-center gap-2 text-indigo-300 font-semibold">
                  <FileCheck2 className="w-4 h-4 text-indigo-400" />
                  <span>Trade Verification Credentials & Reference</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                  <div>
                    <span className="text-slate-500 block">Registration Type:</span>
                    <span className="text-slate-200">{selectedBiz.documentType || 'GSTIN Registration'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Identifier / Reference Number:</span>
                    <span className="text-indigo-200 font-bold">{selectedBiz.documentReference || `REF-${selectedBiz.id?.slice(0, 8).toUpperCase()}`}</span>
                  </div>
                </div>
              </div>

              {/* Audit Trail Info */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-400 space-y-1">
                <p>
                  <strong>Registered On:</strong> {new Date(selectedBiz.createdAt).toLocaleDateString()} at {new Date(selectedBiz.createdAt).toLocaleTimeString()}
                </p>
                {selectedBiz.reviewedBy && (
                  <p>
                    <strong>Last Audit Action:</strong> {selectedBiz.reviewedBy} on {selectedBiz.reviewedAt ? new Date(selectedBiz.reviewedAt).toLocaleDateString() : 'N/A'}
                  </p>
                )}
                {selectedBiz.rejectionReason && (
                  <p className="text-rose-400">
                    <strong>Rejection Finding:</strong> {selectedBiz.rejectionReason}
                  </p>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedBiz(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
                >
                  Close Audit File
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
