'use client'

interface Props {
  input: string
  qtyMode: boolean
  onKey: (key: string) => void
  onAction: (action: string) => void
}

const LEFT_ACTIONS = [
  { label: 'CORRECT', color: 'bg-red-700 hover:bg-red-600' },
  { label: 'VOID', color: 'bg-red-700 hover:bg-red-600' },
  { label: 'REFUND', color: 'bg-red-700 hover:bg-red-600' },
  { label: 'TRANSACT VOID', color: 'bg-red-800 hover:bg-red-700' },
  { label: 'EXIT', color: 'bg-red-900 hover:bg-red-800' },
]

const RIGHT_ACTIONS = [
  { label: 'CLEAR', color: 'bg-gray-600 hover:bg-gray-500' },
  { label: 'QTY', color: 'bg-blue-700 hover:bg-blue-600' },
  { label: 'CLERK', color: 'bg-gray-600 hover:bg-gray-500' },
  { label: 'UP', color: 'bg-gray-600 hover:bg-gray-500' },
  { label: 'DOWN', color: 'bg-gray-600 hover:bg-gray-500' },
  { label: 'BILL', color: 'bg-orange-600 hover:bg-orange-500' },
  { label: 'TABLE', color: 'bg-gray-600 hover:bg-gray-500' },
  { label: 'STORE', color: 'bg-gray-600 hover:bg-gray-500' },
]

const NUM_KEYS = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '0', '00', '.']

export default function Numpad({ input, qtyMode, onKey, onAction }: Props) {
  return (
    <div className="bg-gray-900 border-t border-gray-700 p-2 shrink-0">
      {/* Input display */}
      <div
        className={`text-right font-mono text-base px-3 py-1.5 mb-2 rounded border ${
          qtyMode
            ? 'bg-blue-950 border-blue-600 text-blue-200'
            : 'bg-gray-800 border-gray-600 text-white'
        }`}
      >
        <span className="text-gray-500 text-xs mr-2">{qtyMode ? 'QTY:' : 'INPUT:'}</span>
        {input || '0'}
      </div>

      <div className="flex gap-1.5">
        {/* Left action buttons */}
        <div className="flex flex-col gap-1 w-[72px] shrink-0">
          {LEFT_ACTIONS.map(({ label, color }) => (
            <button
              key={label}
              onClick={() => onAction(label)}
              className={`${color} text-white text-[9px] font-bold py-1.5 rounded leading-tight text-center`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Number keys */}
        <div className="flex-1">
          <div className="grid grid-cols-3 gap-1">
            {NUM_KEYS.map((k) => (
              <button
                key={k}
                onClick={() => onKey(k)}
                className="bg-gray-700 hover:bg-gray-600 active:bg-gray-500 text-white text-sm font-bold py-2 rounded transition-colors"
              >
                {k}
              </button>
            ))}
          </div>
        </div>

        {/* Right action buttons */}
        <div className="grid grid-cols-1 gap-1 w-[72px] shrink-0">
          {RIGHT_ACTIONS.map(({ label, color }) => (
            <button
              key={label}
              onClick={() => onAction(label)}
              className={`${color} text-white text-[9px] font-bold py-1.5 rounded leading-tight text-center`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
