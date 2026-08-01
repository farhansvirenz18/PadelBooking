"use client"
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function AdminGuard({ children }) {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function check() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }

      const { data } = await supabase.from('users').select('role').eq('id', session.user.id).single();
      if (data?.role === 'admin') {
        setAllowed(true);
      } else {
        router.push('/');
      }
      setLoading(false);
    }
    check();
  }, [router]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-surface-variant border-t-primary rounded-full animate-spin" />
        <p className="text-on-surface-variant">Loading admin panel...</p>
      </div>
    </div>
  );

  if (!allowed) return null;
  return children;
}
