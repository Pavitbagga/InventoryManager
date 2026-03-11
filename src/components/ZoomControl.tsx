'use client'
import { useZoom } from '@/lib/useZoom'

export default function ZoomControl() {
  const { zoom, zoomIn, zoomOut, reset, min, max } = useZoom()
  const pct = Math.round(zoom * 100)

  return (
    <div className="flex items-center gap-1 bg-gray-800 border border-gray-600 rounded-lg px-1.5 py-1 select-none"
      title="Text zoom (Ctrl +  /  Ctrl −  /  Ctrl 0)">
      <button
        onClick={zoomOut}
        disabled={zoom <= min}
        className="w-6 h-6 flex items-center justify-center rounded text-gray-300 hover:bg-gray-700
                   hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-base font-bold"
        aria-label="Zoom out"
      >−</button>

      <button
        onClick={reset}
        className="px-1.5 text-xs font-mono text-gray-300 hover:text-white min-w-[38px] text-center
                   hover:bg-gray-700 rounded transition-colors"
        title="Reset zoom"
        aria-label="Reset zoom"
      >{pct}%</button>

      <button
        onClick={zoomIn}
        disabled={zoom >= max}
        className="w-6 h-6 flex items-center justify-center rounded text-gray-300 hover:bg-gray-700
                   hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-base font-bold"
        aria-label="Zoom in"
      >+</button>
    </div>
  )
}
