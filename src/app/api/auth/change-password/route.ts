import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { hashPassword, getSessionUser } from '@/lib/auth'

export async function POST(request: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { currentPassword, newPassword } = await request.json()
  const admin = await prisma.adminUser.findUnique({ where: { username: user } })
  if (!admin || admin.passwordHash !== hashPassword(currentPassword)) {
    return NextResponse.json({ error: 'Current password incorrect' }, { status: 400 })
  }
  if (!newPassword || newPassword.length < 4) {
    return NextResponse.json({ error: 'New password too short' }, { status: 400 })
  }

  await prisma.adminUser.update({
    where: { username: user },
    data: { passwordHash: hashPassword(newPassword) },
  })
  return NextResponse.json({ ok: true })
}
