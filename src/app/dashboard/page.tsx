import TotalRevenueHeroCard from '@/components/dashboard/TotalRevenueHeroCard';
import CustomizableWidgets from '@/components/dashboard/CustomizableWidgets';
import DashboardGreetingBanner from '@/components/dashboard/DashboardGreetingBanner';
import dbStore from '@/lib/store';
import {
  getMozambiqueDate,
  getMozambiqueHour,
  getMozambiqueDay,
  getMozambiqueMonth,
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
  const thisWeekEmola = thisWeekOrders.filter(o => o.transaction?.method === 'EMOLA');
  const thisWeekMpesa = thisWeekOrders.filter(o => o.transaction?.method === 'MPESA');

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

  const weekDayNames = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
  const weekDayShort = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
  const monthNamesShort = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const monthNamesFull = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const buildHourlySeries = (ordersList: typeof allOrders) =>
    hours.map((hour, index) => {
      const ordersInHour = ordersList.filter((o) => getMozambiqueHour(o.createdAt) === index);
      return {
        hour,
        iniciados: ordersInHour.length,
        aprovados: ordersInHour.filter((o) => o.status === 'APPROVED').length,
      };
    });

  // Helper for single-day 3-hour buckets (Ontem / Hoje) in Mozambique time
  const hourBlocks = [
    { start: 0, end: 3, short: '00h', full: '00:00 – 02:59' },
    { start: 3, end: 6, short: '03h', full: '03:00 – 05:59' },
    { start: 6, end: 9, short: '06h', full: '06:00 – 08:59' },
    { start: 9, end: 12, short: '09h', full: '09:00 – 11:59' },
    { start: 12, end: 15, short: '12h', full: '12:00 – 14:59' },
    { start: 15, end: 18, short: '15h', full: '15:00 – 17:59' },
    { start: 18, end: 21, short: '18h', full: '18:00 – 20:59' },
    { start: 21, end: 24, short: '21h', full: '21:00 – 23:59' },
  ];

  const buildDayBlocksSeries = (ordersList: typeof allOrders, targetDateUtc: Date) => {
    const mozTarget = getMozambiqueDate(targetDateUtc);
    const dateLabel = `${mozTarget.getUTCDate().toString().padStart(2, '0')}/${(mozTarget.getUTCMonth() + 1).toString().padStart(2, '0')}`;
    const barChartData = hourBlocks.map((b) => {
      const inBlock = ordersList.filter((o) => {
        const h = getMozambiqueHour(o.createdAt);
        return h >= b.start && h < b.end && o.status === 'APPROVED';
      });
      return {
        day: b.short,
        fullLabel: b.full,
        vendas: inBlock.length,
        date: dateLabel,
      };
    });

    const approvalsVsVolumeData = hourBlocks.map((b) => {
      const inBlock = ordersList.filter((o) => {
        const h = getMozambiqueHour(o.createdAt);
        return h >= b.start && h < b.end;
      });
      const approvedInBlock = inBlock.filter((o) => o.status === 'APPROVED');
      return {
        date: b.short,
        dayName: b.full,
        fullDate: dateLabel,
        aprovados: approvedInBlock.reduce((s, o) => s + o.amount, 0),
        volume: inBlock.reduce((s, o) => s + o.amount, 0),
      };
    });

    return { barChartData, approvalsVsVolumeData };
  };

  // Helper for weekly series (Segunda a Domingo) in Mozambique time
  const buildWeekSeries = (ordersList: typeof allOrders) => {
    const barChartData = weekDayShort.map((shortDay, idx) => {
      const dayStart = createMozambiqueDateUtc(mozYear, mozMonth, mozDay - diffToMonday + idx, 0, 0, 0, 0);
      const dayEnd = createMozambiqueDateUtc(mozYear, mozMonth, mozDay - diffToMonday + idx + 1, 0, 0, 0, 0);
      const mozDayLabel = getMozambiqueDate(dayStart);
      const dateLabel = `${mozDayLabel.getUTCDate().toString().padStart(2, '0')}/${(mozDayLabel.getUTCMonth() + 1).toString().padStart(2, '0')}`;

      const count = ordersList.filter((o) => {
        const d = new Date(o.createdAt);
        return d >= dayStart && d < dayEnd && o.status === 'APPROVED';
      }).length;

      return { day: shortDay, fullLabel: weekDayNames[idx], vendas: count, date: dateLabel };
    });

    const approvalsVsVolumeData = weekDayShort.map((shortDay, idx) => {
      const dayStart = createMozambiqueDateUtc(mozYear, mozMonth, mozDay - diffToMonday + idx, 0, 0, 0, 0);
      const dayEnd = createMozambiqueDateUtc(mozYear, mozMonth, mozDay - diffToMonday + idx + 1, 0, 0, 0, 0);
      const mozDayLabel = getMozambiqueDate(dayStart);
      const dateLabel = `${mozDayLabel.getUTCDate().toString().padStart(2, '0')}/${(mozDayLabel.getUTCMonth() + 1).toString().padStart(2, '0')}`;

      const dayOrders = ordersList.filter((o) => {
        const d = new Date(o.createdAt);
        return d >= dayStart && d < dayEnd;
      });
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

  // Helper for monthly series (Semanas do mês atual: Sem 1 a Sem 5) in Mozambique time
  const buildMonthSeries = (ordersList: typeof allOrders) => {
    const monthNum = (mozMonth + 1).toString().padStart(2, '0');
    const weeksOfMonth = [
      { short: 'Sem 1', full: 'Semana 1', range: `01/${monthNum} – 07/${monthNum}`, minDay: 1, maxDay: 7 },
      { short: 'Sem 2', full: 'Semana 2', range: `08/${monthNum} – 14/${monthNum}`, minDay: 8, maxDay: 14 },
      { short: 'Sem 3', full: 'Semana 3', range: `15/${monthNum} – 21/${monthNum}`, minDay: 15, maxDay: 21 },
      { short: 'Sem 4', full: 'Semana 4', range: `22/${monthNum} – 28/${monthNum}`, minDay: 22, maxDay: 28 },
      { short: 'Sem 5', full: 'Semana 5', range: `29/${monthNum}+`, minDay: 29, maxDay: 31 },
    ];

    const barChartData = weeksOfMonth.map((w) => {
      const inSegment = ordersList.filter((o) => {
        const dom = getMozambiqueDay(o.createdAt);
        return dom >= w.minDay && dom <= w.maxDay && o.status === 'APPROVED';
      });
      return {
        day: w.short,
        fullLabel: w.full,
        vendas: inSegment.length,
        date: w.range,
      };
    });

    const approvalsVsVolumeData = weeksOfMonth.map((w) => {
      const inSegment = ordersList.filter((o) => {
        const dom = getMozambiqueDay(o.createdAt);
        return dom >= w.minDay && dom <= w.maxDay;
      });
      const approved = inSegment.filter((o) => o.status === 'APPROVED');
      return {
        date: w.short,
        dayName: w.full,
        fullDate: w.range,
        aprovados: approved.reduce((s, o) => s + o.amount, 0),
        volume: inSegment.reduce((s, o) => s + o.amount, 0),
      };
    });

    return { barChartData, approvalsVsVolumeData };
  };

  // Helper for yearly / all-time series (Jan - Dez) in Mozambique time
  const buildYearSeries = (ordersList: typeof allOrders, yearLabel: string) => {
    const barChartData = monthNamesShort.map((mShort, mIdx) => {
      const inMonth = ordersList.filter(
        (o) => getMozambiqueMonth(o.createdAt) === mIdx && o.status === 'APPROVED'
      );
      return {
        day: mShort,
        fullLabel: monthNamesFull[mIdx],
        vendas: inMonth.length,
        date: yearLabel,
      };
    });

    const approvalsVsVolumeData = monthNamesShort.map((mShort, mIdx) => {
      const inMonth = ordersList.filter((o) => getMozambiqueMonth(o.createdAt) === mIdx);
      const approved = inMonth.filter((o) => o.status === 'APPROVED');
      return {
        date: mShort,
        dayName: monthNamesFull[mIdx],
        fullDate: yearLabel,
        aprovados: approved.reduce((s, o) => s + o.amount, 0),
        volume: inMonth.reduce((s, o) => s + o.amount, 0),
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

  const yesterdayCharts = buildDayBlocksSeries(yesterdayOrders, startOfYesterday);
  const todayCharts = buildDayBlocksSeries(todayOrders, startOfToday);
  const weekCharts = buildWeekSeries(thisWeekOrders);
  const monthCharts = buildMonthSeries(thisMonthOrders);
  const yearCharts = buildYearSeries(thisYearOrders, `${mozYear}`);
  const allCharts = buildYearSeries(allOrders, 'Histórico');

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

    // Payment method totals for approved orders in this period (or all orders in period if none approved yet)
    const methodSource = approved.length > 0 ? approved : ordersInPeriod;
    const periodEmolaTotal = methodSource
      .filter((o) => o.transaction?.method === 'EMOLA')
      .reduce((sum, o) => sum + o.amount, 0);
    const periodMpesaTotal = methodSource
      .filter((o) => o.transaction?.method === 'MPESA' || !o.transaction?.method)
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
      periodBadge: 'Ontem (24h)',
      hourlyBadge: 'Ontem (24 Horas)',
      hourlyTitle: 'Fluxo por Horário do Dia — Ontem (00:00 – 23:59)',
      hourlySubtitle: 'Movimento hora a hora durante as 24 horas de ontem (00:00 – 23:59): Carrinhos Iniciados vs. Vendas Aprovadas',
      hourlyData: yesterdayHourlySeries,
      barChartTitle: 'Vendas por Faixa Horária (Ontem)',
      barChartSubtitle: 'Distribuição das vendas aprovadas em janelas de 3h ontem',
      lineChartTitle: 'Carrinhos Aprovados vs Total (Ontem)',
      lineChartSubtitle: 'Evolução financeira de ontem em Meticais (00h – 23h)',
      ...yesterdayCharts,
    }),
    today: buildPeriodMetric(todayOrders, yesterdayOrders, 'vs. ontem', 'hoje', {
      periodBadge: 'Hoje (24h)',
      hourlyBadge: 'Hoje (24 Horas)',
      hourlyTitle: 'Fluxo por Horário do Dia (00:00 – 23:59)',
      hourlySubtitle: 'Movimento em tempo real ao longo das 24 horas de hoje (00:00 – 23:59): Carrinhos Iniciados vs. Vendas Aprovadas',
      hourlyData: todayHourlySeries,
      barChartTitle: 'Vendas por Faixa Horária (Hoje)',
      barChartSubtitle: 'Distribuição das vendas aprovadas em janelas de 3h hoje',
      lineChartTitle: 'Carrinhos Aprovados vs Total (Hoje)',
      lineChartSubtitle: 'Evolução financeira de hoje em Meticais (00h – 23h)',
      ...todayCharts,
    }),
    week: buildPeriodMetric(thisWeekOrders, lastWeekOrders, 'vs. semana anterior', 'na última semana', {
      periodBadge: 'Esta Semana',
      hourlyBadge: 'Hoje (24 Horas)',
      hourlyTitle: 'Fluxo por Horário do Dia (00:00 – 23:59)',
      hourlySubtitle: 'Movimento em tempo real ao longo das 24 horas de hoje (00:00 – 23:59): Carrinhos Iniciados vs. Vendas Aprovadas',
      hourlyData: todayHourlySeries,
      barChartTitle: 'Vendas por Dia (Semana)',
      barChartSubtitle: 'Ciclo semanal atual (Segunda a Domingo)',
      lineChartTitle: 'Carrinhos Aprovados vs Total (Semana)',
      lineChartSubtitle: 'Evolução diária da semana atual (Segunda a Domingo em Meticais)',
      ...weekCharts,
    }),
    month: buildPeriodMetric(thisMonthOrders, lastMonthOrders, 'vs. mês anterior', 'no último mês', {
      periodBadge: 'Este Mês',
      hourlyBadge: 'Hoje (24 Horas)',
      hourlyTitle: 'Fluxo por Horário do Dia (00:00 – 23:59)',
      hourlySubtitle: 'Movimento em tempo real ao longo das 24 horas de hoje (00:00 – 23:59): Carrinhos Iniciados vs. Vendas Aprovadas',
      hourlyData: todayHourlySeries,
      barChartTitle: 'Vendas por Semana (Mês Atual)',
      barChartSubtitle: 'Evolução semanal ao longo do mês atual',
      lineChartTitle: 'Carrinhos Aprovados vs Total (Mês)',
      lineChartSubtitle: 'Evolução semanal deste mês em Meticais',
      ...monthCharts,
    }),
    year: buildPeriodMetric(thisYearOrders, lastYearOrders, 'vs. ano anterior', 'no último ano', {
      periodBadge: 'Este Ano',
      hourlyBadge: 'Hoje (24 Horas)',
      hourlyTitle: 'Fluxo por Horário do Dia (00:00 – 23:59)',
      hourlySubtitle: 'Movimento em tempo real ao longo das 24 horas de hoje (00:00 – 23:59): Carrinhos Iniciados vs. Vendas Aprovadas',
      hourlyData: todayHourlySeries,
      barChartTitle: 'Vendas por Mês (Ano Atual)',
      barChartSubtitle: `Evolução mensal de vendas em ${mozYear}`,
      lineChartTitle: 'Carrinhos Aprovados vs Total (Ano)',
      lineChartSubtitle: `Evolução mensal de ${mozYear} em Meticais`,
      ...yearCharts,
    }),
    all: buildPeriodMetric(allOrders, [], 'desde o início', 'em todo o período', {
      periodBadge: 'Todo o Período',
      hourlyBadge: 'Hoje (24 Horas)',
      hourlyTitle: 'Fluxo por Horário do Dia (00:00 – 23:59)',
      hourlySubtitle: 'Movimento em tempo real ao longo das 24 horas de hoje (00:00 – 23:59): Carrinhos Iniciados vs. Vendas Aprovadas',
      hourlyData: todayHourlySeries,
      barChartTitle: 'Vendas Acumuladas por Mês',
      barChartSubtitle: 'Histórico completo de vendas aprovadas',
      lineChartTitle: 'Carrinhos Aprovados vs Total (Histórico)',
      lineChartSubtitle: 'Volume histórico aprovado vs. iniciado em Meticais',
      ...allCharts,
    }),
  };

  return (
    <div className="w-full max-w-[2000px] 2xl:max-w-full mx-auto space-y-6 sm:space-y-8 pb-16 min-w-0 overflow-x-hidden">
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
        hourlyData={todayHourlySeries}
        weeklyData={weekCharts.barChartData}
        approvalsVsVolumeData={weekCharts.approvalsVsVolumeData}
        periodStats={periodStats}
      />
    </div>
  );
}
