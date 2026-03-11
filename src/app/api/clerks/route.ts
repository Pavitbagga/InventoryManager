import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  const clerks = await prisma.clerk.findMany({
    orderBy: { id: 'asc' },
    select: { id: true, name: true, email: true, phone: true, role: true, active: true, createdAt: true },
    // PIN is intentionally excluded from GET list for security
  })
  return NextResponse.json(clerks)
}

export async function POST(request: Request) {
  const body = await request.json()
  if (!body.pin || body.pin.length < 4) {
    return NextResponse.json({ error: 'PIN must be at least 4 digits' }, { status: 400 })
  }
  try {
    const clerk = await prisma.clerk.create({
      data: {
        name: body.name,
        pin: body.pin,
        email: body.email || null,
        phone: body.phone || null,
        role: body.role || 'clerk',
        active: body.active ?? true,
      },
      select: { id: true, name: true, email: true, phone: true, role: true, active: true, createdAt: true },
    })
    return NextResponse.json(clerk, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Clerk name already exists' }, { status: 400 })
  }
}
