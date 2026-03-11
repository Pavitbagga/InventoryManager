import { createHash, randomBytes } from 'crypto'
import { cookies } from 'next/headers'
import { prisma } from './db'

const SESSION_COOKIE = 'pos_session'
const SESSION_SECRET = process.env.SESSION_SECRET || 'pos-secret-change-in-prod'

export function hashPassword(password: string): string {
  return createHash('sha256').update(password + SESSION_SECRET).digest('hex')
}

export function generateToken(): string {
  return randomBytes(32).toString('hex')
}

// Token store in memory (for dev; in prod use Redis/DB)
const activeSessions = new Map<string, { username: string; expires: number }>()

export function createSession(username: string): string {
  const token = generateToken()
  activeSessions.set(token, { username, expires: Date.now() + 8 * 60 * 60 * 1000 })
  return token
}

export function validateSession(token: string): string | null {
  const session = activeSessions.get(token)
  if (!session) return null
  if (Date.now() > session.expires) { activeSessions.delete(token); return null }
  return session.username
}

export function destroySession(token: string): void {
  activeSessions.delete(token)
}

export async function getSessionUser(): Promise<string | null> {
  const cookieStore = cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return null
  return validateSession(token)
}

export async function ensureDefaultAdmin(): Promise<void> {
  const count = await prisma.adminUser.count()
  if (count === 0) {
    await prisma.adminUser.create({
      data: { username: 'admin', passwordHash: hashPassword('admin123') },
    })
  }
}

export { SESSION_COOKIE }
