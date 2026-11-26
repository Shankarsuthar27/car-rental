'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AdminTopbar } from '@/components/admin/AdminTopbar'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import type { Profile } from '@/types'

interface AdminLayoutClientProps {
  children: React.ReactNode
  profile: Profile | null
}

export function AdminLayoutClient({ children, profile }: AdminLayoutClientProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)
  const [sidebarDark, setSidebarDark] = useState(false)

  // Keep right-hand side view in light theme; restore sidebar theme preference
  useEffect(() => {
    document.documentElement.classList.remove('dark')
    try {
      setSidebarDark(localStorage.getItem('jsd_sidebar_theme') === 'dark')
    } catch {
      // Ignore storage access errors
    }
  }, [])

  const toggleSidebarTheme = () => {
    setSidebarDark(prev => {
      const next = !prev
      try {
        localStorage.setItem('jsd_sidebar_theme', next ? 'dark' : 'light')
      } catch {
        // Ignore storage access errors
      }
      return next
    })
  }

  // Track desktop viewport (>= 768px) to safely apply layout offset
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className="flex min-h-dvh h-dvh overflow-hidden bg-background">
      {/* Desktop sidebar - hidden on mobile/tablet */}
      <div className={sidebarDark ? 'hidden md:block dark' : 'hidden md:block'}>
        <AdminSidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(prev => !prev)}
        />
      </div>

      {/* Mobile drawer sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className={
            sidebarDark
              ? 'p-0 w-72 max-w-[85vw] bg-[#060e1d] border-[#122036] dark'
              : 'p-0 w-72 max-w-[85vw] bg-[#F1F4FA] border-slate-200'
          }
        >
          <AdminSidebar
            collapsed={false}
            onToggle={() => setMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Main content wrapper with mobile-first fluid layout */}
      <motion.div
        animate={{
          marginLeft: isDesktop ? (sidebarCollapsed ? 80 : 256) : 0,
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="flex-1 flex flex-col min-w-0 w-full overflow-hidden"
      >
        <AdminTopbar
          onMobileMenuToggle={() => setMobileOpen(true)}
          profile={profile}
          isDark={sidebarDark}
          onToggleTheme={toggleSidebarTheme}
        />

        <main className="flex-1 overflow-y-auto overscroll-contain">
          <div className="w-full min-w-0 animate-in fade-in-50 duration-150">
            {children}
          </div>
        </main>
      </motion.div>
    </div>
  )
}
