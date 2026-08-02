"use client"
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function AdminGuard({ children }) {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    async function check() {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (cancelled) return;
        if (sessionError) {
          console.error('Session error:', sessionError);
          router.push('/login');
          return;
        }
        if (!session) { router.push('/login'); return; }

        const { data, error: roleError } = await supabase.from('users').select('role').eq('id', session.user.id).single();
        if (cancelled) return;
        if (roleError) {
          console.error('Role check error:', roleError);
          setError('Failed to verify admin access. Please try again.');
          setLoading(false);
          return;
        }
        if (data?.role === 'admin') {
          setAllowed(true);
        } else {
          router.push('/');
          return;
        }
        setLoading(false);
      } catch (err) {
        console.error('AdminGuard check failed:', err);
        if (!cancelled) {
          setError('Connection error. Please refresh or try again later.');
          setLoading(false);
        }
      }
    }
    check();
    return () => { cancelled = true; };
  }, [router]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-surface-variant border-t-primary rounded-full animate-spin" />
        <p className="text-on-surface-variant">Loading admin panel...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4 max-w-md text-center px-4">
        <div className="w-14 h-14 rounded-full bg-error-container flex items-center justify-center">
          <span className="material-symbols-outlined text-error text-[28px]">error</span>
        </div>
        <h2 className="font-display text-xl font-bold text-on-surface">Access Error</h2>
        <p className="text-on-surface-variant text-sm">{error}</p>
        <button onClick={() => window.location.reload()} className="px-6 py-2.5 rounded-full bg-primary text-on-primary text-sm font-medium hover:bg-primary-dark transition-colors">
          Retry
        </button>
      </div>
    </div>
  );

  if (!allowed) return null;
  return children;
}
