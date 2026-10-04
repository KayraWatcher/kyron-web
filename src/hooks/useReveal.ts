import { useEffect, useRef } from 'react'

/**
 * Bölüm göründüğünde `reveal` sınıfına sahip elemanları görünür yapar.
 * Kısa ve subtle bir geçiş; `prefers-reduced-motion` global CSS'te devre dışı.
 */
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const show = () => {
      el.classList.add('is-visible')
      el.querySelectorAll('.reveal').forEach((child) => child.classList.add('is-visible'))
    }

    if (typeof IntersectionObserver === 'undefined') {
      show()
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            show()
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return ref
}
