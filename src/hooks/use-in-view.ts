"use client"

import { useEffect, useRef, useState } from "react"

interface UseInViewOptions extends IntersectionObserverInit {
  threshold?: number
  rootMargin?: string
  once?: boolean
}

export function useInView<T extends Element>(options: UseInViewOptions = {}) {
  const { threshold = 0, rootMargin = "0px", once = true, ...restOptions } = options
  const [isInView, setIsInView] = useState(false)
  const ref = useRef<T | HTMLElement | null>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          if (once && element) {
            observer.unobserve(element)
          }
        } else if (!once) {
          setIsInView(false)
        }
      },
      {
        threshold,
        rootMargin,
        ...restOptions
      }
    )

    observer.observe(element)

    return () => {
      if (element) {
        observer.unobserve(element)
      }
    }
  }, [threshold, rootMargin, once, restOptions])

  // Return both formats to maintain compatibility with both usage patterns
  const result = { ref, isInView }
  return result
} 