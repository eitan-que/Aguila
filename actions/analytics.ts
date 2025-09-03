import { db } from '@/db/drizzle';
import {
  user, restaurant, product, discount,
  restaurantVisit, discountRedemption, discountQrScan,
  interactionEvent, discountView, restaurantCost,
  visitor, type WeekdayFlags
} from '@/db/schema';
import { auth } from '@/lib/auth';
import { count, eq, and, gte, lte, sql, desc } from 'drizzle-orm';
import { headers } from 'next/headers';

// Utilidades internas
function startOfDay(d: Date) { const n = new Date(d); n.setHours(0,0,0,0); return n; }
function daysAgo(n: number) { const d = new Date(); d.setDate(d.getDate()-n); return d; }

type GuardResult = { error?: string };
async function guardPlatform(): Promise<GuardResult & { userId?: string }> {
  const s = await auth.api.getSession({ headers: await headers() });
  if (!s?.user) return { error: "Authentication required" };
  const ok = await auth.api.userHasPermission({
    body: { userId: s.user.id, permissions: { analytics: ["read:analytics:platform"] } }
  });
  if (!ok) return { error: "Forbidden" };
  return { userId: s.user.id };
}

export async function getPlatformMetrics() {
  const g = await guardPlatform();
  if (g.error) return g;

  const now = new Date();
  const last30 = daysAgo(30);
  const last7 = daysAgo(7);

  // Totales base
  const [restaurantsCount] = await db.select({ c: count() }).from(restaurant);
  const [productsCount] = await db.select({ c: count() }).from(product);
  const [activeDiscounts] = await db.select({ c: count() }).from(discount)
    .where(and(lte(discount.startDate, now), gte(discount.endDate, now)));
  const [qrScansTotalRow] = await db.select({ c: count() }).from(discountQrScan);

  // Visitas últimos 30 días
  const visits = await db.select({
    restaurantId: restaurantVisit.restaurantId,
    occurredAt: restaurantVisit.occurredAt
  }).from(restaurantVisit)
    .where(gte(restaurantVisit.occurredAt, last30));

  // Conteos por restaurante
  const visitCountByRestaurant: Record<string, number> = {};
  const dayOfWeekCounts: number[] = [0,0,0,0,0,0,0];
  const hourCounts: number[] = Array.from({ length: 24 }, () => 0);
  for (const v of visits) {
    visitCountByRestaurant[v.restaurantId] = (visitCountByRestaurant[v.restaurantId] ?? 0) + 1;
    const d = new Date(v.occurredAt);
    dayOfWeekCounts[d.getDay()]++;
    hourCounts[d.getHours()]++;
  }

  const mostVisited = Object.entries(visitCountByRestaurant).sort((a,b)=>b[1]-a[1])[0];
  const leastVisited = Object.entries(visitCountByRestaurant).sort((a,b)=>a[1]-b[1])[0];

  const mostVisitedRestaurant = mostVisited
    ? await db.query.restaurant.findFirst({ where: eq(restaurant.id, mostVisited[0]) })
    : null;
  const leastVisitedRestaurant = leastVisited
    ? await db.query.restaurant.findFirst({ where: eq(restaurant.id, leastVisited[0]) })
    : null;

  const mostVisitedDayIndex = dayOfWeekCounts.indexOf(Math.max(...dayOfWeekCounts));
  const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const peakHour = hourCounts.indexOf(Math.max(...hourCounts));

  // Promos (redenciones y vistas)
  const promoViews = await db.select({
    discountId: discountView.discountId,
    occurredAt: discountView.occurredAt
  }).from(discountView).where(gte(discountView.occurredAt, last30));

  const promoRedemptions = await db.select({
    discountId: discountRedemption.discountId
  }).from(discountRedemption).where(gte(discountRedemption.redeemedAt, last30));

  const redemptionCounts: Record<string, number> = {};
  for (const r of promoRedemptions) {
    redemptionCounts[r.discountId] = (redemptionCounts[r.discountId] ?? 0) + 1;
  }
  const mostPromo = Object.entries(redemptionCounts).sort((a,b)=>b[1]-a[1])[0];
  const leastPromo = Object.entries(redemptionCounts).sort((a,b)=>a[1]-b[1])[0];

  const mostPromoData = mostPromo
    ? await db.query.discount.findFirst({ where: eq(discount.id, mostPromo[0]) })
    : null;
  const leastPromoData = leastPromo
    ? await db.query.discount.findFirst({ where: eq(discount.id, leastPromo[0]) })
    : null;

  // Usuarios registrados
  const [registeredUsersRow] = await db.select({ c: count() }).from(user);

  // Visitantes (retorno y total users = visitor + user)
  const visitors = await db.select({
    id: visitor.id,
    visitCount: visitor.visitCount
  }).from(visitor);

  const totalVisitors = visitors.length;
  const returningVisitors = visitors.filter(v => v.visitCount > 1).length;
  const totalUsers = totalVisitors; // base tracking
  const registeredUsers = registeredUsersRow.c;
  const registeredPct = totalUsers === 0 ? 0 : (registeredUsers / totalUsers) * 100;
  const returnRate = totalVisitors === 0 ? 0 : (returningVisitors / totalVisitors) * 100;

  // Crecimiento (usuarios última semana / semana previa)
  const usersLast7 = await db.select({ c: count() }).from(user)
    .where(gte(user.createdAt, last7));
  const usersPrev7 = await db.select({ c: count() }).from(user)
    .where(and(gte(user.createdAt, daysAgo(14)), lte(user.createdAt, daysAgo(7))));
  const weeklyGrowth = usersPrev7[0].c === 0
    ? 100
    : ((usersLast7[0].c - usersPrev7[0].c) / usersPrev7[0].c) * 100;

  const usersLast30 = await db.select({ c: count() }).from(user)
    .where(gte(user.createdAt, last30));
  const usersPrev30 = await db.select({ c: count() }).from(user)
    .where(and(gte(user.createdAt, daysAgo(60)), lte(user.createdAt, daysAgo(30))));
  const monthlyGrowth = usersPrev30[0].c === 0
    ? 100
    : ((usersLast30[0].c - usersPrev30[0].c) / usersPrev30[0].c) * 100;

  // Conversion rate: redenciones / visitas (últimos 30)
  const totalRedemptions = promoRedemptions.length;
  const totalVisits30 = visits.length;
  const conversionRate = totalVisits30 === 0 ? 0 : (totalRedemptions / totalVisits30) * 100;

  return {
    metrics: {
      totalRestaurants: restaurantsCount.c,
      totalProducts: productsCount.c,
      activeDiscounts: activeDiscounts.c,
      qrScans: qrScansTotalRow.c,
      visitsLast30Days: totalVisits30,
      mostVisitedDay: dayNames[mostVisitedDayIndex],
      peakHour: `${peakHour}:00`,
      registeredUsers,
      totalUsers,
      registeredUsersPercentage: Number(registeredPct.toFixed(2)),
      userGrowth: {
        weekly: Number(weeklyGrowth.toFixed(2)),
        monthly: Number(monthlyGrowth.toFixed(2)),
      },
      returnRate: Number(returnRate.toFixed(2)),
      restaurantExtremes: {
        mostVisited: mostVisitedRestaurant
          ? { id: mostVisitedRestaurant.id, name: mostVisitedRestaurant.name, visits: mostVisited?.[1] ?? 0 }
          : null,
        leastVisited: leastVisitedRestaurant
          ? { id: leastVisitedRestaurant.id, name: leastVisitedRestaurant.name, visits: leastVisited?.[1] ?? 0 }
          : null,
      },
      promotionExtremes: {
        mostVisited: mostPromoData
          ? { id: mostPromoData.id, name: mostPromoData.name, redemptions: mostPromo?.[1] ?? 0 }
          : null,
        leastVisited: leastPromoData
          ? { id: leastPromoData.id, name: leastPromoData.name, redemptions: leastPromo?.[1] ?? 0 }
          : null,
      },
      conversionRate: Number(conversionRate.toFixed(2)),
      dailyVisitCounts: dayOfWeekCounts,
      hourDistribution: hourCounts,
      promoViews: promoViews.length,
      promoRedemptions: totalRedemptions,
    }
  };
}

