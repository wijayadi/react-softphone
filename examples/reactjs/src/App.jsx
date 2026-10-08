import { useCallback, useState } from 'react'
import SoftPhone from '@sengsara/react-softphone'
import './App.css'

/**
 * Small localStorage-backed state helper. This is a plain client-side Vite
 * app, so reading storage during the initial render is safe.
 */
function usePersistentState(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const raw = window.localStorage.getItem(key)
      return raw !== null ? JSON.parse(raw) : initial
    } catch {
      return initial
    }
  })

  const setValuePersisted = useCallback(
    (next) => {
      setValue(next)
      try {
        window.localStorage.setItem(key, JSON.stringify(next))
      } catch {
        // Ignore unavailable storage.
      }
    },
    [key],
  )

  return [value, setValuePersisted]
}

// --- SIP configuration (provided through .env / .env.example) --------------
const domain = import.meta.env.VITE_SIP_DOMAIN ?? 'your-sip-server.com'
const extension = import.meta.env.VITE_SIP_EXTENSION ?? '1001'

const sipConfig = {
  domain,
  uri: `sip:${extension}@${domain}`,
  password: import.meta.env.VITE_SIP_PASSWORD ?? 'your-sip-password',
  ws_servers:
    import.meta.env.VITE_SIP_WS_SERVER ?? `wss://${domain}:8089/ws`,
  display_name: import.meta.env.VITE_SIP_DISPLAY_NAME ?? extension,
  debug: import.meta.env.VITE_SIP_DEBUG === 'true',
  session_timers_refresh_method: 'invite',
}

function App() {
  const [softPhoneOpen, setSoftPhoneOpen] = useState(false)

  const [callVolume, setCallVolume] = usePersistentState(
    'softphone-call-volume',
    0.8,
  )
  const [ringVolume, setRingVolume] = usePersistentState(
    'softphone-ring-volume',
    0.6,
  )
  const [notifications, setNotifications] = usePersistentState(
    'softphone-notifications',
    true,
  )
  const [connectOnStart, setConnectOnStart] = usePersistentState(
    'softphone-connect-on-start',
    // Auto-connect on load so the demo actually opens the SIP WebSocket.
    // The component only starts JsSIP when `connectOnStart` is true at mount
    // (or when the user flips the "Connected" switch in Settings).
    true,
  )

  return (
    <div className="App">
      <header className="App-header">
        <h1>📞 My Softphone App</h1>
        <p>
          Connected target: <code>{sipConfig.uri}</code>
        </p>
        <p className="hint">
          Credentials are read from <code>.env</code>. The softphone component
          is referenced by path (<code>file:../..</code>), not installed from
          npm.
        </p>

        <button
          type="button"
          className="open-button"
          onClick={() => setSoftPhoneOpen(true)}
        >
          📞 Open Softphone
        </button>

        <SoftPhone
          // Visibility control
          softPhoneOpen={softPhoneOpen}
          setSoftPhoneOpen={setSoftPhoneOpen}
          // Audio settings
          callVolume={callVolume}
          ringVolume={ringVolume}
          // Connection settings
          connectOnStart={connectOnStart}
          notifications={notifications}
          // SIP configuration
          config={sipConfig}
          // Settings callbacks (persisted to localStorage)
          setConnectOnStartToLocalStorage={setConnectOnStart}
          setNotifications={setNotifications}
          setCallVolume={setCallVolume}
          setRingVolume={setRingVolume}
          // Optional built-in floating launcher
          builtInLauncher
          launcherPosition="bottom-right"
          launcherSize="medium"
          launcherColor="primary"
          // Optional accounts for call transfer
          asteriskAccounts={[]}
          // Timezone for call history
          timelocale="UTC"
        />
      </header>
    </div>
  )
}

export default App
