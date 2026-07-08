import type { CSSProperties, ReactNode } from 'react'

// Taped scrapbook card. Thin wrapper over the .card-taped class from Task 1 so
// screens do not repeat the class string and can still pass extra styling.
export function Card({
  children,
  className,
  style,
}: {
  children: ReactNode
  className?: string
  style?: CSSProperties
}) {
  return (
    <div className={className ? `card-taped ${className}` : 'card-taped'} style={style}>
      {children}
    </div>
  )
}
