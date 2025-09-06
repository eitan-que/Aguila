"use client"

import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis } from "recharts"

export function VisitsLineChart({
  data,
  label
}: {
  data: { day: string; visitas: number }[]
  label: string
}) {
  return (
    <ChartContainer
      className="w-full max-w-full overflow-hidden"
      style={{ width: '100%', aspectRatio: '16/6' }}
      config={{ visitas: { label, color: "var(--chart-1)" } }}
    >
      <LineChart data={data}>
        <XAxis dataKey="day" />
        <YAxis />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Line
          type="monotone"
          dataKey="visits"
          stroke="var(--chart-1)"
          strokeWidth={3}
          dot={{ fill: "var(--chart-1)", strokeWidth: 2, r: 3 }}
        />
      </LineChart>
    </ChartContainer>
  )
}

export function ClicksBarChart({
  data,
  label
}: {
  data: { name: string; clicks: number }[],
  label: string
}) {
  return (
    <ChartContainer
      className="w-full max-w-full overflow-hidden"
      style={{ aspectRatio: '16/7' }}
      config={{ clicks: { label, color: "var(--chart-2)" } }}
    >
      <BarChart data={data}>
        <XAxis dataKey="name" />
        <YAxis />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="clicks" fill="var(--chart-2)" radius={6} />
      </BarChart>
    </ChartContainer>
  )
}

export function UsersPieChart({
  data,
  label
}: {
  data: { name: string; value: number; color?: string }[]
  label: { registered: string; unregistered: string }
}) {
  return (
    <ChartContainer
      className="w-full max-w-full overflow-hidden"
      style={{ aspectRatio: '16/10' }}
      config={{
        registrados: { label: label.registered, color: "var(--chart-1)" },
        noregs: { label: label.unregistered, color: "var(--chart-2)" },
      }}
    >
      <PieChart>
        <Pie data={data} dataKey="value" innerRadius="55%" outerRadius="75%">
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Pie>
        <ChartTooltip content={<ChartTooltipContent />} />
      </PieChart>
    </ChartContainer>
  )
}
