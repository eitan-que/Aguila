import { db } from '@/db/drizzle';
import {
  user, restaurant, product, discount,
  restaurantVisit, discountRedemption, discountQrScan,
  interactionEvent, discountView, restaurantCost,
  visitor, category
} from '@/db/schema';
import { auth } from '@/lib/auth';
import { count, eq, and, gte, lte, sql, inArray } from 'drizzle-orm';
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

// =============================
// MÉTRICAS PLATAFORMA (ADMIN)
// =============================
export async function getPlatformMetrics() {
  const g = await guardPlatform();
  if (g.error) return g;

  const now = new Date();
  const last30 = daysAgo(30);
  const last7 = daysAgo(7);
  const last24h = daysAgo(1);

  // Totales base
  const [restaurantsCount] = await db.select({ c: count() }).from(restaurant);
  const [productsCount] = await db.select({ c: count() }).from(product);
  const [activeDiscounts] = await db.select({ c: count() }).from(discount)
    .where(and(lte(discount.startDate, now), gte(discount.endDate, now)));
  const [qrScansTotalRow] = await db.select({ c: count() }).from(discountQrScan);

  // Visitas últimos 30 días (para agregaciones)
  const visits = await db.select({
    restaurantId: restaurantVisit.restaurantId,
    occurredAt: restaurantVisit.occurredAt
  }).from(restaurantVisit)
    .where(gte(restaurantVisit.occurredAt, last30));

  // Visitas última semana y último día
  const visitsLast7 = visits.filter(v => v.occurredAt >= last7);
  const visitsLast24h = visits.filter(v => v.occurredAt >= last24h);

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

  const sortedRestaurants = Object.entries(visitCountByRestaurant).sort((a,b)=>b[1]-a[1]);
  const mostVisited = sortedRestaurants[0];
  const leastVisited = sortedRestaurants[sortedRestaurants.length - 1];

  const mostVisitedRestaurant = mostVisited
    ? await db.query.restaurant.findFirst({ where: eq(restaurant.id, mostVisited[0]) })
    : null;
  const leastVisitedRestaurant = leastVisited
    ? await db.query.restaurant.findFirst({ where: eq(restaurant.id, leastVisited[0]) })
    : null;

  const mostVisitedDayIndex = dayOfWeekCounts.indexOf(Math.max(...dayOfWeekCounts));
  const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const peakHour = hourCounts.indexOf(Math.max(...hourCounts));

  // Promos (vistas y redenciones)
  const promoViews = await db.select({
    discountId: discountView.discountId,
    occurredAt: discountView.occurredAt
  }).from(discountView).where(gte(discountView.occurredAt, last30));

  const promoRedemptions = await db.select({
    discountId: discountRedemption.discountId,
    occurredAt: discountRedemption.redeemedAt
  }).from(discountRedemption).where(gte(discountRedemption.redeemedAt, last30));

  const viewCounts: Record<string, number> = {};
  for (const v of promoViews) viewCounts[v.discountId] = (viewCounts[v.discountId] ?? 0) + 1;
  const redemptionCounts: Record<string, number> = {};
  for (const r of promoRedemptions) redemptionCounts[r.discountId] = (redemptionCounts[r.discountId] ?? 0) + 1;

  const sortedViews = Object.entries(viewCounts).sort((a,b)=>b[1]-a[1]);
  const sortedRedemptions = Object.entries(redemptionCounts).sort((a,b)=>b[1]-a[1]);
  const mostViewedPromo = sortedViews[0];
  const leastViewedPromo = sortedViews[sortedViews.length - 1];
  const mostRedeemedPromo = sortedRedemptions[0];
  const leastRedeemedPromo = sortedRedemptions[sortedRedemptions.length - 1];

  async function enrichDiscount(entry?: [string, number]) {
    if (!entry) return null;
    const d = await db.query.discount.findFirst({ where: eq(discount.id, entry[0]) });
    if (!d) return null;
    return { id: d.id, name: d.name, restaurantId: d.restaurantId, value: entry[1] };
  }

  const mostViewedPromoData = await enrichDiscount(mostViewedPromo);
  const leastViewedPromoData = await enrichDiscount(leastViewedPromo);
  const mostRedeemedPromoData = await enrichDiscount(mostRedeemedPromo);
  const leastRedeemedPromoData = await enrichDiscount(leastRedeemedPromo);

  async function attachRestaurantName(d: any | null) {
    if (!d || !d.restaurantId) return d;
    const r = await db.query.restaurant.findFirst({ where: eq(restaurant.id, d.restaurantId) });
    return r ? { ...d, restaurantName: r.name } : d;
  }

  const [mvPromo, lvPromo, mrPromo, lrPromo] = await Promise.all([
    attachRestaurantName(mostViewedPromoData),
    attachRestaurantName(leastViewedPromoData),
    attachRestaurantName(mostRedeemedPromoData),
    attachRestaurantName(leastRedeemedPromoData)
  ]);

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

  // Interacciones específicas (últimos 30 días)
  const interactionRows = await db.select({
    type: interactionEvent.type
  }).from(interactionEvent).where(gte(interactionEvent.occurredAt, last30));
  const instagramClicks = interactionRows.filter(e => e.type === 'instagram_click').length;
  const shareClicks = interactionRows.filter(e => e.type === 'share_click').length;

  // Visitas diarias (últimos 7 días) para mostrar tendencia
  const dailyMap: Record<string, number> = {};
  visits.filter(v => v.occurredAt >= last7).forEach(v => {
    const dStr = new Date(v.occurredAt).toISOString().slice(0,10);
    dailyMap[dStr] = (dailyMap[dStr] ?? 0) + 1;
  });
  const dailyVisitsLast7 = Object.entries(dailyMap).sort(([a],[b])=> a.localeCompare(b)).map(([date, count]) => ({ date, count }));

  return {
    metrics: {
      totalRestaurants: restaurantsCount.c,
      totalProducts: productsCount.c,
      activeDiscounts: activeDiscounts.c,
      qrScans: qrScansTotalRow.c,
      visits: {
        last24h: visitsLast24h.length,
        last7Days: visitsLast7.length,
        last30Days: totalVisits30,
        dailyLast7: dailyVisitsLast7,
      },
      mostVisitedDay: dayNames[mostVisitedDayIndex],
      peakHour: `${peakHour}:00`,
      instagramClicks,
      shareClicks,
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
        mostViewed: mvPromo ? { ...mvPromo, views: mvPromo.value } : null,
        leastViewed: lvPromo ? { ...lvPromo, views: lvPromo.value } : null,
        mostRedeemed: mrPromo ? { ...mrPromo, redemptions: mrPromo.value } : null,
        leastRedeemed: lrPromo ? { ...lrPromo, redemptions: lrPromo.value } : null,
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
// =============================
// MÉTRICAS POR RESTAURANTE
// =============================
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

  // Escaneos QR exitosos (últimos 30)
  const successfulQrScansRows = await db.select({ id: discountQrScan.id })
    .from(discountQrScan)
    .leftJoin(discount, eq(discount.id, discountQrScan.discountId))
    .where(and(eq(discount.restaurantId, restaurantId), eq(discountQrScan.success, true), gte(discountQrScan.scannedAt, last30)));

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

  // Share of attention y ranking por categoría (según nombre)
  const catNamesRows = await db.select({ name: category.name }).from(category).where(eq(category.restaurantId, restaurantId));
  const catNames = Array.from(new Set(catNamesRows.map(c => c.name)));
  const perCategory: Array<{ categoryName: string; shareOfAttention: number; ranking: number; totalRestaurants: number; totalVisitsCategory: number; restaurantVisits: number; } > = [];
  if (catNames.length) {
    // Para cada nombre de categoría buscamos los restaurants que la tienen
    for (const catName of catNames) {
      const catRestaurantRows = await db.select({ restaurantId: category.restaurantId })
        .from(category)
        .where(eq(category.name, catName));
      const relatedRestaurantIds = Array.from(new Set(catRestaurantRows.map(r => r.restaurantId)));
      if (!relatedRestaurantIds.length) continue;
      // Visitas últimos 30 de esos restaurantes
      const relatedVisits = allVisits30.filter(v => relatedRestaurantIds.includes(v.restaurantId));
      const totalCatVisits = relatedVisits.length || 1;
      const restaurantCatVisits = relatedVisits.filter(v => v.restaurantId === restaurantId).length;
      const catRankMap: Record<string, number> = {};
      for (const rv of relatedVisits) catRankMap[rv.restaurantId] = (catRankMap[rv.restaurantId] ?? 0) + 1;
      const catRanking = Object.entries(catRankMap).sort((a,b)=>b[1]-a[1]).findIndex(e => e[0] === restaurantId) + 1;
      perCategory.push({
        categoryName: catName,
        shareOfAttention: Number(((restaurantCatVisits / totalCatVisits) * 100).toFixed(2)),
        ranking: catRanking || relatedRestaurantIds.length,
        totalRestaurants: relatedRestaurantIds.length,
        totalVisitsCategory: totalCatVisits,
        restaurantVisits: restaurantCatVisits
      });
    }
  }

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
        promotionScansSuccessful: successfulQrScansRows.length,
        whatsappClicks: sumType('whatsapp_click'),
        locationClicks: sumType('location_click'),
        menuClicks: sumType('menu_click'),
        instagramClicks: sumType('instagram_click'),
        shareClicks: sumType('share_click'),
      },
      categoryMetrics: {
        shareOfAttention: Number(shareOfAttention.toFixed(2)),
        categoryRanking: ranking,
        perCategory,
        costPerExposure: Number(costPerExposure.toFixed(2)),
      }
    }
  };
}

