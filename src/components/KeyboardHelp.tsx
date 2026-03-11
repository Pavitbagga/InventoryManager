'use client'

interface ShortcutGroup { title: string; shortcuts: { keys: string[]; desc: string }[] }

const POS_SHORTCUTS: ShortcutGroup[] = [
  {
    title: 'Numpad',
    shortcuts: [
      { keys: ['0–9'], desc: 'Numpad input' },
      { keys: ['Backspace'], desc: 'Delete last digit (CORRECT)' },
      { keys: ['Esc'], desc: 'Clear numpad (CLEAR)' },
      { keys: ['.'], desc: 'Decimal point' },
    ],
  },
  {
    title: 'Cart',
    shortcuts: [
      { keys: ['Enter'], desc: 'CASH — generate bill' },
      { keys: ['Delete'], desc: 'Remove selected / last item (VOID)' },
      { keys: ['↑ ↓'], desc: 'Navigate cart items' },
      { keys: ['Ctrl', 'Z'], desc: 'Void entire transaction' },
    ],
  },
  {
    title: 'Modes',
    shortcuts: [
      { keys: ['Q'], desc: 'Enter QTY mode' },
      { keys: ['D'], desc: 'Apply numpad value as discount' },
      { keys: ['C'], desc: 'Switch clerk' },
    ],
  },
  {
    title: 'Zoom',
    shortcuts: [
      { keys: ['Ctrl', '+'], desc: 'Zoom in' },
      { keys: ['Ctrl', '−'], desc: 'Zoom out' },
      { keys: ['Ctrl', '0'], desc: 'Reset zoom' },
    ],
  },
]

const ADMIN_SHORTCUTS: ShortcutGroup[] = [
  {
    title: 'Navigation',
    shortcuts: [
      { keys: ['1'], desc: 'Products tab' },
      { keys: ['2'], desc: 'Categories tab' },
      { keys: ['3'], desc: 'Clerks tab' },
      { keys: ['4'], desc: 'Bill Config tab' },
      { keys: ['5'], desc: 'Settings tab' },
    ],
  },
  {
    title: 'Forms',
    shortcuts: [
      { keys: ['Ctrl', 'S'], desc: 'Save / submit current form' },
      { keys: ['Esc'], desc: 'Cancel editing' },
      { keys: ['Tab'], desc: 'Next field' },
      { keys: ['Shift', 'Tab'], desc: 'Previous field' },
    ],
  },
  {
    title: 'Zoom',
    shortcuts: [
      { keys: ['Ctrl', '+'], desc: 'Zoom in' },
      { keys: ['Ctrl', '−'], desc: 'Zoom out' },
      { keys: ['Ctrl', '0'], desc: 'Reset zoom' },
    ],
  },
]

interface Props {
  onClose: () => void
  mode: 'pos' | 'admin'
}

function Kbd({ children }: { children: string }) {
  return (
    <kbd className="inline-flex items-center px-2 py-0.5 rounded bg-gray-700 border border-gray-500
                    text-xs font-mono text-gray-200 shadow-sm">
      {children}
    </kbd>
  )
}

export default function KeyboardHelp({ onClose, mode }: Props) {
  const groups = mode === 'pos' ? POS_SHORTCUTS : ADMIN_SHORTCUTS

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-2xl
                      max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 sticky top-0 bg-gray-900">
          <div>
            <h2 className="text-lg font-bold text-white">Keyboard Shortcuts</h2>
            <p className="text-xs text-gray-500 mt-0.5">Press <Kbd>?</Kbd> to toggle this panel</p>
          </div>
          <button onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl leading-none transition-colors">×</button>
        </div>

        {/* Shortcut groups */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {groups.map(group => (
            <div key={group.title}>
              <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-3">{group.title}</h3>
              <div className="space-y-2">
                {group.shortcuts.map((s, i) => (
                  <div key={i} className="flex items-center justify-between gap-3">
                    <span className="text-gray-300 text-sm">{s.desc}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      {s.keys.map((k, j) => (
                        <span key={k} className="flex items-center gap-1">
                          <Kbd>{k}</Kbd>
                          {j < s.keys.length - 1 && <span className="text-gray-600 text-xs">+</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="px-6 py-3 border-t border-gray-800 text-center">
          <span className="text-xs text-gray-600">Click anywhere outside or press Esc to close</span>
        </div>
      </div>
    </div>
  )
}
