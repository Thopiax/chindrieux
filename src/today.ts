// Single source of truth for "today" as local yyyy-mm-dd (kept local, not
// toISOString, so a day never drifts across the UTC boundary). Dev-only
// override: append ?fakeToday=2026-08-14 to the URL to preview any date,
// e.g. the before/during/after phases of the home screen.
export function todayISO(): string {
  const fake = new URLSearchParams(location.search).get('fakeToday')
  if (fake) return fake
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}
