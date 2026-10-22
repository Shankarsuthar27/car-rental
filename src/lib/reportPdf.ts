import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export interface ReportRecord {
  id: string
  date: string
  vehicle: string
  customer: string
  rentalType: string
  duration: string
  totalAmount: number
  paymentStatus: string
  billType?: string
  outlet?: string
}

export function generateReportPDF(records: ReportRecord[], dateRange?: string) {
  if (typeof window === 'undefined') return

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  })

  const totalAmount = records.reduce((sum, r) => sum + (Number(r.totalAmount) || 0), 0)
  const gstAmount = Math.round(totalAmount * 0.18)

  // Document Header Banner
  doc.setFillColor(15, 23, 42) // Dark Navy slate-900
  doc.rect(0, 0, 297, 24, 'F')

  // Accent Line
  doc.setFillColor(0, 192, 239) // #00c0ef Cyan
  doc.rect(0, 24, 297, 1.5, 'F')

  // Company Name & Report Title
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('DRIVEEASE CAR RENTAL', 14, 10)

  doc.setFontSize(8.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(148, 163, 184) // slate-400
  doc.text('Fleet Operations & Financial Audit Statement', 14, 16)

  // Right Header Meta
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text('FLEET RENTAL REPORT', 283, 10, { align: 'right' })

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(226, 232, 240)
  const nowStr = new Date().toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
  doc.text(`Generated: ${nowStr}`, 283, 16, { align: 'right' })

  // Summary Information Cards
  doc.setTextColor(30, 41, 59)
  doc.setFontSize(8.5)
  doc.setFont('helvetica', 'bold')
  doc.text('REPORT PARAMETERS & FINANCIAL AUDIT SUMMARY', 14, 31)

  // Card 1: Scope / Date Range
  doc.setFillColor(248, 250, 252)
  doc.setDrawColor(226, 232, 240)
  doc.roundedRect(14, 34, 62, 16, 2, 2, 'FD')
  doc.setFontSize(7)
  doc.setTextColor(100, 116, 139)
  doc.text('DATE RANGE / SCOPE', 17, 39)
  doc.setFontSize(8)
  doc.setTextColor(15, 23, 42)
  doc.setFont('helvetica', 'bold')
  const rangeDisplay = (dateRange && dateRange.length > 32) ? `${dateRange.slice(0, 30)}...` : (dateRange || 'All Records')
  doc.text(rangeDisplay, 17, 46)

  // Card 2: Total Records
  doc.roundedRect(82, 34, 62, 16, 2, 2, 'FD')
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 116, 139)
  doc.text('TOTAL RENTALS', 85, 39)
  doc.setFontSize(10)
  doc.setTextColor(15, 23, 42)
  doc.setFont('helvetica', 'bold')
  doc.text(`${records.length} Trips Recorded`, 85, 46)

  // Card 3: Total Revenue
  doc.roundedRect(150, 34, 62, 16, 2, 2, 'FD')
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 116, 139)
  doc.text('GROSS RENTAL REVENUE', 153, 39)
  doc.setFontSize(10)
  doc.setTextColor(16, 185, 129) // emerald-600
  doc.setFont('helvetica', 'bold')
  doc.text(`INR ${totalAmount.toLocaleString('en-IN')}`, 153, 46)

  // Card 4: Estimated GST
  doc.roundedRect(218, 34, 65, 16, 2, 2, 'FD')
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 116, 139)
  doc.text('OUTPUT GST LIABILITY (18%)', 221, 39)
  doc.setFontSize(10)
  doc.setTextColor(15, 23, 42)
  doc.setFont('helvetica', 'bold')
  doc.text(`INR ${gstAmount.toLocaleString('en-IN')}`, 221, 46)

  // Prepare table data
  const tableHead = [[
    '#',
    'Rental ID',
    'Date',
    'Vehicle',
    'Customer',
    'Rental Type',
    'Duration',
    'Total Amount',
    'Payment Status'
  ]]

  const tableBody = records.map((r, i) => [
    String(i + 1),
    r.id,
    r.date,
    r.vehicle,
    r.customer,
    r.rentalType,
    r.duration,
    `INR ${Number(r.totalAmount || 0).toLocaleString('en-IN')}`,
    r.paymentStatus
  ])

  // Table foot row
  const tableFoot = [[
    '',
    'TOTAL SUMMARY',
    '',
    '',
    '',
    '',
    `${records.length} Trips`,
    `INR ${totalAmount.toLocaleString('en-IN')}`,
    'All Audited'
  ]]

  autoTable(doc, {
    head: tableHead,
    body: tableBody,
    foot: tableFoot,
    startY: 54,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'left',
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'left',
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
      textColor: [30, 41, 59],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 32, fontStyle: 'bold' },
      2: { cellWidth: 24 },
      3: { cellWidth: 62 },
      4: { cellWidth: 42 },
      5: { cellWidth: 28 },
      6: { cellWidth: 20 },
      7: { cellWidth: 32, halign: 'right', fontStyle: 'bold' },
      8: { cellWidth: 26, halign: 'center' },
    },
    didDrawPage: (data) => {
      const pageCount = (doc as any).internal.getNumberOfPages()
      doc.setFontSize(7)
      doc.setTextColor(148, 163, 184)
      doc.text(
        'DriveEase Car Rental System Generated Audit Report • Confidential',
        14,
        202
      )
      doc.text(
        `Page ${data.pageNumber} of ${pageCount}`,
        283,
        202,
        { align: 'right' }
      )
    }
  })

  // Download the PDF
  const filename = `Fleet_Rental_Report_${new Date().toISOString().slice(0, 10)}.pdf`
  doc.save(filename)
}

