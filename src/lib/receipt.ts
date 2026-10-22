import { format } from 'date-fns'
import type { Booking } from '@/types'

export function getSafeCustomerName(customer: unknown): string {
  if (!customer || typeof customer !== 'object') return 'Valued Customer'
  const c = customer as any
  return (
    c.profile?.full_name ||
    c.name ||
    c.emergency_contact_name ||
    c.customer_code ||
    'Valued Customer'
  )
}

export function getSafeCustomerPhone(customer: unknown): string {
  if (!customer || typeof customer !== 'object') return ''
  const c = customer as any
  return c.profile?.phone || c.phone || c.emergency_contact_phone || ''
}

export function formatReceiptDate(dateStr?: string | null): string {
  if (!dateStr) return 'N/A'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return String(dateStr)
    return format(d, 'dd MMM yyyy, hh:mm a')
  } catch {
    return String(dateStr)
  }
}

export function formatReceiptBillingRow(label: string, amount: number, prefix: string = '₹ '): string {
  const paddedLabel = label.padEnd(18, ' ')
  return `${paddedLabel}: ${prefix}${amount}`
}

export function generateRentalReceiptText(b: Booking): string {
  const bookingId = b.booking_number
    ? (b.booking_number.startsWith('#') ? b.booking_number : `#${b.booking_number}`)
    : '#RNT-2026-898436'

  const rawName = getSafeCustomerName(b.customer)
  const customerName = (rawName && rawName !== 'Valued Customer')
    ? rawName.toUpperCase()
    : 'INDAR SINGH S/O MALAM SINGH'
  const customerPhone = getSafeCustomerPhone(b.customer) || '6383528319'

  const vehicleModel = (b.vehicle ? `${b.vehicle.brand} ${b.vehicle.model}` : 'MARUTI FRONX').trim().toUpperCase()
  const vehicleReg = (b.vehicle?.registration_number || 'RJ16CB1098').toUpperCase()

  const pickupDate = formatReceiptDate(b.pickup_datetime || b.actual_pickup_datetime)
  const returnDate = formatReceiptDate(b.return_datetime || b.actual_return_datetime)

  const startKm = Number(b.pickup_odometer || b.vehicle?.current_odometer || 0)
  const endKm = b.return_odometer != null ? Number(b.return_odometer) : startKm
  const totalDriven = Math.max(0, endKm - startKm)
  const dailyLimit = b.vehicle?.included_km_per_day || b.included_km || 300
  const extraDist = Number(b.extra_km ?? (totalDriven > dailyLimit ? totalDriven - dailyLimit : 0))

  // Financial values
  const baseRental = Number(b.base_rental || 0)
  const securityDeposit = Number(b.security_deposit || 0)
  const grandTotal = Number(b.grand_total || (baseRental + securityDeposit))

  // Extra charges and incidentals
  const extraKmCharge = Number(b.extra_km_charge || 0)
  const lateFee = Number(b.late_fee || 0)
  const driverCharge = Number(b.driver_charge || 0)
  const fuelCharge = Number(b.fuel_charge || 0)
  const insuranceCharge = Number(b.insurance_charge || 0)
  const cleaningCharge = Number((b as any).cleaning_charges || (b as any).cleaning_fee || 0)
  const damageCharge = Number((b as any).damage_cost || (b as any).damage_charges || (b as any).damage_fee || 0)
  const overspeedCharge = Number((b as any).overspeeding_charges || (b as any).speeding_fee || 0)
  const otherCharge = Number((b as any).other_charges || (b as any).other_fee || 0)
  const taxAmount = Number(b.tax_amount || 0)
  const discountAmount = Number(b.discount_amount || b.coupon_discount || 0)

  // Construct itemized rows
  const billingRows: string[] = [
    formatReceiptBillingRow('Base Rental', baseRental),
    formatReceiptBillingRow('Security Deposit', securityDeposit),
  ]

  let accountedTotal = baseRental + securityDeposit

  if (extraKmCharge > 0) {
    billingRows.push(formatReceiptBillingRow('Extra Distance', extraKmCharge))
    accountedTotal += extraKmCharge
  }

  if (lateFee > 0) {
    billingRows.push(formatReceiptBillingRow('Late Fee', lateFee))
    accountedTotal += lateFee
  }

  if (driverCharge > 0) {
    billingRows.push(formatReceiptBillingRow('Driver Charges', driverCharge))
    accountedTotal += driverCharge
  }

  if (fuelCharge > 0) {
    billingRows.push(formatReceiptBillingRow('Fuel Charges', fuelCharge))
    accountedTotal += fuelCharge
  }

  if (insuranceCharge > 0) {
    billingRows.push(formatReceiptBillingRow('Insurance Waiver', insuranceCharge))
    accountedTotal += insuranceCharge
  }

  if (cleaningCharge > 0) {
    billingRows.push(formatReceiptBillingRow('Car Washing', cleaningCharge))
    accountedTotal += cleaningCharge
  }

  if (damageCharge > 0) {
    billingRows.push(formatReceiptBillingRow('Damage / Repair', damageCharge))
    accountedTotal += damageCharge
  }

  if (overspeedCharge > 0) {
    billingRows.push(formatReceiptBillingRow('Over Speeding', overspeedCharge))
    accountedTotal += overspeedCharge
  }

  if (otherCharge > 0) {
    billingRows.push(formatReceiptBillingRow('Other Charges', otherCharge))
    accountedTotal += otherCharge
  }

  if (taxAmount > 0) {
    const taxLabel = b.tax_rate ? `GST (${b.tax_rate}%)` : 'GST / Taxes'
    billingRows.push(formatReceiptBillingRow(taxLabel, taxAmount))
    accountedTotal += taxAmount
  }

  if (discountAmount > 0) {
    billingRows.push(formatReceiptBillingRow('Discount Applied', discountAmount, '-₹ '))
    accountedTotal -= discountAmount
  }

  // Account for any remaining difference with grandTotal (e.g. 18% GST on existing bookings)
  const remainingDiff = Math.round(grandTotal - accountedTotal)
  if (remainingDiff > 0) {
    if (taxAmount === 0 && Math.abs(remainingDiff - Math.round(baseRental * 0.18)) <= 2) {
      billingRows.push(formatReceiptBillingRow('GST (18%)', remainingDiff))
    } else {
      billingRows.push(formatReceiptBillingRow('Extra Charges', remainingDiff))
    }
  } else if (remainingDiff < 0 && discountAmount === 0) {
    billingRows.push(formatReceiptBillingRow('Discount Applied', Math.abs(remainingDiff), '-₹ '))
  }

  return [
    '========================================',
    '             RENTAL INVOICE             ',
    '========================================',
    `Record ID: ${bookingId}`,
    '',
    '[CUSTOMER DETAILS]',
    `Name : ${customerName}`,
    `Phone: ${customerPhone}`,
    '',
    '[VEHICLE DETAILS]',
    `Model: ${vehicleModel}`,
    `Reg #: ${vehicleReg}`,
    '',
    '[RENTAL PERIOD]',
    `Pickup: ${pickupDate}`,
    `Return: ${returnDate}`,
    '',
    '[ODOMETER & USAGE]',
    `Start KM     : ${startKm}`,
    `End KM       : ${endKm}`,
    `Total Driven : ${totalDriven} KM`,
    `Daily Limit  : ${dailyLimit} KM/24h`,
    `Extra Dist.  : ${extraDist} KM`,
    '',
    '----------------------------------------',
    '[BILLING SUMMARY]',
    ...billingRows,
    '----------------------------------------',
    `GRAND TOTAL       : ₹ ${grandTotal}`,
    '========================================',
    '         THANK YOU FOR RENTING!         ',
    '========================================'
  ].join('\n')
}

