import Sidebar from '@/components/dashboard/Sidebar';
import DashboardTopNav from '@/components/dashboard/DashboardTopNav';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ReactNode } from 'react';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  if (!session || session.user?.email !== 'nhacossfilipe@gmail.com') {
    redirect('/auth/login');
  }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#08070C] text-[#F8FAFC] overflow-hidden">
      <Sidebar userEmail={session.user?.email ?? 'admin@otterfy.co.mz'} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <DashboardTopNav />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
