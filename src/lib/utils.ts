import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getInitials(name?: string | null, fallback = 'AD'): string {
  if (!name || typeof name !== 'string') return fallback
  // Strip emojis, surrogate pairs, and non-letter/number symbols to prevent SSR/hydration mismatch
  const clean = name.replace(/[^\p{L}\p{N}\s]/gu, '').trim()
  if (!clean) return fallback
  const words = clean.split(/\s+/).filter(Boolean)
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase()
  }
  return (words[0][0] + words[words.length - 1][0]).toUpperCase()
}
