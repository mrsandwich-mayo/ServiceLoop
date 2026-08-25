'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Building2, UserCircle, Briefcase, AlertCircle, Loader2 } from 'lucide-react';

export default function OnboardingPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setError('');
    setLoading(true);
    
    try {
      const businessData = {
        ownerId: user.uid,
        businessName,
        ownerName,
        businessType,
      };
      
      const res = await fetch('/api/business', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(businessData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save details');
      }
      
      // Redirect to dashboard, auth provider should naturally allow it now
      window.location.href = '/dashboard'; // Force a full reload to make sure auth state updates immediately
    } catch (err: any) {
      setError(err.message || 'Failed to save details');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4 relative overflow-hidden">
      {/* Background gradients for a premium feel */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-64 bg-indigo-500/20 blur-[120px] rounded-full pointer-events-none"></div>
      
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 border border-gray-200 relative z-10">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-3">Let's get started</h1>
          <p className="text-gray-600 font-medium">Tell us a bit about your business</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-600 flex items-center gap-3 text-sm font-medium border border-red-100">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleOnboarding} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Business Name</label>
            <div className="relative">
              <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input 
                type="text" 
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-gray-900 font-medium placeholder:text-gray-400"
                placeholder="Acme Corp"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Owner Name</label>
            <div className="relative">
              <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input 
                type="text" 
                required
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-gray-900 font-medium placeholder:text-gray-400"
                placeholder="John Doe"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Business Type</label>
            <div className="relative">
              <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select 
                required
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all appearance-none text-gray-900 font-medium"
              >
                <option value="" disabled>Select a type...</option>
                <option value="retail">Retail</option>
                <option value="services">Services</option>
                <option value="restaurant">Restaurant</option>
                <option value="agency">Agency / Consulting</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-indigo-600 text-white rounded-xl py-3.5 font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:shadow-indigo-300 focus:ring-4 focus:ring-indigo-100 transition-all flex items-center justify-center disabled:opacity-70 mt-8"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Complete Setup'}
          </button>
        </form>
      </div>
    </div>
  );
}
