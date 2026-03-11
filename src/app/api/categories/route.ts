import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  const categories = await prisma.category.findMany({
    include: { products: { orderBy: { id: 'asc' } } },
    orderBy: { position: 'asc' },
  })
  return NextResponse.json(categories)
}

export async function POST(request: Request) {
  const body = await request.json()
  const category = await prisma.category.create({ data: body })
  return NextResponse.json(category, { status: 201 })
}
