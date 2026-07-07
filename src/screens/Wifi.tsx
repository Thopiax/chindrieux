import { useT } from '../i18n.ts'

export function Wifi() {
  const t = useT()
  return (
    <section>
      <h1>{t('wifi.title')}</h1>
      <p>SSID, password, and a join-QR.</p>
    </section>
  )
}
