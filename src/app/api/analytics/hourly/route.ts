import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import dbStore from '@/lib/store';
import {
  getMozambiqueDate,
  getMozambiqueHour,
  getMozambiqueDay,
  getMozambiqueDateString,
  createMozambiqueDateUtc,
} from '@/lib/utils';

// Server-side lightweight in-memory cache to eliminate redundant Neon DB egress
const hourlyMemoryCache = new Map<string, { data: any; expiresAt: number }>();
const CACHE_TTL_MS = 30_000; // 30 seconds

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

    const mozNow = getMozambiqueDate();

    // Parse target date (defaults to today in Mozambique)
    let targetYear = mozNow.getUTCFullYear();
    let targetMonth = mozNow.getUTCMonth(); // 0-indexed
    let targetDay = mozNow.getUTCDate();

    if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      const parts = dateParam.split('-').map(Number);
      targetYear = parts[0];
      targetMonth = parts[1] - 1;
      targetDay = parts[2];
    }

    const startOfDay = createMozambiqueDateUtc(targetYear, targetMonth, targetDay, 0, 0, 0, 0);
    const endOfDay = createMozambiqueDateUtc(targetYear, targetMonth, targetDay, 23, 59, 59, 999);

    // Also determine month window for calendar activity dots
    let queryMonthYear = targetYear;
    let queryMonth = targetMonth;
    if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
      const parts = monthParam.split('-').map(Number);
      queryMonthYear = parts[0];
      queryMonth = parts[1] - 1;
    }

    const startOfMonth = createMozambiqueDateUtc(queryMonthYear, queryMonth, 1, 0, 0, 0, 0);
    const daysInMonth = new Date(queryMonthYear, queryMonth + 1, 0).getDate();
    const endOfMonth = createMozambiqueDateUtc(queryMonthYear, queryMonth, daysInMonth, 23, 59, 59, 999);

    const cacheKey = `${dateParam || 'default'}_${monthParam || 'default'}`;
    const cached = hourlyMemoryCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return NextResponse.json(cached.data);
    }

    // Fetch only needed columns (status, createdAt) to keep Neon network egress tiny
    let dayOrders: { status: string; createdAt: Date | string }[] = [];
    let monthOrders: { status: string; createdAt: Date | string }[] = [];

    try {
      const [dbDay, dbMonth] = await Promise.all([
        prisma.order.findMany({
          where: {
            createdAt: {
              gte: startOfDay,
              lte: endOfDay,
            },
          },
          select: {
            status: true,
            createdAt: true,
          },
        }),
        prisma.order.findMany({
          where: {
            createdAt: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
          select: {
            status: true,
            createdAt: true,
          },
        }),
      ]);
      dayOrders = dbDay;
      monthOrders = dbMonth;
    } catch {
      // Fallback to dbStore if direct prisma throws
      const [fallbackDay, fallbackMonth] = await Promise.all([
        dbStore.getOrders({
          startDate: startOfDay.toISOString(),
          endDate: endOfDay.toISOString(),
        }),
        dbStore.getOrders({
          startDate: startOfMonth.toISOString(),
          endDate: endOfMonth.toISOString(),
        }),
      ]);
      dayOrders = fallbackDay;
      monthOrders = fallbackMonth;
    }

    // Build 24-hour buckets using Mozambique local hour
    const hourlyData = HOURS_LIST.map((hour, idx) => {
      const ordersInHour = dayOrders.filter((o) => {
        return getMozambiqueHour(o.createdAt) === idx;
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
      const dayNum = getMozambiqueDay(o.createdAt);
      if (!monthActivity[dayNum]) {
        monthActivity[dayNum] = { total: 0, approved: 0 };
      }
      monthActivity[dayNum].total += 1;
      if (o.status === 'APPROVED') {
        monthActivity[dayNum].approved += 1;
      }
    });

    // Determine if target day is today or yesterday in Mozambique
    const todayStr = getMozambiqueDateString();
    const yesterdayDate = new Date(mozNow.getTime() - 86400000);
    const yesterdayStr = `${yesterdayDate.getUTCFullYear()}-${String(yesterdayDate.getUTCMonth() + 1).padStart(2, '0')}-${String(yesterdayDate.getUTCDate()).padStart(2, '0')}`;

    const dateIso = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}`;
    const isToday = dateIso === todayStr;
    const isYesterday = dateIso === yesterdayStr;

    // Format localized date
    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    const weekDayNames = [
      'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira',
      'Quinta-feira', 'Sexta-feira', 'Sábado'
    ];
    const targetMozDate = new Date(Date.UTC(targetYear, targetMonth, targetDay));
    const fullDateText = `${weekDayNames[targetMozDate.getUTCDay()]}, ${targetDay} de ${monthNames[targetMonth]} de ${targetYear}`;
    const shortDateText = `${String(targetDay).padStart(2, '0')}/${String(targetMonth + 1).padStart(2, '0')}/${targetYear}`;

    let badgeLabel = `${shortDateText} (24 Horas)`;
    if (isToday) badgeLabel = 'Hoje (24 Horas)';
    else if (isYesterday) badgeLabel = 'Ontem (24 Horas)';

    const responsePayload = {
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
    };

    hourlyMemoryCache.set(cacheKey, {
      data: responsePayload,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });

    return NextResponse.json(responsePayload);
  } catch (error) {
    console.error('Erro na API hourly analytics:', error);
    return NextResponse.json({ success: false, error: 'Erro ao processar dados de horário' }, { status: 500 });
  }
}
