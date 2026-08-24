'use client'

import Link from 'next/link'
import { Gauge, Phone, Mail, MapPin, Globe, Share2, MessageCircle } from 'lucide-react'
import { Separator } from '@/components/ui/separator'

export function Footer() {
  return (
    <footer className="bg-sidebar text-sidebar-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center">
                <Gauge className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg text-white">DriveEase</span>
            </div>
            <p className="text-sm text-sidebar-foreground/60 leading-relaxed mb-4">
              Premium self-drive car rental across Rajasthan and Gujarat. 
              Drive your way, every day.
            </p>
            <div className="flex gap-3">
              {[
                { icon: Globe, href: '#' },
                { icon: Share2, href: '#' },
                { icon: MessageCircle, href: '#' },
              ].map(({ icon: Icon, href }, idx) => (
                <a
                  key={idx}
                  href={href}
                  className="w-8 h-8 rounded-lg bg-sidebar-accent flex items-center justify-center text-sidebar-foreground/60 hover:text-white transition-colors"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-white mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {[
                { label: 'Browse Cars', href: '/cars' },
                { label: 'Assign Car', href: '/admin/assign' },
                { label: 'Fleet Console', href: '/admin/dashboard' },
                { label: 'Fleet Inventory', href: '/admin/vehicles' },
                { label: 'Special Offers', href: '/#offers' },
              ].map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-sidebar-foreground/60 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Locations */}
          <div>
            <h4 className="font-semibold text-white mb-4">Our Branches</h4>
            <ul className="space-y-2">
              {['Jaipur', 'Jodhpur', 'Udaipur', 'Ahmedabad'].map((city) => (
                <li key={city}>
                  <span className="text-sm text-sidebar-foreground/60 flex items-center gap-1.5">
                    <MapPin className="w-3 h-3" /> {city}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-white mb-4">Contact Us</h4>
            <ul className="space-y-3">
              <li>
                <a
                  href="tel:+911412345678"
                  className="text-sm text-sidebar-foreground/60 hover:text-white transition-colors flex items-center gap-2"
                >
                  <Phone className="w-4 h-4 shrink-0" />
                  +91-141-2345678
                </a>
              </li>
              <li>
                <a
                  href="mailto:support@driveease.in"
                  className="text-sm text-sidebar-foreground/60 hover:text-white transition-colors flex items-center gap-2"
                >
                  <Mail className="w-4 h-4 shrink-0" />
                  support@driveease.in
                </a>
              </li>
              <li>
                <span className="text-sm text-sidebar-foreground/60 flex items-start gap-2">
                  <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                  C-Scheme, Ashok Marg, Jaipur, Rajasthan 302001
                </span>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="bg-sidebar-border mb-6" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-sidebar-foreground/40">
          <p>© 2026 DriveEase. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-white transition-colors">
              Terms of Service
            </Link>
            <Link href="/refund" className="hover:text-white transition-colors">
              Refund Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
