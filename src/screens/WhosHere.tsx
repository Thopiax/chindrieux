import { useT } from '../i18n.ts'

export function WhosHere() {
  const t = useT()
  return (
    <section>
      <h1>{t('whoshere.title')}</h1>
      <p>Stay timeline.</p>
    </section>
  )
}
