'use client'

import { motion } from 'framer-motion'
import { Shield, Clock, Headphones, IndianRupee, Car, MapPin } from 'lucide-react'

const features = [
  {
    icon: Shield,
    title: 'Fully Insured',
    description: 'All vehicles are comprehensively insured. Drive with complete peace of mind.',
  },
  {
    icon: Clock,
    title: 'Flexible Duration',
    description: 'Book by the hour, day, week, or month. No minimum rental period.',
  },
  {
    icon: Headphones,
    title: '24/7 Support',
    description: 'Our customer support team is available round the clock via phone, chat, and WhatsApp.',
  },
  {
    icon: IndianRupee,
    title: 'Transparent Pricing',
    description: 'No hidden charges. What you see is what you pay. Deposit fully refundable.',
  },
  {
    icon: Car,
    title: 'Premium Fleet',
    description: 'Regularly serviced, clean, and well-maintained vehicles from top brands.',
  },
  {
    icon: MapPin,
    title: 'Multiple Locations',
    description: 'Pick up and drop off at any of our branches across Rajasthan and Gujarat.',
  },
]

export function WhyChooseUs() {
  return (
    <section className="py-16 md:py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">
              Why DriveEase
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-4">
              The Smarter Way to Rent a Car
            </h2>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              DriveEase brings you a premium, hassle-free car rental experience with 
              transparent pricing, top-notch vehicles, and 24/7 customer support. 
              Whether you need a car for a few hours or a few months, we have you covered.
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="bg-primary/10 rounded-xl px-4 py-2 text-sm font-medium text-primary">
                ✓ No hidden fees
              </div>
              <div className="bg-primary/10 rounded-xl px-4 py-2 text-sm font-medium text-primary">
                ✓ Instant confirmation
              </div>
              <div className="bg-primary/10 rounded-xl px-4 py-2 text-sm font-medium text-primary">
                ✓ Free cancellation
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {features.map((feature, i) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.07 }}
                  className="bg-card border border-border rounded-xl p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-sm mb-1">{feature.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
