import { NextResponse } from 'next/server';
import dbStore from '@/lib/store';

const HOURS_LIST = [
  '00:00', '01:00', '02:00', '03:00', '04:00', '05:00',
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00', '21:00', '22:00', '23:59'
];

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get('date'); // YYYY-MM-DD
    const monthParam = searchParams.get('month'); // YYYY-MM

    const now = new Date();
    
    // Parse target date (defaults to today)
    let targetYear = now.getFullYear();
    let targetMonth = now.getMonth(); // 0-indexed
    let targetDay = now.getDate();

    if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      const parts = dateParam.split('-').map(Number);
      targetYear = parts[0];
      targetMonth = parts[1] - 1;
      targetDay = parts[2];
    }

    const startOfDay = new Date(targetYear, targetMonth, targetDay, 0, 0, 0, 0);
    const endOfDay = new Date(targetYear, targetMonth, targetDay, 23, 59, 59, 999);

    // Also determine month window for calendar activity dots
    let queryMonthYear = targetYear;
    let queryMonth = targetMonth;
    if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
      const parts = monthParam.split('-').map(Number);
      queryMonthYear = parts[0];
      queryMonth = parts[1] - 1;
    }

    const startOfMonth = new Date(queryMonthYear, queryMonth, 1, 0, 0, 0, 0);
    const endOfMonth = new Date(queryMonthYear, queryMonth + 1, 0, 23, 59, 59, 999);

    // Fetch orders for the target day and the month in parallel
    const [dayOrders, monthOrders] = await Promise.all([
      dbStore.getOrders({
        startDate: startOfDay.toISOString(),
        endDate: endOfDay.toISOString(),
      }),
      dbStore.getOrders({
        startDate: startOfMonth.toISOString(),
        endDate: endOfMonth.toISOString(),
      }),
    ]);

    // Build 24-hour buckets
    const hourlyData = HOURS_LIST.map((hour, idx) => {
      const ordersInHour = dayOrders.filter((o) => {
        const d = new Date(o.createdAt);
        return d.getHours() === idx;
      });

      return {
        hour,
        iniciados: ordersInHour.length,
        aprovados: ordersInHour.filter((o) => o.status === 'APPROVED').length,
      };
    });

    const totalIniciados = hourlyData.reduce((acc, curr) => acc + curr.iniciados, 0);
    const totalAprovados = hourlyData.reduce((acc, curr) => acc + curr.aprovados, 0);
    const conversionRate = totalIniciados > 0
      ? ((totalAprovados / totalIniciados) * 100).toFixed(1)
      : '0';

    // Peak hour calculation
    const peakEntry = hourlyData.reduce(
      (best, curr, idx) => {
        const score = curr.aprovados * 2 + curr.iniciados;
        return score > best.score ? { score, idx, hour: curr.hour } : best;
      },
      { score: 0, idx: 19, hour: '19:00' }
    );
    const nextPeakHour = hourlyData[Math.min(hourlyData.length - 1, peakEntry.idx + 1)]?.hour || '21:00';
    const peakRange =
      peakEntry.score > 0
        ? `${peakEntry.hour} e ${nextPeakHour}`
        : null;

    // Monthly activity map for calendar day badges: { [dayNumber]: { total, approved } }
    const monthActivity: Record<number, { total: number; approved: number }> = {};
    monthOrders.forEach((o) => {
      const dayNum = new Date(o.createdAt).getDate();
      if (!monthActivity[dayNum]) {
        monthActivity[dayNum] = { total: 0, approved: 0 };
      }
      monthActivity[dayNum].total += 1;
      if (o.status === 'APPROVED') {
        monthActivity[dayNum].approved += 1;
      }
    });

    // Determine if target day is today or yesterday
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).getTime();
    const isToday = startOfDay.getTime() === todayMidnight;
    const isYesterday = startOfDay.getTime() === todayMidnight - 86400000;

    // Format localized date
    const dateIso = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}`;
    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    const weekDayNames = [
      'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira',
      'Quinta-feira', 'Sexta-feira', 'Sábado'
    ];
    const fullDateText = `${weekDayNames[startOfDay.getDay()]}, ${targetDay} de ${monthNames[targetMonth]} de ${targetYear}`;
    const shortDateText = `${String(targetDay).padStart(2, '0')}/${String(targetMonth + 1).padStart(2, '0')}/${targetYear}`;

    let badgeLabel = `${shortDateText} (24 Horas)`;
    if (isToday) badgeLabel = 'Hoje (24 Horas)';
    else if (isYesterday) badgeLabel = 'Ontem (24 Horas)';

    return NextResponse.json({
      success: true,
      date: dateIso,
      isToday,
      isYesterday,
      badgeLabel,
      fullDateText,
      shortDateText,
      data: hourlyData,
      totalIniciados,
      totalAprovados,
      conversionRate,
      peakRange,
      monthActivity,
      monthQuery: `${queryMonthYear}-${String(queryMonth + 1).padStart(2, '0')}`,
    });
  } catch (error) {
    console.error('Erro na API hourly analytics:', error);
    return NextResponse.json({ success: false, error: 'Erro ao processar dados de horário' }, { status: 500 });
  }
}
