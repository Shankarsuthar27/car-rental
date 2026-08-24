'use client'

import { motion } from 'framer-motion'
import { Star, Quote } from 'lucide-react'

const testimonials = [
  {
    name: 'Priya Sharma',
    location: 'Jaipur',
    rating: 5,
    text: 'Booked a Hyundai Creta for our Udaipur trip. The car was immaculate, pickup was smooth, and the pricing was exactly as shown. Highly recommend DriveEase!',
    avatar: 'PS',
  },
  {
    name: 'Rahul Gupta',
    location: 'Ahmedabad',
    rating: 5,
    text: 'Used the monthly rental plan for 3 months for work. Best decision ever — saved so much money compared to Ola/Uber. Customer support is exceptional.',
    avatar: 'RG',
  },
  {
    name: 'Anjali Mehta',
    location: 'Jodhpur',
    rating: 5,
    text: 'The Toyota Fortuner for our family trip was perfect! Well maintained, full tank, and the return process was hassle-free. Security deposit refunded within 2 hours!',
    avatar: 'AM',
  },
  {
    name: 'Vikram Singh',
    location: 'Udaipur',
    rating: 5,
    text: 'Rented the Mahindra Thar for an offroad adventure. The vehicle was in excellent condition and the staff at Udaipur branch was very helpful. Will definitely rent again.',
    avatar: 'VS',
  },
]

export function Testimonials() {
  return (
    <section className="py-16 md:py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">
            Customer Reviews
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mt-2">What Our Customers Say</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-card border border-border rounded-2xl p-5 relative"
            >
              <Quote className="w-8 h-8 text-primary/20 absolute top-4 right-4" />
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full gradient-brand flex items-center justify-center text-white text-sm font-bold shrink-0">
                  {t.avatar}
                </div>
                <div>
                  <p className="font-semibold text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.location}</p>
                </div>
              </div>
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">"{t.text}"</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