// Registro de eventos públicos (no requieren sesión)
export async function recordRestaurantVisit(restaurantId: string, visitorId?: string) {
  try {
    // Skip counting if dashboard/admin context header present
    const hdrs = await headers();
    if (hdrs.get('x-internal-context') === 'dashboard') {
      return { success: true, skipped: true };
    }
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
    // Increment popularityScore with light decay guard (cap burst)
    await db.execute(sql`UPDATE "restaurant" SET popularity_score = popularity_score + 1, last_boost_at = NOW() WHERE id = ${restaurantId}`);
    return { success: true, visitorId: resolvedVisitorId };
  } catch (e) {
    console.error('recordRestaurantVisit failed', e);
    return { success: false };
  }
}

export async function recordInteraction(type: 'instagram_click' | 'share_click' | 'whatsapp_click' | 'location_click' | 'menu_click', restaurantId?: string, visitorId?: string) {
  try {
    const hdrs = await headers();
    if (hdrs.get('x-internal-context') === 'dashboard') {
      return { success: true, skipped: true };
    }
    await db.insert(interactionEvent).values({
      id: crypto.randomUUID(),
      type,
      restaurantId: restaurantId ?? null,
      userId: null,
      visitorId: visitorId ?? null
    });
    if (restaurantId) {
      await db.execute(sql`UPDATE "restaurant" SET popularity_score = popularity_score + 2 WHERE id = ${restaurantId}`);
    }
    return { success: true };
  } catch (e) {
    console.error('recordInteraction failed', e);
    return { success: false };
  }
}

