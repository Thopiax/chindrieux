import { Badge } from './Badge.tsx'
import type { Person } from '../domain/types.ts'

// Reusable checklist of people. Each row is a checkbox plus a small badge and
// name; the parent owns the selected set and gets a toggle per person. Kept
// deliberately small so later screens can reuse it as-is. An optional noteOf
// renders a small right-aligned note per row (costs uses it to show each
// selected person's share of the split).
export function PersonPicker({
  people,
  selectedIds,
  onToggle,
  noteOf,
}: {
  people: Person[]
  selectedIds: ReadonlySet<string>
  onToggle: (id: string) => void
  noteOf?: (id: string) => string | null
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {people.map((p) => {
        const note = noteOf?.(p.id) ?? null
        return (
          <label
            key={p.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={selectedIds.has(p.id)}
              onChange={() => onToggle(p.id)}
              style={{ width: 20, height: 20 }}
            />
            <Badge person={p} size="sm" />
            {p.name}
            {note !== null && (
              <span
                style={{
                  marginLeft: 'auto',
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                  fontSize: 14,
                  opacity: 0.75,
                }}
              >
                {note}
              </span>
            )}
          </label>
        )
      })}
    </div>
  )
}