// Analytics por restaurante
export async function getRestaurantDetailedAnalytics(restaurantId: string) {
  const s = await auth.api.getSession({ headers: await headers() });
  if (!s?.user) return { error: "Authentication required" };
  const has = await auth.api.userHasPermission({
    body: { userId: s.user.id, permissions: { analytics: ["read:analytics:any","read:analytics:own"] } }
  });
  if (!has) return { error: "Forbidden" };

  const r = await db.query.restaurant.findFirst({ where: eq(restaurant.id, restaurantId) });
  if (!r) return { error: "Restaurant not found" };

  const now = new Date();
  const last30 = daysAgo(30);
  const last90 = daysAgo(90);
  const last7 = daysAgo(7);

  const visits = await db.select({
    occurredAt: restaurantVisit.occurredAt
  }).from(restaurantVisit)
    .where(and(eq(restaurantVisit.restaurantId, restaurantId), gte(restaurantVisit.occurredAt, last90)));

  // Aggregate weekly
  const weekBuckets: Record<string, number> = {};
  const dayOfWeekCounts = [0,0,0,0,0,0,0];
  for (const v of visits) {
    const d = new Date(v.occurredAt);
    const yearWeek = `${d.getFullYear()}-W${Math.floor((d.getTime() - new Date(d.getFullYear(),0,1).getTime())/ (7*24*3600*1000))}`;
    weekBuckets[yearWeek] = (weekBuckets[yearWeek] ?? 0) + 1;
    dayOfWeekCounts[d.getDay()]++;
  }
  const weeklySeries = Object.entries(weekBuckets).sort().map(([w,c]) => ({ week: w, visits: c }));
  const last7Visits = visits.filter(v => v.occurredAt >= last7).length;
  const last30Visits = visits.filter(v => v.occurredAt >= last30).length;
  const mostVisitedDayIdx = dayOfWeekCounts.indexOf(Math.max(...dayOfWeekCounts));
  const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

  // Promos (redenciones) y clics
  const redemptions = await db.select({ id: discountRedemption.id })
    .from(discountRedemption)
    .where(and(eq(discountRedemption.restaurantId, restaurantId), gte(discountRedemption.redeemedAt, last30)));

  const events = await db.select({
    type: interactionEvent.type
  }).from(interactionEvent)
    .where(and(eq(interactionEvent.restaurantId, restaurantId), gte(interactionEvent.occurredAt, last30)));

  const sumType = (t: string) => events.filter(e => e.type === t).length;

  // Cost per exposure (últimos 30 días)
  const costRows = await db.select({
    spend: sql<number>`COALESCE(SUM(${restaurantCost.spendMinorUnits}),0)`
  }).from(restaurantCost)
    .where(and(
      eq(restaurantCost.restaurantId, restaurantId),
      gte(restaurantCost.periodStart, last30)
    ));
  const spendMinor = Number(costRows[0].spend) || 0;
  const costPerExposure = last30Visits === 0 ? 0 : (spendMinor / 100) / last30Visits;

  // Share of attention (sobre total visitas últimos 30)
  const allVisits30 = await db.select({ restaurantId: restaurantVisit.restaurantId })
    .from(restaurantVisit)
    .where(gte(restaurantVisit.occurredAt, last30));
  const totalPlatformVisits30 = allVisits30.length || 1;
  const shareOfAttention = (last30Visits / totalPlatformVisits30) * 100;

  // Ranking (por visitas últimos 30)
  const rankMap: Record<string, number> = {};
  for (const v of allVisits30) {
    rankMap[v.restaurantId] = (rankMap[v.restaurantId] ?? 0) + 1;
  }
  const ranking = Object.entries(rankMap).sort((a,b)=>b[1]-a[1]).findIndex(e => e[0] === restaurantId) + 1;

  // Proyección (promedio semanal * factor simple)
  const recentWeeks = weeklySeries.slice(-4);
  const avgWeekly = recentWeeks.length
    ? recentWeeks.reduce((acc, w) => acc + w.visits, 0) / recentWeeks.length
    : last30Visits / 4;
  const projections = [1,2,3].map(m => Math.round(avgWeekly * (m+4))); // simple

  // Edad en meses
  const ageInMonths = ((now.getFullYear() - r.createdAt.getFullYear()) * 12) + (now.getMonth() - r.createdAt.getMonth());

  return {
    analytics: {
      ageInMonths,
      visits: {
        weekly: last7Visits,
        monthly: last30Visits,
        mostVisitedDay: dayNames[mostVisitedDayIdx],
        byDayOfWeek: dayOfWeekCounts,
        weeklySeries,
        projectedNext3Months: projections,
      },
      interactions: {
        promotionScans: redemptions.length,
        whatsappClicks: sumType('whatsapp_click'),
        locationClicks: sumType('location_click'),
        menuClicks: sumType('menu_click'),
      },
      categoryMetrics: {
        shareOfAttention: Number(shareOfAttention.toFixed(2)),
        categoryRanking: ranking,
        costPerExposure: Number(costPerExposure.toFixed(2)),
      }
    }
  };
}

