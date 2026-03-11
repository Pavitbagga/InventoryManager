'use client'
import { useEffect, useState, useCallback } from 'react'

const ZOOM_KEY = 'pos_zoom'
const MIN_ZOOM = 0.7
const MAX_ZOOM = 1.5
const STEP = 0.1

export function useZoom() {
  const [zoom, setZoom] = useState<number>(1)

  // Initialise from localStorage on mount
  useEffect(() => {
    const stored = parseFloat(localStorage.getItem(ZOOM_KEY) || '1')
    const initial = isNaN(stored) ? 1 : Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, stored))
    setZoom(initial)
    document.documentElement.style.setProperty('--zoom', String(initial))
  }, [])

  const applyZoom = useCallback((val: number) => {
    const clamped = parseFloat(Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, val)).toFixed(1))
    setZoom(clamped)
    document.documentElement.style.setProperty('--zoom', String(clamped))
    localStorage.setItem(ZOOM_KEY, String(clamped))
  }, [])

  const zoomIn  = useCallback(() => applyZoom(zoom + STEP), [zoom, applyZoom])
  const zoomOut = useCallback(() => applyZoom(zoom - STEP), [zoom, applyZoom])
  const reset   = useCallback(() => applyZoom(1), [applyZoom])

  return { zoom, zoomIn, zoomOut, reset, min: MIN_ZOOM, max: MAX_ZOOM }
}
