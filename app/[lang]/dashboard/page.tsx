import { getDictionary, type Lang, locales } from "@/actions/dictionaries"
import { SiteHeader } from "@/components/dashboard/siteHeader"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TrendingUp, Users, ShoppingBag, DollarSign, Plus, Edit, MoreHorizontal } from "lucide-react"
import { CategoryPieChart, OrdersLineChart, RevenueBarChart } from "@/components/dashboard/Charts"

const mockMetrics = [
  {
    title: "Total Revenue",
    value: "$45,231.89",
    change: "+20.1%",
    trend: "up",
    icon: DollarSign,
  },
  {
    title: "Active Orders",
    value: "2,350",
    change: "+180.1%",
    trend: "up",
    icon: ShoppingBag,
  },
  {
    title: "Total Customers",
    value: "12,234",
    change: "+19%",
    trend: "up",
    icon: Users,
  },
  {
    title: "Growth Rate",
    value: "+573",
    change: "+201%",
    trend: "up",
    icon: TrendingUp,
  },
]

const revenueData = [
  { month: "Jan", revenue: 4000 },
  { month: "Feb", revenue: 3000 },
  { month: "Mar", revenue: 5000 },
  { month: "Apr", revenue: 4500 },
  { month: "May", revenue: 6000 },
  { month: "Jun", revenue: 5500 },
]

const ordersData = [
  { day: "Mon", orders: 45 },
  { day: "Tue", orders: 52 },
  { day: "Wed", orders: 38 },
  { day: "Thu", orders: 61 },
  { day: "Fri", orders: 75 },
  { day: "Sat", orders: 89 },
  { day: "Sun", orders: 67 },
]

const categoryData = [
  { name: "Pizza", value: 35, color: "hsl(var(--chart-1))" },
  { name: "Burgers", value: 25, color: "hsl(var(--chart-2))" },
  { name: "Salads", value: 20, color: "hsl(var(--chart-3))" },
  { name: "Desserts", value: 20, color: "hsl(var(--chart-4))" },
]

const recentOrders = [
  { id: "#3210", customer: "John Doe", amount: "$89.00", status: "completed", time: "2 min ago" },
  { id: "#3209", customer: "Jane Smith", amount: "$156.00", status: "preparing", time: "5 min ago" },
  { id: "#3208", customer: "Mike Johnson", amount: "$67.50", status: "pending", time: "8 min ago" },
  { id: "#3207", customer: "Sarah Wilson", amount: "$234.00", status: "completed", time: "12 min ago" },
]

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

  return (
    <>
      <SiteHeader title={dict.dashboard.home.title} />
      <div className="flex flex-col flex-1 gap-6 p-4 lg:p-6">
        {/* Welcome Section */}
        <div className="flex flex-col gap-2">
          <h2 className="font-bold text-2xl text-balance">{dict.dashboard.home.description}</h2>
          <p className="text-muted-foreground">Here&apos;s what&apos;s happening with your business today.</p>
        </div>

        {/* Metrics Cards */}
        <div className="gap-4 grid md:grid-cols-2 lg:grid-cols-4">
          {mockMetrics.map((metric, index) => {
            const Icon = metric.icon
            return (
              <Card key={index}>
                <CardHeader className="flex flex-row justify-between items-center space-y-0 pb-2">
                  <CardTitle className="font-medium text-muted-foreground text-sm">{metric.title}</CardTitle>
                  <Icon className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="font-bold text-2xl">{metric.value}</div>
                  <p className="flex items-center gap-1 text-muted-foreground text-xs">
                    <span className="text-success">{metric.change}</span>
                    from last month
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Charts Section */}
        <div className="gap-6 grid md:grid-cols-2 lg:grid-cols-7">
          {/* Revenue Chart */}
          <Card className="col-span-full lg:col-span-4">
            <CardHeader>
              <CardTitle>Revenue Overview</CardTitle>
              <CardDescription>Monthly revenue for the last 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              <RevenueBarChart data={revenueData} />
            </CardContent>
          </Card>

          {/* Category Distribution */}
          <Card className="col-span-full lg:col-span-3">
            <CardHeader>
              <CardTitle>Popular Categories</CardTitle>
              <CardDescription>Distribution of orders by category</CardDescription>
            </CardHeader>
            <CardContent>
              <CategoryPieChart data={categoryData} />
            </CardContent>
          </Card>
        </div>

        {/* Bottom Section */}
        <div className="gap-6 grid md:grid-cols-2 lg:grid-cols-7">
          {/* Weekly Orders Trend */}
          <Card className="col-span-full lg:col-span-4">
            <CardHeader>
              <CardTitle>Weekly Orders Trend</CardTitle>
              <CardDescription>Orders received each day this week</CardDescription>
            </CardHeader>
            <CardContent>
              <OrdersLineChart data={ordersData} />
            </CardContent>
          </Card>
          {/* Quick Actions */}
          <Card className="col-span-full lg:col-span-3"> 
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Frequently used actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="gap-3 grid">
                <Button className="justify-start bg-transparent w-full" variant="outline">
                  <Plus className="mr-2 w-4 h-4" />
                  Add New Restaurant
                </Button>
                <Button className="justify-start bg-transparent w-full" variant="outline">
                  <Edit className="mr-2 w-4 h-4" />
                  Manage Menu
                </Button>
                <Button className="justify-start bg-transparent w-full" variant="outline">
                  <Users className="mr-2 w-4 h-4" />
                  Customer Analytics
                </Button>
                <Button className="justify-start bg-transparent w-full" variant="outline">
                  <MoreHorizontal className="mr-2 w-4 h-4" />
                  More Options
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
} 