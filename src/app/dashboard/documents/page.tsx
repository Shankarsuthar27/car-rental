import type { Metadata } from 'next'
import {
  FileCheck2,
  ShieldCheck,
  Upload,
  AlertCircle,
  Clock,
  CheckCircle,
  FileText
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export const metadata: Metadata = {
  title: 'KYC Documents — DriveEase'
}

export default function CustomerDocumentsPage() {
  const documents = [
    {
      id: 'doc-1',
      title: 'Original Driving License (Front & Back)',
      number: 'RJ14-20220019284',
      status: 'verified',
      uploadedAt: '12 Aug 2026',
      expiryDate: '15 Jan 2038',
      type: 'driving_license'
    },
    {
      id: 'doc-2',
      title: 'Aadhaar / Government Photo ID',
      number: 'XXXX-XXXX-3019',
      status: 'verified',
      uploadedAt: '12 Aug 2026',
      expiryDate: 'Lifetime',
      type: 'aadhaar'
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">KYC & Identity Documents</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Government regulations require digital identity and driving license verification for all self-drive rentals.
        </p>
      </div>

      {/* Verification Status Banner */}
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-6 flex items-start gap-4 text-emerald-800 dark:text-emerald-300">
        <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 flex items-center justify-center shrink-0">
          <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h3 className="font-bold text-sm">KYC Verified & Approved</h3>
          <p className="text-xs mt-0.5 opacity-90">
            Your driving license and identity proofs are verified. You can book and pick up any vehicle without additional in-person verification.
          </p>
        </div>
      </div>

      {/* Documents List */}
      <div className="space-y-4">
        {documents.map(doc => (
          <div
            key={doc.id}
            className="bg-card border border-border rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm">{doc.title}</h3>
                  <Badge className="bg-emerald-500 text-white text-[10px] uppercase font-bold">
                    {doc.status}
                  </Badge>
                </div>
                <p className="text-xs font-mono text-muted-foreground mt-0.5">
                  Doc #: {doc.number}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Uploaded: {doc.uploadedAt} • Valid till: {doc.expiryDate}
                </p>
              </div>
            </div>

            <Button variant="outline" size="sm" className="text-xs h-9">
              Update Document
            </Button>
          </div>
        ))}
      </div>

      {/* Upload Additional Document Card */}
      <div className="bg-card border border-dashed border-border rounded-3xl p-6 md:p-8 text-center space-y-4 shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto text-muted-foreground">
          <Upload className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="font-bold text-sm">Need to add Passport or International Driving Permit?</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Upload PDF, JPG, or PNG files up to 10MB.
          </p>
        </div>
        <Button size="sm" variant="secondary" className="text-xs font-semibold">
          Select & Upload File
        </Button>
      </div>
    </div>
  )
}
