'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

const categories = [
  { label: 'SUV', icon: '🚙', query: 'suv', count: '8+ Cars' },
  { label: 'Sedan', icon: '🚗', query: 'sedan', count: '6+ Cars' },
  { label: 'Hatchback', icon: '🚕', query: 'hatchback', count: '5+ Cars' },
  { label: 'MUV / MPV', icon: '🚐', query: 'muv', count: '4+ Cars' },
  { label: 'Luxury', icon: '🏎️', query: 'luxury', count: '3+ Cars' },
  { label: 'Electric', icon: '⚡', query: 'electric', count: '2+ Cars' },
]

export function PopularCategories() {
  return (
    <section className="py-14 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">
            Browse by Type
          </span>
          <h2 className="text-3xl font-bold mt-2">Popular Categories</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
            >
              <Link
                href={`/cars?type=${cat.query}`}
                className="flex flex-col items-center gap-3 p-5 bg-card border border-border rounded-2xl hover:border-primary/50 hover:shadow-md hover:-translate-y-1 transition-all duration-200 group"
              >
                <span className="text-4xl group-hover:scale-110 transition-transform duration-200">
                  {cat.icon}
                </span>
                <div className="text-center">
                  <p className="font-semibold text-sm">{cat.label}</p>
                  <p className="text-xs text-muted-foreground">{cat.count}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
