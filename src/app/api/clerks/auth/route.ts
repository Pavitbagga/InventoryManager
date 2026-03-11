import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: Request) {
  const { clerkId, pin } = await request.json()

  const clerk = await prisma.clerk.findFirst({
    where: { id: Number(clerkId), pin, active: true },
    select: { id: true, name: true, role: true },
  })

  if (!clerk) {
    return NextResponse.json({ error: 'Incorrect PIN' }, { status: 401 })
  }

  return NextResponse.json(clerk)
}
