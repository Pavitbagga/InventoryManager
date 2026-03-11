'use client'
import { CartItem } from '@/types'

interface Props {
  cart: CartItem[]
  subtotal: number
  discount: number
  clerkId: string
  billNumber: string
  selectedIndex: number | null
  onSelectItem: (index: number) => void
}

export default function BillPanel({
  cart,
  subtotal,
  discount,
  clerkId,
  billNumber,
  selectedIndex,
  onSelectItem,
}: Props) {
  const total = Math.max(0, subtotal - discount)

  return (
    <div className="flex flex-col h-full bg-[#111827]">
      {/* Header */}
      <div className="bg-gray-800 px-3 py-1.5 flex items-center gap-3 border-b border-gray-600 shrink-0">
        <span className="text-yellow-400 text-xs font-bold tracking-wider">{clerkId}</span>
        <span className="text-white text-xs bg-gray-700 px-2 py-0.5 rounded font-mono">
          #{billNumber}
        </span>
      </div>

      {/* Column headers */}
      {cart.length > 0 && (
        <div className="grid grid-cols-[1fr_36px_56px_60px] text-[10px] text-gray-500 px-2 py-1 border-b border-gray-800 shrink-0">
          <span>ITEM</span>
          <span className="text-right">QTY</span>
          <span className="text-right">RATE</span>
          <span className="text-right">AMT</span>
        </div>
      )}

      {/* Cart items */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {cart.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-600 text-sm">
            No items added
          </div>
        ) : (
          <div>
            {cart.map((item, i) => (
              <div
                key={i}
                onClick={() => onSelectItem(i)}
                className={`grid grid-cols-[1fr_36px_56px_60px] px-2 py-1.5 cursor-pointer border-b border-gray-800 text-xs transition-colors ${
                  selectedIndex === i
                    ? 'bg-blue-900/50 border-blue-700'
                    : 'hover:bg-gray-800'
                }`}
              >
                <span className="text-white truncate pr-1">{item.product.name}</span>
                <span className="text-yellow-300 text-right">{item.quantity}</span>
                <span className="text-gray-400 text-right">{item.product.price.toFixed(2)}</span>
                <span className="text-green-400 text-right font-medium">{item.total.toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Totals footer */}
      <div className="bg-gray-900 border-t border-gray-700 p-3 shrink-0">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>SUBTOTAL</span>
          <span className="text-white font-mono">{subtotal.toFixed(2)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-400">DISCOUNT</span>
            <span className="text-red-400 font-mono">- {discount.toFixed(2)}</span>
          </div>
        )}
        <div className="border-t border-gray-700 mt-2 pt-2 flex justify-between">
          <span className="text-sm font-bold text-gray-300">TOTAL</span>
          <span className="text-lg font-bold text-green-400 font-mono">{total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  )
}
