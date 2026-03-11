import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { Bill } from '@/types'

export function generateBillNumber(): string {
  const now = new Date()
  const date = now.toISOString().slice(0, 10).replace(/-/g, '')
  const time = now.getTime().toString().slice(-6)
  return `BILL-${date}-${time}`
}

interface BillConfig {
  shopName: string; shopAddress: string; shopPhone: string; shopGST: string
  footerMessage: string; showGST: boolean; showAddress: boolean; showPhone: boolean
  showClerk: boolean; showTable: boolean; showItemRate: boolean; showDiscount: boolean
  paperWidth: number; currency: string
}

const DEFAULT_CONFIG: BillConfig = {
  shopName: 'MY SHOP', shopAddress: '', shopPhone: '', shopGST: '',
  footerMessage: 'Thank you! Visit again.',
  showGST: true, showAddress: true, showPhone: true, showClerk: true,
  showTable: false, showItemRate: true, showDiscount: true,
  paperWidth: 80, currency: 'Rs.',
}

export async function fetchBillConfig(): Promise<BillConfig> {
  try {
    const res = await fetch('/api/bill-config')
    if (res.ok) return res.json()
  } catch {}
  return DEFAULT_CONFIG
}

export async function printBillPDF(bill: Bill) {
  const cfg = await fetchBillConfig()
  const width = cfg.paperWidth
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [width, 220] })
  const margin = 5
  const contentWidth = width - margin * 2

  let y = 10

  // Shop name
  doc.setFontSize(14)
  doc.setFont('courier', 'bold')
  doc.text(cfg.shopName, width / 2, y, { align: 'center' })
  y += 6

  doc.setFontSize(8)
  doc.setFont('courier', 'normal')
  if (cfg.showAddress && cfg.shopAddress) { doc.text(cfg.shopAddress, width / 2, y, { align: 'center' }); y += 4 }
  if (cfg.showPhone && cfg.shopPhone) { doc.text(`Ph: ${cfg.shopPhone}`, width / 2, y, { align: 'center' }); y += 4 }
  if (cfg.showGST && cfg.shopGST) { doc.text(`GST: ${cfg.shopGST}`, width / 2, y, { align: 'center' }); y += 4 }

  doc.setLineWidth(0.3)
  doc.line(margin, y + 1, width - margin, y + 1); y += 5

  doc.text(`Bill No : ${bill.billNumber}`, margin, y); y += 4
  doc.text(`Date    : ${new Date(bill.createdAt).toLocaleString('en-IN')}`, margin, y); y += 4
  if (cfg.showClerk) { doc.text(`Clerk   : ${bill.clerkId}`, margin, y); y += 4 }
  if (cfg.showTable && bill.tableNumber) { doc.text(`Table   : ${bill.tableNumber}`, margin, y); y += 4 }

  doc.line(margin, y + 1, width - margin, y + 1); y += 4

  // Items table columns depend on showItemRate
  const head = cfg.showItemRate
    ? [['Item', 'Qty', 'Rate', 'Amt']]
    : [['Item', 'Qty', 'Amt']]

  const tableData = bill.items.map(item =>
    cfg.showItemRate
      ? [item.name, `x${item.quantity}`, `${item.price.toFixed(2)}`, `${item.total.toFixed(2)}`]
      : [item.name, `x${item.quantity}`, `${item.total.toFixed(2)}`]
  )

  const colStyles = cfg.showItemRate
    ? { 0: { cellWidth: contentWidth * 0.45 }, 1: { cellWidth: contentWidth * 0.12, halign: 'center' as const }, 2: { cellWidth: contentWidth * 0.21, halign: 'right' as const }, 3: { cellWidth: contentWidth * 0.22, halign: 'right' as const } }
    : { 0: { cellWidth: contentWidth * 0.6 }, 1: { cellWidth: contentWidth * 0.15, halign: 'center' as const }, 2: { cellWidth: contentWidth * 0.25, halign: 'right' as const } }

  ;(doc as any).autoTable({
    startY: y,
    head,
    body: tableData,
    styles: { fontSize: 7, cellPadding: 1.5, font: 'courier' },
    headStyles: { fillColor: [40, 40, 40], textColor: 255 },
    columnStyles: colStyles,
    margin: { left: margin, right: margin },
    tableWidth: contentWidth,
  })

  const finalY: number = (doc as any).lastAutoTable.finalY + 3
  doc.line(margin, finalY, width - margin, finalY)

  let ty = finalY + 7
  doc.setFontSize(9)
  doc.text(`Subtotal :`, margin, ty)
  doc.text(`${cfg.currency} ${bill.subtotal.toFixed(2)}`, width - margin, ty, { align: 'right' })

  if (cfg.showDiscount && bill.discount > 0) {
    ty += 6
    doc.text(`Discount :`, margin, ty)
    doc.text(`- ${cfg.currency} ${bill.discount.toFixed(2)}`, width - margin, ty, { align: 'right' })
  }

  ty += 4
  doc.setLineWidth(0.5)
  doc.line(margin, ty, width - margin, ty)
  ty += 7

  doc.setFontSize(12)
  doc.setFont('courier', 'bold')
  doc.text(`TOTAL    :`, margin, ty)
  doc.text(`${cfg.currency} ${bill.total.toFixed(2)}`, width - margin, ty, { align: 'right' })

  doc.setFontSize(8)
  doc.setFont('courier', 'normal')
  ty += 6
  doc.text(`Payment  : ${bill.paymentMode}`, margin, ty)

  ty += 4
  doc.line(margin, ty, width - margin, ty)
  ty += 7
  doc.setFontSize(9)
  doc.text(cfg.footerMessage, width / 2, ty, { align: 'center' })

  doc.autoPrint()
  const blob = doc.output('blob')
  window.open(URL.createObjectURL(blob), '_blank')
}
