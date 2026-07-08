import { Badge } from './Badge.tsx'
import type { Person } from '../domain/types.ts'

// Reusable checklist of people. Each row is a checkbox plus a small badge and
// name; the parent owns the selected set and gets a toggle per person. Kept
// deliberately small so later screens can reuse it as-is.
export function PersonPicker({
  people,
  selectedIds,
  onToggle,
}: {
  people: Person[]
  selectedIds: ReadonlySet<string>
  onToggle: (id: string) => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {people.map((p) => (
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
        </label>
      ))}
    </div>
  )
}
