'use client'

import React, { useState, useRef, useEffect, useMemo } from 'react'
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DateRangePickerProps {
  value: string
  onChange: (value: string, range?: { start: Date; end: Date }) => void
  className?: string
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
]

const DAYS_OF_WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

function parseDateTimeString(str: string): { start: Date; end: Date } {
  // Expected format: DD/MM/YYYY hh:mmA - DD/MM/YYYY hh:mmA
  const parts = str.split(' - ')
  const defaultStart = new Date(2026, 9, 22, 0, 0, 0) // 22 Oct 2026 12:00 AM
  const defaultEnd = new Date(2026, 9, 22, 23, 59, 0)  // 22 Oct 2026 11:59 PM

  if (parts.length !== 2) {
    return { start: defaultStart, end: defaultEnd }
  }

  function parsePart(p: string, isEnd = false): Date {
    const match = p.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})\s*(AM|PM)?$/i)
    if (!match) return isEnd ? defaultEnd : defaultStart
    const [, d, m, y, h, min, ampm] = match
    let hour = parseInt(h, 10)
    if (ampm) {
      if (ampm.toUpperCase() === 'PM' && hour < 12) hour += 12
      if (ampm.toUpperCase() === 'AM' && hour === 12) hour = 0
    }
    return new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10), hour, parseInt(min, 10))
  }

  return {
    start: parsePart(parts[0], false),
    end: parsePart(parts[1], true)
  }
}

function formatSingleDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  let hours = date.getHours()
  const ampm = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12
  hours = hours ? hours : 12
  const strHours = String(hours).padStart(2, '0')
  const strMinutes = String(date.getMinutes()).padStart(2, '0')
  return `${day}/${month}/${year} ${strHours}:${strMinutes}${ampm}`
}

function formatRange(start: Date, end: Date): string {
  return `${formatSingleDate(start)} - ${formatSingleDate(end)}`
}

function getTimeComponents(date: Date) {
  let hours = date.getHours()
  const ampm = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12
  hours = hours ? hours : 12
  return {
    hour: String(hours).padStart(2, '0'),
    minute: String(date.getMinutes()).padStart(2, '0'),
    ampm
  }
}

interface CalendarCell {
  date: Date
  dayNumber: number
  isCurrentMonth: boolean
}

function generateCalendarDays(year: number, month: number): CalendarCell[] {
  const cells: CalendarCell[] = []
  const firstDayOfWeek = new Date(year, month, 1).getDay() // 0 = Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const prevMonthDays = new Date(year, month, 0).getDate()

  // Previous month trailing days
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const day = prevMonthDays - i
    cells.push({
      date: new Date(year, month - 1, day),
      dayNumber: day,
      isCurrentMonth: false
    })
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({
      date: new Date(year, month, d),
      dayNumber: d,
      isCurrentMonth: true
    })
  }

  // Next month leading days to complete 42 cells (6 rows)
  const remaining = 42 - cells.length
  for (let d = 1; d <= remaining; d++) {
    cells.push({
      date: new Date(year, month + 1, d),
      dayNumber: d,
      isCurrentMonth: false
    })
  }

  return cells
}

