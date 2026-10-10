'use client';

import { useState } from 'react';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
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
  ArrowRight, 
  UserPlus, 
  ShieldCheck
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signInAsDemo, checkOnboarded, loginLocalAccount } = useAuth();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;

      // Check if business profile exists for this authenticated UID
      const docRef = doc(db, 'businesses', user.uid);
      const snap = await getDoc(docRef);

      await checkOnboarded();

      if (snap.exists()) {
        router.push('/dashboard');
      } else {
        router.push('/onboarding');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to sign in';

      // If Firebase Auth provider is disabled or user is in local registration registry, log them in
      if (
        message.includes('auth/operation-not-allowed') ||
        message.includes('auth/invalid-credential') ||
        message.includes('auth/user-not-found') ||
        message.includes('OPERATION_NOT_ALLOWED')
      ) {
        const localResult = loginLocalAccount(email.trim(), password);
        if (localResult.success) {
          router.push('/dashboard');
          return;
        } else if (
          message.includes('auth/operation-not-allowed') ||
          message.includes('OPERATION_NOT_ALLOWED')
        ) {
          setError(localResult.error || 'No business account found with this email. Please register below.');
          return;
        }
      }

      if (
        message.includes('auth/invalid-credential') ||
        message.includes('auth/user-not-found') ||
        message.includes('auth/wrong-password')
      ) {
        setError('No business account found with this email or password is incorrect. If you are new, please register below.');
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await signInWithPopup(auth, googleProvider);
      const user = res.user;

      const docRef = doc(db, 'businesses', user.uid);
      const snap = await getDoc(docRef);

      await checkOnboarded();

      if (snap.exists()) {
        router.push('/dashboard');
      } else {
        router.push('/onboarding');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to sign in with Google';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50/80 p-4 sm:p-6 relative overflow-hidden">
      {/* Luxury Ambient Radial Mesh & Fine Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(99,102,241,0.06),transparent)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000004_1px,transparent_1px),linear-gradient(to_bottom,#00000004_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.07),0_1px_3px_rgba(0,0,0,0.03)] p-6 sm:p-8 border border-zinc-200/80 relative z-10"
      >
        {/* Navigation & Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-100">
          <Link 
            href="/" 
            className="text-xs font-semibold text-zinc-500 hover:text-zinc-950 inline-flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-zinc-400" /> Back to Home
          </Link>
          <Logo href="/" size="sm" />
        </div>

        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-sans font-extrabold text-zinc-950 tracking-tight">
            Sign In to Your Business
          </h1>
          <p className="text-zinc-500 text-xs sm:text-sm mt-1">
            Access your private client pipeline & follow-up workspace
          </p>
        </div>

        {/* Instant 1-Click Demo Button */}
        <div className="mb-6">
          <button
            type="button"
            onClick={() => signInAsDemo()}
            className="w-full bg-indigo-50/80 hover:bg-indigo-100/90 text-indigo-700 border border-indigo-200/80 rounded-xl py-2.5 px-4 font-semibold transition-all flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer shadow-2xs"
          >
            <Sparkles className="w-4 h-4 text-indigo-600" />
            Continue with Demo Account (Instant Access)
          </button>
          <div className="mt-4 flex items-center justify-center gap-4">
            <div className="h-px bg-zinc-200/80 flex-1"></div>
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">OR ENTER CREDENTIALS</span>
            <div className="h-px bg-zinc-200/80 flex-1"></div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50/90 text-red-800 flex flex-col gap-2 text-xs sm:text-sm border border-red-200">
            <div className="flex items-center gap-2 font-bold">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
              <span>Notice</span>
            </div>
            <p className="text-xs text-red-700 leading-relaxed">{error}</p>
            <div className="mt-1 pt-2 border-t border-red-200/60 flex items-center justify-between">
              <Link
                href="/register"
                className="text-xs font-bold text-indigo-600 underline hover:text-indigo-800 flex items-center gap-1"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Register new account here &rarr;
              </Link>
              <button
                type="button"
                onClick={() => signInAsDemo()}
                className="text-xs font-semibold text-zinc-700 hover:text-black cursor-pointer"
              >
                Use Demo
              </button>
            </div>
          </div>
        )}

        <button 
          onClick={handleGoogleLogin}
          disabled={loading}
          className="mb-4 w-full bg-white border border-zinc-200/90 text-zinc-800 rounded-xl py-2.5 font-semibold hover:bg-zinc-50 hover:border-zinc-300 transition-all flex items-center justify-center gap-2.5 disabled:opacity-70 text-xs sm:text-sm cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Sign in with Google
        </button>

        <form onSubmit={handleEmailLogin} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 text-sm rounded-xl border border-zinc-200/90 bg-white focus:ring-4 focus:ring-zinc-950/5 focus:border-zinc-950 outline-none transition-all"
                placeholder="you@example.in"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 text-sm rounded-xl border border-zinc-200/90 bg-white focus:ring-4 focus:ring-zinc-950/5 focus:border-zinc-950 outline-none transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gradient-to-b from-zinc-900 to-zinc-950 hover:from-zinc-800 hover:to-zinc-900 text-white rounded-xl py-2.5 text-sm font-semibold transition-all flex items-center justify-center disabled:opacity-70 cursor-pointer shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_1px_3px_rgba(0,0,0,0.08)] border border-zinc-800"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : 'Sign In to Dashboard'}
          </button>
        </form>

        {/* If no account exists callout */}
        <div className="mt-6 pt-5 border-t border-zinc-100 bg-slate-50/70 -mx-6 -mb-6 sm:-mx-8 sm:-mb-8 p-5 sm:p-6 rounded-b-2xl">
          <div className="text-center">
            <span className="text-xs text-zinc-600 font-medium">New business owner?</span>
            <div className="mt-2">
              <Link 
                href="/register" 
                className="inline-flex items-center justify-center gap-1.5 w-full bg-white border border-zinc-200/90 text-zinc-900 px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-zinc-50 hover:border-zinc-300 transition-colors shadow-2xs"
              >
                <UserPlus className="w-4 h-4 text-indigo-600" />
                Register New Business Account
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <p className="text-[11px] text-zinc-500 mt-2 flex items-center justify-center gap-1 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              100% private isolated workspace
            </p>
            <div className="mt-3 pt-3 border-t border-zinc-200/60">
              <Link 
                href="/admin/login" 
                className="text-[11px] font-semibold text-slate-500 hover:text-indigo-600 transition-colors inline-flex items-center gap-1"
              >
                <span>Platform Administrator? Access Admin Portal</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>

      </motion.div>
    </div>
  );
}
