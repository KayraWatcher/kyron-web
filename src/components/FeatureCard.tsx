import type { ReactNode } from 'react'

export interface Feature {
  title: string
  text: string
  icon: ReactNode
}

export default function FeatureCard({ feature }: { feature: Feature }) {
  return (
    <article className="card">
      <div className="card__icon">{feature.icon}</div>
      <h3 className="card__title">{feature.title}</h3>
      <p className="card__text">{feature.text}</p>
    </article>
  )
}
