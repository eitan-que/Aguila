import { Dictionary, getDictionary, type Lang, locales } from "@/actions/dictionaries"
import { SiteHeader } from "@/components/dashboard/siteHeader"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ClicksBarChart, UsersPieChart, VisitsLineChart } from "@/components/dashboard/DashboardCharts"

type Stat = { title: string; value: string; note?: string }

export async function generateStaticParams() {
  return locales.map((lang) => ({ lang }))
}

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ lang: Lang }>
}) {
  const { lang } = await params
  const dict = await getDictionary(lang)
  const t = (dict as Dictionary).dashboard.analytics

  // Localized mock data
  const overview: Stat[] = [
    { title: t.metrics.restaurants, value: "12", note: t.notes.totalRegistered },
    { title: t.metrics.products, value: "287", note: t.notes.inMenu },
    { title: t.metrics.discounts, value: "9", note: t.notes.activePromos },
    { title: t.metrics.scannedQrs, value: "0", note: t.notes.scannedAtCashier },
  ]

  const visitasKPIs: Stat[] = [
    { title: t.metrics.dailyVisits, value: "9999", note: t.notes.dailyTotal },
    { title: t.metrics.weeklyVisits, value: "9999", note: t.notes.weeklyTotal },
    { title: t.metrics.monthlyVisits, value: "9999", note: t.notes.monthlyTotal },
  ]

  const usuariosKPIs: Stat[] = [
    { title: t.metrics.registeredUsers, value: "9999", note: t.notes.totalRegistered },
    { title: t.metrics.totalUsers, value: "9999", note: t.notes.total },
    { title: t.metrics.registeredPercent, value: "88%", note: t.notes.total },
    { title: t.metrics.retentionPercent, value: "88%", note: t.notes.returningUsers },
    { title: t.metrics.monthlyUsersIncrease, value: "+15%", note: t.notes.thisMonth },
    { title: t.metrics.weeklyUsersIncrease, value: "+21%", note: t.notes.thisWeek },
  ]

  const destacados: Stat[] = [
    { title: t.metrics.mostVisitedRestaurant, value: "McDonald's", note: t.notes.last30Days },
    { title: t.metrics.leastVisitedRestaurant, value: "Big Pizza", note: t.notes.last30Days },
    { title: t.metrics.mostVisitedPromo, value: "2x1 Cuarto de Libra", note: "McDonald's" },
  ]

  const rendimiento: Stat[] = [
    { title: t.metrics.conversionRate, value: "88%", note: t.notes.total },
    { title: t.metrics.busiestHour, value: t.values.busiestHour, note: t.notes.thisMonth },
    { title: t.metrics.busiestDay, value: t.values.busiestDay, note: t.notes.thisMonth },
  ]

  // Charts data (colors come from CSS vars in globals.css via components)
  const d = t.daysShort
  const visitsByDay = [
    { day: d.mon, visits: 1320 },
    { day: d.tue, visits: 1480 },
    { day: d.wed, visits: 1560 },
    { day: d.thu, visits: 1999 },
    { day: d.fri, visits: 1750 },
    { day: d.sat, visits: 1650 },
    { day: d.sun, visits: 1540 },
  ]

  const clicksBySource = [
    { name: t.charts.instagramClicks, clicks: 843 },
    { name: t.charts.shareClicks, clicks: 210 },
  ]

  const usersDistribution = [
    { name: t.metrics.registeredUsers, value: 88, color: "var(--chart-1)" },
    { name: t.metrics.unregisteredUsers, value: 12, color: "var(--chart-2)" },
  ]

  return (
    <>
      <SiteHeader title={dict.dashboard.home.title} />
      <div className="flex flex-col flex-1 gap-6 p-4 lg:p-6">
        {/* Intro */}
        <div className="flex flex-col gap-2">
          <h2 className="font-bold text-2xl text-balance">{dict.dashboard.home.description}</h2>
          <p className="text-muted-foreground">{t.intro}</p>
        </div>

        {/* Summary */}
        <div className="gap-4 grid sm:grid-cols-2 lg:grid-cols-4">
          {overview.map((s, i) => (
            <Card key={i} className="w-full">
              <CardHeader className="space-y-0 pb-2">
                <CardTitle className="font-medium text-muted-foreground text-sm">{s.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="font-bold text-2xl">{s.value}</div>
                {s.note ? (
                  <p className="text-muted-foreground text-xs">{s.note}</p>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Traffic and visits */}
        <div className="gap-6 grid lg:grid-cols-7">
          <Card className="col-span-full h-full">
            <CardHeader>
              <CardTitle>{t.charts.visitsByDay}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full">
                <VisitsLineChart data={visitsByDay} label={t.labels.visits} />
              </div>
              <div className="gap-4 grid sm:grid-cols-3 mt-4">
                {visitasKPIs.map((s, i) => (
                  <div key={i} className="bg-muted/40 px-3 py-2 rounded-md">
                    <div className="text-muted-foreground text-xs">{s.title}</div>
                    <div className="font-semibold">{s.value}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <div className="self-start gap-4 grid grid-cols-2 col-span-full">
            {rendimiento
              .filter((r) => [t.metrics.busiestDay, t.metrics.busiestHour].includes(r.title))
              .map((s, i) => (
                <Card key={i} className="col-span-full lg:col-span-1">
                  <CardHeader className="space-y-0 pb-2">
                    <CardTitle className="font-medium text-muted-foreground text-sm">{s.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="py-3">
                    <div className="font-bold text-2xl leading-tight">{s.value}</div>
                    {s.note ? (
                      <p className="text-muted-foreground text-xs">{s.note}</p>
                    ) : null}
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>

        {/* Users */}
        <div className="gap-6 grid lg:grid-cols-7">
          <Card className="col-span-full lg:col-span-3">
            <CardHeader>
              <CardTitle>{t.charts.usersDistribution}</CardTitle>
            </CardHeader>
            <CardContent>
              <UsersPieChart data={usersDistribution} 
              label={{ registered: t.metrics.registeredUsers, unregistered: t.metrics.unregisteredUsers }} 
              />
              <div className="gap-4 grid grid-cols-2 mt-4">
                <div className="bg-muted/40 px-3 py-2 rounded-md">
                  <div className="text-muted-foreground text-xs">{t.metrics.registeredUsers}</div>
                  <div className="font-semibold">88%</div>
                </div>
                <div className="bg-muted/40 px-3 py-2 rounded-md">
                  <div className="text-muted-foreground text-xs">{t.metrics.unregisteredUsers}</div>
                  <div className="font-semibold">12%</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="gap-4 grid sm:grid-cols-2 col-span-full lg:col-span-4">
            {usuariosKPIs.map((s, i) => (
              <Card key={i} className="w-full">
                <CardHeader className="space-y-0 pb-2">
                  <CardTitle className="font-medium text-muted-foreground text-sm">{s.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="font-bold text-2xl">{s.value}</div>
                  {s.note ? (
                    <p className="text-muted-foreground text-xs">{s.note}</p>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Interactions */}
        <div className="gap-6 grid lg:grid-cols-7">
          <Card className="col-span-full lg:col-span-4">
            <CardHeader>
              <CardTitle>{t.charts.clicksBySource}</CardTitle>
            </CardHeader>
            <CardContent>
              <ClicksBarChart data={clicksBySource} label={t.labels.clicks} />
              <div className="gap-4 grid sm:grid-cols-3 mt-4">
                <div className="bg-muted/40 px-3 py-2 rounded-md">
                  <div className="text-muted-foreground text-xs">{t.charts.instagramClicks}</div>
                  <div className="font-semibold">843</div>
                </div>
                <div className="bg-muted/40 px-3 py-2 rounded-md">
                  <div className="text-muted-foreground text-xs">{t.charts.shareClicks}</div>
                  <div className="font-semibold">210</div>
                </div>
                <div className="bg-muted/40 px-3 py-2 rounded-md">
                  <div className="text-muted-foreground text-xs">{t.notes.total}</div>
                  <div className="font-semibold">{843 + 210}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Highlights */}
          <div className="gap-4 grid sm:grid-cols-2 lg:grid-cols-3 col-span-full lg:col-span-3">
            {destacados.map((s, i) => (
              <Card key={i} className="col-span-full lg:col-span-3 hover:bg-muted/30 w-full transition-colors">
                <CardHeader className="space-y-0 pb-2">
                  <CardTitle className="font-medium text-muted-foreground text-sm">{s.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="font-extrabold text-xl lg:text-2xl tracking-tight">{s.value}</div>
                  {s.note ? (
                    <p className="text-muted-foreground text-xs">{s.note}</p>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