// Registro de eventos públicos (no requieren sesión)
export async function recordRestaurantVisit(restaurantId: string, visitorId?: string) {
  try {
    // Upsert visitor anónimo si se provee visitorId sin user
    let resolvedVisitorId = visitorId ?? crypto.randomUUID();
    const existing = await db.query.visitor.findFirst({ where: eq(visitor.id, resolvedVisitorId) });
    if (existing) {
      await db.update(visitor)
        .set({ visitCount: existing.visitCount + 1, lastVisitAt: new Date() })
        .where(eq(visitor.id, resolvedVisitorId));
    } else {
      await db.insert(visitor).values({
        id: resolvedVisitorId,
        userId: null,
        visitCount: 1,
        createdAt: new Date(),
        lastVisitAt: new Date()
      });
    }
    await db.insert(restaurantVisit).values({
      id: crypto.randomUUID(),
      restaurantId,
      userId: null,
      visitorId: resolvedVisitorId
    });
    return { success: true, visitorId: resolvedVisitorId };
  } catch {
    return { success: false };
  }
}

export async function recordInteraction(type: 'instagram_click' | 'share_click' | 'whatsapp_click' | 'location_click' | 'menu_click', restaurantId?: string, visitorId?: string) {
  try {
    await db.insert(interactionEvent).values({
      id: crypto.randomUUID(),
      type,
      restaurantId: restaurantId ?? null,
      userId: null,
      visitorId: visitorId ?? null
    });
    return { success: true };
  } catch {
    return { success: false };
  }
}

export async function recordDiscountRedemption(discountId: string, restaurantId?: string, visitorId?: string) {
  try {
    await db.insert(discountRedemption).values({
      id: crypto.randomUUID(),
      discountId,
      restaurantId: restaurantId ?? null,
      userId: null,
      visitorId: visitorId ?? null
    });
    return { success: true };
  } catch {
    return { success: false };
  }
}

export async function getRestaurantsByVisits(limit = 10) {
  const g = await guardPlatform();
  if (g.error) return g;
  const last7 = daysAgo(7);
  const rows = await db.select({
    restaurantId: restaurantVisit.restaurantId
  }).from(restaurantVisit).where(gte(restaurantVisit.occurredAt, last7));
  const map: Record<string, number> = {};
  for (const r of rows) map[r.restaurantId] = (map[r.restaurantId] ?? 0) + 1;
  const ranked = Object.entries(map).sort((a,b)=>b[1]-a[1]).slice(0, limit);

  const result = [];
  for (const [id, visits] of ranked) {
    const r = await db.query.restaurant.findFirst({ where: eq(restaurant.id, id) });
    if (r) result.push({ ...r, weeklyVisits: visits });
  }
  return { restaurants: result };
}