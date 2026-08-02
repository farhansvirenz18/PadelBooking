import AdminGuard from '@/components/AdminGuard';
import AdminSidebar from '@/components/AdminSidebar';

export const metadata = {
  title: 'Admin - Aero Padel',
};

export default function AdminLayout({ children }) {
  return (
    <AdminGuard>
      <div className="min-h-screen bg-background flex">
        <AdminSidebar />
        <main className="flex-1 md:ml-64">
          {children}
        </main>
      </div>
    </AdminGuard>
  );
}
