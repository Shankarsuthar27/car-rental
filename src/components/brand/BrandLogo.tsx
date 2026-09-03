'use client'

import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export interface BrandLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  showText?: boolean
  textVariant?: 'full' | 'compact' | 'title-only'
  href?: string
  className?: string
  textClassName?: string
  subtextClassName?: string
  priority?: boolean
}

const sizeMap = {
  xs: {
    badge: 'w-7 h-7',
    px: 28,
    title: 'text-sm font-black',
    subtitle: 'text-[9px] font-bold',
  },
  sm: {
    badge: 'w-8 h-8',
    px: 32,
    title: 'text-base font-black',
    subtitle: 'text-[10px] font-bold',
  },
  md: {
    badge: 'w-10 h-10',
    px: 40,
    title: 'text-lg font-black',
    subtitle: 'text-[10px] font-extrabold',
  },
  lg: {
    badge: 'w-12 h-12',
    px: 48,
    title: 'text-xl font-black',
    subtitle: 'text-xs font-extrabold',
  },
  xl: {
    badge: 'w-16 h-16 sm:w-20 sm:h-20',
    px: 80,
    title: 'text-2xl sm:text-3xl font-black',
    subtitle: 'text-xs sm:text-sm font-extrabold',
  },
}

export function BrandLogo({
  size = 'md',
  showText = true,
  textVariant = 'full',
  href,
  className,
  textClassName,
  subtextClassName,
  priority = false,
}: BrandLogoProps) {
  const config = sizeMap[size] || sizeMap.md

  const content = (
    <div className={cn('inline-flex items-center gap-2.5 select-none', className)}>
      {/* Circular Logo Badge */}
      <div
        className={cn(
          'relative rounded-full overflow-hidden shrink-0 shadow-md ring-2 ring-primary/20 bg-slate-950 flex items-center justify-center transition-transform hover:scale-105',
          config.badge
        )}
      >
        <Image
          src="/logo.png"
          alt="JSD — Jalore Self Drive Car Rental"
          width={config.px}
          height={config.px}
          priority={priority}
          className="w-full h-full object-cover rounded-full"
        />
      </div>

      {/* Typography */}
      {showText && (
        <div className="flex flex-col leading-none text-left">
          <span
            className={cn(
              'tracking-tight font-black transition-colors',
              config.title,
              textClassName || 'text-foreground'
            )}
          >
            JSD
          </span>
          {textVariant === 'full' && (
            <span
              className={cn(
                'tracking-wider uppercase text-primary transition-colors mt-0.5',
                config.subtitle,
                subtextClassName
              )}
            >
              Jalore Self Drive Car Rental
            </span>
          )}
          {textVariant === 'compact' && (
            <span
              className={cn(
                'tracking-wider uppercase text-muted-foreground transition-colors mt-0.5 text-[9px] font-semibold',
                subtextClassName
              )}
            >
              Self Drive
            </span>
          )}
        </div>
      )}
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center group">
        {content}
      </Link>
    )
  }

  return content
}

export default BrandLogo
