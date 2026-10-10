'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { handleFirestoreError, OperationType } from '@/lib/firestoreErrors';
import { useAuth } from '@/hooks/useAuth';
import { Logo } from '@/components/Logo';
import { Building2, User, Briefcase, MapPin, Phone, AlertCircle, Loader2, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { 
  BUSINESS_CATEGORY_GROUPS, 
  ALL_BUSINESS_TYPES, 
  QUICK_SERVICE_PRESETS 
} from '@/lib/businessCategories';

export default function OnboardingPage() {
  const { user, checkOnboarded } = useAuth();
  const router = useRouter();
  
  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState(user?.displayName || '');
  const [phone, setPhone] = useState('+91 ');
  const [businessType, setBusinessType] = useState(ALL_BUSINESS_TYPES[0]);
  const [customType, setCustomType] = useState('');
  const [location, setLocation] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setError('');
    if (!businessName.trim() || !ownerName.trim() || !location.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    if (businessType === 'Other Service Business (Specify Below)' && !customType.trim()) {
      setError('Please specify your custom trade or business category.');
      return;
    }

    setLoading(true);
    
    try {
      const sanitizedBusinessName = businessName.trim().slice(0, 100);
      const sanitizedOwnerName = ownerName.trim().slice(0, 100);
      const finalBusinessType = (
        businessType === 'Other Service Business (Specify Below)'
          ? (customType.trim() || 'Custom Service Business')
          : businessType.trim()
      ).slice(0, 50);
      const sanitizedBusinessType = finalBusinessType;
      const sanitizedLocation = location.trim().slice(0, 120);
      const sanitizedPhone = phone.trim().slice(0, 50);

      const businessData = {
        ownerId: user.uid,
        businessName: sanitizedBusinessName,
        ownerName: sanitizedOwnerName,
        businessType: sanitizedBusinessType,
        location: sanitizedLocation,
        phone: sanitizedPhone,
        email: user.email || '',
        verificationStatus: 'PENDING_VERIFICATION' as const,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      const docPath = `businesses/${user.uid}`;
      try {
        await setDoc(doc(db, 'businesses', user.uid), businessData);
      } catch (fsErr: unknown) {
        console.warn('Firestore setDoc notice:', fsErr);
        if (typeof window !== 'undefined') {
          localStorage.setItem(`serviceloop_registered_business_${user.uid}`, JSON.stringify(businessData));
          localStorage.setItem('serviceloop_demo_business', JSON.stringify(businessData));
        }
        if (!user.isDemo) {
          handleFirestoreError(fsErr, OperationType.CREATE, docPath);
        }
      }

      await checkOnboarded();
      router.push('/dashboard');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save details';
      setError(message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50/80 p-4 sm:p-6 relative py-12 overflow-hidden">
      {/* Luxury Ambient Radial Mesh & Fine Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(99,102,241,0.06),transparent)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000004_1px,transparent_1px),linear-gradient(to_bottom,#00000004_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.07),0_1px_3px_rgba(0,0,0,0.03)] p-6 sm:p-9 border border-zinc-200/80 relative z-10"
      >
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-100">
          <Logo href="/" size="sm" />
          <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 bg-indigo-50/90 px-3 py-1 rounded-full border border-indigo-200/80">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
            <span>Profile Setup</span>
          </div>
        </div>

        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-sans font-extrabold text-zinc-950 tracking-tight mb-2">
            Complete Your Business Profile
          </h1>
          <p className="text-zinc-500 text-xs sm:text-sm">
            Configure your trade category and city to generate your fresh, private dashboard.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50/90 text-red-800 flex items-center gap-3 text-xs sm:text-sm border border-red-200">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
            <p className="leading-relaxed">{error}</p>
          </div>
        )}

        <form onSubmit={handleOnboarding} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">Your Full Name</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input 
                type="text" 
                required
                maxLength={100}
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 text-sm rounded-xl border border-zinc-200/90 bg-white focus:ring-4 focus:ring-zinc-950/5 focus:border-zinc-950 outline-none transition-all"
                placeholder="e.g. Rajesh Kumar"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">Phone Number (+91)</label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input 
                type="tel" 
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 text-sm rounded-xl border border-zinc-200/90 bg-white focus:ring-4 focus:ring-zinc-950/5 focus:border-zinc-950 outline-none transition-all font-mono text-xs"
                placeholder="+91 98765 43210"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">Business Name</label>
            <div className="relative">
              <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input 
                type="text" 
                required
                maxLength={100}
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 text-sm rounded-xl border border-zinc-200/90 bg-white focus:ring-4 focus:ring-zinc-950/5 focus:border-zinc-950 outline-none transition-all"
                placeholder="e.g. Apex Electrical & Cooling Services"
              />
            </div>
          </div>

              {/* Quick Preset Service Chips */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-zinc-700">Quick select trade:</span>
                  <span className="text-[10px] text-zinc-400">or choose from 35+ categories below</span>
                </div>
                <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-zinc-50 border border-zinc-200/80 max-h-24 overflow-y-auto">
                  {QUICK_SERVICE_PRESETS.map((preset) => {
                    const isSelected = businessType === preset.value;
                    return (
                      <button
                        type="button"
                        key={preset.value}
                        onClick={() => {
                          setBusinessType(preset.value);
                          setCustomType('');
                        }}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-zinc-900 text-white shadow-xs'
                            : 'bg-white text-zinc-700 hover:bg-zinc-100 border border-zinc-200'
                        }`}
                      >
                        <span>{preset.emoji}</span>
                        <span>{preset.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Business Type / Trade</label>
                  <div className="relative">
                    <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <select
                      value={businessType}
                      onChange={(e) => {
                        setBusinessType(e.target.value);
                        if (e.target.value !== 'Other Service Business (Specify Below)') {
                          setCustomType('');
                        }
                      }}
                      className="w-full pl-10 pr-3 py-2.5 text-xs sm:text-sm rounded-xl border border-zinc-300 focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 outline-none bg-white text-zinc-900"
                    >
                      {BUSINESS_CATEGORY_GROUPS.map((group) => (
                        <optgroup key={group.category} label={`── ${group.category} ──`} className="font-bold text-zinc-900">
                          {group.options.map((opt) => (
                            <option key={opt} value={opt} className="font-normal text-zinc-800">
                              {opt}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>

                  {businessType === 'Other Service Business (Specify Below)' && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-2"
                    >
                      <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                        Specify Your Trade / Service <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={customType}
                        onChange={(e) => setCustomType(e.target.value)}
                        placeholder="e.g. Dental Clinic, Painting, Custom Tech..."
                        className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 outline-none"
                      />
                    </motion.div>
                  )}
                </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Location</label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input 
                  type="text" 
                  required
                  maxLength={120}
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 text-sm rounded-xl border border-zinc-200/90 bg-white focus:ring-4 focus:ring-zinc-950/5 focus:border-zinc-950 outline-none transition-all"
                  placeholder="e.g. Bengaluru, Karnataka"
                />
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full mt-5 bg-gradient-to-b from-zinc-900 to-zinc-950 hover:from-zinc-800 hover:to-zinc-900 text-white rounded-xl py-3 font-semibold text-sm transition-all flex items-center justify-center disabled:opacity-70 cursor-pointer shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_1px_3px_rgba(0,0,0,0.08)] border border-zinc-800"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : 'Launch Fresh Dashboard'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
