"use client"

import { useEffect } from "react"

/** Registers the service worker so MyPMOS is installable + can receive push. */
export function PwaRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {})
    }
  }, [])
  return null
}
