import { useT } from '../i18n.ts'

export function Profiles() {
  const t = useT()
  return (
    <section>
      <h1>{t('profiles.title')}</h1>
      <p>Roster of avatars.</p>
    </section>
  )
}
