'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import BillPanel from '@/components/BillPanel'
import ProductGrid from '@/components/ProductGrid'
import Numpad from '@/components/Numpad'
import ActionBar from '@/components/ActionBar'
import ClerkLogin from '@/components/ClerkLogin'
import ZoomControl from '@/components/ZoomControl'
import KeyboardHelp from '@/components/KeyboardHelp'
import { CartItem, Category, Product } from '@/types'
import { printBillPDF } from '@/lib/billUtils'
import { useGlobalZoomKeys } from '@/lib/useGlobalZoomKeys'

interface ActiveClerk { id: number; name: string; role: string }

export default function POSPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [activeCategory, setActiveCategory] = useState<number>(0)
  const [cart, setCart] = useState<CartItem[]>([])
  const [numInput, setNumInput] = useState('')
  const [qtyMode, setQtyMode] = useState(false)
  const [discount, setDiscount] = useState(0)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [clerk, setClerk] = useState<ActiveClerk | null>(null)
  const [showClerkSwitch, setShowClerkSwitch] = useState(false)
  const [clerkLoaded, setClerkLoaded] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [billCounter, setBillCounter] = useState(1)
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const clockRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [time, setTime] = useState('')

  useGlobalZoomKeys()

  // Restore clerk session from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('clerk_session')
      if (saved) setClerk(JSON.parse(saved))
    } catch { /* ignore */ }
    setClerkLoaded(true)
  }, [])

  const billNumber = String(billCounter).padStart(8, '0')
  const subtotal = cart.reduce((s, i) => s + i.total, 0)

  // Clock
  useEffect(() => {
    const update = () => setTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }))
    update()
    clockRef.current = setInterval(update, 1000)
    return () => { if (clockRef.current) clearInterval(clockRef.current) }
  }, [])

  // Load categories
  useEffect(() => {
    fetch('/api/categories')
      .then(r => r.json())
      .then((data: Category[]) => {
        setCategories(data)
        if (data.length > 0) setActiveCategory(data[0].id)
      })
  }, [])

  const flash = useCallback((msg: string, duration = 2500) => {
    setStatus(msg)
    setTimeout(() => setStatus(''), duration)
  }, [])

  // ── Core actions (stable refs for keyboard handler) ────────────────────────
  const handleCashRef = useRef<() => void>(() => {})

  const handleCash = useCallback(async () => {
    if (cart.length === 0) { flash('Cart is empty'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cart, discount, paymentMode: 'CASH', clerkId: clerk?.name ?? 'CLERK' }),
      })
      if (!res.ok) throw new Error('Failed')
      const bill = await res.json()
      printBillPDF(bill)
      setCart([])
      setDiscount(0)
      setNumInput('')
      setSelectedIndex(null)
      setBillCounter(n => n + 1)
      flash('Bill generated!')
    } catch {
      flash('Error generating bill')
    } finally {
      setLoading(false)
    }
  }, [cart, discount, clerk, flash])

  useEffect(() => { handleCashRef.current = handleCash }, [handleCash])

  // ── Keyboard handler ────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't intercept when user is typing in an input/textarea
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      // Don't intercept when overlay is open
      if (showHelp || showClerkSwitch || !clerk) return
      // Don't intercept Ctrl combos (handled by zoom hook)
      if (e.ctrlKey || e.metaKey) return

      switch (e.key) {
        // Numpad digits
        case '0': case '1': case '2': case '3': case '4':
        case '5': case '6': case '7': case '8': case '9':
          e.preventDefault()
          setNumInput(p => p.length >= 8 ? p : p + e.key)
          break
        case '0': break // handled above
        case '.':
          e.preventDefault()
          setNumInput(p => p.includes('.') ? p : p + '.')
          break
        case 'Backspace':
          e.preventDefault()
          setNumInput(p => p.slice(0, -1))
          break
        case 'Escape':
          e.preventDefault()
          setNumInput('')
          setQtyMode(false)
          break
        case 'Enter':
          e.preventDefault()
          handleCashRef.current()
          break
        case 'Delete':
          e.preventDefault()
          if (selectedIndex !== null) {
            setCart(p => p.filter((_, i) => i !== selectedIndex))
            setSelectedIndex(null)
            flash('Item removed')
          } else if (cart.length > 0) {
            setCart(p => p.slice(0, -1))
            flash('Last item removed')
          }
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => prev === null ? cart.length - 1 : Math.max(0, prev - 1))
          break
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev => prev === null ? 0 : Math.min(cart.length - 1, prev + 1))
          break
        case 'q': case 'Q':
          e.preventDefault()
          setQtyMode(true)
          flash('QTY mode — enter qty then click product')
          break
        case 'd': case 'D': {
          e.preventDefault()
          const val = numInput ? parseFloat(numInput) : 0
          if (isNaN(val) || val < 0) { flash('Invalid discount'); break }
          if (val > subtotal) { flash('Discount cannot exceed subtotal'); break }
          setDiscount(val)
          setNumInput('')
          flash(`Discount set: Rs.${val.toFixed(2)}`)
          break
        }
        case 'c': case 'C':
          e.preventDefault()
          setShowClerkSwitch(true)
          break
        case '?':
          e.preventDefault()
          setShowHelp(p => !p)
          break
        case 'z': case 'Z':
          // Ctrl+Z handled via ctrlKey check above; plain Z = nothing
          break
      }
    }

    // Ctrl+Z = transact void
    const ctrlHandler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z') && !e.shiftKey) {
        if (showHelp || showClerkSwitch || !clerk) return
        if (cart.length > 0) {
          setCart([])
          setDiscount(0)
          setNumInput('')
          setSelectedIndex(null)
          flash('Transaction voided')
        }
      }
    }

    window.addEventListener('keydown', handler)
    window.addEventListener('keydown', ctrlHandler)
    return () => {
      window.removeEventListener('keydown', handler)
      window.removeEventListener('keydown', ctrlHandler)
    }
  }, [showHelp, showClerkSwitch, clerk, cart, selectedIndex, numInput, subtotal, flash])

  // ── Other handlers ──────────────────────────────────────────────────────────
  const handleClerkLogin = (loggedIn: ActiveClerk) => {
    localStorage.setItem('clerk_session', JSON.stringify(loggedIn))
    setClerk(loggedIn)
    setShowClerkSwitch(false)
    if (clerk && clerk.id !== loggedIn.id) {
      setCart([])
      setDiscount(0)
      setNumInput('')
      setSelectedIndex(null)
    }
  }

  const handleSignOut = () => {
    localStorage.removeItem('clerk_session')
    setClerk(null)
    setCart([])
    setDiscount(0)
    setNumInput('')
    setSelectedIndex(null)
  }

  const addToCart = useCallback(
    (product: Product) => {
      const qty = numInput ? Math.max(1, parseInt(numInput) || 1) : 1
      setNumInput('')
      setQtyMode(false)
      setCart(prev => {
        const existing = prev.findIndex(i => i.product.id === product.id)
        if (existing >= 0) {
          const updated = [...prev]
          const newQty = updated[existing].quantity + qty
          updated[existing] = { ...updated[existing], quantity: newQty, total: newQty * product.price }
          return updated
        }
        return [...prev, { product, quantity: qty, total: qty * product.price }]
      })
      setSelectedIndex(null)
    },
    [numInput]
  )

  const handleNumKey = (key: string) => {
    if (key === '.') {
      if (!numInput.includes('.')) setNumInput(p => p + '.')
    } else {
      setNumInput(p => (p.length >= 8 ? p : p + key))
    }
  }

  const handleNumAction = (action: string) => {
    switch (action) {
      case 'CORRECT':      setNumInput(p => p.slice(0, -1)); break
      case 'CLEAR':        setNumInput(''); setQtyMode(false); break
      case 'QTY':          setQtyMode(true); flash('QTY mode: enter quantity then tap product'); break
      case 'VOID':
        if (selectedIndex !== null) { setCart(p => p.filter((_, i) => i !== selectedIndex)); setSelectedIndex(null); flash('Item removed') }
        else if (cart.length > 0) { setCart(p => p.slice(0, -1)); flash('Last item removed') }
        break
      case 'BILL':         handleCashRef.current(); break
      case 'UP':           setSelectedIndex(prev => prev === null ? cart.length - 1 : Math.max(0, prev - 1)); break
      case 'DOWN':         setSelectedIndex(prev => prev === null ? 0 : Math.min(cart.length - 1, prev + 1)); break
      case 'CLERK':        setShowClerkSwitch(true); break
      case 'TRANSACT VOID':
        if (cart.length > 0) { setCart([]); setDiscount(0); setNumInput(''); setSelectedIndex(null); flash('Transaction voided') }
        break
    }
  }

  const handleActionBar = (action: string) => {
    switch (action) {
      case 'CASH':          handleCashRef.current(); break
      case 'DISCOUNT': {
        const val = numInput ? parseFloat(numInput) : 0
        if (isNaN(val) || val < 0) { flash('Invalid discount'); return }
        if (val > subtotal) { flash('Discount cannot exceed subtotal'); return }
        setDiscount(val); setNumInput(''); flash(`Discount set: Rs.${val.toFixed(2)}`); break
      }
      case 'SUBTOTAL':      flash(`Subtotal: Rs.${subtotal.toFixed(2)}`); break
      case 'BUFFER PRINT':  if (cart.length === 0) { flash('Nothing to print'); return } flash('Printing buffer...'); break
    }
  }

  return (
    <div className="pos-root flex flex-col bg-gray-950 text-white select-none">
      {/* Overlays */}
      {clerkLoaded && (!clerk || showClerkSwitch) && (
        <ClerkLogin
          onLogin={handleClerkLogin}
          isSwitch={showClerkSwitch && !!clerk}
          onCancel={showClerkSwitch ? () => setShowClerkSwitch(false) : undefined}
        />
      )}
      {showHelp && <KeyboardHelp mode="pos" onClose={() => setShowHelp(false)} />}

      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-700 px-4 py-1.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => setShowClerkSwitch(true)}
            className="text-yellow-400 font-bold text-sm tracking-wider hover:text-yellow-300 transition-colors"
            title="Click to switch clerk">
            {clerk?.name ?? '—'}
          </button>
          {clerk && (
            <button onClick={handleSignOut}
              className="text-red-400 hover:text-red-300 text-xs transition-colors"
              title="Sign out">
              Sign Out
            </button>
          )}
          <span className="text-gray-600 text-xs">|</span>
          <a href="/admin" className="text-blue-400 hover:text-blue-300 text-xs transition-colors">Admin</a>
          <a href="/bills" className="text-blue-400 hover:text-blue-300 text-xs transition-colors">Bills</a>
        </div>
        <div className="flex items-center gap-3">
          {status && (
            <span className={`text-xs font-bold px-3 py-1 rounded ${
              status.includes('Error') ? 'text-red-400 bg-red-950' : 'text-green-400 bg-green-950'
            }`}>{status}</span>
          )}
          {loading && <span className="text-yellow-400 text-xs animate-pulse">Processing...</span>}
          <ZoomControl />
          <button onClick={() => setShowHelp(true)} title="Keyboard shortcuts (?)"
            className="text-gray-500 hover:text-gray-300 text-xs px-2 py-1 rounded hover:bg-gray-800 transition-colors">
            ?
          </button>
          <span className="text-gray-400 font-mono text-sm">{time}</span>
        </div>
      </div>

      {/* Main body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Bill + Numpad */}
        <div className="w-[320px] flex flex-col border-r border-gray-700 shrink-0">
          <div className="flex-1 overflow-hidden min-h-0">
            <BillPanel
              cart={cart} subtotal={subtotal} discount={discount}
              clerkId={clerk?.name ?? '—'} billNumber={billNumber}
              selectedIndex={selectedIndex} onSelectItem={i => setSelectedIndex(selectedIndex === i ? null : i)}
            />
          </div>
          <Numpad input={numInput} qtyMode={qtyMode} onKey={handleNumKey} onAction={handleNumAction} />
        </div>

        {/* Right: Product grid + action bar */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden min-h-0">
            <ProductGrid
              categories={categories} activeCategory={activeCategory}
              onCategoryChange={setActiveCategory} onProductClick={addToCart}
            />
          </div>
          <ActionBar onAction={handleActionBar} subtotal={subtotal} cartEmpty={cart.length === 0} />
        </div>
      </div>
    </div>
  )
}
