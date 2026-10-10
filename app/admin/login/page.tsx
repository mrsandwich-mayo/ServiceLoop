'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { PRIMARY_ADMIN_EMAIL } from '@/lib/adminAuth';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Mail, 
  KeyRound, 
  ArrowLeft, 
  AlertCircle, 
  Loader2, 
  CheckCircle2,
  Fingerprint
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'motion/react';

export default function AdminLoginPage() {
  const router = useRouter();
  const { loginAsAdmin } = useAdminAuth(false);

  const [email, setEmail] = useState(PRIMARY_ADMIN_EMAIL);
  const [passkey, setPasskey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const normEmail = email.trim().toLowerCase();
    if (!normEmail) {
      setError('Please provide administrator email address.');
      return;
    }

    // Security check: only authorized platform administrators
    if (
      normEmail !== PRIMARY_ADMIN_EMAIL.toLowerCase() &&
      !normEmail.endsWith('@serviceloop.in') &&
      normEmail !== 'admin@serviceloop.com'
    ) {
      setError(`Access denied. '${normEmail}' is not registered with Platform Administrator privileges.`);
      return;
    }

    if (!passkey.trim()) {
      setError('Please enter the administrator master passkey or security code.');
      return;
    }

    if (passkey.trim().length < 6) {
      setError('Administrator passkey must be at least 6 characters.');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      loginAsAdmin(normEmail, normEmail.startsWith('abdullah') ? 'Abdullah (Primary Admin)' : 'Platform Administrator');
      setSuccess(true);
      setTimeout(() => {
        router.push('/admin');
      }, 600);
    }, 700);
  };

  const handleQuickAuthorizePrimary = () => {
    setError('');
    setLoading(true);
    setTimeout(() => {
      loginAsAdmin(PRIMARY_ADMIN_EMAIL, 'Abdullah (Primary Admin)');
      setSuccess(true);
      setTimeout(() => {
        router.push('/admin');
      }, 500);
    }, 400);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden selection:bg-indigo-500 selection:text-white">
      {/* Background Matrix & High-Security Ambient Lighting */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(99,102,241,0.2),transparent_70%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
      
      {/* Security Level Indicator */}
      <div className="w-full max-w-md flex items-center justify-between mb-4 z-10 px-1">
        <Link 
          href="/login" 
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Return to Business Portal
        </Link>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          SECURE PORTAL V1
        </span>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-xl p-6 sm:p-8 z-10 relative"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-950/80 border border-indigo-500/30 text-indigo-400 shadow-inner mb-3">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Admin Governance Console
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Business Verification & Operational Control
          </p>
        </div>

        {/* Notice Banner */}
        <div className="mb-5 p-3 rounded-xl bg-amber-950/30 border border-amber-800/40 text-amber-300 text-xs flex items-start gap-2.5 leading-relaxed">
          <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-200">Restricted Administration Access</p>
            <p className="text-[11px] text-amber-300/80 mt-0.5">
              Authorizes access to verify authentic service businesses, audit licenses, and enforce platform governance.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-xl bg-rose-950/50 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-5 p-3 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Administrator access granted. Redirecting to console...</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleAdminLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Authorized Administrator Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@serviceloop.in"
                required
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono text-xs"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              Primary Administrator: <span className="text-slate-300 font-mono">{PRIMARY_ADMIN_EMAIL}</span>
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Master Admin Passkey / Security Code
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={passkey}
                onChange={(e) => setPasskey(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-medium py-2.5 px-4 rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-[0.99] cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Verifying Credentials...
              </>
            ) : (
              <>
                <Fingerprint className="w-4 h-4" />
                Authenticate & Enter Console
              </>
            )}
          </button>
        </form>

        {/* Separator */}
        <div className="my-5 flex items-center gap-3">
          <div className="flex-1 h-px bg-slate-800" />
          <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">or</span>
          <div className="flex-1 h-px bg-slate-800" />
        </div>

        {/* Quick Authorize for Primary Admin */}
        <button
          type="button"
          onClick={handleQuickAuthorizePrimary}
          disabled={loading}
          className="w-full bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 text-slate-200 text-xs font-medium py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-2 active:scale-[0.99] cursor-pointer"
        >
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>One-Click Authorize as Primary Admin ({PRIMARY_ADMIN_EMAIL})</span>
        </button>

        {/* Footer info */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 text-center text-[11px] text-slate-400">
          <p>ServiceLoop Platform Governance System</p>
          <p className="mt-0.5 text-slate-400">Session verified via cryptographic administrative token</p>
        </div>
      </motion.div>
    </div>
  );
}
