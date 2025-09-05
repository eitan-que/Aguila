"use client"

import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell, LineChart, Line } from "recharts"

export function RevenueBarChart({ data }: { data: { month: string; revenue: number }[] }) {
  return (
    <ChartContainer
      config={{
        revenue: { label: "Revenue", color: "var(--primary)" },
      }}
      className="w-full h-[300px]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis dataKey="month" />
          <YAxis />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="revenue" fill="var(--primary)" radius={4} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}

export function CategoryPieChart({
  data,
}: {
  data: { name: string; value: number; color: string }[]
}) {
  return (
    <ChartContainer
      config={{
        pizza: { label: "Pizza", color: "var(--color-chart-1)" },
        burgers: { label: "Burgers", color: "var(--color-chart-2)" },
        salads: { label: "Salads", color: "var(--color-chart-3)" },
        desserts: { label: "Desserts", color: "var(--color-chart-4)" },
      }}
      className="w-full h-[300px]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value">
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <ChartTooltip content={<ChartTooltipContent />} />
        </PieChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}

export function OrdersLineChart({ data }: { data: { day: string; orders: number }[] }) {
  return (
    <ChartContainer
      config={{
        orders: { label: "Orders", color: "var(--secondary)" },
      }}
      className="w-full h-[200px]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="day" />
          <YAxis />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Line
            type="monotone"
            dataKey="orders"
            stroke="hsl(var(--secondary))"
            strokeWidth={3}
            dot={{ fill: "hsl(var(--secondary))", strokeWidth: 2, r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}