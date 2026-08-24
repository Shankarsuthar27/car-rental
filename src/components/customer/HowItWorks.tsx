'use client'

import { motion } from 'framer-motion'
import { Search, CreditCard, Key, RotateCcw } from 'lucide-react'

const steps = [
  {
    step: '01',
    icon: Search,
    title: 'Search & Compare',
    description:
      'Browse our premium fleet, compare prices, and find the perfect vehicle for your trip. Filter by type, fuel, transmission, and more.',
    color: 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
  },
  {
    step: '02',
    icon: CreditCard,
    title: 'Book & Pay',
    description:
      'Secure your booking with just 30% advance payment. Pay online via UPI, card, or net banking. Documents verified digitally.',
    color: 'bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400',
  },
  {
    step: '03',
    icon: Key,
    title: 'Pick Up & Drive',
    description:
      'Visit our branch at your scheduled time. Complete a quick inspection, sign the rental agreement, and you\'re on your way!',
    color: 'bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400',
  },
  {
    step: '04',
    icon: RotateCcw,
    title: 'Return & Done',
    description:
      'Return the vehicle at your chosen time. We\'ll inspect it together, settle any extras, and refund your security deposit promptly.',
    color: 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400',
  },
]

export function HowItWorks() {
  return (
    <section className="py-16 md:py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">
            Simple Process
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mt-2">How It Works</h2>
          <p className="text-muted-foreground mt-2 max-w-md mx-auto">
            Rent a car in 4 easy steps. No hidden charges, no surprises.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, i) => {
            const Icon = step.icon
            return (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative"
              >
                {/* Connector line */}
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-full w-full h-px bg-gradient-to-r from-border to-transparent z-10" />
                )}

                <div className="bg-card border border-border rounded-2xl p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${step.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-3xl font-black text-muted/30">{step.step}</span>
                  </div>
                  <h3 className="font-semibold mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
