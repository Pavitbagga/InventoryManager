'use client'
import { useEffect, useRef, useState } from 'react'

interface Clerk { id: number; name: string; role: string; active?: boolean }

interface ClerkListItem { id: number; name: string; role: string; active?: boolean }

interface Props {
  onLogin: (clerk: Clerk) => void
  isSwitch?: boolean
  onCancel?: () => void
}

export default function ClerkLogin({ onLogin, isSwitch = false, onCancel }: Props) {
  const [clerks, setClerks] = useState<ClerkListItem[]>([])
  const [selected, setSelected] = useState<ClerkListItem | null>(null)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const loginRef = useRef<() => void>(() => {})

  useEffect(() => {
    fetch('/api/clerks')
      .then(r => r.json())
      .then((data: Clerk[]) => setClerks(data.filter(c => c.active)))
  }, [])

  const handleNumKey = (key: string) => {
    if (code.length < 10) setCode(p => p + key)
  }

  const handleBackspace = () => setCode(p => p.slice(0, -1))

  const handleLogin = async () => {
    if (!selected || !code) return
    setLoading(true)
    setError('')
    const res = await fetch('/api/clerks/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clerkId: selected.id, pin: code }),
    })
    setLoading(false)
    if (res.ok) {
      const clerk = await res.json()
      onLogin(clerk)
    } else {
      setError('Incorrect code. Try again.')
      setCode('')
    }
  }

  // Keep login ref stable for keyboard handler
  useEffect(() => { loginRef.current = handleLogin }, [handleLogin])

  // Keyboard support for PIN entry
  useEffect(() => {
    if (!selected) return
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault()
        setCode(p => p.length < 10 ? p + e.key : p)
      } else if (e.key === 'Backspace') {
        e.preventDefault()
        setCode(p => p.slice(0, -1))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        loginRef.current()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        setSelected(null)
        setCode('')
        setError('')
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [selected])

  const numKeys = ['1','2','3','4','5','6','7','8','9','0']

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-md p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">👤</div>
          <h2 className="text-xl font-bold text-white">
            {isSwitch ? 'Switch Clerk' : 'Clerk Sign In'}
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            {selected ? `Enter code for ${selected.name}` : 'Select your name'}
          </p>
        </div>

        {!selected ? (
          /* Clerk selection list */
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {clerks.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                No active clerks found.<br />
                <span className="text-xs">Add clerks from Admin → Clerks tab.</span>
              </div>
            ) : (
              clerks.map(c => (
                <button
                  key={c.id}
                  onClick={() => { setSelected(c); setCode(''); setError('') }}
                  className="w-full bg-gray-800 hover:bg-gray-700 border border-gray-600 hover:border-blue-500
                             rounded-xl px-4 py-3 text-left transition-all group"
                >
                  <div className="font-bold text-white group-hover:text-blue-300">{c.name}</div>
                  <div className="text-xs text-gray-500 capitalize">{c.role}</div>
                </button>
              ))
            )}
          </div>
        ) : (
          /* Code entry */
          <div className="space-y-4">
            {/* Back button */}
            <button
              onClick={() => { setSelected(null); setCode(''); setError('') }}
              className="flex items-center gap-1 text-gray-400 hover:text-white text-sm transition-colors"
            >
              ← Back
            </button>

            {/* Code display */}
            <div className="bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-center font-mono tracking-[0.5em] text-2xl text-white min-h-[52px]">
              {code ? '•'.repeat(code.length) : <span className="text-gray-600 text-base tracking-normal">Enter code</span>}
            </div>

            {error && (
              <div className="bg-red-950 border border-red-700 text-red-300 text-sm px-3 py-2 rounded-lg text-center">
                {error}
              </div>
            )}

            {/* Numpad */}
            <div className="grid grid-cols-3 gap-2">
              {numKeys.map((k, i) => (
                <button
                  key={k}
                  onClick={() => handleNumKey(k)}
                  className={`bg-gray-700 hover:bg-gray-600 active:bg-gray-500 text-white text-lg font-bold py-3 rounded-xl transition-colors ${i === 9 ? 'col-start-2' : ''}`}
                >
                  {k}
                </button>
              ))}
              <button
                onClick={handleBackspace}
                className="bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm font-bold py-3 rounded-xl transition-colors"
              >
                ⌫
              </button>
            </div>

            {/* Login button */}
            <button
              onClick={handleLogin}
              disabled={!code || loading}
              className="w-full bg-green-700 hover:bg-green-600 disabled:opacity-40 disabled:cursor-not-allowed
                         text-white font-bold py-3 rounded-xl text-lg transition-colors"
            >
              {loading ? 'Checking...' : `Sign In as ${selected.name}`}
            </button>
          </div>
        )}

        {/* Cancel (only when switching) */}
        {isSwitch && onCancel && (
          <button
            onClick={onCancel}
            className="w-full mt-3 text-gray-500 hover:text-gray-300 text-sm transition-colors py-2"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  )
}
