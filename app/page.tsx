'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/context';

export default function Home() {
  const { settings, isHydrated } = useApp();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isHydrated && settings) {
      if (settings.isOnboarded) {
        router.push('/dashboard');
      } else {
        router.push('/setup');
      }
    }
  }, [settings, router, isHydrated]);

  if (!mounted) return null;

  return (
    <div className="flex-center" style={{ height: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      <div className="text-center">
        <div style={{
          width: '50px',
          height: '50px',
          border: '3px solid var(--border-color)',
          borderTopColor: 'var(--primary)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 1rem'
        }} />
        <style jsx global>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
        <p style={{ color: 'var(--text-secondary)' }}>جاري التحميل... | Loading...</p>
      </div>
    </div>
  );
}
