'use client'

import { useState } from 'react'
import {
  BarChart3,
  Download,
  Calendar,
  DollarSign,
  Car,
  TrendingUp,
  FileSpreadsheet,
  Users,
  Percent,
  Clock,
  Printer,
  Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

export default function AdminReportsPage() {
  const [reportType, setReportType] = useState('revenue')
  const [dateRange, setDateRange] = useState('this_month')

  const mostRentedCars: any[] = []
  const topCustomers: any[] = []

  const handleExportCSV = () => {
    let csvContent = 'Rental ID,Date,Vehicle,Customer,Rental Type,Duration,Total Amount (INR),Payment Status\n'

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `DriveEase_Fleet_Report_${reportType}_${dateRange}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl gradient-brand flex items-center justify-center shadow-md shadow-primary/20 text-white">
              <BarChart3 className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground">
                Fleet Financial & Utilization Reports
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Generate P&amp;L reports, track vehicle ROI, monitor utilization, and export GST audits.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleExportCSV}
            className="rounded-xl text-xs font-bold gap-2 shadow-sm"
          >
            <Download className="w-4 h-4" /> Export CSV Report
          </Button>
        </div>
      </div>

      {/* Control Bar: Report Type & Date Range Selector */}
      <div className="flex flex-wrap items-center gap-3 p-3 bg-card border border-border/80 rounded-2xl shadow-2xs">
        <div className="space-y-1">
          <span className="text-[10px] uppercase font-bold text-muted-foreground block">
            Report Category
          </span>
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger className="w-52 h-9 text-xs rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="revenue" className="text-xs">Gross Revenue &amp; Collections</SelectItem>
              <SelectItem value="utilization" className="text-xs">Fleet Utilization % &amp; Idle Time</SelectItem>
              <SelectItem value="roi" className="text-xs">Vehicle Cost vs Profit ROI</SelectItem>
              <SelectItem value="gst" className="text-xs">GST Output Tax Statement</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <span className="text-[10px] uppercase font-bold text-muted-foreground block">
            Date Range Filter
          </span>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-48 h-9 text-xs rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today" className="text-xs">Today</SelectItem>
              <SelectItem value="this_week" className="text-xs">This Week</SelectItem>
              <SelectItem value="this_month" className="text-xs">This Month</SelectItem>
              <SelectItem value="this_year" className="text-xs">This Financial Year</SelectItem>
              <SelectItem value="custom" className="text-xs">All Time Custom Range</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="bg-card border border-border/80 rounded-2xl p-5 space-y-1 shadow-sm">
          <span className="text-xs font-bold text-muted-foreground uppercase">
            Gross Rental Revenue
          </span>
          <div className="text-2xl font-black text-foreground font-mono">₹0</div>
          <span className="text-[11px] text-muted-foreground font-semibold">No revenue recorded yet</span>
        </div>

        <div className="bg-card border border-border/80 rounded-2xl p-5 space-y-1 shadow-sm">
          <span className="text-xs font-bold text-muted-foreground uppercase">
            Fleet Utilization
          </span>
          <div className="text-2xl font-black text-foreground">0%</div>
          <span className="text-[11px] text-muted-foreground font-semibold">No vehicles currently active</span>
        </div>

        <div className="bg-card border border-border/80 rounded-2xl p-5 space-y-1 shadow-sm">
          <span className="text-xs font-bold text-muted-foreground uppercase">
            Total Completed Rentals
          </span>
          <div className="text-2xl font-black text-foreground font-mono">0 Trips</div>
          <span className="text-[11px] text-muted-foreground">0 days duration</span>
        </div>

        <div className="bg-card border border-border/80 rounded-2xl p-5 space-y-1 shadow-sm">
          <span className="text-xs font-bold text-muted-foreground uppercase">
            Output GST Liability (18%)
          </span>
          <div className="text-2xl font-black text-foreground font-mono">₹0</div>
          <span className="text-[10px] text-muted-foreground font-mono">CGST: ₹0 • SGST: ₹0</span>
        </div>
      </div>

      {/* 2-Column Analytics Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Rented Vehicles */}
        <div className="bg-card border border-border/80 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm sm:text-base text-foreground flex items-center gap-2">
              <Car className="w-4 h-4 text-primary" /> Most Rented Vehicles
            </h3>
            <Badge variant="outline" className="text-[10px]">By Volume</Badge>
          </div>

          <div className="divide-y divide-border/60">
            {mostRentedCars.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No vehicle rental history recorded yet.
              </div>
            ) : (
              mostRentedCars.map(car => (
                <div key={car.reg} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-foreground block">{car.name}</span>
                    <span className="font-mono text-[10px] text-muted-foreground">{car.reg}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400 block">{car.revenue}</span>
                    <span className="text-[10px] text-muted-foreground">{car.trips} Trips ({car.utilization} util.)</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Most Valuable Customers */}
        <div className="bg-card border border-border/80 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm sm:text-base text-foreground flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" /> Top Valuable Customers
            </h3>
            <Badge variant="outline" className="text-[10px]">By Lifetime Spend</Badge>
          </div>

          <div className="divide-y divide-border/60">
            {topCustomers.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No customer spending history recorded yet.
              </div>
            ) : (
              topCustomers.map(cust => (
                <div key={cust.phone} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-foreground block">{cust.name}</span>
                    <span className="text-[10px] text-muted-foreground">{cust.phone}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold font-mono text-primary block">{cust.spend}</span>
                    <span className="text-[10px] text-muted-foreground">{cust.trips} Total Rentals</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
