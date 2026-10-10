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
  const finalTotalRevenue = totalApprovedRev;
  const finalApprovedCount = approvedOrders.length;

  // Real synchronized chart data and metrics for current week (Segunda a Domingo)
  const now = new Date();
  const currentJsDay = now.getDay();
  const diffToMonday = currentJsDay === 0 ? 6 : currentJsDay - 1;
  const startOfThisWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMonday, 0, 0, 0, 0);

  // 7-day / This week orders & conversion metrics
  const thisWeekOrders = allOrders.filter(o => new Date(o.createdAt) >= startOfThisWeek);
  const thisWeekApproved = thisWeekOrders.filter(o => o.status === 'APPROVED');
  const thisWeekEmola = thisWeekOrders.filter(o => o.transaction?.method === 'EMOLA');
  const thisWeekMpesa = thisWeekOrders.filter(o => o.transaction?.method === 'MPESA');

  const conversionRate = thisWeekOrders.length > 0
    ? Number(((thisWeekApproved.length / thisWeekOrders.length) * 100).toFixed(1))
    : 0;

  const emolaTotal = thisWeekEmola.reduce((sum, o) => sum + o.amount, 0);
  const mpesaTotal = thisWeekMpesa.reduce((sum, o) => sum + o.amount, 0);

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
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

  const weekDayNames = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
  const weekDayShort = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

  // Synchronized weekly sales (Segunda a Domingo of current week)
  const weeklyData = weekDayNames.map((day, idx) => {
    const dayDate = new Date(startOfThisWeek);
    dayDate.setDate(startOfThisWeek.getDate() + idx);
    const dayStr = dayDate.toISOString().split('T')[0];
    const dateLabel = `${dayDate.getDate().toString().padStart(2, '0')}/${(dayDate.getMonth() + 1).toString().padStart(2, '0')}`;

    const count = approvedOrders.filter(o => o.createdAt.startsWith(dayStr)).length;
    return { day, vendas: count, date: dateLabel };
  });

  // Synchronized approvals vs volume (Strictly 7 days of the week, Segunda a Domingo)
  const approvalsVsVolumeData = weekDayShort.map((dayShort, idx) => {
    const dayDate = new Date(startOfThisWeek);
    dayDate.setDate(startOfThisWeek.getDate() + idx);
    const dayStr = dayDate.toISOString().split('T')[0];
    const dateLabel = `${dayDate.getDate().toString().padStart(2, '0')}/${(dayDate.getMonth() + 1).toString().padStart(2, '0')}`;

    const dayOrders = allOrders.filter(o => o.createdAt.startsWith(dayStr));
    const dayApproved = dayOrders.filter(o => o.status === 'APPROVED');
    const dayVolume = dayOrders.reduce((sum, o) => sum + o.amount, 0);
    const dayApprovedAmount = dayApproved.reduce((sum, o) => sum + o.amount, 0);

    return {
      date: dayShort,
      dayName: weekDayNames[idx],
      fullDate: dateLabel,
      aprovados: dayApprovedAmount,
      volume: dayVolume,
    };
  });

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
