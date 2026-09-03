'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function CTABanner() {
  return (
    <section className="py-16 md:py-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl hero-gradient p-6 sm:p-10 md:p-16 text-center"
        >
          {/* Background glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />

          <div className="relative">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden shadow-2xl ring-4 ring-white/20 bg-slate-950 flex items-center justify-center mx-auto mb-5 sm:mb-6">
              <Image
                src="/logo.png"
                alt="JSD — Jalore Self Drive Car Rental"
                width={64}
                height={64}
                className="w-full h-full object-cover rounded-full"
              />
            </div>
            <h2 className="text-2xl xs:text-3xl md:text-5xl font-extrabold text-white mb-3 sm:mb-4 leading-tight">
              Ready to Hit the Road?
            </h2>
            <p className="text-white/80 text-sm sm:text-lg mb-6 sm:mb-8 max-w-lg mx-auto">
              Browse 50+ premium vehicles and book instantly. Your next adventure is just a few clicks away.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-xs sm:max-w-none mx-auto">
              <Button
                size="lg"
                asChild
                className="bg-white text-primary hover:bg-white/90 font-bold gap-2 h-11 sm:h-12 rounded-xl"
              >
                <Link href="/cars">
                  Browse Cars <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="border-white/30 text-white hover:bg-white/10 h-11 sm:h-12 rounded-xl font-semibold"
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