export function printReportSection(records: ReportRecord[], dateRange?: string) {
  if (typeof window === 'undefined') return

  const totalAmount = records.reduce((sum, r) => sum + (Number(r.totalAmount) || 0), 0)
  const gstAmount = Math.round(totalAmount * 0.18)
  const nowStr = new Date().toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })

  const rowsHtml = records
    .map(
      (r, i) => `
    <tr class="${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}">
      <td class="text-center font-mono">${i + 1}</td>
      <td class="font-bold font-mono text-slate-900">${r.id}</td>
      <td>${r.date}</td>
      <td class="font-medium text-slate-800">${r.vehicle}</td>
      <td>${r.customer}</td>
      <td>${r.rentalType}</td>
      <td>${r.duration}</td>
      <td class="text-right font-mono font-bold text-slate-900">₹${Number(r.totalAmount || 0).toLocaleString('en-IN')}</td>
      <td class="text-center">
        <span class="status-badge ${r.paymentStatus === 'Paid' ? 'status-paid' : 'status-pending'}">
          ${r.paymentStatus}
        </span>
      </td>
    </tr>
  `
    )
    .join('')

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
  <title>Fleet_Rental_Report_ALL_RECORDS</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 10mm 12mm;
    }
    @media print {
      body {
        margin: 0;
        padding: 0;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      table {
        page-break-inside: auto;
      }
      tr {
        page-break-inside: avoid;
        page-break-after: auto;
      }
      thead {
        display: table-header-group;
      }
      tfoot {
        display: table-footer-group;
      }
    }
    * {
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 12px;
      font-size: 11px;
      line-height: 1.4;
    }
    .header-bar {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #00c0ef;
      padding-bottom: 10px;
      margin-bottom: 12px;
    }
    .brand-title {
      font-size: 18px;
      font-weight: 900;
      letter-spacing: -0.5px;
      color: #0f172a;
      margin: 0;
    }
    .brand-sub {
      font-size: 10px;
      color: #64748b;
      margin-top: 2px;
    }
    .meta-right {
      text-align: right;
    }
    .report-badge {
      display: inline-block;
      background: #0f172a;
      color: #ffffff;
      font-size: 10px;
      font-weight: bold;
      padding: 3px 8px;
      border-radius: 4px;
      margin-bottom: 4px;
    }
    .meta-text {
      font-size: 9px;
      color: #64748b;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-bottom: 14px;
    }
    .summary-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 8px 10px;
    }
    .card-label {
      font-size: 9px;
      font-weight: bold;
      color: #64748b;
      text-transform: uppercase;
    }
    .card-value {
      font-size: 14px;
      font-weight: 900;
      color: #0f172a;
      margin-top: 3px;
    }
    .card-value-green {
      color: #059669;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10.5px;
    }
    th {
      background: #0f172a;
      color: #ffffff;
      font-weight: bold;
      text-align: left;
      padding: 7px 8px;
      border: 1px solid #0f172a;
      white-space: nowrap;
    }
    td {
      padding: 6px 8px;
      border: 1px solid #e2e8f0;
    }
    .bg-white { background: #ffffff; }
    .bg-gray-50 { background: #f8fafc; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
    .font-bold { font-weight: 700; }
    .font-medium { font-weight: 500; }
    .status-badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 9px;
      font-weight: bold;
      border: 1px solid transparent;
    }
    .status-paid {
      background: #ecfdf5;
      color: #065f46;
      border-color: #a7f3d0;
    }
    .status-pending {
      background: #fffbeb;
      color: #92400e;
      border-color: #fde68a;
    }
    tfoot td {
      background: #f1f5f9;
      font-weight: 800;
      color: #0f172a;
      border-top: 2px solid #cbd5e1;
      padding: 8px;
    }
    .footer-note {
      margin-top: 14px;
      display: flex;
      justify-content: space-between;
      color: #94a3b8;
      font-size: 9px;
      border-top: 1px solid #e2e8f0;
      padding-top: 6px;
    }
  </style>
</head>
<body>
  <div class="header-bar">
    <div>
      <h1 class="brand-title">DRIVEEASE CAR RENTAL</h1>
      <div class="brand-sub">Fleet Operations &amp; Financial Audit Statement</div>
    </div>
    <div class="meta-right">
      <div class="report-badge">FLEET RENTAL REPORT</div>
      <div class="meta-text">Generated: ${nowStr}</div>
    </div>
  </div>

  <div class="summary-grid">
    <div class="summary-card">
      <div class="card-label">Date Range / Scope</div>
      <div class="card-value" style="font-size: 11px;">${dateRange || 'All Time Records'}</div>
    </div>
    <div class="summary-card">
      <div class="card-label">Total Rentals</div>
      <div class="card-value">${records.length} Trips</div>
    </div>
    <div class="summary-card">
      <div class="card-label">Gross Revenue</div>
      <div class="card-value card-value-green">₹${totalAmount.toLocaleString('en-IN')}</div>
    </div>
    <div class="summary-card">
      <div class="card-label">Output GST (18%)</div>
      <div class="card-value">₹${gstAmount.toLocaleString('en-IN')}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 28px; text-align: center;">#</th>
        <th>Rental ID</th>
        <th>Date</th>
        <th>Vehicle</th>
        <th>Customer</th>
        <th>Rental Type</th>
        <th>Duration</th>
        <th style="text-align: right;">Total Amount</th>
        <th style="text-align: center;">Payment Status</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
    <tfoot>
      <tr>
        <td colspan="6" style="text-align: right;">REPORT TOTAL SUMMARY:</td>
        <td>${records.length} Trips</td>
        <td style="text-align: right; font-family: monospace; font-size: 12px; color: #0f172a;">₹${totalAmount.toLocaleString('en-IN')}</td>
        <td style="text-align: center;">All Audited</td>
      </tr>
    </tfoot>
  </table>

  <div class="footer-note">
    <span>DriveEase Car Rental Operations • Official System Audit Report</span>
    <span>Total Records Printed: ${records.length}</span>
  </div>
</body>
</html>`)
  doc.close()

  setTimeout(() => {
    try {
      iframe.contentWindow?.focus()
      iframe.contentWindow?.print()
    } catch (e) {
      console.error('Print report failed:', e)
    } finally {
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe)
        }
      }, 1500)
    }
  }, 250)
}
