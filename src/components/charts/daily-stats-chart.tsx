"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { useState } from "react"
import { Button } from "../ui/button"
import { format } from "date-fns"

const chartConfig = {
  revenue: {
    label: "Revenue (INR)",
    color: "#2563eb",
  },
  withdrawals: {
    label: "Withdrawals (INR)",
    color: "#60a5fa",
  },
  newUsers: {
    label: "New Users",
    color: "#93c5fd",
  },
}

export function DailyStatsChart({ data }: { data: any[] }) {
  const [activeCharts, setActiveCharts] = useState({
    revenue: true,
    withdrawals: true,
    newUsers: true,
  })

  const toggleChart = (key: keyof typeof activeCharts) => {
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
                    variant={activeCharts[key as keyof typeof activeCharts] ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleChart(key as keyof typeof activeCharts)}
                    style={{
                        backgroundColor: activeCharts[key as keyof typeof activeCharts] ? config.color : undefined,
                        borderColor: config.color,
                        color: activeCharts[key as keyof typeof activeCharts] ? 'white' : config.color
                    }}
                >
                    {config.label}
                </Button>
            ))}
        </div>
        <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value}
            />
            <YAxis />
            <Tooltip 
                cursor={false}
                content={<ChartTooltipContent 
                    formatter={(value, name) => {
                        if (name === 'newUsers') return `${value} users`
                        return `₹${Number(value).toFixed(2)}`
                    }}
                />} 
            />
            <Legend />
            {activeCharts.revenue && <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />}
            {activeCharts.withdrawals && <Bar dataKey="withdrawals" fill="var(--color-withdrawals)" radius={4} />}
            {activeCharts.newUsers && <Bar dataKey="newUsers" fill="var(--color-newUsers)" radius={4} />}
          </BarChart>
        </ChartContainer>
    </div>
  )
}
