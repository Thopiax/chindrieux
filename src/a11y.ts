import type { KeyboardEvent } from 'react'

// Roving-focus keyboard support for a role="radio" group. A radiogroup should be
// a single tab stop: one radio is tabbable (tabIndex 0), the rest are -1, and
// arrow / Home / End keys move both the selection and focus. When nothing is
// selected yet the first option is the tab stop.

// tabIndex for one radio: 0 for the selected option, or the first option when
// the group has no selection; -1 otherwise.
export function radioTabIndex<T>(value: T, current: T | null, options: readonly T[]): 0 | -1 {
  if (current == null) return value === options[0] ? 0 : -1
  return value === current ? 0 : -1
}

// Keydown handler for the radiogroup container. Moves selection with the arrow
// keys (wrapping), Home and End, then focuses the newly selected radio.
export function handleRadioKeydown<T>(
  e: KeyboardEvent<HTMLElement>,
  options: readonly T[],
  current: T | null,
  onSelect: (value: T) => void,
): void {
  const navKeys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End']
  if (!navKeys.includes(e.key)) return
  e.preventDefault()
  const last = options.length - 1
  const i = current == null ? -1 : options.indexOf(current)
  let next: number
  switch (e.key) {
    case 'ArrowRight':
    case 'ArrowDown':
      next = i < 0 ? 0 : (i + 1) % options.length
      break
    case 'ArrowLeft':
    case 'ArrowUp':
      next = i <= 0 ? last : i - 1
      break
    case 'Home':
      next = 0
      break
    default:
      next = last
  }
  onSelect(options[next])
  const radios = e.currentTarget.querySelectorAll<HTMLElement>('[role="radio"]')
  radios[next]?.focus()
}
