import { useT } from '../i18n.ts'

export function Tournaments() {
  const t = useT()
  return (
    <section>
      <h1>{t('tournaments.title')}</h1>
      <p>Log matches, standings compute themselves.</p>
    </section>
  )
}
