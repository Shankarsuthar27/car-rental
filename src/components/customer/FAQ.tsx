'use client'

import { motion } from 'framer-motion'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

const faqs = [
  {
    question: 'What documents do I need to rent a car?',
    answer:
      'You need a valid driving license (at least 1 year old), Aadhaar card or any government-issued photo ID, and a selfie for verification. All document verification is done digitally.',
  },
  {
    question: 'How does the security deposit work?',
    answer:
      'A refundable security deposit is collected at the time of pickup. The deposit amount varies by vehicle type (typically ₹5,000–₹25,000). It is fully refunded within 24–48 hours after vehicle return, after deducting any applicable charges.',
  },
  {
    question: 'What is included in the rental price?',
    answer:
      'The rental price includes the vehicle, basic insurance, and a fixed number of kilometers per day (typically 200 km/day). Fuel, toll charges, and parking are not included. Extra kilometers beyond the included limit are charged at a per-km rate.',
  },
  {
    question: 'Can I extend my rental period?',
    answer:
      'Yes, you can extend your rental through the app, website, or by calling our support team. Extension charges will be calculated at your existing rental rate.',
  },
  {
    question: 'What is your cancellation policy?',
    answer:
      'Free cancellation up to 48 hours before pickup — 100% refund. 24–48 hours before pickup — 75% refund. Less than 24 hours — 50% refund. Refunds are processed within 5–7 business days.',
  },
  {
    question: 'Do you offer one-way rentals?',
    answer:
      'Yes! You can pick up from one branch and return to another. One-way rentals may have an additional fee depending on the route. Available between all our branches in Jaipur, Jodhpur, Udaipur, and Ahmedabad.',
  },
  {
    question: 'What happens if the car breaks down?',
    answer:
      'We provide 24/7 roadside assistance. In case of a breakdown, call our support line and we will arrange a replacement vehicle or technical assistance at no additional cost.',
  },
]

export function FAQ() {
  return (
    <section className="py-16 md:py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">
              FAQ
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mt-2">
              Frequently Asked Questions
            </h2>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Accordion type="single" collapsible className="space-y-3">
              {faqs.map((faq, i) => (
                <AccordionItem
                  key={i}
                  value={`item-${i}`}
                  className="bg-card border border-border rounded-xl px-5 data-[state=open]:border-primary/30"
                >
                  <AccordionTrigger className="text-sm font-medium text-left hover:no-underline py-4">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground pb-4 leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
