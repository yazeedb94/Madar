'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/context';

export default function SetupPage() {
  const { updateSettings } = useApp();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined' && sessionStorage.getItem('is_super_admin_authenticated') !== 'true') {
      router.replace('/login');
    }
  }, [router]);

  if (!mounted) {
    return (
      <div className="setup-container">
        <div className="setup-card" style={{ minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p>Loading... | جاري التحميل...</p>
        </div>
      </div>
    );
  }

  // No further UI – setup page is disabled.
  return null;
}
