'use client'
import { useEffect, useState } from 'react'
import { Bill } from '@/types'
import { printBillPDF } from '@/lib/billUtils'
import ZoomControl from '@/components/ZoomControl'
import { useGlobalZoomKeys } from '@/lib/useGlobalZoomKeys'

interface ActiveClerk { id: number; name: string; role: string }

export default function BillsPage() {
  const [bills, setBills] = useState<Bill[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [clerk, setClerk] = useState<ActiveClerk | null>(null)
  useGlobalZoomKeys()

  useEffect(() => {
    try {
      const saved = localStorage.getItem('clerk_session')
      if (saved) setClerk(JSON.parse(saved))
    } catch { /* ignore */ }
  }, [])

  const handleSignOut = () => {
    localStorage.removeItem('clerk_session')
    setClerk(null)
  }

  useEffect(() => {
    fetch('/api/bills')
      .then(r => r.json())
      .then(data => { setBills(data); setLoading(false) })
  }, [])

  const filtered = bills.filter(b =>
    b.billNumber.toLowerCase().includes(search.toLowerCase()) ||
    b.clerkId.toLowerCase().includes(search.toLowerCase())
  )

  const totalRevenue = filtered.reduce((s, b) => s + b.total, 0)

  return (
    <div className="page-scroll bg-gray-950 text-white p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Bill History</h1>
          <p className="text-gray-400 text-sm">{filtered.length} bills — Total: Rs.{totalRevenue.toFixed(2)}</p>
        </div>
        <div className="flex items-center gap-3">
          {clerk && (
            <div className="flex items-center gap-2">
              <span className="text-yellow-400 font-bold text-sm">{clerk.name}</span>
              <button onClick={handleSignOut}
                className="text-red-400 hover:text-red-300 text-xs transition-colors"
                title="Sign out">
                Sign Out
              </button>
              <span className="text-gray-600 text-xs">|</span>
            </div>
          )}
          <ZoomControl />
          <input
            placeholder="Search bill no / clerk..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-gray-800 border border-gray-600 px-3 py-2 rounded text-sm focus:outline-none focus:border-blue-500 w-56"
          />
          <a href="/" className="bg-green-700 hover:bg-green-600 px-4 py-2 rounded text-sm transition-colors">
            Back to POS
          </a>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-gray-500 py-20">Loading...</div>
      ) : bills.length === 0 ? (
        <div className="text-center text-gray-500 py-20">No bills yet. Make a sale first!</div>
      ) : (
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-700 text-gray-300">
                <th className="p-3 text-left">Bill No</th>
                <th className="p-3 text-left">Date & Time</th>
                <th className="p-3 text-center">Clerk</th>
                <th className="p-3 text-center">Items</th>
                <th className="p-3 text-right">Subtotal</th>
                <th className="p-3 text-right">Discount</th>
                <th className="p-3 text-right">Total</th>
                <th className="p-3 text-center">Payment</th>
                <th className="p-3 text-center">Reprint</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(b => (
                <tr key={b.id} className="border-t border-gray-700 hover:bg-gray-750">
                  <td className="p-3 font-mono text-yellow-400 text-xs">{b.billNumber}</td>
                  <td className="p-3 text-gray-400 text-xs">
                    {new Date(b.createdAt).toLocaleString('en-IN')}
                  </td>
                  <td className="p-3 text-center text-xs">{b.clerkId}</td>
                  <td className="p-3 text-center text-gray-400">{b.items.length}</td>
                  <td className="p-3 text-right font-mono">Rs.{b.subtotal.toFixed(2)}</td>
                  <td className="p-3 text-right font-mono text-red-400">
                    {b.discount > 0 ? `- Rs.${b.discount.toFixed(2)}` : '—'}
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-green-400">
                    Rs.{b.total.toFixed(2)}
                  </td>
                  <td className="p-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                      b.paymentMode === 'CASH' ? 'bg-green-900 text-green-300' : 'bg-blue-900 text-blue-300'
                    }`}>
                      {b.paymentMode}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => printBillPDF(b)}
                      className="bg-gray-600 hover:bg-gray-500 px-3 py-1 rounded text-xs transition-colors"
                    >
                      Print
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
