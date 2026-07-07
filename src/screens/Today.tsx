import { LangSwitcher } from '../components/LangSwitcher.tsx'
import { useT } from '../i18n.ts'

export function Today() {
  const t = useT()
  return (
    <section>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>{t('today.title')}</h1>
        <LangSwitcher />
      </div>
      <p>Phase-aware front door.</p>
    </section>
  )
}
