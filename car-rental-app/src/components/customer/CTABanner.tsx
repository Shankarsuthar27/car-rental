'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Car } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function CTABanner() {
  return (
    <section className="py-16 md:py-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl hero-gradient p-10 md:p-16 text-center"
        >
          {/* Background glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />

          <div className="relative">
            <div className="w-14 h-14 rounded-2xl gradient-brand flex items-center justify-center mx-auto mb-6">
              <Car className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">
              Ready to Hit the Road?
            </h2>
            <p className="text-white/70 text-lg mb-8 max-w-lg mx-auto">
              Browse 50+ premium vehicles and book instantly. Your next adventure is just a few clicks away.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Button
                size="lg"
                asChild
                className="bg-white text-primary hover:bg-white/90 font-semibold gap-2"
              >
                <Link href="/cars">
                  Browse Cars <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="border-white/30 text-white hover:bg-white/10"
              >
                <a href="tel:+911412345678">Call Us Now</a>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
