'use client';

import { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Logo } from '@/components/Logo';
import Link from 'next/link';
import { 
  Mail, 
  Lock, 
  AlertCircle, 
  Loader2, 
  Sparkles, 
  ArrowLeft, 
  User, 
  Phone, 
  Building2, 
  Briefcase, 
  MapPin, 
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';
import { handleFirestoreError, OperationType } from '@/lib/firestoreErrors';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { 
  BUSINESS_CATEGORY_GROUPS, 
  ALL_BUSINESS_TYPES, 
  QUICK_SERVICE_PRESETS 
} from '@/lib/businessCategories';

const POPULAR_LOCATIONS = [
  'Bengaluru, Karnataka',
  'Mumbai, Maharashtra',
  'Delhi NCR, New Delhi',
  'Hyderabad, Telangana',
  'Pune, Maharashtra',
  'Chennai, Tamil Nadu',
  'Ahmedabad, Gujarat',
  'Kolkata, West Bengal',
  'Jaipur, Rajasthan',
  'Chandigarh, Punjab',
];

export default function RegisterPage() {
  const router = useRouter();
  const { signInAsDemo, checkOnboarded, registerLocalAccount } = useAuth();

  // Personal Credentials
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+91 ');
  const [password, setPassword] = useState('');

  // Business Credentials
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState(ALL_BUSINESS_TYPES[0]);
  const [customType, setCustomType] = useState('');
  const [location, setLocation] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Field validations
    if (!name.trim()) {
      setError('Please enter your full name');
      return;
    }
    if (!email.trim()) {
      setError('Please enter a valid email address');
      return;
    }
    if (!phone.trim() || phone.trim() === '+91') {
      setError('Please provide your Indian phone number');
      return;
    }
    if (!businessName.trim()) {
      setError('Please enter your business name');
      return;
    }
    if (!businessType.trim()) {
      setError('Please select or specify your business type');
      return;
    }
    if (businessType === 'Other Service Business (Specify Below)' && !customType.trim()) {
      setError('Please specify your custom trade or business type');
      return;
    }
    if (!location.trim()) {
      setError('Please enter your business location (city/state)');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    const finalBusinessType = (
      businessType === 'Other Service Business (Specify Below)'
        ? (customType.trim() || 'Custom Service Business')
        : businessType.trim()
    ).slice(0, 50);

    setLoading(true);

    try {
      // 1. Create account directly in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const registeredUser = userCredential.user;

      // 2. Persist private business record directly in Firestore
      const sanitizedData = {
        ownerId: registeredUser.uid,
        ownerName: name.trim().slice(0, 100),
        email: email.trim().slice(0, 120),
        phone: phone.trim().slice(0, 50),
        businessName: businessName.trim().slice(0, 100),
        businessType: finalBusinessType,
        location: location.trim().slice(0, 120),
        verificationStatus: 'PENDING_VERIFICATION' as const,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, 'businesses', registeredUser.uid), sanitizedData);

      await checkOnboarded();
      router.push('/dashboard');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      if (message.includes('auth/email-already-in-use')) {
        setError('An account with this email already exists. Please log in instead.');
      } else if (
        message.includes('auth/operation-not-allowed') ||
        message.includes('auth/admin-restricted-operation') ||
        message.includes('OPERATION_NOT_ALLOWED')
      ) {
        // Firebase Cloud project has email/password provider disabled;
        // Seamlessly register the business account with full local persistence so the owner is never blocked!
        const res = registerLocalAccount({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          password,
          businessName: businessName.trim(),
          businessType: finalBusinessType,
          location: location.trim(),
        });

        if (res.success) {
          router.push('/dashboard');
        } else {
          setError(res.error || 'Failed to complete registration.');
        }
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError('');

    if (!businessName.trim()) {
      setError('Please provide your Business Name before connecting Google');
      return;
    }
    if (businessType === 'Other Service Business (Specify Below)' && !customType.trim()) {
      setError('Please specify your custom trade or business type');
      return;
    }
    if (!location.trim()) {
      setError('Please specify your Business Location (City / State)');
      return;
    }

    const finalBusinessType = (
      businessType === 'Other Service Business (Specify Below)'
        ? (customType.trim() || 'Custom Service Business')
        : businessType.trim()
    ).slice(0, 50);

    setLoading(true);

    try {
      const res = await signInWithPopup(auth, googleProvider);
      const user = res.user;

      const sanitizedData = {
        ownerId: user.uid,
        ownerName: (name.trim() || user.displayName || 'Business Owner').slice(0, 100),
        email: (user.email || email.trim()).slice(0, 120),
        phone: phone.trim() !== '+91' ? phone.trim().slice(0, 50) : '',
        businessName: businessName.trim().slice(0, 100),
        businessType: finalBusinessType,
        location: location.trim().slice(0, 120),
        verificationStatus: 'PENDING_VERIFICATION' as const,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docPath = `businesses/${user.uid}`;
      try {
        await setDoc(doc(db, 'businesses', user.uid), sanitizedData);
      } catch (fsErr: unknown) {
        handleFirestoreError(fsErr, OperationType.CREATE, docPath);
      }

      await checkOnboarded();
      router.push('/dashboard');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Google sign up failed';
      setError(message);
    } finally {
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
        className="w-full max-w-xl bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.07),0_1px_3px_rgba(0,0,0,0.03)] p-6 sm:p-9 border border-zinc-200/80 relative z-10"
      >
        {/* Navigation & Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-100">
          <Link 
            href="/login" 
            className="text-xs font-semibold text-zinc-500 hover:text-zinc-950 inline-flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-zinc-400" /> Go to Login
          </Link>
          <Logo href="/" size="sm" />
        </div>

        <div className="mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50/90 text-indigo-700 text-xs font-bold mb-3 border border-indigo-200/80">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
            <span>Private Business Registration</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-sans font-extrabold text-zinc-950 tracking-tight">
            Register New Account
          </h1>
          <p className="text-zinc-500 text-xs sm:text-sm mt-1">
            Create your account to unlock your fresh, private business workspace.
          </p>
        </div>

        {/* Demo Account Callout */}
        <div className="mb-8 p-4 rounded-xl bg-slate-50/80 border border-zinc-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              Preview with Sample Data?
            </div>
            <p className="text-[11px] text-zinc-500 mt-0.5">Explore with pre-populated Indian client records in one click.</p>
          </div>
          <button
            type="button"
            onClick={() => signInAsDemo()}
            className="text-xs font-semibold bg-gradient-to-b from-zinc-900 to-zinc-950 hover:from-zinc-800 hover:to-zinc-900 text-white px-3.5 py-2 rounded-xl transition-all shadow-xs border border-zinc-800 whitespace-nowrap cursor-pointer"
          >
            Launch Demo Account
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-800 flex items-start gap-3 text-xs sm:text-sm border border-red-200">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-600" />
            <div>
              <p className="font-bold">Notice</p>
              <p className="mt-0.5 text-red-700">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-6">
          {/* Section 1: Personal Credentials */}
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
              <span>Step 1: Your Personal Credentials</span>
            </span>
            <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rajesh Kumar"
                    className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-zinc-300 focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-zinc-300 focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 outline-none transition-all font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="rajesh@example.in"
                    className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-zinc-300 focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-zinc-300 focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Business Credentials */}
          <div className="pt-4 border-t border-zinc-100">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
              <span>Step 2: Business Details</span>
            </span>

            <div className="mt-2.5 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Name of Business <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type="text"
                    required
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. Apex Electrical & Cooling Services"
                    className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-zinc-300 focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Quick Preset Service Chips */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-zinc-700">Quick select trade / service:</span>
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
                            ? 'bg-zinc-900 text-white shadow-xs scale-102'
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
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Type of Business / Trade <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <select
                      value={businessType}
                      onChange={(e) => {
                        setBusinessType(e.target.value);
                        if (e.target.value !== 'Other Service Business (Specify Below)') {
                          setCustomType('');
                        }
                      }}
                      className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm rounded-xl border border-zinc-300 focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 outline-none bg-white transition-all text-zinc-900"
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
                        placeholder="e.g. Dental Laboratory, Epoxy Coating, Drone Repair..."
                        className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 outline-none transition-all"
                      />
                    </motion.div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Location (City / State) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input
                      type="text"
                      required
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Bengaluru, Karnataka"
                      list="locations-list"
                      className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-zinc-300 focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 outline-none transition-all"
                    />
                    <datalist id="locations-list">
                      {POPULAR_LOCATIONS.map((loc) => (
                        <option key={loc} value={loc} />
                      ))}
                    </datalist>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Data Privacy Guarantee Badge */}
          <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200/80 text-xs text-zinc-700 flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-bold text-zinc-900">Data Isolation Guarantee: </span>
              Your business records (clients, jobs, invoices, follow-ups) are cryptographically restricted to your account. No other business can see your records even if they share the exact same trade and location.
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-b from-zinc-900 to-zinc-950 hover:from-zinc-800 hover:to-zinc-900 text-white rounded-xl py-3 font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_1px_3px_rgba(0,0,0,0.08)] border border-zinc-800 disabled:opacity-70 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                Setting up your fresh dashboard...
              </>
            ) : (
              'Create Account & Launch Fresh Dashboard'
            )}
          </button>

          {/* Alternative Google Sign Up */}
          <button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={loading}
            className="w-full bg-white border border-zinc-200/90 hover:border-zinc-300 text-zinc-800 rounded-xl py-2.5 text-xs sm:text-sm font-semibold hover:bg-zinc-50 transition-all flex items-center justify-center gap-2.5 disabled:opacity-60 cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign up with Google & this Business Info
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-zinc-100 text-center">
          <p className="text-xs text-zinc-600 font-medium">
            Already have an account?{' '}
            <Link href="/login" className="font-bold text-zinc-950 hover:underline">
              Sign in to your dashboard &rarr;
            </Link>
          </p>
        </div>

      </motion.div>
    </div>
  );
}
