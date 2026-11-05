import TotalRevenueHeroCard from '@/components/dashboard/TotalRevenueHeroCard';
import CustomizableWidgets from '@/components/dashboard/CustomizableWidgets';
import DashboardGreetingBanner from '@/components/dashboard/DashboardGreetingBanner';
import dbStore from '@/lib/store';
import {
  getMozambiqueDate,
  getMozambiqueHour,
  getMozambiqueDayOfWeek,
  createMozambiqueDateUtc,
} from '@/lib/utils';

export const dynamic = 'force-dynamic';

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

  const lostOrders = allOrders.filter(
    (o) => o.status === 'DECLINED' || o.status === 'CANCELLED' || o.status === 'EXPIRED'
  );
  const lostAmount = lostOrders.reduce((sum, o) => sum + o.amount, 0);
  const lostCount = lostOrders.length;

  const refundOrders = allOrders.filter((o) => o.status === 'REFUNDED');
  const refundsAmount = refundOrders.reduce((sum, o) => sum + o.amount, 0);
  const refundsCount = refundOrders.length;

  const totalApprovedRev = approvedOrders.reduce((sum, o) => sum + o.amount, 0);
  const averageTicket = approvedOrders.length > 0 ? Math.round(totalApprovedRev / approvedOrders.length) : 0;
  const finalTotalRevenue = totalApprovedRev;
  const finalApprovedCount = approvedOrders.length;

  // Real synchronized chart data and metrics calibrated for Mozambique timezone (Africa/Maputo, CAT = UTC+2)
  const mozNow = getMozambiqueDate();
  const mozYear = mozNow.getUTCFullYear();
  const mozMonth = mozNow.getUTCMonth();
  const mozDay = mozNow.getUTCDate();
  const mozDayOfWeek = mozNow.getUTCDay();

  // Current calendar week in Mozambique (Segunda-feira às 00:00:00 CAT)
  const diffToMonday = mozDayOfWeek === 0 ? 6 : mozDayOfWeek - 1;
  const startOfThisWeek = createMozambiqueDateUtc(mozYear, mozMonth, mozDay - diffToMonday, 0, 0, 0, 0);
  const startOfLastWeek = createMozambiqueDateUtc(mozYear, mozMonth, mozDay - diffToMonday - 7, 0, 0, 0, 0);

  // 7-day / This week orders & conversion metrics
  const thisWeekOrders = allOrders.filter(o => new Date(o.createdAt) >= startOfThisWeek);
  const thisWeekApproved = thisWeekOrders.filter(o => o.status === 'APPROVED');
  const thisWeekEmola = thisWeekApproved.filter(o => o.transaction?.method === 'EMOLA');
  const thisWeekMpesa = thisWeekApproved.filter(o => o.transaction?.method === 'MPESA');

  const conversionRate = thisWeekOrders.length > 0
    ? Number(((thisWeekApproved.length / thisWeekOrders.length) * 100).toFixed(1))
    : 0;

  const emolaTotal = thisWeekEmola.reduce((sum, o) => sum + o.amount, 0);
  const mpesaTotal = thisWeekMpesa.reduce((sum, o) => sum + o.amount, 0);

  const startOfToday = createMozambiqueDateUtc(mozYear, mozMonth, mozDay, 0, 0, 0, 0);
  const startOfYesterday = createMozambiqueDateUtc(mozYear, mozMonth, mozDay - 1, 0, 0, 0, 0);
  const startOfTwoDaysAgo = createMozambiqueDateUtc(mozYear, mozMonth, mozDay - 2, 0, 0, 0, 0);

  const startOfThisMonth = createMozambiqueDateUtc(mozYear, mozMonth, 1, 0, 0, 0, 0);
  const startOfLastMonth = createMozambiqueDateUtc(mozYear, mozMonth - 1, 1, 0, 0, 0, 0);

  const startOfThisYear = createMozambiqueDateUtc(mozYear, 0, 1, 0, 0, 0, 0);
  const startOfLastYear = createMozambiqueDateUtc(mozYear - 1, 0, 1, 0, 0, 0, 0);

  const calcTrend = (curr: number, prev: number) => {
    if (prev <= 0) return curr > 0 ? '+100.0%' : '+0.0%';
    const diff = ((curr - prev) / prev) * 100;
    return `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}%`;
  };

  const hours = [
    '00:00', '01:00', '02:00', '03:00', '04:00', '05:00',
    '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
    '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
    '18:00', '19:00', '20:00', '21:00', '22:00', '23:59'
  ];

  const weekDayNames = [
    'Segunda-feira',
    'Terça-feira',
    'Quarta-feira',
    'Quinta-feira',
    'Sexta-feira',
    'Sábado',
    'Domingo',
  ];
  const weekDayShort = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

  const buildHourlySeries = (ordersList: typeof allOrders) =>
    hours.map((hour, index) => {
      const ordersInHour = ordersList.filter((o) => getMozambiqueHour(o.createdAt) === index);
      return {
        hour,
        iniciados: ordersInHour.length,
        aprovados: ordersInHour.filter((o) => o.status === 'APPROVED').length,
      };
    });

  // Always build weekly series from Monday to Sunday (Seg – Dom) in Mozambique time
  const buildWeeklyMondayToSundaySeries = (
    ordersList: typeof allOrders,
    weekMondayCoords?: { year: number; month: number; mondayDate: number },
    periodDateLabel?: string
  ) => {
    const barChartData = weekDayShort.map((shortDay, idx) => {
      // idx 0 = Seg (UTCDay 1), ..., idx 5 = Sáb (UTCDay 6), idx 6 = Dom (UTCDay 0)
      const targetDow = (idx + 1) % 7;
      let dateLabel = periodDateLabel || '';
      if (weekMondayCoords) {
        const dayStart = createMozambiqueDateUtc(
          weekMondayCoords.year,
          weekMondayCoords.month,
          weekMondayCoords.mondayDate + idx,
          0,
          0,
          0,
          0
        );
        const mozDayLabel = getMozambiqueDate(dayStart);
        dateLabel = `${mozDayLabel.getUTCDate().toString().padStart(2, '0')}/${(
          mozDayLabel.getUTCMonth() + 1
        )
          .toString()
          .padStart(2, '0')}`;
      }

      const count = ordersList.filter(
        (o) => getMozambiqueDayOfWeek(o.createdAt) === targetDow && o.status === 'APPROVED'
      ).length;

      return { day: shortDay, fullLabel: weekDayNames[idx], vendas: count, date: dateLabel };
    });

    const approvalsVsVolumeData = weekDayShort.map((shortDay, idx) => {
      const targetDow = (idx + 1) % 7;
      let dateLabel = periodDateLabel || '';
      if (weekMondayCoords) {
        const dayStart = createMozambiqueDateUtc(
          weekMondayCoords.year,
          weekMondayCoords.month,
          weekMondayCoords.mondayDate + idx,
          0,
          0,
          0,
          0
        );
        const mozDayLabel = getMozambiqueDate(dayStart);
        dateLabel = `${mozDayLabel.getUTCDate().toString().padStart(2, '0')}/${(
          mozDayLabel.getUTCMonth() + 1
        )
          .toString()
          .padStart(2, '0')}`;
      }

      const dayOrders = ordersList.filter(
        (o) => getMozambiqueDayOfWeek(o.createdAt) === targetDow
      );
      const dayApproved = dayOrders.filter((o) => o.status === 'APPROVED');

      return {
        date: shortDay,
        dayName: weekDayNames[idx],
        fullDate: dateLabel,
        aprovados: dayApproved.reduce((s, o) => s + o.amount, 0),
        volume: dayOrders.reduce((s, o) => s + o.amount, 0),
      };
    });

    return { barChartData, approvalsVsVolumeData };
  };

  const todayOrders = allOrders.filter((o) => new Date(o.createdAt) >= startOfToday);
  const yesterdayOrders = allOrders.filter((o) => {
    const d = new Date(o.createdAt);
    return d >= startOfYesterday && d < startOfToday;
  });
  const twoDaysAgoOrders = allOrders.filter((o) => {
    const d = new Date(o.createdAt);
    return d >= startOfTwoDaysAgo && d < startOfYesterday;
  });
  const lastWeekOrders = allOrders.filter((o) => {
    const d = new Date(o.createdAt);
    return d >= startOfLastWeek && d < startOfThisWeek;
  });
  const thisMonthOrders = allOrders.filter((o) => new Date(o.createdAt) >= startOfThisMonth);
  const lastMonthOrders = allOrders.filter((o) => {
    const d = new Date(o.createdAt);
    return d >= startOfLastMonth && d < startOfThisMonth;
  });
  const thisYearOrders = allOrders.filter((o) => new Date(o.createdAt) >= startOfThisYear);
  const lastYearOrders = allOrders.filter((o) => {
    const d = new Date(o.createdAt);
    return d >= startOfLastYear && d < startOfThisYear;
  });

  const currentWeekMondayCoords = {
    year: mozYear,
    month: mozMonth,
    mondayDate: mozDay - diffToMonday,
  };

  const mozYesterday = getMozambiqueDate(startOfYesterday);
  const yesterdayDow = mozYesterday.getUTCDay();
  const yesterdayDiffToMonday = yesterdayDow === 0 ? 6 : yesterdayDow - 1;
  const yesterdayWeekMondayCoords = {
    year: mozYesterday.getUTCFullYear(),
    month: mozYesterday.getUTCMonth(),
    mondayDate: mozYesterday.getUTCDate() - yesterdayDiffToMonday,
  };

  const yesterdayCharts = buildWeeklyMondayToSundaySeries(yesterdayOrders, yesterdayWeekMondayCoords);
  const todayCharts = buildWeeklyMondayToSundaySeries(todayOrders, currentWeekMondayCoords);
  const weekCharts = buildWeeklyMondayToSundaySeries(thisWeekOrders, currentWeekMondayCoords);
  const monthCharts = buildWeeklyMondayToSundaySeries(thisMonthOrders, undefined, 'Este Mês');
  const yearCharts = buildWeeklyMondayToSundaySeries(thisYearOrders, undefined, `${mozYear}`);
  const allCharts = buildWeeklyMondayToSundaySeries(allOrders, undefined, 'Todo o Período');

  const todayHourlySeries = buildHourlySeries(todayOrders);
  const yesterdayHourlySeries = buildHourlySeries(yesterdayOrders);

  const buildPeriodMetric = (
    ordersInPeriod: typeof allOrders,
    ordersInPrevPeriod: typeof allOrders,
    vsLabel: string,
    expiredLabel: string,
    chartsConfig: {
      periodBadge: string;
      hourlyBadge: string;
      hourlyTitle: string;
      hourlySubtitle: string;
      hourlyData: { hour: string; iniciados: number; aprovados: number }[];
      barChartTitle: string;
      barChartSubtitle: string;
      lineChartTitle: string;
      lineChartSubtitle: string;
      barChartData: { day: string; fullLabel?: string; vendas: number; date?: string }[];
      approvalsVsVolumeData: { date: string; dayName?: string; fullDate?: string; aprovados: number; volume: number }[];
    }
  ) => {
    const approved = ordersInPeriod.filter((o) => o.status === 'APPROVED');
    const prevApproved = ordersInPrevPeriod.filter((o) => o.status === 'APPROVED');
    const pending = ordersInPeriod.filter((o) => o.status === 'PENDING');
    const prevPending = ordersInPrevPeriod.filter((o) => o.status === 'PENDING');
    const expired = ordersInPeriod.filter(
      (o) => o.status === 'DECLINED' || o.status === 'CANCELLED' || (o.status as string) === 'EXPIRED'
    );

    const salesCount = approved.length;
    const prevSalesCount = prevApproved.length;
    const revenue = approved.reduce((sum, o) => sum + o.amount, 0);
    const prevRevenue = prevApproved.reduce((sum, o) => sum + o.amount, 0);

    const periodConversionRate =
      ordersInPeriod.length > 0
        ? Number(((approved.length / ordersInPeriod.length) * 100).toFixed(1))
        : 0;

    // Payment method totals strictly for approved orders in this period
    const methodSource = approved;
    const resolveOrderMethod = (o: (typeof ordersInPeriod)[number]) => {
      const raw = (o.transaction?.method || '').toUpperCase().trim();
      if (raw.includes('EMOLA') || raw.includes('E-MOLA')) return 'EMOLA';
      if (raw.includes('MPESA') || raw.includes('M-PESA')) return 'MPESA';
      const clean = (o.customerPhone || '').replace(/\D/g, '');
      const moz = clean.startsWith('258') ? clean.slice(3) : clean;
      if (moz.startsWith('86') || moz.startsWith('87')) return 'EMOLA';
      if (moz.startsWith('84') || moz.startsWith('85')) return 'MPESA';
      return raw || 'MPESA';
    };

    const periodEmolaTotal = methodSource
      .filter((o) => resolveOrderMethod(o) === 'EMOLA')
      .reduce((sum, o) => sum + o.amount, 0);
    const periodMpesaTotal = methodSource
      .filter((o) => resolveOrderMethod(o) === 'MPESA')
      .reduce((sum, o) => sum + o.amount, 0);

    const periodTransactions = ordersInPeriod.slice(0, 20).map((o) => ({
      id: o.id,
      reference:
        o.transaction?.zenofyTransactionId ||
        o.transaction?.zenofyCheckoutId ||
        `OTF-${o.id.slice(-5).toUpperCase()}`,
      amount: o.amount,
      status: o.status,
      productName: o.product?.name || 'Produto Digital',
      date: o.createdAt,
      method: resolveOrderMethod(o),
    }));

    return {
      salesCount,
      revenue,
      pendingCount: pending.length,
      expiredCount: expired.length,
      salesTrend: calcTrend(salesCount, prevSalesCount),
      revenueTrend: calcTrend(revenue, prevRevenue),
      pendingTrend: calcTrend(pending.length, prevPending.length),
      vsLabel,
      expiredLabel,
      periodBadge: chartsConfig.periodBadge,
      hourlyBadge: chartsConfig.hourlyBadge,
      hourlyTitle: chartsConfig.hourlyTitle,
      hourlySubtitle: chartsConfig.hourlySubtitle,
      barChartTitle: chartsConfig.barChartTitle,
      barChartSubtitle: chartsConfig.barChartSubtitle,
      lineChartTitle: chartsConfig.lineChartTitle,
      lineChartSubtitle: chartsConfig.lineChartSubtitle,
      hourlyData: chartsConfig.hourlyData,
      barChartData: chartsConfig.barChartData,
      approvalsVsVolumeData: chartsConfig.approvalsVsVolumeData,
      conversionRate: periodConversionRate,
      emolaTotal: periodEmolaTotal,
      mpesaTotal: periodMpesaTotal,
      recentTransactions: periodTransactions,
    };
  };

  const periodStats = {
    yesterday: buildPeriodMetric(yesterdayOrders, twoDaysAgoOrders, 'vs. dia anterior', 'ontem', {
      periodBadge: 'Ontem (Seg – Dom)',
      hourlyBadge: 'Ontem (24 Horas)',
      hourlyTitle: 'Fluxo por Horário do Dia — Ontem (00:00 – 23:59)',
      hourlySubtitle: 'Movimento hora a hora durante as 24 horas de ontem (00:00 – 23:59): Carrinhos Iniciados vs. Vendas Aprovadas',
      hourlyData: yesterdayHourlySeries,
      barChartTitle: 'Vendas por Dia da Semana (Seg – Dom)',
      barChartSubtitle: 'Ciclo semanal de Segunda a Domingo (Ontem)',
      lineChartTitle: 'Carrinhos Aprovados vs Total (Seg – Dom)',
      lineChartSubtitle: 'Evolução de Segunda a Domingo em Meticais (Ontem)',
      ...yesterdayCharts,
    }),
    today: buildPeriodMetric(todayOrders, yesterdayOrders, 'vs. ontem', 'hoje', {
      periodBadge: 'Hoje (Seg – Dom)',
      hourlyBadge: 'Hoje (24 Horas)',
      hourlyTitle: 'Fluxo por Horário do Dia (00:00 – 23:59)',
      hourlySubtitle: 'Movimento em tempo real ao longo das 24 horas de hoje (00:00 – 23:59): Carrinhos Iniciados vs. Vendas Aprovadas',
      hourlyData: todayHourlySeries,
      barChartTitle: 'Vendas por Dia da Semana (Seg – Dom)',
      barChartSubtitle: 'Ciclo semanal atual (Segunda a Domingo — Hoje)',
      lineChartTitle: 'Carrinhos Aprovados vs Total (Seg – Dom)',
      lineChartSubtitle: 'Evolução diária de Segunda a Domingo em Meticais (Hoje)',
      ...todayCharts,
    }),
    week: buildPeriodMetric(thisWeekOrders, lastWeekOrders, 'vs. semana anterior', 'na última semana', {
      periodBadge: 'Esta Semana (Seg – Dom)',
      hourlyBadge: 'Hoje (24 Horas)',
      hourlyTitle: 'Fluxo por Horário do Dia (00:00 – 23:59)',
      hourlySubtitle: 'Movimento em tempo real ao longo das 24 horas de hoje (00:00 – 23:59): Carrinhos Iniciados vs. Vendas Aprovadas',
      hourlyData: todayHourlySeries,
      barChartTitle: 'Vendas por Dia da Semana (Seg – Dom)',
      barChartSubtitle: 'Ciclo semanal atual (Segunda a Domingo)',
      lineChartTitle: 'Carrinhos Aprovados vs Total (Seg – Dom)',
      lineChartSubtitle: 'Evolução diária da semana atual (Segunda a Domingo em Meticais)',
      ...weekCharts,
    }),
    month: buildPeriodMetric(thisMonthOrders, lastMonthOrders, 'vs. mês anterior', 'no último mês', {
      periodBadge: 'Este Mês (Seg – Dom)',
      hourlyBadge: 'Hoje (24 Horas)',
      hourlyTitle: 'Fluxo por Horário do Dia (00:00 – 23:59)',
      hourlySubtitle: 'Movimento em tempo real ao longo das 24 horas de hoje (00:00 – 23:59): Carrinhos Iniciados vs. Vendas Aprovadas',
      hourlyData: todayHourlySeries,
      barChartTitle: 'Vendas por Dia da Semana (Mês)',
      barChartSubtitle: 'Distribuição semanal de Segunda a Domingo neste mês',
      lineChartTitle: 'Carrinhos Aprovados vs Total (Seg – Dom)',
      lineChartSubtitle: 'Evolução de Segunda a Domingo neste mês em Meticais',
      ...monthCharts,
    }),
    year: buildPeriodMetric(thisYearOrders, lastYearOrders, 'vs. ano anterior', 'no último ano', {
      periodBadge: 'Este Ano (Seg – Dom)',
      hourlyBadge: 'Hoje (24 Horas)',
      hourlyTitle: 'Fluxo por Horário do Dia (00:00 – 23:59)',
      hourlySubtitle: 'Movimento em tempo real ao longo das 24 horas de hoje (00:00 – 23:59): Carrinhos Iniciados vs. Vendas Aprovadas',
      hourlyData: todayHourlySeries,
      barChartTitle: 'Vendas por Dia da Semana (Ano)',
      barChartSubtitle: `Distribuição de Segunda a Domingo em ${mozYear}`,
      lineChartTitle: 'Carrinhos Aprovados vs Total (Seg – Dom)',
      lineChartSubtitle: `Volume de Segunda a Domingo em ${mozYear} (Meticais)`,
      ...yearCharts,
    }),
    all: buildPeriodMetric(allOrders, [], 'desde o início', 'em todo o período', {
      periodBadge: 'Todo o Período (Seg – Dom)',
      hourlyBadge: 'Hoje (24 Horas)',
      hourlyTitle: 'Fluxo por Horário do Dia (00:00 – 23:59)',
      hourlySubtitle: 'Movimento em tempo real ao longo das 24 horas de hoje (00:00 – 23:59): Carrinhos Iniciados vs. Vendas Aprovadas',
      hourlyData: todayHourlySeries,
      barChartTitle: 'Vendas por Dia da Semana (Seg – Dom)',
      barChartSubtitle: 'Vendas aprovadas de Segunda a Domingo',
      lineChartTitle: 'Carrinhos Aprovados vs Total (Seg – Dom)',
      lineChartSubtitle: 'Volume aprovado vs. iniciado de Segunda a Domingo em Meticais',
      ...allCharts,
    }),
  };

  const clientOrders = allOrders.map((o) => {
    const raw = (o.transaction?.method || '').toUpperCase().trim();
    const clean = (o.customerPhone || '').replace(/\D/g, '');
    const moz = clean.startsWith('258') ? clean.slice(3) : clean;
    const method =
      raw.includes('EMOLA') || raw.includes('E-MOLA') || moz.startsWith('86') || moz.startsWith('87')
        ? 'EMOLA'
        : 'MPESA';
    return {
      id: o.id,
      reference:
        o.transaction?.zenofyTransactionId ||
        o.transaction?.zenofyCheckoutId ||
        `OTF-${o.id.slice(-5).toUpperCase()}`,
      amount: o.amount,
      status: o.status,
      productName: o.product?.name || 'Produto Digital',
      createdAt: o.createdAt,
      method,
    };
  });

  return (
    <div className="w-full max-w-[2000px] 2xl:max-w-full mx-auto space-y-6 sm:space-y-8 pb-16 min-w-0 overflow-x-hidden">
      {/* Top Greeting Banner */}
      <DashboardGreetingBanner />

      {/* Hero Progress Card for Cumulative Revenue & Next Award Milestone (50K, 100K, etc.) */}
      <TotalRevenueHeroCard
        totalRevenue={finalTotalRevenue}
        approvedCount={finalApprovedCount}
      />

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
        hourlyData={todayHourlySeries}
        weeklyData={weekCharts.barChartData}
        approvalsVsVolumeData={weekCharts.approvalsVsVolumeData}
        periodStats={periodStats}
        initialOrders={clientOrders}
      />
    </div>
  );
}
