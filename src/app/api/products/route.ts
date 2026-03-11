import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  const products = await prisma.product.findMany({
    include: { category: true },
    orderBy: { id: 'asc' },
  })
  return NextResponse.json(products)
}

export async function POST(request: Request) {
  const body = await request.json()
  const product = await prisma.product.create({
    data: body,
    include: { category: true },
  })
  return NextResponse.json(product, { status: 201 })
}
