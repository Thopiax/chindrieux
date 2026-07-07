import { LangSwitcher } from '../components/LangSwitcher.tsx'
import { useT } from '../i18n.ts'

export function Onboarding() {
  const t = useT()
  return (
    <section>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>{t('onboarding.title')}</h1>
        <LangSwitcher />
      </div>
      <p>{t('onboarding.whoAreYou')}</p>
    </section>
  )
}
