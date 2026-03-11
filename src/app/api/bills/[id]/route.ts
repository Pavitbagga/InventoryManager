import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const bill = await prisma.bill.findUnique({
    where: { id: Number(params.id) },
    include: { items: true },
  })
  if (!bill) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(bill)
}
