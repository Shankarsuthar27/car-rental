'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { cn } from '@/lib/utils'

export interface AssignCarButtonProps {
  href?: string
  onClick?: (e: React.MouseEvent<any>) => void
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  loading?: boolean
  prefixText?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  fullWidth?: boolean
  title?: string
  children?: React.ReactNode
}

export function AssignCarButton({
  href,
  onClick,
  type = 'button',
  disabled = false,
  loading = false,
  prefixText,
  size = 'md',
  className,
  fullWidth = false,
  title,
  children,
}: AssignCarButtonProps) {
  // Size specifications
  const sizeConfig = {
    xs: {
      btn: 'h-7 px-3 text-[11px] gap-1.5',
      icon: 'w-4 h-3.5',
      divider: 'h-3 w-[1px] mx-0.5',
    },
    sm: {
      btn: 'h-8 px-3.5 text-xs gap-2',
      icon: 'w-5 h-4',
      divider: 'h-3.5 w-[1px] mx-1',
    },
    md: {
      btn: 'h-10 px-5 text-sm gap-2.5',
      icon: 'w-6 h-5',
      divider: 'h-4 w-[1px] mx-1.5',
    },
    lg: {
      btn: 'h-12 px-6 text-base gap-3',
      icon: 'w-7.5 h-6',
      divider: 'h-5 w-[1.5px] mx-1.5',
    },
    xl: {
      btn: 'h-14 px-8 text-lg gap-3.5',
      icon: 'w-9 h-7',
      divider: 'h-6 w-[2px] mx-2',
    },
  }[size]

  const content = (
    <>
      {/* Car badge graphic with embedded circle arrow */}
      <span className={cn('relative shrink-0 flex items-center justify-center', sizeConfig.icon)}>
        <Image
          src="/assign-car-badge-transparent.png"
          alt="Assign car"
          width={48}
          height={38}
          unoptimized
          className="w-full h-full object-contain filter drop-shadow-xs"
          priority
        />
      </span>

      {/* Thin Vertical Translucent Divider Line */}
      <span className={cn('bg-[#689cdf]/60 shrink-0 rounded-full', sizeConfig.divider)} />

      {/* Stylized Typography matching the image:
          - "Assign": Pure White with the dot on the letter 'i' highlighted in cyan (#48c4fd)
          - "car": Vivid Sky-Blue / Cyan (#48c4fd)
      */}
      {children ? (
        <span className="font-extrabold tracking-tight flex items-baseline select-none whitespace-nowrap text-white">
          {children}
        </span>
      ) : (
        <span className="font-extrabold tracking-tight flex items-baseline select-none whitespace-nowrap">
          {prefixText && <span className="text-white mr-1.5 font-bold">{prefixText}</span>}
          <span className="text-white">Ass</span>
          <span className="relative inline-block text-white">
            {/* Stem of 'i' in white, dot in cyan */}
            <span className="text-white">ı</span>
            <span className="absolute left-1/2 -top-[0.24em] -translate-x-1/2 text-[#48c4fd] text-[1.15em] leading-none pointer-events-none font-bold">
              •
            </span>
          </span>
          <span className="text-white">gn</span>
          <span className="inline-block w-1.5" />
          <span className="text-[#48c4fd] font-black">car</span>
        </span>
      )}

      {loading && (
        <span className="ml-2 inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
      )}
    </>
  )

  const baseClasses = cn(
    'relative inline-flex items-center justify-center rounded-full select-none cursor-pointer font-sans',
    'bg-[#055fe3] hover:bg-[#0453ca] active:scale-[0.98] active:bg-[#0349b3]',
    'text-white shadow-md shadow-[#055fe3]/30 hover:shadow-lg hover:shadow-[#055fe3]/45 transition-all duration-150',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
    fullWidth && 'w-full',
    sizeConfig.btn,
    className
  )

  if (href && !disabled) {
    return (
      <Link href={href} onClick={onClick} className={baseClasses} title={title || 'Assign car'}>
        {content}
      </Link>
    )
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={baseClasses}
      title={title || 'Assign car'}
    >
      {content}
    </button>
  )
}
