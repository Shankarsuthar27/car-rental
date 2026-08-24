import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { Tag, Plus, CheckCircle2, Clock, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Discount Coupons & Promotions — DriveEase Admin'
}

async function getCouponsData() {
  const supabase = createAdminClient()
  const { data } = await supabase.from('coupons').select('*').order('created_at', { ascending: false })
  return data || []
}

export default async function AdminCouponsPage() {
  const coupons = await getCouponsData()

  // Demo fallback
  const displayCoupons = coupons.length > 0 ? coupons : [
    {
      id: 'c-1',
      code: 'WELCOME20',
      description: '20% off on your first rental reservation',
      discount_type: 'percentage',
      discount_value: 20,
      min_rental_amount: 500,
      max_discount: 2000,
      times_used: 142,
      usage_limit: 1000,
      is_active: true
    },
    {
      id: 'c-2',
      code: 'FLAT500',
      description: 'Flat ₹500 discount on rentals above ₹2000',
      discount_type: 'fixed',
      discount_value: 500,
      min_rental_amount: 2000,
      times_used: 89,
      usage_limit: 500,
      is_active: true
    },
    {
      id: 'c-3',
      code: 'WEEKEND30',
      description: '30% off on weekend SUV rentals',
      discount_type: 'percentage',
      discount_value: 30,
      min_rental_amount: 1000,
      max_discount: 3000,
      times_used: 64,
      usage_limit: 200,
      is_active: true
    }
  ]

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Coupons & Promotional Offers ({displayCoupons.length})
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Create percentage or fixed discount coupon codes with minimum order limits and per-customer usage restrictions.
          </p>
        </div>

        <Button className="gradient-brand text-white border-0 hover:opacity-90 font-bold gap-2 text-xs h-10 shadow-md">
          <Plus className="w-4 h-4" /> Create New Coupon
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {displayCoupons.map((c: any) => (
          <div
            key={c.id}
            className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4 hover:shadow-md transition-shadow relative overflow-hidden"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="font-mono text-base font-extrabold bg-primary/10 text-primary px-2.5 py-1 rounded-lg inline-block">
                  {c.code}
                </span>
                <p className="text-xs text-muted-foreground mt-1">{c.description}</p>
              </div>
              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">
                Active
              </Badge>
            </div>

            <div className="p-3 bg-muted/40 rounded-2xl text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Discount</span>
                <span className="font-bold text-foreground">
                  {c.discount_type === 'percentage' ? `${c.discount_value}% OFF` : `Flat ₹${c.discount_value} OFF`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Min. Order</span>
                <span>₹{c.min_rental_amount}</span>
              </div>
              {c.max_discount && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Max Discount</span>
                  <span>₹{c.max_discount}</span>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center text-xs text-muted-foreground pt-1">
              <span>Used: {c.times_used} / {c.usage_limit || '∞'} times</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
