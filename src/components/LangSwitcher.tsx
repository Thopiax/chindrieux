import { use$ } from '@legendapp/state/react'
import { LANGS, lang$, useT, type Lang } from '../i18n.ts'
import { handleRadioKeydown, radioTabIndex } from '../a11y.ts'

const names: Record<Lang, string> = {
  en: 'English',
  fr: 'Français',
  pt: 'Português',
  nl: 'Nederlands',
}

// Text-only language picker (no flags: flags are countries, not languages).
// The app already follows navigator.language on first visit; this is the
// quiet override, meant to live at the bottom of a screen, not in a header.
export function LangSwitcher() {
  const t = useT()
  const current = use$(lang$)
  return (
    <div
      role="radiogroup"
      aria-label={t('langSwitcher.label')}
      onKeyDown={(e) => handleRadioKeydown(e, LANGS, current, (l) => lang$.set(l))}
      style={{ display: 'flex', gap: 6 }}
    >
      {LANGS.map((l) => (
        <button
          key={l}
          type="button"
          role="radio"
          aria-checked={current === l}
          aria-label={names[l]}
          tabIndex={radioTabIndex(l, current, LANGS)}
          onClick={() => lang$.set(l)}
          title={names[l]}
          style={{
            fontFamily: 'inherit',
            fontWeight: 700,
            fontSize: 13,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            minWidth: 44,
            minHeight: 40,
            borderRadius: 9999,
            cursor: 'pointer',
            color: 'var(--color-ink)',
            background: current === l ? 'var(--color-sunny)' : 'transparent',
            border: current === l ? '2px solid var(--color-ink)' : '2px solid transparent',
            opacity: current === l ? 1 : 0.55,
          }}
        >
          {l}
        </button>
      ))}
    </div>
  )
}
