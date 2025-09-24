"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, TrendingUp, Clock, Share2, Award, Ticket, Trash2, Pencil, ImageIcon } from "lucide-react"
import { Dictionary } from "@/actions/dictionaries"
import Image from "next/image"
import { useEffect, useState } from "react"
import { deleteDiscount, listDiscounts } from "@/actions/discounts"
import { DrawerDialogTemplate } from "@/components/dashboard/drawerDialogTemplate"
import { CreateDiscountForm } from "@/components/dashboard/forms/createDiscount"
import { EditDiscountForm } from "@/components/dashboard/forms/editDiscount"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"

// Define the type for discounts
type Discount = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  imageAlt: string | null;
  restaurantId: string | null;
}

// Define the props for our component
type RestaurantAnalyticsProps = {
  restaurantId: string
  restaurantName: string
  createdAt: Date
  dict: Dictionary["dashboard"]
}

export function RestaurantAnalytics({ 
  restaurantId, 
  restaurantName,
  createdAt,
  dict
}: RestaurantAnalyticsProps) {
  // State for discounts
  const [discounts, setDiscounts] = useState<Discount[]>([])
  const [isLoadingDiscounts, setIsLoadingDiscounts] = useState(false)
  const [discountError, setDiscountError] = useState<string | null>(null)
  
  // New state for delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [discountToDelete, setDiscountToDelete] = useState<string | null>(null)
  const [discountNameToDelete, setDiscountNameToDelete] = useState<string | null>(null)
  const [deletingDiscount, setDeletingDiscount] = useState(false)

  // New state for edit dialog
  const [discountToEdit, setDiscountToEdit] = useState<Discount | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  
  const t = dict.restaurants

  // Function to fetch discounts
  const fetchDiscounts = async () => {
    setIsLoadingDiscounts(true)
    setDiscountError(null)
    
    try {
      const response = await listDiscounts(restaurantId)
      if (response.success && response.data) {
        setDiscounts(response.data)
      } else {
        setDiscountError(response.message || "Failed to load discounts")
      }
    } catch (error) {
      setDiscountError("An error occurred while loading discounts")
      console.error("Error loading discounts:", error)
    } finally {
      setIsLoadingDiscounts(false)
    }
  }

  // Fetch discounts when component mounts
  useEffect(() => {
    fetchDiscounts()
  }, [restaurantId])

  // Calculate restaurant age
  const calculateAge = (date: Date) => {
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - new Date(date).getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 30) {
      return `${diffDays} ${t.analytics?.time?.days || 'days'}`
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30)
      return `${months} ${t.analytics?.time?.months || 'months'}`
    } else {
      const years = Math.floor(diffDays / 365)
      const remainingMonths = Math.floor((diffDays % 365) / 30)
      return `${years} ${years > 1 ? t.analytics?.time?.yearsPlural || 'years' : t.analytics?.time?.year || 'year'}${remainingMonths > 0 ? ` ${remainingMonths} ${remainingMonths > 1 ? t.analytics?.time?.monthsPlural || 'months' : t.analytics?.time?.month || 'month'}` : ''}`
    }
  }

  // Mock data for the charts
  const dailyVisitsByWeekday = [
    { day: t.analytics?.daysShort?.mon || "Mon", visits: 156 },
    { day: t.analytics?.daysShort?.tue || "Tue", visits: 142 },
    { day: t.analytics?.daysShort?.wed || "Wed", visits: 164 },
    { day: t.analytics?.daysShort?.thu || "Thu", visits: 185 },
    { day: t.analytics?.daysShort?.fri || "Fri", visits: 246 },
    { day: t.analytics?.daysShort?.sat || "Sat", visits: 324 },
    { day: t.analytics?.daysShort?.sun || "Sun", visits: 215 },
  ]

  const clickDistribution = [
    { name: "WhatsApp", value: 38, color: "#25D366" },
    { name: t.analytics?.engagement?.location || "Location", value: 27, color: "#4285F4" },
    { name: t.analytics?.engagement?.menu || "Menu", value: 35, color: "#FF9900" },
  ]

  const monthlyCostProjection = [
    { month: t.analytics?.months?.jan || "Jan", cost: 120, projected: 150 },
    { month: t.analytics?.months?.feb || "Feb", cost: 130, projected: 155 },
    { month: t.analytics?.months?.mar || "Mar", cost: 125, projected: 160 },
    { month: t.analytics?.months?.apr || "Apr", cost: 140, projected: 165 },
    { month: t.analytics?.months?.may || "May", cost: 155, projected: 170 },
    { month: t.analytics?.months?.jun || "Jun", cost: 165, projected: 175 },
  ]

  const marketShareData = [
    { name: restaurantName, value: 32, color: "var(--chart-1)" },
    { name: t.analytics?.marketShare?.competitorA || "Competitor A", value: 25, color: "var(--chart-2)" },
    { name: t.analytics?.marketShare?.competitorB || "Competitor B", value: 18, color: "var(--chart-3)" },
    { name: t.analytics?.marketShare?.others || "Others", value: 25, color: "var(--chart-4)" },
  ]

  // Mock analytics data
  const analytics = {
    age: calculateAge(createdAt),
    weeklyVisits: 1432,
    monthlyVisits: 5876,
    whatsappClicks: 543,
    locationClicks: 387,
    menuClicks: 498,
    mostVisitedDay: t.analytics?.values?.busiestDay || "Friday",
    shareOfAttention: "32%",
    categoryRanking: {
      category: "Fast Food",
      position: 3,
      total: 12
    },
    costPerExposure: "$0.12",
    projectedExposure: "7,500"
  }

  // New function to handle delete button click
  const handleDelete = (id: string, name: string) => {
    setDiscountToDelete(id)
    setDiscountNameToDelete(name)
    setDeleteDialogOpen(true)
  }

  // New function to confirm deletion
  const confirmDelete = async () => {
    if (!discountToDelete) return
    
    setDeletingDiscount(true)
    try {
      const result = await deleteDiscount(discountToDelete)
      if (result.success) {
        toast.success(t.discounts?.form?.toasts?.deleteSuccess || "Discount deleted successfully")
        // Update local data
        setDiscounts(discounts.filter(discount => discount.id !== discountToDelete))
      } else {
        toast.error(result.message || t.discounts?.form?.toasts?.deleteError || "Failed to delete discount")
      }
    } catch (err) {
      console.error(err)
      toast.error(t.discounts?.form?.toasts?.unexpected || "An unexpected error occurred")
    } finally {
      setDeletingDiscount(false)
      setDeleteDialogOpen(false)
      setDiscountToDelete(null)
      setDiscountNameToDelete(null)
    }
  }

  // New function to handle edit button click
  const handleEditDiscount = (discount: Discount) => {
    // Only allow editing if restaurantId is not null
    if (discount.restaurantId) {
      setDiscountToEdit(discount)
      setEditDialogOpen(true)
    }
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 w-full h-auto">
          <TabsTrigger value="overview">{t.analytics?.tabs?.overview || "Overview"}</TabsTrigger>
          <TabsTrigger value="traffic">{t.analytics?.tabs?.traffic || "Traffic"}</TabsTrigger>
          <TabsTrigger value="engagement">{t.analytics?.tabs?.engagement || "Engagement"}</TabsTrigger>
          <TabsTrigger value="performance">{t.analytics?.tabs?.performance || "Performance"}</TabsTrigger>
          <TabsTrigger value="discounts">{t.analytics?.tabs?.discounts || "Discounts"}</TabsTrigger>
        </TabsList>
        
        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-2">
          <div className="gap-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {/* Restaurant Age */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center font-medium text-muted-foreground text-sm">
                  <Clock className="mr-2 w-4 h-4" />
                  {t.analytics?.metrics?.restaurantAge || "Restaurant Age"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="font-bold text-2xl">{analytics.age}</div>
                <p className="text-muted-foreground text-xs">{t.analytics?.labels?.since || "Since"} {createdAt.toLocaleDateString()}</p>
              </CardContent>
            </Card>
            
            {/* Weekly Visits */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center font-medium text-muted-foreground text-sm">
                  {t.analytics?.metrics?.weeklyVisits || "Weekly Visits"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="font-bold text-2xl">{analytics.weeklyVisits.toLocaleString()}</div>
                <p className="text-muted-foreground text-xs">{t.analytics?.notes?.last7Days || "Last 7 days"}</p>
              </CardContent>
            </Card>
            
            {/* Monthly Visits */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center font-medium text-muted-foreground text-sm">
                  {t.analytics?.metrics?.monthlyVisits || "Monthly Visits"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="font-bold text-2xl">{analytics.monthlyVisits.toLocaleString()}</div>
                <p className="text-muted-foreground text-xs">{t.analytics?.notes?.last30Days || "Last 30 days"}</p>
              </CardContent>
            </Card>
          </div>
          
          {/* Market Position */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Share2 className="mr-2 w-5 h-5" />
                {t.analytics?.sections?.marketPosition || "Market Position"}
              </CardTitle>
            </CardHeader>
            <CardContent className="gap-6 grid grid-cols-1 lg:grid-cols-2">
              <div>
                <h4 className="mb-4 font-medium text-muted-foreground">{t.analytics?.metrics?.shareOfAttention || "Share of Attention"}</h4>
                <ChartContainer
                  className="mx-auto w-full max-w-md aspect-square"
                  config={{
                    share: { label: t.analytics?.charts?.marketShare || "Market Share", color: "var(--chart-1)" },
                  }}
                >
                  <PieChart>
                    <Pie 
                      data={marketShareData} 
                      dataKey="value" 
                      nameKey="name" 
                      innerRadius="60%" 
                      outerRadius="80%"
                    >
                      {marketShareData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ChartContainer>
              </div>
              <div className="flex flex-col justify-center">
                <div className="mb-6">
                  <h4 className="font-medium text-muted-foreground">{t.analytics?.metrics?.categoryRanking || "Category Ranking"}</h4>
                  <div className="flex items-center mt-2">
                    <Badge className="bg-amber-500 mr-2">{analytics.categoryRanking.position}</Badge>
                    <div>
                      <div className="font-bold text-lg">{analytics.categoryRanking.category}</div>
                      <p className="text-muted-foreground text-xs">
                        {t.analytics?.labels?.outOf || "Out of"} {analytics.categoryRanking.total} {t.analytics?.labels?.restaurants || "restaurants"}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-muted-foreground">{t.analytics?.metrics?.busiestDay || "Day with Most Visits"}</h4>
                  <div className="flex items-center mt-2">
                    <Badge className="bg-green-500 mr-2">
                      <CalendarDays className="mr-1 w-3 h-3" />
                    </Badge>
                    <div>
                      <div className="font-bold text-lg">{analytics.mostVisitedDay}</div>
                      <p className="text-muted-foreground text-xs">
                        {t.analytics?.labels?.basedOnWeeklyData || "Based on average weekly data"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* TRAFFIC TAB */}
        <TabsContent value="traffic" className="space-y-2">
          <Card>
            <CardHeader>
              <CardTitle>{t.analytics?.charts?.dailyTrafficDistribution || "Daily Traffic Distribution"}</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                className="w-full"
                style={{ height: '300px' }}
                config={{ visits: { label: t.analytics?.labels?.visits || "Visits", color: "var(--chart-1)" } }}
              >
                <BarChart data={dailyVisitsByWeekday}>
                  <XAxis dataKey="day" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="visits" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>

              <div className="gap-2 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 mt-6">
                {dailyVisitsByWeekday.map((day) => (
                  <div key={day.day} className="bg-muted/40 p-3 rounded-lg">
                    <div className="text-muted-foreground text-xs">{day.day}</div>
                    <div className="font-semibold">{day.visits}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <div className="gap-2 grid grid-cols-1 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">{t.analytics?.charts?.weeklyVsMonthlyTrend || "Weekly vs Monthly Trend"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-muted-foreground text-sm">{t.analytics?.metrics?.weeklyVisits || "Weekly Visits"}</p>
                    <p className="font-bold text-2xl">{analytics.weeklyVisits.toLocaleString()}</p>
                  </div>
                  <Badge variant="outline" className="border-green-500 text-green-500">
                    <TrendingUp className="mr-1 w-3 h-3" />
                    +8%
                  </Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-muted-foreground text-sm">{t.analytics?.metrics?.monthlyVisits || "Monthly Visits"}</p>
                    <p className="font-bold text-2xl">{analytics.monthlyVisits.toLocaleString()}</p>
                  </div>
                  <Badge variant="outline" className="border-green-500 text-green-500">
                    <TrendingUp className="mr-1 w-3 h-3" />
                    +12%
                  </Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-muted-foreground text-sm">{t.analytics?.metrics?.avgDailyVisits || "Avg. Daily Visits"}</p>
                    <p className="font-bold text-2xl">{Math.round(analytics.weeklyVisits / 7).toLocaleString()}</p>
                  </div>
                  <Badge variant="outline" className="border-green-500 text-green-500">
                    <TrendingUp className="mr-1 w-3 h-3" />
                    +5%
                  </Badge>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">{t.analytics?.charts?.projectedGrowth || "Projected Growth"}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[220px]">
                  <ChartContainer
                    className="w-full h-full"
                    config={{
                      cost: { label: t.analytics?.labels?.current || "Current", color: "var(--chart-1)" },
                      projected: { label: t.analytics?.labels?.projected || "Projected", color: "var(--chart-2)" }
                    }}
                  >
                    <LineChart data={monthlyCostProjection}>
                      <XAxis dataKey="month" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line
                        type="monotone"
                        dataKey="cost"
                        stroke="var(--chart-1)"
                        strokeWidth={2}
                        dot={{ fill: "var(--chart-1)", r: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="projected"
                        stroke="var(--chart-2)"
                        strokeDasharray="5 5"
                        strokeWidth={2}
                        dot={{ fill: "var(--chart-2)", r: 4 }}
                      />
                    </LineChart>
                  </ChartContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* ENGAGEMENT TAB */}
        <TabsContent value="engagement" className="space-y-2">
          <Card>
            <CardHeader>
              <CardTitle>{t.analytics?.sections?.clickEngagement || "Click Engagement"}</CardTitle>
            </CardHeader>
            <CardContent className="gap-2 grid grid-cols-1 lg:grid-cols-2">
              <div>
                <ChartContainer
                  className="mx-auto w-full max-w-md"
                  style={{ height: '300px' }}
                  config={{
                    clicks: { label: t.analytics?.labels?.clicks || "Clicks", color: "var(--chart-1)" }
                  }}
                >
                  <PieChart>
                    <Pie
                      data={clickDistribution}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {clickDistribution.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ChartContainer>
              </div>
              
              <div className="flex flex-col justify-center space-y-2">
                <div className="space-y-4">
                  <div className="bg-muted/40 p-4 rounded-lg">
                    <div className="flex items-center">
                      <div className="bg-[#25D366] mr-2 rounded-full w-3 h-3" />
                      <div className="font-medium text-sm">{t.analytics?.engagement?.whatsappClicks || "WhatsApp Clicks"}</div>
                    </div>
                    <div className="mt-1 font-bold text-2xl">{analytics.whatsappClicks.toLocaleString()}</div>
                    <p className="text-muted-foreground text-xs">38% {t.analytics?.labels?.ofTotalEngagement || "of total engagement"}</p>
                  </div>
                  
                  <div className="bg-muted/40 p-4 rounded-lg">
                    <div className="flex items-center">
                      <div className="bg-[#4285F4] mr-2 rounded-full w-3 h-3" />
                      <div className="font-medium text-sm">{t.analytics?.engagement?.locationClicks || "Location Clicks"}</div>
                    </div>
                    <div className="mt-1 font-bold text-2xl">{analytics.locationClicks.toLocaleString()}</div>
                    <p className="text-muted-foreground text-xs">27% {t.analytics?.labels?.ofTotalEngagement || "of total engagement"}</p>
                  </div>
                  
                  <div className="bg-muted/40 p-4 rounded-lg">
                    <div className="flex items-center">
                      <div className="bg-[#FF9900] mr-2 rounded-full w-3 h-3" />
                      <div className="font-medium text-sm">{t.analytics?.engagement?.menuClicks || "Menu Clicks"}</div>
                    </div>
                    <div className="mt-1 font-bold text-2xl">{analytics.menuClicks.toLocaleString()}</div>
                    <p className="text-muted-foreground text-xs">35% {t.analytics?.labels?.ofTotalEngagement || "of total engagement"}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* PERFORMANCE TAB */}
        <TabsContent value="performance" className="space-y-2">
          <div className="gap-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center font-medium text-muted-foreground text-sm">
                  <Award className="mr-2 w-4 h-4" />
                  {t.analytics?.metrics?.categoryRanking || "Category Ranking"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <div className="mr-2 font-bold text-3xl">#{analytics.categoryRanking.position}</div>
                  <Badge>{t.analytics?.labels?.top25Percent || "Top 25%"}</Badge>
                </div>
                <p className="text-muted-foreground text-xs">
                  {t.analytics?.labels?.inCategory || "in"} {analytics.categoryRanking.category} ({t.analytics?.labels?.ofTotal || "of"} {analytics.categoryRanking.total} {t.analytics?.labels?.restaurants || "restaurants"})
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="font-medium text-muted-foreground text-sm">
                  {t.analytics?.metrics?.costPerExposure || "Cost per Exposure"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="font-bold text-3xl">{analytics.costPerExposure}</div>
                <p className="text-muted-foreground text-xs">{t.analytics?.labels?.avgCostPerView || "Average cost per customer view"}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="font-medium text-muted-foreground text-sm">
                  {t.analytics?.metrics?.projectedExposure || "Projected Exposure"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="font-bold text-3xl">{analytics.projectedExposure}</div>
                <p className="text-muted-foreground text-xs">{t.analytics?.labels?.estimatedMonthlyViews || "Estimated monthly views"}</p>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>{t.analytics?.sections?.costEfficiencyMetrics || "Cost Efficiency Metrics"}</CardTitle>
            </CardHeader>
            <CardContent className="gap-6 grid grid-cols-1 md:grid-cols-2">
              <div>
                <h4 className="mb-4 font-medium text-muted-foreground text-sm">{t.analytics?.charts?.monthlyCostProjection || "Monthly Cost Projection"}</h4>
                <ChartContainer
                  className="w-full"
                  style={{ height: '250px' }}
                  config={{
                    cost: { label: t.analytics?.labels?.cost || "Cost", color: "var(--chart-1)" },
                    projected: { label: t.analytics?.labels?.projected || "Projected", color: "var(--chart-3)" }
                  }}
                >
                  <LineChart data={monthlyCostProjection}>
                    <XAxis dataKey="month" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line 
                      type="monotone" 
                      dataKey="cost" 
                      stroke="var(--chart-1)"
                      strokeWidth={2}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="projected" 
                      stroke="var(--chart-3)" 
                      strokeDasharray="5 5"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ChartContainer>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h4 className="mb-2 font-medium text-muted-foreground text-sm">{t.analytics?.sections?.performanceSummary || "Performance Summary"}</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">{t.analytics?.metrics?.engagementRate || "Engagement Rate"}:</span>
                      <span className="font-medium text-sm">4.8%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">{t.analytics?.metrics?.conversionRate || "Conversion Rate"}:</span>
                      <span className="font-medium text-sm">2.3%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">{t.analytics?.metrics?.roi || "ROI"}:</span>
                      <span className="font-medium text-sm">324%</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="mb-2 font-medium text-muted-foreground text-sm">{t.analytics?.sections?.recommendations || "Recommendations"}</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start">
                      <div className="bg-green-500 mt-1.5 mr-2 rounded-full w-2 h-2" />
                      <span>{t.analytics?.recommendations?.increaseMenuHighlights || "Increase menu highlights to improve engagement"}</span>
                    </li>
                    <li className="flex items-start">
                      <div className="bg-green-500 mt-1.5 mr-2 rounded-full w-2 h-2" />
                      <span>{t.analytics?.recommendations?.updateWhatsapp || "Update WhatsApp contact information for better visibility"}</span>
                    </li>
                    <li className="flex items-start">
                      <div className="bg-amber-500 mt-1.5 mr-2 rounded-full w-2 h-2" />
                      <span>{t.analytics?.recommendations?.reviewLocation || "Review location data accuracy to improve map clicks"}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* DISCOUNTS TAB */}
        <TabsContent value="discounts" className="space-y-2">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center">
                  <Ticket className="mr-2 w-5 h-5" />
                  {t.analytics?.sections?.discounts || "Restaurant Discounts"}
                </CardTitle>
                <DrawerDialogTemplate
                  triggerText={dict.restaurants.discounts?.add.trigger || "Add Discount"}
                  title={dict.restaurants.discounts?.add?.title || "Create New Discount"}
                  description={dict.restaurants.discounts?.add?.description || `Create a new discount for ${restaurantName}`}
                  form={
                    <CreateDiscountForm
                      restaurantId={restaurantId}
                      restaurantName={restaurantName}
                      t={dict.restaurants.discounts?.form}
                      onSuccess={fetchDiscounts}
                    />
                  }
                />
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingDiscounts ? (
                <div className="flex justify-center items-center h-40">
                  <p>{t.analytics?.labels?.loadingDiscounts || "Loading discounts..."}</p>
                </div>
              ) : discountError ? (
                <div className="flex justify-center items-center h-40">
                  <p className="text-red-500">{discountError}</p>
                </div>
              ) : discounts.length === 0 ? (
                <div className="flex justify-center items-center h-40">
                  <p>{t.analytics?.labels?.noDiscounts || "No discounts available for this restaurant."}</p>
                </div>
              ) : (
                <div className="gap-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 w-full h-auto">
                  {discounts.map((discount) => (
                    <Card key={discount.id} className="overflow-hidden">
                      <div className="relative aspect-video overflow-hidden">
                        {discount.imageUrl ? (
                          <Image
                            src={discount.imageUrl}
                            alt={discount.imageAlt || discount.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex justify-center items-center bg-muted h-full">
                            <ImageIcon className="w-10 h-10 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium">{discount.name}</h3>
                            {discount.description && (
                              <p className="mt-1 text-muted-foreground text-sm line-clamp-2">
                                {discount.description}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleEditDiscount(discount)}
                            >
                              <Pencil className="w-4 h-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleDelete(discount.id, discount.name)}
                            >
                              <Trash2 className="w-4 h-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Delete confirmation dialog */}
          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {t.discounts?.deleteDialog?.title || "Delete Discount"}
                </DialogTitle>
                <DialogDescription>
                  {(t.discounts?.deleteDialog?.description || 'Are you sure you want to delete "{name}"? This action cannot be undone.')
                    .replace("{name}", discountNameToDelete || "")}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setDeleteDialogOpen(false)}
                  disabled={deletingDiscount}
                >
                  {t.discounts?.deleteDialog?.cancel || "Cancel"}
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={confirmDelete}
                  disabled={deletingDiscount}
                >
                  {deletingDiscount 
                    ? (t.discounts?.deleteDialog?.deleting || "Deleting...") 
                    : (t.discounts?.deleteDialog?.confirm || "Delete")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit discount dialog */}
          {editDialogOpen && discountToEdit && (
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>{t.discounts?.form?.editTitle || "Edit Discount"}</DialogTitle>
                  <DialogDescription>
                    {t.discounts?.form?.editDescription || "Update discount information."}
                  </DialogDescription>
                </DialogHeader>
                <EditDiscountForm 
                  discount={discountToEdit}
                  t={dict.restaurants.discounts?.form}
                  onSuccess={() => {
                    setEditDialogOpen(false)
                    // Refresh discount data
                    fetchDiscounts()
                  }}
                />
              </DialogContent>
            </Dialog>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}