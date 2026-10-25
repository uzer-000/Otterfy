import Sidebar from '@/components/dashboard/Sidebar';
import DashboardTopNav from '@/components/dashboard/DashboardTopNav';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getUserApprovalStatus, isAdminEmail } from '@/lib/adminState';
import { redirect } from 'next/navigation';
import { ReactNode } from 'react';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  let userEmail = session?.user?.email?.trim().toLowerCase();

  if (!userEmail && session?.user?.id) {
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true },
    });
    if (dbUser?.email) {
      userEmail = dbUser.email.trim().toLowerCase();
    }
  }

  if (!session || !userEmail) {
    redirect('/auth/login');
  }

  if (!isAdminEmail(userEmail)) {
    const status = await getUserApprovalStatus(userEmail, session.user?.id);
    if (status !== 'APPROVED') {
      redirect('/auth/pending-approval');
    }
  }

  return (
    <div className="flex flex-col md:flex-row h-dvh w-full max-w-[100vw] bg-[#F5F3FA] dark:bg-[#08070C] text-[#0F172A] dark:text-[#F8FAFC] overflow-hidden overscroll-x-none transition-colors">
      <Sidebar userEmail={userEmail} />
      <div className="flex-1 flex flex-col w-full max-w-full min-w-0 min-h-0 overflow-hidden bg-[#F5F3FA] dark:bg-[#08070C] text-[#0F172A] dark:text-[#F8FAFC] transition-colors">
        <DashboardTopNav />
        <main className="otter-main flex-1 overflow-y-auto overflow-x-hidden p-3.5 sm:p-6 lg:p-8 2xl:p-10 w-full max-w-full min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
