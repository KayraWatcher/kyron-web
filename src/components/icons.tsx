import type { ReactNode } from 'react'

const s = { stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' } as const

function wrap(children: ReactNode) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {children}
    </svg>
  )
}

export const Icons = {
  markets: () => wrap(<><path d="M3 17l5-6 4 3 5-7 4 4" {...s} /><path d="M3 21h18" {...s} /></>),
  portfolio: () =>
    wrap(
      <>
        <path d="M4 7h16M4 12h16M4 17h9" {...s} />
        <circle cx="18" cy="17" r="2.4" {...s} />
      </>,
    ),
  news: () =>
    wrap(
      <>
        <rect x="3.5" y="5" width="17" height="14" rx="2" {...s} />
        <path d="M7 9h6M7 13h10M7 16h7" {...s} />
      </>,
    ),
  calendar: () =>
    wrap(
      <>
        <rect x="3.5" y="5.5" width="17" height="14" rx="2" {...s} />
        <path d="M3.5 10h17M8 3.5v4M16 3.5v4" {...s} />
      </>,
    ),
  chart: () =>
    wrap(
      <>
        <path d="M4 20V4" {...s} />
        <path d="M4 20h16" {...s} />
        <path d="M8 16v-4M12 16V8M16 16v-6M20 16v-3" {...s} />
      </>,
    ),
  personalize: () =>
    wrap(
      <>
        <path d="M5 6h14M5 12h14M5 18h14" {...s} />
        <circle cx="9" cy="6" r="2.2" {...s} />
        <circle cx="15" cy="12" r="2.2" {...s} />
        <circle cx="8" cy="18" r="2.2" {...s} />
      </>,
    ),
  check: () =>
    wrap(<path d="M5 12.5l4.5 4.5L19 7.5" {...s} strokeWidth={2.4} />),
}
