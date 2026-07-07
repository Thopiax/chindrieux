import { useT } from '../i18n.ts'

export function Costs() {
  const t = useT()
  return (
    <section>
      <h1>{t('costs.title')}</h1>
      <p>Split expenses and settle up.</p>
    </section>
  )
}
