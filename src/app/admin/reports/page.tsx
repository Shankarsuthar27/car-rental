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

  // Sample fleet report data for rich dashboard presentation
  const mostRentedCars = [
    { name: 'Hyundai Creta', reg: 'RJ14-CR-2024', trips: 28, revenue: '₹50,400', utilization: '88%' },
    { name: 'Toyota Fortuner', reg: 'GJ01-TF-2024', trips: 19, revenue: '₹76,000', utilization: '82%' },
    { name: 'Mahindra Thar ROXX', reg: 'RJ27-TR-2024', trips: 22, revenue: '₹61,600', utilization: '79%' },
    { name: 'Toyota Innova Crysta', reg: 'RJ20-IC-2023', trips: 24, revenue: '₹60,000', utilization: '75%' },
    { name: 'Maruti Swift', reg: 'RJ14-SW-2024', trips: 31, revenue: '₹27,900', utilization: '91%' },
  ]

  const topCustomers = [
    { name: 'Rahul Sharma', phone: '+91 98290 12345', trips: 8, spend: '₹38,500', kyc: 'Verified' },
    { name: 'Vikram Singh', phone: '+91 94140 56789', trips: 6, spend: '₹29,800', kyc: 'Verified' },
    { name: 'Pooja Jain', phone: '+91 98765 43210', trips: 5, spend: '₹22,400', kyc: 'Verified' },
    { name: 'Ananya Verma', phone: '+91 91234 56789', trips: 4, spend: '₹18,900', kyc: 'Verified' },
  ]

  const handleExportCSV = () => {
    let csvContent = 'Rental ID,Date,Vehicle,Customer,Rental Type,Duration,Total Amount (INR),Payment Status\n'
    csvContent += 'RNT-2026-891024,2026-08-24,Hyundai Creta,Rahul Sharma,Daily,2 Days,5890,Paid\n'
    csvContent += 'RNT-2026-891025,2026-08-23,Maruti Swift,Pooja Jain,Hourly,6 Hours,1200,Paid\n'
    csvContent += 'RNT-2026-891026,2026-08-22,Toyota Innova Crysta,Vikram Singh,Daily,3 Days,12500,Paid\n'
    csvContent += 'RNT-2026-891027,2026-08-20,Toyota Fortuner,Ananya Verma,Daily,4 Days,24000,Paid\n'
    csvContent += 'RNT-2026-891028,2026-08-19,Mahindra Thar ROXX,Suresh Kumar,Daily,2 Days,7200,Paid\n'

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
                Fleet & Financial Analytics Reports
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Analyze vehicle utilization, gross revenues, top customer lifetime values, and export audit reports.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => window.print()}
            variant="outline"
            className="text-xs h-9 rounded-xl font-bold gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" /> Print Summary
          </Button>

          <Button
            onClick={handleExportCSV}
            className="gradient-brand text-white border-0 hover:opacity-90 font-bold gap-1.5 text-xs h-9 shadow-md rounded-xl"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-card border border-border/80 rounded-2xl shadow-sm">
        <div className="space-y-1">
          <span className="text-[10px] uppercase font-bold text-muted-foreground block">
            Report Scope
          </span>
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger className="w-52 h-9 text-xs rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="revenue" className="text-xs">Daily & Monthly Revenue</SelectItem>
              <SelectItem value="utilization" className="text-xs">Fleet Utilization & Efficiency</SelectItem>
              <SelectItem value="most_rented" className="text-xs">Most Rented Vehicles</SelectItem>
              <SelectItem value="customers" className="text-xs">Valuable Customer Rankings</SelectItem>
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
              <SelectItem value="this_month" className="text-xs">This Month (August 2026)</SelectItem>
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
          <div className="text-2xl font-black text-foreground font-mono">₹2,84,500</div>
          <span className="text-[11px] text-emerald-600 font-semibold">↑ +21.4% vs last period</span>
        </div>

        <div className="bg-card border border-border/80 rounded-2xl p-5 space-y-1 shadow-sm">
          <span className="text-xs font-bold text-muted-foreground uppercase">
            Fleet Utilization
          </span>
          <div className="text-2xl font-black text-foreground">82.4%</div>
          <span className="text-[11px] text-emerald-600 font-semibold">High vehicle active time</span>
        </div>

        <div className="bg-card border border-border/80 rounded-2xl p-5 space-y-1 shadow-sm">
          <span className="text-xs font-bold text-muted-foreground uppercase">
            Total Completed Rentals
          </span>
          <div className="text-2xl font-black text-foreground font-mono">114 Trips</div>
          <span className="text-[11px] text-muted-foreground">Avg. 2.4 days duration</span>
        </div>

        <div className="bg-card border border-border/80 rounded-2xl p-5 space-y-1 shadow-sm">
          <span className="text-xs font-bold text-muted-foreground uppercase">
            Output GST Liability (18%)
          </span>
          <div className="text-2xl font-black text-foreground font-mono">₹43,398</div>
          <span className="text-[10px] text-muted-foreground font-mono">CGST: ₹21,699 • SGST: ₹21,699</span>
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
            {mostRentedCars.map(car => (
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
            ))}
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
            {topCustomers.map(cust => (
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
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
