import TotalRevenueHeroCard from '@/components/dashboard/TotalRevenueHeroCard';
import CustomizableWidgets from '@/components/dashboard/CustomizableWidgets';
import DashboardGreetingBanner from '@/components/dashboard/DashboardGreetingBanner';
import dbStore from '@/lib/store';

export default async function DashboardPage() {
  const allOrders = await dbStore.getOrders();
  const data = await dbStore.getKPIs(allOrders);

  // Filter approved orders for notifications
  const approvedOrders = allOrders
    .filter((o) => o.status === 'APPROVED')
    .map((o) => ({
      id: o.id,
      customerName: o.customerName || 'Cliente Otterfy',
      amount: o.amount,
      createdAt: o.createdAt,
      method: o.transaction?.method || 'M-Pesa',
    }));

  // Calculations for pending, lost, refunds and average ticket
  const pendingOrders = allOrders.filter((o) => o.status === 'PENDING');
  const pendingAmount = pendingOrders.reduce((sum, o) => sum + o.amount, 0);
  const pendingCount = pendingOrders.length;

  const lostOrders = allOrders.filter((o) => o.status === 'DECLINED' || o.status === 'CANCELLED');
  const lostAmount = lostOrders.reduce((sum, o) => sum + o.amount, 0);
  const lostCount = lostOrders.length;

  const refundOrders = allOrders.filter((o) => o.status === 'REFUNDED');
  const refundsAmount = refundOrders.reduce((sum, o) => sum + o.amount, 0);
  const refundsCount = refundOrders.length;

  const totalApprovedRev = approvedOrders.reduce((sum, o) => sum + o.amount, 0);
  const averageTicket = approvedOrders.length > 0 ? Math.round(totalApprovedRev / approvedOrders.length) : 0;

  const emolaOrders = allOrders.filter((o) => o.transaction?.method === 'EMOLA');
  const mpesaOrders = allOrders.filter((o) => o.transaction?.method === 'MPESA');
  const emolaTotal = emolaOrders.reduce((sum, o) => sum + o.amount, 0);
  const mpesaTotal = mpesaOrders.reduce((sum, o) => sum + o.amount, 0);

  const finalTotalRevenue = totalApprovedRev;
  const finalApprovedCount = approvedOrders.length;
  const conversionRate = allOrders.length > 0 ? Number(((approvedOrders.length / allOrders.length) * 100).toFixed(1)) : 0;

  // Real synchronized chart data based on actual orders
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayOrders = allOrders.filter(o => new Date(o.createdAt) >= startOfToday);

  const hours = [
    '00:00', '01:00', '02:00', '03:00', '04:00', '05:00',
    '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
    '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
    '18:00', '19:00', '20:00', '21:00', '22:00', '23:59'
  ];

  const hourlyData = hours.map((hour, index) => {
    const ordersInHour = todayOrders.filter(o => {
      const h = new Date(o.createdAt).getHours();
      return h === index;
    });
    return {
      hour,
      iniciados: ordersInHour.length,
      aprovados: ordersInHour.filter(o => o.status === 'APPROVED').length,
    };
  });

  const weekDays = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
  const weeklyData = weekDays.map((day, idx) => {
    const targetJsDay = (idx + 1) % 7;
    const count = approvedOrders.filter(o => {
      const d = new Date(o.createdAt);
      return d.getDay() === targetJsDay && (now.getTime() - d.getTime()) <= 7 * 24 * 60 * 60 * 1000;
    }).length;
    return { day, vendas: count };
  });

  const approvalsVsVolumeData = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dayStr = d.toISOString().split('T')[0];
    const dateLabel = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
    
    const dayOrders = allOrders.filter(o => o.createdAt.startsWith(dayStr));
    const dayApproved = dayOrders.filter(o => o.status === 'APPROVED');
    const dayVolume = dayOrders.reduce((sum, o) => sum + o.amount, 0);
    const dayApprovedAmount = dayApproved.reduce((sum, o) => sum + o.amount, 0);

    approvalsVsVolumeData.push({
      date: dateLabel,
      aprovados: dayApprovedAmount,
      volume: dayVolume,
    });
  }

  return (
    <div className="w-full max-w-[2000px] 2xl:max-w-full mx-auto space-y-8 pb-16">
      {/* Top Greeting Banner */}
      <DashboardGreetingBanner />

      {/* Customizable Dashboard with Reorderable Blocks (Graphs First, KPIs, Transactions, etc.) */}
      <CustomizableWidgets
        todayRevenue={data.today.revenue}
        todaySalesCount={data.today.salesCount}
        weekRevenue={data.thisWeek.revenue}
        weekSalesCount={data.thisWeek.salesCount}
        monthRevenue={data.thisMonth.revenue}
        monthSalesCount={data.thisMonth.salesCount}
        pendingAmount={pendingAmount}
        pendingCount={pendingCount}
        lostAmount={lostAmount}
        lostCount={lostCount}
        refundsAmount={refundsAmount}
        refundsCount={refundsCount}
        averageTicket={averageTicket}
        emolaTotal={emolaTotal}
        mpesaTotal={mpesaTotal}
        conversionRate={conversionRate}
        recentTransactions={data.recentTransactions}
        totalRevenue={finalTotalRevenue}
        approvedCount={finalApprovedCount}
        hourlyData={hourlyData}
        weeklyData={weeklyData}
        approvalsVsVolumeData={approvalsVsVolumeData}
      />
    </div>
  );
}
