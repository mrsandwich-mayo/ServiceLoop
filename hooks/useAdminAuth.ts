'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  AdminSession, 
  getAdminSession, 
  setAdminSession, 
  clearAdminSession, 
  PRIMARY_ADMIN_EMAIL 
} from '@/lib/adminAuth';

export function useAdminAuth(requireAuth = true) {
  const [admin, setAdmin] = useState<AdminSession | null>(() => {
    if (typeof window !== 'undefined') {
      return getAdminSession();
    }
    return null;
  });
  const [loading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (requireAuth && !admin) {
      router.replace('/admin/login');
    }
  }, [requireAuth, admin, router]);

  const loginAsAdmin = (email: string, name = 'Admin Abdullah'): boolean => {
    const session: AdminSession = {
      email: email.trim().toLowerCase(),
      name,
      role: 'super_admin',
      authenticatedAt: new Date().toISOString(),
      token: 'admin_tok_' + Math.random().toString(36).substring(2, 12),
    };
    setAdminSession(session);
    setAdmin(session);
    return true;
  };

  const logoutAdmin = () => {
    clearAdminSession();
    setAdmin(null);
    router.replace('/admin/login');
  };

  return {
    admin,
    loading,
    isAdmin: !!admin,
    primaryAdminEmail: PRIMARY_ADMIN_EMAIL,
    loginAsAdmin,
    logoutAdmin,
  };
}
