'use client'

import React, { useState, useMemo } from 'react'
import type { Customer } from '@/types'
import { cn } from '@/lib/utils'

interface TerminalCustomerListProps {
  customers: Customer[]
  onSelectCustomer?: (customer: Customer) => void
  selectedCustomerId?: string
  onEditCustomer?: (customer: Customer) => void
  onDeleteCustomer?: (customer: Customer) => void
  className?: string
}

export function TerminalCustomerList({
  customers,
  onSelectCustomer,
  selectedCustomerId,
  onEditCustomer,
  onDeleteCustomer,
  className,
}: TerminalCustomerListProps) {
  const [grepFilter, setGrepFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PENDING' | 'REJECTED'>('ALL')
  const [wrapLines, setWrapLines] = useState(false)

  // Filter customers matching grep term or status
  const filteredCustomers = useMemo(() => {
    return customers.filter((cust) => {
      const name = (cust.profile?.full_name || cust.emergency_contact_name || '').toUpperCase()
      const email = (cust.profile?.email || '').toLowerCase()
      const phone = cust.profile?.phone || cust.emergency_contact_phone || ''
      const code = (cust.customer_code || cust.id).toUpperCase()
      const dl = (cust.driving_license_number || '').toUpperCase()
      const city = (cust.city || '').toUpperCase()
      const status = cust.kyc_status?.toUpperCase() || 'UNKNOWN'

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && (cust.kyc_status === 'verified' || cust.profile?.is_active)) ||
        (statusFilter === 'PENDING' && (cust.kyc_status === 'pending' || cust.kyc_status === 're_upload_requested')) ||
        (statusFilter === 'REJECTED' && (cust.kyc_status === 'rejected' || cust.blacklisted))

      const q = grepFilter.toLowerCase().trim()
      const matchesGrep =
        !q ||
        name.toLowerCase().includes(q) ||
        email.includes(q) ||
        phone.includes(q) ||
        code.toLowerCase().includes(q) ||
        dl.toLowerCase().includes(q) ||
        city.toLowerCase().includes(q) ||
        status.toLowerCase().includes(q)

      return matchesStatus && matchesGrep
    })
  }, [customers, grepFilter, statusFilter])

  // Format date and time
  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return { date: '1970-01-01', time: '00:00:00' }
    try {
      const d = new Date(dateStr)
      const date = d.toISOString().slice(0, 10)
      const time = d.toTimeString().slice(0, 8)
      return { date, time }
    } catch {
      return { date: '2026-10-17', time: '00:00:00' }
    }
  }

  // Format status tag to look like HTTP server codes
  const getStatusBadge = (cust: Customer) => {
    if (cust.blacklisted) {
      return { text: '403_BLOCKED', color: 'text-[#ff3333]' }
    }
    switch (cust.kyc_status) {
      case 'verified':
        return { text: '200_ACTIVE', color: 'text-[#00ff66]' }
      case 'pending':
        return { text: '102_PENDING', color: 'text-[#ffcc00]' }
      case 're_upload_requested':
        return { text: '304_REUPLOAD', color: 'text-[#ff9900]' }
      case 'rejected':
        return { text: '400_REJECTED', color: 'text-[#ff3333]' }
      default:
        return cust.profile?.is_active
          ? { text: '200_ACTIVE', color: 'text-[#00ff66]' }
          : { text: '404_INACTIVE', color: 'text-[#888888]' }
    }
  }

  return (
    <div
      className={cn(
        'w-full bg-[#000000] text-[#a0a0a0] font-mono text-[11px] sm:text-[12px] leading-[1.35] select-text',
        'border-0 rounded-none p-0 overflow-hidden',
        className
      )}
      style={{
        fontFamily: "'Fira Code', Consolas, 'Courier New', Courier, monospace",
      }}
    >
      {/* ──────────────────────────────────────────────────────────── */}
      {/* 1. SERVER CONSOLE HEADER BANNER */}
      {/* ──────────────────────────────────────────────────────────── */}
      <div className="bg-[#050505] text-[#888888] px-3 py-2 border-b border-[#222222] flex flex-wrap items-center justify-between gap-2 select-none">
        <div className="flex items-center gap-2">
          <span className="text-[#00ff66] font-bold">●</span>
          <span className="text-[#cccccc] font-bold tracking-tight">
            sys.log.viewer :: /var/log/customers.log
          </span>
          <span className="text-[#555555]">[{filteredCustomers.length}/{customers.length} RECORDS]</span>
        </div>

        <div className="flex items-center gap-2 text-[10px]">
          <button
            type="button"
            onClick={() => setWrapLines((w) => !w)}
            className={cn(
              'px-1.5 py-0.5 border border-[#333333] cursor-pointer',
              wrapLines ? 'bg-[#222222] text-[#00ff66]' : 'text-[#777777] hover:text-[#cccccc]'
            )}
            title="Toggle word wrap"
          >
            [WRAP:{wrapLines ? 'ON' : 'OFF'}]
          </button>
          <span className="text-[#444444]">|</span>
          <span className="text-[#555555]">MODE: RAW_ASCII</span>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 2. REPL COMMAND BAR (GREP & STATUS FILTER) */}
      {/* ──────────────────────────────────────────────────────────── */}
      <div className="bg-[#020202] px-3 py-2 border-b border-[#1a1a1a] flex flex-wrap items-center gap-3">
        {/* Grep command input */}
        <div className="flex items-center gap-1.5 flex-1 min-w-[180px]">
          <span className="text-[#00ff66] font-bold shrink-0">$</span>
          <span className="text-[#777777] shrink-0">grep -i</span>
          <input
            type="text"
            value={grepFilter}
            onChange={(e) => setGrepFilter(e.target.value)}
            placeholder="filter customer_id, name, dl, email..."
            className="bg-transparent border-0 text-[#ffffff] focus:outline-none focus:ring-0 text-[11px] sm:text-[12px] flex-1 min-w-0 placeholder:text-[#444444] font-mono"
          />
          {grepFilter && (
            <button
              type="button"
              onClick={() => setGrepFilter('')}
              className="text-[#ff3333] hover:text-[#ff6666] text-[10px] px-1 font-bold"
            >
              [CLEAR]
            </button>
          )}
        </div>

        {/* Status flags */}
        <div className="flex items-center gap-1 text-[10px] shrink-0">
          <span className="text-[#555555] mr-1">--status:</span>
          {(['ALL', 'ACTIVE', 'PENDING', 'REJECTED'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={cn(
                'px-1.5 py-0.5 transition-colors cursor-pointer',
                statusFilter === st
                  ? 'bg-[#1f1f1f] text-[#00ff66] font-bold border border-[#00ff66]/40'
                  : 'text-[#666666] hover:text-[#aaaaaa] border border-transparent'
              )}
            >
              [{st}]
            </button>
          ))}
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 3. DENSE MONOSPACE TABULAR STREAM */}
      {/* ──────────────────────────────────────────────────────────── */}
      <div className="overflow-x-auto scrollbar-thin scrollbar-track-[#000000] scrollbar-thumb-[#222222]">
        {/* Fixed Width Column Headers */}
        <div
          className={cn(
            'flex items-center text-[#555555] font-bold border-b border-[#1a1a1a] py-1.5 px-2 bg-[#050505] select-none text-[10.5px]',
            wrapLines ? 'min-w-full' : 'min-w-[840px]'
          )}
        >
          <span className="w-10 shrink-0 text-[#444444]">LINE</span>
          <span className="w-6 shrink-0 text-[#444444]">TYP</span>
          <span className="w-24 shrink-0">DATE_ADDED</span>
          <span className="w-20 shrink-0">TIME</span>
          <span className="w-28 shrink-0">CUSTOMER_ID</span>
          <span className="w-32 shrink-0">STATUS</span>
          <span className="w-44 shrink-0">NAME</span>
          <span className="w-32 shrink-0">DL_NUMBER</span>
          <span className="w-24 shrink-0">SPENT</span>
          <span className="flex-1 min-w-[200px]">EMAIL_PATH</span>
        </div>

        {/* Log Entries */}
        <div className={cn('divide-y divide-[#111111]', wrapLines ? 'min-w-full' : 'min-w-[840px]')}>
          {filteredCustomers.length === 0 ? (
            <div className="py-8 px-4 text-center text-[#555555]">
              <div>[EMPTY_STREAM] 0 records match grep filter &quot;{grepFilter}&quot;</div>
              <div className="text-[10px] text-[#333333] mt-1">
                Hint: execute [CLEAR] to reset log viewer filters.
              </div>
            </div>
          ) : (
            filteredCustomers.map((cust, idx) => {
              const { date, time } = formatDateTime(cust.created_at)
              const custId = cust.customer_code || `CUST-${cust.id.slice(0, 6).toUpperCase()}`
              const status = getStatusBadge(cust)
              const name = (cust.profile?.full_name || cust.emergency_contact_name || 'ANONYMOUS').toUpperCase()
              const email = cust.profile?.email || 'customer@driveease.in'
              const emailPath = `/var/users/${email.replace(/[@.]/g, '_')}`
              const dl = cust.driving_license_number || 'RJ19-NONE'
              const spent = `INR_${Number(cust.total_spent || 0).toLocaleString('en-IN')}`
              const isSelected = selectedCustomerId === cust.id
              const lineNo = (idx + 1).toString().padStart(3, '0')

              return (
                <div
                  key={cust.id}
                  onClick={() => onSelectCustomer?.(cust)}
                  className={cn(
                    'flex items-center py-1.5 px-2 transition-colors cursor-pointer group',
                    isSelected
                      ? 'bg-[#112211] text-[#ffffff]'
                      : 'hover:bg-[#0c0c0c] text-[#a0a0a0]'
                  )}
                  title={`Click to inspect or assign customer: ${name}`}
                >
                  {/* Line Number */}
                  <span className="w-10 shrink-0 text-[#444444] group-hover:text-[#666666] font-mono">
                    {lineNo}
                  </span>

                  {/* ASCII Type Indicator */}
                  <span className="w-6 shrink-0 text-[#00ff66] font-bold">
                    [m]
                  </span>

                  {/* DATE_ADDED */}
                  <span className="w-24 shrink-0 text-[#888888] font-mono">
                    {date}
                  </span>

                  {/* TIME */}
                  <span className="w-20 shrink-0 text-[#666666] font-mono">
                    {time}
                  </span>

                  {/* CUSTOMER_ID */}
                  <span className="w-28 shrink-0 text-[#cccccc] font-bold font-mono">
                    {custId}
                  </span>

                  {/* STATUS */}
                  <span className={cn('w-32 shrink-0 font-bold tracking-tight', status.color)}>
                    [{status.text}]
                  </span>

                  {/* NAME */}
                  <span className="w-44 shrink-0 text-[#eeeeee] font-semibold truncate pr-2">
                    {name}
                  </span>

                  {/* DL NUMBER */}
                  <span className="w-32 shrink-0 text-[#888888] font-mono truncate pr-2">
                    {dl}
                  </span>

                  {/* TOTAL SPENT */}
                  <span className="w-24 shrink-0 text-[#ffcc00] font-mono text-[11px]">
                    {spent}
                  </span>

                  {/* EMAIL_PATH */}
                  <span className="flex-1 min-w-[200px] text-[#5555aa] group-hover:text-[#7777cc] font-mono truncate">
                    {emailPath}
                  </span>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 4. CONSOLE FOOTER & LIVE STATS */}
      {/* ──────────────────────────────────────────────────────────── */}
      <div className="bg-[#050505] text-[#555555] px-3 py-2 border-t border-[#1a1a1a] flex flex-wrap items-center justify-between gap-2 text-[10.5px]">
        <div className="flex items-center gap-2">
          <span className="text-[#00ff66] animate-pulse">●</span>
          <span>STREAM_ONLINE</span>
          <span className="text-[#333333]">|</span>
          <span>SHOWING {filteredCustomers.length} OF {customers.length} ENTRIES</span>
        </div>

        <div className="flex items-center gap-3 text-[#444444]">
          <span>[TAB]=NAV</span>
          <span>[ENTER]=SELECT</span>
          <span className="text-[#00ff66] font-bold">
            READY <span className="inline-block w-1.5 h-3 bg-[#00ff66] animate-pulse ml-0.5 align-middle" />
          </span>
        </div>
      </div>
    </div>
  )
}
