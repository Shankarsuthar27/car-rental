'use client'

import React, { useState, useRef, useCallback } from 'react'
import {
  UploadCloud,
  Image as ImageIcon,
  Link as LinkIcon,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ExternalLink,
  RefreshCw,
  FileImage,
  Layers
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export const VEHICLE_IMAGE_PRESETS = [
  {
    label: 'Luxury Sedan',
    url: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=800&q=80',
    category: 'Sedan'
  },
  {
    label: 'White SUV',
    url: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80',
    category: 'SUV'
  },
  {
    label: 'Black SUV',
    url: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80',
    category: 'SUV'
  },
  {
    label: 'Red Sedan',
    url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80',
    category: 'Sedan'
  },
  {
    label: 'Off-Road 4x4',
    url: 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&w=800&q=80',
    category: '4x4'
  },
  {
    label: 'Electric EV',
    url: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&w=800&q=80',
    category: 'EV'
  }
]

interface VehicleImageUploaderProps {
  imageUrl: string
  onChange: (url: string) => void
  label?: string
  className?: string
}

export function VehicleImageUploader({
  imageUrl,
  onChange,
  label = 'Vehicle Photo',
  className
}: VehicleImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploadMode, setUploadMode] = useState<'upload' | 'url'>('upload')
  const [imageError, setImageError] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [fileSize, setFileSize] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Process File
  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (PNG, JPG, WEBP, AVIF).')
      return
    }

    // Size limit: 10MB
    if (file.size > 10 * 1024 * 1024) {
      alert('Image size exceeds 10MB limit. Please upload a smaller image.')
      return
    }

    setFileName(file.name)
    const formattedSize = file.size > 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.round(file.size / 1024)} KB`
    setFileSize(formattedSize)
    setImageError(false)

    const reader = new FileReader()
    reader.onload = (e) => {
      if (typeof e.target?.result === 'string') {
        onChange(e.target.result)
      }
    }
    reader.readAsDataURL(file)
  }, [onChange])

  // Drag & Drop Handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      handleFile(files[0])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFile(files[0])
    }
  }

  const handleClearImage = () => {
    onChange('')
    setFileName(null)
    setFileSize(null)
    setImageError(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Header and Mode Toggle */}
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
          <ImageIcon className="w-3.5 h-3.5 text-primary" /> {label}
        </Label>
        <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-lg border border-border/60 text-[11px]">
          <button
            type="button"
            onClick={() => setUploadMode('upload')}
            className={cn(
              'px-2 py-0.5 rounded-md font-medium transition-all flex items-center gap-1',
              uploadMode === 'upload'
                ? 'bg-card text-foreground shadow-xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <UploadCloud className="w-3 h-3" /> Drag & Drop
          </button>
          <button
            type="button"
            onClick={() => setUploadMode('url')}
            className={cn(
              'px-2 py-0.5 rounded-md font-medium transition-all flex items-center gap-1',
              uploadMode === 'url'
                ? 'bg-card text-foreground shadow-xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <LinkIcon className="w-3 h-3" /> Image URL
          </button>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp,image/avif"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* 1. If Image is Present -> Show Rich Live Preview with Replace/Clear */}
      {imageUrl ? (
        <div className="relative rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xs transition-all">
          <div className="relative h-44 w-full bg-muted/40 overflow-hidden flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt="Vehicle preview"
              onError={() => setImageError(true)}
              onLoad={() => setImageError(false)}
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            />

            {/* Gradient Overlay for info */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />

            {/* Status Badges */}
            <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
              {!imageError ? (
                <Badge className="bg-emerald-500/90 backdrop-blur-md text-white text-[10px] font-bold border-0 flex items-center gap-1 px-2 py-0.5 shadow-sm">
                  <CheckCircle2 className="w-3 h-3" /> Live Preview
                </Badge>
              ) : (
                <Badge className="bg-rose-500/90 backdrop-blur-md text-white text-[10px] font-bold border-0 flex items-center gap-1 px-2 py-0.5 shadow-sm">
                  <AlertCircle className="w-3 h-3" /> Image Load Error
                </Badge>
              )}
              {fileSize && (
                <Badge variant="outline" className="bg-black/50 backdrop-blur-md text-white text-[10px] font-mono border-white/20">
                  {fileSize}
                </Badge>
              )}
            </div>

            {/* Action Buttons Overlay */}
            <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
                className="h-7 text-[11px] px-2.5 rounded-lg bg-card/90 hover:bg-card text-foreground font-semibold shadow-md gap-1 backdrop-blur-md border border-white/10"
              >
                <RefreshCw className="w-3 h-3" /> Replace Photo
              </Button>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                onClick={handleClearImage}
                className="h-7 text-[11px] px-2 rounded-lg bg-rose-600/90 hover:bg-rose-600 text-white font-semibold shadow-md gap-1 backdrop-blur-md"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>

            {/* File Name info */}
            {fileName && (
              <div className="absolute bottom-2.5 left-2.5 text-white text-[11px] font-medium flex items-center gap-1.5 max-w-[200px] truncate drop-shadow-md">
                <FileImage className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="truncate">{fileName}</span>
              </div>
            )}
          </div>

          {/* Quick Change URL Accordion */}
          <div className="p-2.5 bg-muted/20 border-t border-border/60 flex items-center gap-2">
            <Input
              value={imageUrl.startsWith('data:') ? 'Uploaded local image file' : imageUrl}
              readOnly={imageUrl.startsWith('data:')}
              onChange={(e) => {
                setImageError(false)
                onChange(e.target.value)
              }}
              placeholder="Paste image web link (https://...)"
              className="h-7 text-xs rounded-lg flex-1 bg-background font-mono text-muted-foreground"
            />
            {!imageUrl.startsWith('data:') && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => window.open(imageUrl, '_blank')}
                className="h-7 text-[11px] px-2 text-muted-foreground hover:text-foreground"
                title="Open image in new tab"
              >
                <ExternalLink className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      ) : uploadMode === 'upload' ? (
        /* 2. Drag & Drop Upload Zone */
        <div
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'group relative rounded-2xl border-2 border-dashed p-6 text-center transition-all duration-200 cursor-pointer flex flex-col items-center justify-center gap-2.5 select-none',
            isDragging
              ? 'border-primary bg-primary/10 ring-4 ring-primary/20 scale-[0.99]'
              : 'border-border/80 hover:border-primary/60 bg-muted/20 hover:bg-muted/40'
          )}
        >
          <div className={cn(
            'w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 shadow-inner',
            isDragging
              ? 'bg-primary text-white scale-110'
              : 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white'
          )}>
            <UploadCloud className="w-6 h-6 animate-pulse" />
          </div>

          <div className="space-y-1">
            <p className="text-xs font-bold text-foreground">
              {isDragging ? 'Drop your car photo here!' : 'Drag & drop vehicle photo here'}
            </p>
            <p className="text-[11px] text-muted-foreground">
              or <span className="text-primary font-semibold underline underline-offset-2">browse from your computer</span>
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium pt-1">
            <span className="px-2 py-0.5 rounded-full bg-muted border border-border">PNG, JPG, WEBP, AVIF</span>
            <span>•</span>
            <span>Up to 10MB</span>
          </div>
        </div>
      ) : (
        /* 3. Image URL Input Zone */
        <div className="space-y-2 p-3 rounded-2xl border border-border/80 bg-muted/20">
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground font-medium">Direct Image URL Link</Label>
            <div className="flex gap-2">
              <Input
                placeholder="https://images.unsplash.com/photo-..."
                value={imageUrl}
                onChange={(e) => {
                  setImageError(false)
                  onChange(e.target.value)
                }}
                className="h-9 text-xs rounded-xl flex-1 bg-background"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="h-9 text-xs rounded-xl gap-1 shrink-0 font-semibold"
              >
                <UploadCloud className="w-3.5 h-3.5" /> Upload File
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Presets Carousel */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-muted-foreground font-medium flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" /> Quick Stock Car Photos:
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {VEHICLE_IMAGE_PRESETS.map((preset) => {
            const isSelected = imageUrl === preset.url
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  setImageError(false)
                  setFileName(null)
                  setFileSize(null)
                  onChange(preset.url)
                }}
                className={cn(
                  'text-[11px] px-2.5 py-1 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 select-none',
                  isSelected
                    ? 'gradient-brand text-white border-primary font-bold shadow-xs'
                    : 'bg-card text-muted-foreground hover:text-foreground hover:bg-muted border-border/80'
                )}
              >
                <span className="text-[10px] opacity-75">{preset.category}:</span>
                <span>{preset.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
