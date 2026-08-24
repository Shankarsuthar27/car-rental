'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowRight, Car } from 'lucide-react'

interface TopVehicle {
  id: string
  count: number
  vehicle: {
    brand: string
    model: string
    registration_number: string
    images?: Array<{ url: string; is_primary: boolean }>
  } | null
}

interface MostRentedVehiclesProps {
  vehicles: TopVehicle[]
}

export function MostRentedVehicles({ vehicles }: MostRentedVehiclesProps) {
  const maxCount = Math.max(...vehicles.map((v) => v.count), 1)

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Most Rented</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/reports" className="gap-1 text-xs">
              Reports <ArrowRight className="w-3 h-3" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {vehicles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-muted-foreground gap-2">
            <Car className="w-8 h-8" />
            <p className="text-sm">No rental data yet</p>
          </div>
        ) : (
          vehicles.map((item, i) => {
            const primaryImage = item.vehicle?.images?.find((img) => img.is_primary)
            const barWidth = (item.count / maxCount) * 100

            return (
              <div key={item.id} className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-bold text-muted-foreground w-4 shrink-0">
                      {i + 1}
                    </span>
                    {primaryImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={primaryImage.url}
                        alt=""
                        className="w-8 h-6 object-cover rounded shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-6 bg-muted rounded shrink-0 flex items-center justify-center">
                        <Car className="w-3 h-3 text-muted-foreground" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">
                        {item.vehicle?.brand} {item.vehicle?.model}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {item.vehicle?.registration_number}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold shrink-0">{item.count}x</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full gradient-brand transition-all duration-500"
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
