import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

async function getOrCreate() {
  const existing = await prisma.billConfig.findFirst()
  if (existing) return existing
  return prisma.billConfig.create({ data: {} })
}

export async function GET() {
  return NextResponse.json(await getOrCreate())
}

export async function PUT(request: Request) {
  const body = await request.json()
  const config = await getOrCreate()
  const updated = await prisma.billConfig.update({ where: { id: config.id }, data: body })
  return NextResponse.json(updated)
}
