import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json()
  const product = await prisma.product.update({
    where: { id: Number(params.id) },
    data: body,
    include: { category: true },
  })
  return NextResponse.json(product)
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  await prisma.product.delete({ where: { id: Number(params.id) } })
  return NextResponse.json({ success: true })
}