export function DateRangePickerWithTime({
  value,
  onChange,
  className
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Initialize dates from prop value
  const initialDates = useMemo(() => parseDateTimeString(value), [value])
  const [tempStart, setTempStart] = useState<Date>(initialDates.start)
  const [tempEnd, setTempEnd] = useState<Date>(initialDates.end)
  const [activeInput, setActiveInput] = useState<'start' | 'end'>('start')

  // Calendar month views (Left calendar: month/year; Right calendar: month+1/year)
  const [leftMonth, setLeftMonth] = useState<number>(initialDates.start.getMonth())
  const [leftYear, setLeftYear] = useState<number>(initialDates.start.getFullYear())

  // Sync internal state when external value changes while closed
  useEffect(() => {
    if (!isOpen) {
      const parsed = parseDateTimeString(value)
      setTempStart(parsed.start)
      setTempEnd(parsed.end)
      setLeftMonth(parsed.start.getMonth())
      setLeftYear(parsed.start.getFullYear())
    }
  }, [value, isOpen])

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Calculated right calendar month and year
  const rightMonth = (leftMonth + 1) % 12
  const rightYear = leftMonth === 11 ? leftYear + 1 : leftYear

  const prevMonth = () => {
    if (leftMonth === 0) {
      setLeftMonth(11)
      setLeftYear(leftYear - 1)
    } else {
      setLeftMonth(leftMonth - 1)
    }
  }

  const nextMonth = () => {
    if (leftMonth === 11) {
      setLeftMonth(0)
      setLeftYear(leftYear + 1)
    } else {
      setLeftMonth(leftMonth + 1)
    }
  }

  // Handle clicking a calendar cell
  const handleDayClick = (clickedDate: Date) => {
    if (activeInput === 'start') {
      const newStart = new Date(clickedDate)
      newStart.setHours(tempStart.getHours(), tempStart.getMinutes(), 0, 0)
      setTempStart(newStart)

      // If new start is after end, push end to same day 23:59
      if (newStart > tempEnd) {
        const newEnd = new Date(clickedDate)
        newEnd.setHours(23, 59, 0, 0)
        setTempEnd(newEnd)
      }
      setActiveInput('end')
    } else {
      const newEnd = new Date(clickedDate)
      newEnd.setHours(tempEnd.getHours(), tempEnd.getMinutes(), 0, 0)

      if (newEnd < tempStart) {
        // Swap or set as start
        const swappedStart = new Date(clickedDate)
        swappedStart.setHours(tempStart.getHours(), tempStart.getMinutes(), 0, 0)
        setTempStart(swappedStart)
        setActiveInput('end')
      } else {
        setTempEnd(newEnd)
        setActiveInput('start')
      }
    }
  }

  // Time picker change handlers
  const updateStartTime = (hourStr: string, minuteStr: string, ampm: string) => {
    let hour = parseInt(hourStr, 10)
    if (ampm === 'PM' && hour < 12) hour += 12
    if (ampm === 'AM' && hour === 12) hour = 0
    const minute = parseInt(minuteStr, 10)
    const newStart = new Date(tempStart)
    newStart.setHours(hour, minute, 0, 0)
    setTempStart(newStart)
  }

  const updateEndTime = (hourStr: string, minuteStr: string, ampm: string) => {
    let hour = parseInt(hourStr, 10)
    if (ampm === 'PM' && hour < 12) hour += 12
    if (ampm === 'AM' && hour === 12) hour = 0
    const minute = parseInt(minuteStr, 10)
    const newEnd = new Date(tempEnd)
    newEnd.setHours(hour, minute, 0, 0)
    setTempEnd(newEnd)
  }

  const handleApply = () => {
    const formatted = formatRange(tempStart, tempEnd)
    onChange(formatted, { start: tempStart, end: tempEnd })
    setIsOpen(false)
  }

  const handleCancel = () => {
    const parsed = parseDateTimeString(value)
    setTempStart(parsed.start)
    setTempEnd(parsed.end)
    setIsOpen(false)
  }

  // Time components
  const startTime = getTimeComponents(tempStart)
  const endTime = getTimeComponents(tempEnd)

  const hoursList = ['12', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11']
  const minutesList = ['00', '15', '30', '45', '59'] // standard presets, plus include any custom minute
  if (!minutesList.includes(startTime.minute)) minutesList.push(startTime.minute)
  if (!minutesList.includes(endTime.minute)) minutesList.push(endTime.minute)
  minutesList.sort((a, b) => parseInt(a, 10) - parseInt(b, 10))

  const leftDays = useMemo(() => generateCalendarDays(leftYear, leftMonth), [leftYear, leftMonth])
  const rightDays = useMemo(() => generateCalendarDays(rightYear, rightMonth), [rightYear, rightMonth])

  // Helper to test if a date is selected start, selected end, or between
  const isStartDay = (d: Date) =>
    d.getFullYear() === tempStart.getFullYear() &&
    d.getMonth() === tempStart.getMonth() &&
    d.getDate() === tempStart.getDate()

  const isEndDay = (d: Date) =>
    d.getFullYear() === tempEnd.getFullYear() &&
    d.getMonth() === tempEnd.getMonth() &&
    d.getDate() === tempEnd.getDate()

  const isBetween = (d: Date) => {
    const currentMs = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
    const startMs = new Date(tempStart.getFullYear(), tempStart.getMonth(), tempStart.getDate()).getTime()
    const endMs = new Date(tempEnd.getFullYear(), tempEnd.getMonth(), tempEnd.getDate()).getTime()
    return currentMs > startMs && currentMs < endMs
  }

  return (
    <div className={cn("relative inline-block text-left", className)} ref={dropdownRef}>
      {/* TRIGGER INPUT BAR (MATCHES REFERENCE IMAGE) */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center cursor-pointer select-none bg-white dark:bg-card border rounded-[3px] shadow-2xs transition-all h-[34px]",
          isOpen
            ? "border-[#00c0ef] ring-1 ring-[#00c0ef]"
            : "border-slate-300 dark:border-border hover:border-slate-400"
        )}
      >
        <div className="flex items-center justify-center px-2.5 h-full border-r border-slate-200 dark:border-border text-slate-500 dark:text-slate-400 bg-[#f9f9f9] dark:bg-muted/30">
          <CalendarIcon className="w-4 h-4 text-slate-600 dark:text-slate-300" />
        </div>
        <div className="px-3 text-xs font-semibold text-slate-800 dark:text-slate-100 whitespace-nowrap min-w-[270px]">
          {value || formatRange(tempStart, tempEnd)}
        </div>
      </div>

      {/* DROPDOWN POPOVER (MATCHES BOOTSTRAP DATERANGEPICKER REFERENCE IMAGE) */}
      {isOpen && (
        <div className="absolute left-0 top-[calc(100%+4px)] z-50 bg-white dark:bg-card border border-slate-300 dark:border-border rounded-[4px] shadow-2xl p-3.5 sm:p-4 w-[630px] max-w-[95vw] select-none text-slate-800 dark:text-slate-100 animate-in fade-in-50 zoom-in-95 duration-100">
          {/* 1. TOP ROW: Start Input, End Input, Apply & Cancel Buttons */}
          <div className="flex items-center justify-between gap-3 pb-2.5">
            <div className="flex items-center gap-3 flex-1">
              {/* Start Date Input */}
              <div
                onClick={() => setActiveInput('start')}
                className={cn(
                  "flex items-center gap-2 flex-1 px-2.5 py-1.5 text-xs rounded-[4px] border cursor-pointer transition-all bg-white dark:bg-card",
                  activeInput === 'start'
                    ? "border-[#00c0ef] ring-1 ring-[#00c0ef]"
                    : "border-slate-300 dark:border-border hover:border-slate-400"
                )}
              >
                <CalendarIcon className="w-4 h-4 text-slate-600 dark:text-slate-300 shrink-0" />
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {formatSingleDate(tempStart)}
                </span>
              </div>

              {/* End Date Input */}
              <div
                onClick={() => setActiveInput('end')}
                className={cn(
                  "flex items-center gap-2 flex-1 px-2.5 py-1.5 text-xs rounded-[4px] border cursor-pointer transition-all bg-white dark:bg-card",
                  activeInput === 'end'
                    ? "border-[#00c0ef] ring-1 ring-[#00c0ef]"
                    : "border-slate-300 dark:border-border hover:border-slate-400"
                )}
              >
                <CalendarIcon className="w-4 h-4 text-slate-600 dark:text-slate-300 shrink-0" />
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {formatSingleDate(tempEnd)}
                </span>
              </div>
            </div>

            {/* Apply & Cancel */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleApply}
                className="px-4 py-1.5 text-xs font-bold text-white bg-[#00a65a] hover:bg-[#008d4c] rounded-[3px] shadow-xs cursor-pointer transition-colors"
              >
                Apply
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-3.5 py-1.5 text-xs font-normal text-slate-700 dark:text-slate-200 bg-[#f4f4f4] hover:bg-slate-200 dark:bg-muted border border-slate-300 dark:border-border rounded-[3px] cursor-pointer transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>

          {/* 2. TIME CONTROLS ROW */}
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-border/60">
            {/* Start Time Selectors */}
            <div className="flex items-center gap-1.5 flex-1 pl-1">
              <Clock className="w-4 h-4 text-slate-600 dark:text-slate-400 mr-1 shrink-0" />
              <select
                value={startTime.hour}
                onChange={(e) => updateStartTime(e.target.value, startTime.minute, startTime.ampm)}
                className="h-7 px-1 text-xs border border-slate-300 dark:border-border rounded-[3px] bg-white dark:bg-card text-slate-800 dark:text-slate-100 outline-none cursor-pointer"
              >
                {hoursList.map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
              <span className="text-slate-600 dark:text-slate-400 font-bold">:</span>
              <select
                value={startTime.minute}
                onChange={(e) => updateStartTime(startTime.hour, e.target.value, startTime.ampm)}
                className="h-7 px-1 text-xs border border-slate-300 dark:border-border rounded-[3px] bg-white dark:bg-card text-slate-800 dark:text-slate-100 outline-none cursor-pointer"
              >
                {minutesList.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <select
                value={startTime.ampm}
                onChange={(e) => updateStartTime(startTime.hour, startTime.minute, e.target.value)}
                className="h-7 px-1.5 text-xs border border-slate-300 dark:border-border rounded-[3px] bg-white dark:bg-card text-slate-800 dark:text-slate-100 outline-none cursor-pointer ml-1"
              >
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
            </div>

            {/* End Time Selectors */}
            <div className="flex items-center gap-1.5 flex-1 pl-1">
              <Clock className="w-4 h-4 text-slate-600 dark:text-slate-400 mr-1 shrink-0" />
              <select
                value={endTime.hour}
                onChange={(e) => updateEndTime(e.target.value, endTime.minute, endTime.ampm)}
                className="h-7 px-1 text-xs border border-slate-300 dark:border-border rounded-[3px] bg-white dark:bg-card text-slate-800 dark:text-slate-100 outline-none cursor-pointer"
              >
                {hoursList.map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
              <span className="text-slate-600 dark:text-slate-400 font-bold">:</span>
              <select
                value={endTime.minute}
                onChange={(e) => updateEndTime(endTime.hour, e.target.value, endTime.ampm)}
                className="h-7 px-1 text-xs border border-slate-300 dark:border-border rounded-[3px] bg-white dark:bg-card text-slate-800 dark:text-slate-100 outline-none cursor-pointer"
              >
                {minutesList.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <select
                value={endTime.ampm}
                onChange={(e) => updateEndTime(endTime.hour, endTime.minute, e.target.value)}
                className="h-7 px-1.5 text-xs border border-slate-300 dark:border-border rounded-[3px] bg-white dark:bg-card text-slate-800 dark:text-slate-100 outline-none cursor-pointer ml-1"
              >
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
            </div>

            {/* Placeholder alignment spacer */}
            <div className="w-[125px] shrink-0" />
          </div>

          {/* 3. DUAL CALENDARS SECTION */}
          <div className="grid grid-cols-2 gap-6 pt-3">
            {/* LEFT CALENDAR */}
            <div className="space-y-2">
              {/* Header with Left Arrow */}
              <div className="flex items-center justify-between px-1 h-7">
                <button
                  type="button"
                  onClick={prevMonth}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-muted rounded text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4 font-bold" />
                </button>
                <span className="font-bold text-xs text-slate-900 dark:text-white">
                  {MONTH_NAMES[leftMonth]} {leftYear}
                </span>
                <div className="w-6" /> {/* spacer to balance */}
              </div>

              {/* Day Labels */}
              <div className="grid grid-cols-7 text-center">
                {DAYS_OF_WEEK.map((d) => (
                  <span key={d} className="text-[11px] font-bold text-slate-700 dark:text-slate-300 py-1">
                    {d}
                  </span>
                ))}
              </div>

              {/* Days Grid (6 rows of 7 = 42 cells) */}
              <div className="grid grid-cols-7 gap-y-0.5 text-center text-xs">
                {leftDays.map((cell, idx) => {
                  const isStart = isStartDay(cell.date)
                  const isEnd = isEndDay(cell.date)
                  const inBetween = isBetween(cell.date)
                  const isSelected = isStart || isEnd

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleDayClick(cell.date)}
                      className={cn(
                        "h-7 w-full flex items-center justify-center text-xs transition-colors rounded-[3px] font-medium cursor-pointer",
                        !cell.isCurrentMonth && "text-slate-400 dark:text-slate-500",
                        cell.isCurrentMonth && !isSelected && !inBetween && "text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-muted",
                        isSelected && "bg-[#337ab7] text-white font-bold hover:bg-[#286090]",
                        inBetween && "bg-[#ebf4f8] text-[#333] dark:bg-sky-950/40 dark:text-sky-200 rounded-none"
                      )}
                    >
                      {cell.dayNumber}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* RIGHT CALENDAR */}
            <div className="space-y-2">
              {/* Header with Right Arrow */}
              <div className="flex items-center justify-between px-1 h-7">
                <div className="w-6" /> {/* spacer to balance */}
                <span className="font-bold text-xs text-slate-900 dark:text-white">
                  {MONTH_NAMES[rightMonth]} {rightYear}
                </span>
                <button
                  type="button"
                  onClick={nextMonth}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-muted rounded text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4 font-bold" />
                </button>
              </div>

              {/* Day Labels */}
              <div className="grid grid-cols-7 text-center">
                {DAYS_OF_WEEK.map((d) => (
                  <span key={d} className="text-[11px] font-bold text-slate-700 dark:text-slate-300 py-1">
                    {d}
                  </span>
                ))}
              </div>

              {/* Days Grid (6 rows of 7 = 42 cells) */}
              <div className="grid grid-cols-7 gap-y-0.5 text-center text-xs">
                {rightDays.map((cell, idx) => {
                  const isStart = isStartDay(cell.date)
                  const isEnd = isEndDay(cell.date)
                  const inBetween = isBetween(cell.date)
                  const isSelected = isStart || isEnd

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleDayClick(cell.date)}
                      className={cn(
                        "h-7 w-full flex items-center justify-center text-xs transition-colors rounded-[3px] font-medium cursor-pointer",
                        !cell.isCurrentMonth && "text-slate-400 dark:text-slate-500",
                        cell.isCurrentMonth && !isSelected && !inBetween && "text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-muted",
                        isSelected && "bg-[#337ab7] text-white font-bold hover:bg-[#286090]",
                        inBetween && "bg-[#ebf4f8] text-[#333] dark:bg-sky-950/40 dark:text-sky-200 rounded-none"
                      )}
                    >
                      {cell.dayNumber}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
