'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { format, parseISO } from 'date-fns'

interface RevenueDataPoint {
  date: string
  revenue: number
}

interface RevenueChartProps {
  data: RevenueDataPoint[]
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
        <p className="text-xs text-muted-foreground">
          {label ? format(parseISO(label), 'dd MMM yyyy') : ''}
        </p>
        <p className="text-sm font-bold mt-0.5">
          ₹{payload[0].value.toLocaleString('en-IN')}
        </p>
      </div>
    )
  }
  return null
}

export function RevenueChart({ data }: RevenueChartProps) {
  const total = data.reduce((sum, d) => sum + d.revenue, 0)

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Revenue (Last 30 days)</CardTitle>
            <p className="text-2xl font-bold mt-1">
              ₹{total.toLocaleString('en-IN')}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
            No revenue data yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="oklch(0.47 0.22 264)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="oklch(0.47 0.22 264)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.02 256)" vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: 'oklch(0.52 0.04 256)' }}
                tickFormatter={(v) => format(parseISO(v), 'dd/MM')}
                interval={4}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: 'oklch(0.52 0.04 256)' }}
                tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                width={45}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="oklch(0.47 0.22 264)"
                strokeWidth={2}
                fill="url(#revenueGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
