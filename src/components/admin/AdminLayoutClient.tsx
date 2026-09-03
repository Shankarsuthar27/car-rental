'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AdminTopbar } from '@/components/admin/AdminTopbar'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import type { Profile } from '@/types'

interface AdminLayoutClientProps {
  children: React.ReactNode
  profile: Profile | null
}

export function AdminLayoutClient({ children, profile }: AdminLayoutClientProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <AdminSidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Mobile sidebar drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-64 bg-sidebar border-sidebar-border">
          <AdminSidebar
            collapsed={false}
            onToggle={() => setMobileOpen(false)}
            onNavClick={() => setMobileOpen(false)}
            isMobileDrawer
          />
        </SheetContent>
      </Sheet>

      {/* Main content: Full width & 0 margin on mobile; offset only on md+ */}
      <div
        className={cn(
          'flex-1 flex flex-col min-w-0 overflow-hidden w-full transition-[margin,width] duration-300 ease-in-out',
          sidebarCollapsed
            ? 'md:ml-[68px] md:w-[calc(100%-68px)]'
            : 'md:ml-[256px] md:w-[calc(100%-256px)]'
        )}
      >
        <AdminTopbar
          onMobileMenuToggle={() => setMobileOpen(true)}
          profile={profile}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={typeof window !== 'undefined' ? window.location.pathname : 'page'}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="h-full max-w-7xl mx-auto"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
