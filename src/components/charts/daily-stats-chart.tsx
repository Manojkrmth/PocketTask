"use client"

import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts"
import { format } from "date-fns"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { useState } from "react"
import { Button } from "../ui/button"
import { cn } from "@/lib/utils"

const chartConfig = {
  revenue: {
    label: "Revenue (INR)",
    color: "hsl(var(--chart-2))",
  },
  withdrawals: {
    label: "Withdrawals (INR)",
    color: "hsl(var(--chart-5))",
  },
  newUsers: {
    label: "New Users",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

type ChartConfig = typeof chartConfig

export function DailyStatsChart({ data }: { data: any[] }) {
  const [activeCharts, setActiveCharts] = useState<Record<keyof ChartConfig, boolean>>({
    revenue: true,
    withdrawals: true,
    newUsers: false,
  })

  const toggleChart = (key: keyof ChartConfig) => {
    setActiveCharts(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const chartData = data.map(item => ({
    date: format(new Date(item.date), "MMM d"),
    revenue: item.total_revenue,
    withdrawals: item.total_withdrawals,
    newUsers: item.new_users_count,
  }));

  return (
    <div className="space-y-4">
         <div className="flex flex-wrap gap-2">
            {Object.entries(chartConfig).map(([key, config]) => (
                <Button 
                    key={key} 
                    variant={activeCharts[key as keyof ChartConfig] ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleChart(key as keyof ChartConfig)}
                    className={cn(
                        "transition-all",
                        activeCharts[key as keyof ChartConfig] 
                          ? `bg-[${config.color}] text-white` 
                          : `text-[${config.color}] border-[${config.color}]`
                    )}
                    style={{
                        '--chart-color': config.color,
                        backgroundColor: activeCharts[key as keyof ChartConfig] ? 'var(--chart-color)' : 'transparent',
                        borderColor: 'var(--chart-color)',
                        color: activeCharts[key as keyof ChartConfig] ? 'white' : 'var(--chart-color)',
                    } as React.CSSProperties}
                >
                    {config.label}
                </Button>
            ))}
        </div>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <AreaChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value}
            />
            <YAxis 
               tickLine={false}
               axisLine={false}
               tickMargin={8}
               tickFormatter={(value) => `₹${Number(value) / 1000}k`}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  indicator="dot"
                  formatter={(value, name) => {
                    if (name === "newUsers") return `${value} users`
                    return `₹${Number(value).toFixed(2)}`
                  }}
                />
              }
            />
            <defs>
                <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop
                    offset="5%"
                    stopColor="var(--color-revenue)"
                    stopOpacity={0.8}
                    />
                    <stop
                    offset="95%"
                    stopColor="var(--color-revenue)"
                    stopOpacity={0.1}
                    />
                </linearGradient>
            </defs>
            {activeCharts.revenue && (
                <Area
                    dataKey="revenue"
                    type="natural"
                    fill="url(#fillRevenue)"
                    fillOpacity={0.4}
                    stroke="var(--color-revenue)"
                    stackId="a"
                />
            )}
             {activeCharts.withdrawals && (
                <Line
                    dataKey="withdrawals"
                    type="natural"
                    stroke="var(--color-withdrawals)"
                    strokeWidth={2}
                    dot={false}
                />
             )}
              {activeCharts.newUsers && (
                <Line
                    dataKey="newUsers"
                    type="natural"
                    stroke="var(--color-newUsers)"
                    strokeWidth={2}
                    dot={false}
                    yAxisId="right"
                />
             )}
          </AreaChart>
        </ChartContainer>
    </div>
  )
}
