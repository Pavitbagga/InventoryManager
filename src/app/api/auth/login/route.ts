import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { hashPassword, createSession, SESSION_COOKIE, ensureDefaultAdmin } from '@/lib/auth'

export async function POST(request: Request) {
  await ensureDefaultAdmin()
  const { username, password } = await request.json()

  const user = await prisma.adminUser.findUnique({ where: { username } })
  if (!user || user.passwordHash !== hashPassword(password)) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const token = createSession(username)
  const response = NextResponse.json({ ok: true })
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 8 * 60 * 60,
    path: '/',
  })
  return response
}
