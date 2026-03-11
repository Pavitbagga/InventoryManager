'use client'

interface Props {
  onAction: (action: string) => void
  subtotal: number
  cartEmpty: boolean
}

export default function ActionBar({ onAction, subtotal, cartEmpty }: Props) {
  return (
    <div className="flex items-stretch gap-1 px-2 py-1.5 bg-gray-950 border-t border-gray-700 shrink-0">
      {[
        { label: 'PLU NUMBER', color: 'bg-yellow-700 hover:bg-yellow-600' },
        { label: 'PRICE SHIFT', color: 'bg-blue-700 hover:bg-blue-600' },
        { label: 'BUFFER PRINT', color: 'bg-gray-600 hover:bg-gray-500' },
        { label: 'REOPEN BILL', color: 'bg-pink-800 hover:bg-pink-700' },
      ].map(({ label, color }) => (
        <button
          key={label}
          onClick={() => onAction(label)}
          className={`${color} text-white text-[10px] font-bold px-3 py-2.5 rounded transition-colors`}
        >
          {label}
        </button>
      ))}

      <button
        onClick={() => onAction('SUBTOTAL')}
        className="bg-purple-800 hover:bg-purple-700 text-white text-[10px] font-bold px-4 py-2 rounded transition-colors text-center"
      >
        <div>SUBTOTAL</div>
        <div className="text-purple-200 font-mono text-[11px]">{subtotal.toFixed(2)}</div>
      </button>

      <button
        onClick={() => onAction('DISCOUNT')}
        className="bg-pink-700 hover:bg-pink-600 text-white text-[10px] font-bold px-4 py-2.5 rounded transition-colors"
      >
        DISCOUNT
      </button>

      <div className="flex-1" />

      <button
        onClick={() => onAction('CASH')}
        disabled={cartEmpty}
        className="bg-green-600 hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed
                   text-white text-xl font-bold px-10 py-2 rounded transition-colors shadow-lg"
      >
        CASH
      </button>
    </div>
  )
}
