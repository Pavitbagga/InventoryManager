import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const clerk = await prisma.clerk.findUnique({
    where: { id: Number(params.id) },
    select: { id: true, name: true, email: true, phone: true, role: true, active: true, createdAt: true },
  })
  if (!clerk) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(clerk)
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json()
  const data: Record<string, unknown> = {}

  if (body.name !== undefined) data.name = body.name
  if (body.email !== undefined) data.email = body.email || null
  if (body.phone !== undefined) data.phone = body.phone || null
  if (body.role !== undefined) data.role = body.role
  if (body.active !== undefined) data.active = body.active

  // PIN update is only allowed when explicitly provided and valid
  if (body.pin !== undefined) {
    if (body.pin.length < 4) {
      return NextResponse.json({ error: 'PIN must be at least 4 digits' }, { status: 400 })
    }
    data.pin = body.pin
  }

  try {
    const clerk = await prisma.clerk.update({
      where: { id: Number(params.id) },
      data,
      select: { id: true, name: true, email: true, phone: true, role: true, active: true, createdAt: true },
    })
    return NextResponse.json(clerk)
  } catch {
    return NextResponse.json({ error: 'Name already taken' }, { status: 400 })
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  await prisma.clerk.delete({ where: { id: Number(params.id) } })
  return NextResponse.json({ success: true })
}