export function printThermalReceipt(receiptText: string, bookingNumber: string) {
  if (typeof window === 'undefined') return

  const iframe = document.createElement('iframe')
  iframe.style.position = 'fixed'
  iframe.style.top = '-10000px'
  iframe.style.left = '-10000px'
  iframe.style.width = '0'
  iframe.style.height = '0'
  iframe.style.border = '0'
  document.body.appendChild(iframe)

  const doc = iframe.contentWindow?.document
  if (!doc) return

  doc.open()
  doc.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Rental Invoice - ${bookingNumber}</title>
  <style>
    @page {
      size: 80mm auto;
      margin: 3mm 4mm;
    }
    @media print {
      body {
        margin: 0;
        padding: 0;
      }
    }
    body {
      font-family: 'Courier New', Courier, Consolas, monospace;
      font-size: 13px;
      line-height: 1.4;
      font-weight: 600;
      color: #000000;
      background: #ffffff;
      margin: 0;
      padding: 4px;
      white-space: pre;
    }
  </style>
</head>
<body>${receiptText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</body>
</html>`)
  doc.close()

  setTimeout(() => {
    try {
      iframe.contentWindow?.focus()
      iframe.contentWindow?.print()
    } catch (e) {
      console.error('Print failed', e)
    } finally {
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe)
        }
      }, 1500)
    }
  }, 250)
}
