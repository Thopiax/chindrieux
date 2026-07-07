import { use$ } from '@legendapp/state/react'
import { LANGS, lang$, useT, type Lang } from '../i18n.ts'

const flags: Record<Lang, string> = {
  en: '🇬🇧',
  fr: '🇫🇷',
  pt: '🇧🇷',
  nl: '🇳🇱',
}

export function LangSwitcher() {
  const t = useT()
  const current = use$(lang$)
  return (
    <div
      role="group"
      aria-label={t('langSwitcher.label')}
      style={{ display: 'flex', gap: 4 }}
    >
      {LANGS.map((l) => (
        <button
          key={l}
          type="button"
          aria-pressed={current === l}
          onClick={() => lang$.set(l)}
          title={l}
          style={{
            fontSize: 20,
            lineHeight: 1,
            padding: 4,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            opacity: current === l ? 1 : 0.45,
          }}
        >
          {flags[l]}
        </button>
      ))}
    </div>
  )
}
