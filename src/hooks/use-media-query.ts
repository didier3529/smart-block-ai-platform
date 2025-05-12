"use client"

import { useState, useEffect } from "react"

export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    // Server-side check
    if (typeof window === "undefined") {
      return
    }

    const mediaQuery = window.matchMedia(query)
    // Initial check
    setMatches(mediaQuery.matches)

    const handleChange = () => {
      setMatches(mediaQuery.matches)
    }

    // Add event listener
    mediaQuery.addEventListener("change", handleChange)

    // Clean up
    return () => {
      mediaQuery.removeEventListener("change", handleChange)
    }
  }, [query])

  return matches
} 