import { useT } from '../i18n.ts'

export function Oscars() {
  const t = useT()
  return (
    <section>
      <h1>{t('oscars.title')}</h1>
      <p>Vote best moments, reveal winners.</p>
    </section>
  )
}
