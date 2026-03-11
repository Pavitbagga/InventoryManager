import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json()
  try {
    const category = await prisma.category.update({
      where: { id: Number(params.id) },
      data: body,
    })
    return NextResponse.json(category)
  } catch {
    return NextResponse.json({ error: 'Name already exists' }, { status: 400 })
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id)
  const productCount = await prisma.product.count({ where: { categoryId: id } })
  if (productCount > 0) {
    return NextResponse.json(
      { error: `Cannot delete: ${productCount} products still in this category` },
      { status: 400 }
    )
  }
  await prisma.category.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