// Sencillo decaimiento: reducir 5% popularidad para todos (llamar desde cron)
export async function decayPopularityScores() {
  try {
    await db.execute(sql`UPDATE "restaurant" SET popularity_score = GREATEST(0, ROUND(popularity_score * 0.95))`);
    await db.execute(sql`UPDATE "category" SET popularity_score = GREATEST(0, ROUND(popularity_score * 0.95))`);
    await db.execute(sql`UPDATE "product" SET popularity_score = GREATEST(0, ROUND(popularity_score * 0.93))`);
    return { success: true };
  } catch (e) {
    console.error('decayPopularityScores failed', e);
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

// Resumen semanal para listado (ID, nombre, antigüedad meses, visitas semanales) para ordenar
export async function getRestaurantsWeeklySummary() {
  const g = await guardPlatform();
  if (g.error) return g;
  const now = new Date();
  const last7 = daysAgo(7);
  const visits = await db.select({ restaurantId: restaurantVisit.restaurantId }).from(restaurantVisit).where(gte(restaurantVisit.occurredAt, last7));
  const countMap: Record<string, number> = {};
  for (const v of visits) countMap[v.restaurantId] = (countMap[v.restaurantId] ?? 0) + 1;
  const all = await db.select({ id: restaurant.id, name: restaurant.name, createdAt: restaurant.createdAt }).from(restaurant);
  const data = all.map(r => ({
    id: r.id,
    name: r.name,
    ageInMonths: ((now.getFullYear() - r.createdAt.getFullYear()) * 12) + (now.getMonth() - r.createdAt.getMonth()),
    weeklyVisits: countMap[r.id] ?? 0,
  }));
  return { restaurants: data.sort((a,b)=>b.weeklyVisits - a.weeklyVisits) };
}