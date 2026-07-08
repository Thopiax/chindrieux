import { useEffect, useState, type CSSProperties } from 'react'
import { use$ } from '@legendapp/state/react'
import QRCode from 'qrcode'
import { Card } from '../components/Card.tsx'
import { Screen } from '../components/Screen.tsx'
import { useT } from '../i18n.ts'
import { config$ } from '../store.ts'

type T = ReturnType<typeof useT>

const primaryBtn: CSSProperties = {
  fontFamily: 'inherit', fontWeight: 700, fontSize: 15, color: '#fff',
  background: 'var(--color-cerulean)', border: 'none', borderRadius: 9999,
  padding: '9px 18px', cursor: 'pointer',
}
const ghostBtn: CSSProperties = {
  fontFamily: 'inherit', fontWeight: 700, fontSize: 14, color: 'var(--color-ink)',
  background: 'none', border: 'none', cursor: 'pointer', padding: '10px 12px', minHeight: 44,
}
const inputStyle: CSSProperties = {
  fontFamily: 'inherit', fontSize: 16, padding: '10px 12px', borderRadius: 8,
  border: '2px solid var(--color-ink)', width: '100%', boxSizing: 'border-box',
}
const fieldLabel: CSSProperties = { display: 'block', fontWeight: 700, marginBottom: 6 }
const overline: CSSProperties = {
  fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: 1,
  opacity: 0.55, margin: '0 0 4px',
}

// Escape the characters that would otherwise break the WIFI: payload grammar
// (backslash, delimiters, quotes). Same regex the brief specifies verbatim.
const esc = (s: string) => s.replace(/([\\;,:"'])/g, '\\$1')

export function Wifi() {
  const t = useT()
  const ssid = use$(() => config$['main'].wifi_ssid.get() ?? '')
  const password = use$(() => config$['main'].wifi_password.get() ?? '')
  const [editing, setEditing] = useState(false)

  const showForm = ssid.trim() === '' || editing

  return (
    <Screen title={t('wifi.title')}>
      {showForm ? (
        <WifiForm t={t} ssid={ssid} password={password} onDone={() => setEditing(false)} />
      ) : (
        <WifiCard t={t} ssid={ssid} password={password} onEdit={() => setEditing(true)} />
      )}
    </Screen>
  )
}

function WifiForm({
  t, ssid, password, onDone,
}: {
  t: T
  ssid: string
  password: string
  onDone: () => void
}) {
  const [ssidInput, setSsidInput] = useState(ssid)
  const [passInput, setPassInput] = useState(password)
  const canSave = ssidInput.trim() !== ''
  const hasExisting = ssid.trim() !== ''

  const save = () => {
    config$['main'].wifi_ssid.set(ssidInput.trim())
    config$['main'].wifi_password.set(passInput)
    onDone()
  }

  return (
    <Card>
      <label>
        <span style={fieldLabel}>{t('wifi.networkName')}</span>
        <input
          type="text"
          value={ssidInput}
          onChange={(e) => setSsidInput(e.target.value)}
          placeholder={t('wifi.networkPlaceholder')}
          style={inputStyle}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
        />
      </label>
      <label style={{ display: 'block', marginTop: 12 }}>
        <span style={fieldLabel}>{t('wifi.password')}</span>
        <input
          type="text"
          value={passInput}
          onChange={(e) => setPassInput(e.target.value)}
          placeholder={t('wifi.passwordPlaceholder')}
          style={inputStyle}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
        />
      </label>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 16 }}>
        <button
          type="button"
          onClick={save}
          disabled={!canSave}
          style={{ ...primaryBtn, opacity: canSave ? 1 : 0.4 }}
        >
          {t('common.save')}
        </button>
        {hasExisting && (
          <button type="button" onClick={onDone} className="back-chip">
            {t('common.cancel')}
          </button>
        )}
      </div>
    </Card>
  )
}

function WifiCard({
  t, ssid, password, onEdit,
}: {
  t: T
  ssid: string
  password: string
  onEdit: () => void
}) {
  const [dataUrl, setDataUrl] = useState<string | null>(null)
  const [qrFailed, setQrFailed] = useState(false)
  const [copied, setCopied] = useState(false)
  const [copyFailed, setCopyFailed] = useState(false)

  // Regenerate the join-QR whenever the credentials change. WPA covers the
  // common getaway router; the trailing ;; closes the payload.
  useEffect(() => {
    let alive = true
    setQrFailed(false)
    const payload = `WIFI:T:WPA;S:${esc(ssid)};P:${esc(password)};;`
    QRCode.toDataURL(payload, { width: 240, margin: 1 })
      .then((url) => { if (alive) setDataUrl(url) })
      .catch(() => { if (alive) { setDataUrl(null); setQrFailed(true) } })
    return () => { alive = false }
  }, [ssid, password])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(password)
      setCopyFailed(false)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard unavailable (older browser or denied): leave the value on
      // screen so it can still be typed by hand, and say so.
      setCopyFailed(true)
    }
  }

  return (
    <Card style={{ textAlign: 'center' }}>
      <p style={overline}>{t('wifi.networkName')}</p>
      <p
        style={{
          fontSize: 26, fontWeight: 800, fontFamily: 'var(--font-display)',
          margin: '0 0 18px', wordBreak: 'break-word',
        }}
      >
        {ssid}
      </p>

      {password !== '' && (
        <>
          <p style={overline}>{t('wifi.password')}</p>
          <button
            type="button"
            onClick={copy}
            aria-label={t('wifi.tapToCopy')}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              width: '100%', cursor: 'pointer', font: 'inherit', color: 'var(--color-ink)',
              background: copied ? 'var(--color-grass)' : 'var(--color-sunny)',
              border: '2px solid var(--color-ink)', borderRadius: 12,
              padding: '12px 14px', margin: '0 0 20px',
            }}
          >
            <span
              style={{
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                fontSize: 20, fontWeight: 700, wordBreak: 'break-all',
              }}
            >
              {password}
            </span>
            <span style={{ fontSize: 13, fontWeight: 700, opacity: 0.7 }}>
              {copied ? t('wifi.copied') : t('wifi.tapToCopy')}
            </span>
          </button>
          {copyFailed && (
            <p style={{ fontSize: 13, color: 'var(--color-tomato-text)', fontWeight: 700, margin: '-12px 0 20px' }}>
              {t('wifi.copyFailed')}
            </p>
          )}
        </>
      )}

      {dataUrl && (
        <div>
          <img
            src={dataUrl}
            alt={t('wifi.qrAlt')}
            width={240}
            height={240}
            style={{
              maxWidth: '100%', height: 'auto', borderRadius: 12,
              border: '2px solid var(--color-ink)',
            }}
          />
          <p style={{ marginTop: 8, fontWeight: 700 }}>{t('wifi.scanToJoin')}</p>
        </div>
      )}

      {qrFailed && (
        <p style={{ fontSize: 13, color: 'var(--color-tomato-text)', fontWeight: 700 }}>{t('wifi.qrFailed')}</p>
      )}

      <button type="button" onClick={onEdit} style={{ ...ghostBtn, marginTop: 16 }}>
        {t('common.edit')}
      </button>
    </Card>
  )
}
