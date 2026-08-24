'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Tag, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const offers = [
  {
    code: 'WELCOME20',
    title: '20% Off First Rental',
    description: 'New customers get 20% off on their first booking. Valid for all vehicles.',
    discount: '20% OFF',
    expiry: 'Valid till 31 Dec 2026',
    color: 'from-indigo-500 to-purple-600',
  },
  {
    code: 'WEEKEND30',
    title: '30% Weekend Discount',
    description: 'Book any SUV or luxury vehicle for the weekend and save 30%.',
    discount: '30% OFF',
    expiry: 'Fri–Sun bookings only',
    color: 'from-orange-500 to-rose-600',
  },
  {
    code: 'FLAT500',
    title: '₹500 Flat Off',
    description: 'Instant flat discount of ₹500 on rentals above ₹2,000.',
    discount: '₹500 OFF',
    expiry: 'No expiry',
    color: 'from-teal-500 to-green-600',
  },
]

export function SpecialOffers() {
  return (
    <section className="py-16 md:py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">
            Special Deals
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mt-2">Current Offers</h2>
          <p className="text-muted-foreground mt-2">
            Save more on every ride with our exclusive discount codes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto">
          {offers.map((offer, i) => (
            <motion.div
              key={offer.code}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative overflow-hidden rounded-2xl"
            >
              <div className={`bg-gradient-to-br ${offer.color} p-5 text-white h-full`}>
                <div className="flex items-center justify-between mb-4">
                  <Tag className="w-6 h-6 text-white/80" />
                  <Badge className="bg-white/20 text-white border-0 text-sm font-bold">
                    {offer.discount}
                  </Badge>
                </div>
                <h3 className="font-bold text-lg mb-1">{offer.title}</h3>
                <p className="text-sm text-white/80 mb-4">{offer.description}</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-white/60">{offer.expiry}</p>
                    <div className="mt-1 flex items-center gap-1">
                      <code className="text-sm font-mono font-bold bg-white/20 px-2 py-0.5 rounded">
                        {offer.code}
                      </code>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-8">
          <Button variant="outline" size="sm" asChild>
            <Link href="/cars" className="gap-1">
              Start Saving Now <ArrowRight className="w-3 h-3" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
