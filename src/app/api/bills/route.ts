import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { generateBillNumber } from '@/lib/billUtils'
import { CartItem } from '@/types'

export async function GET() {
  const bills = await prisma.bill.findMany({
    include: { items: true },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
  return NextResponse.json(bills)
}

export async function POST(request: Request) {
  const body = await request.json()
  const {
    cart,
    discount = 0,
    paymentMode = 'CASH',
    clerkId = 'CLERK 001',
    tableNumber,
  } = body

  const subtotal: number = cart.reduce((sum: number, item: CartItem) => sum + item.total, 0)
  const total = Math.max(0, subtotal - discount)

  const bill = await prisma.bill.create({
    data: {
      billNumber: generateBillNumber(),
      clerkId,
      tableNumber: tableNumber || null,
      subtotal,
      discount,
      total,
      paymentMode,
      status: 'PAID',
      items: {
        create: cart.map((item: CartItem) => ({
          productId: item.product.id,
          name: item.product.name,
          price: item.product.price,
          quantity: item.quantity,
          total: item.total,
        })),
      },
    },
    include: { items: true },
  })

  return NextResponse.json(bill, { status: 201 })
}
