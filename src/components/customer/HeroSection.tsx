'use client'

import React from 'react'
import { HeroBookingSection, BranchOption } from '@/components/hero/HeroBookingSection'

interface HeroSectionProps {
  branches: BranchOption[]
}

export function HeroSection({ branches }: HeroSectionProps) {
  return (
    <section className="relative min-h-[85vh] flex items-center justify-center bg-slate-50 border-b border-slate-200 py-8 sm:py-12">
      <div className="w-full max-w-6xl mx-auto px-4">
        <HeroBookingSection branches={branches} />
      </div>
    </section>
  )
}

export { HeroBookingSection }
