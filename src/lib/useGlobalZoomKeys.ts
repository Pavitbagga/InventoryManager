'use client'
import { useEffect } from 'react'
import { useZoom } from './useZoom'

/** Wires Ctrl+Plus / Ctrl+Minus / Ctrl+0 to zoom controls globally */
export function useGlobalZoomKeys() {
  const { zoomIn, zoomOut, reset } = useZoom()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!e.ctrlKey && !e.metaKey) return
      if (e.key === '=' || e.key === '+') { e.preventDefault(); zoomIn() }
      else if (e.key === '-' || e.key === '_') { e.preventDefault(); zoomOut() }
      else if (e.key === '0') { e.preventDefault(); reset() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [zoomIn, zoomOut, reset])
}
