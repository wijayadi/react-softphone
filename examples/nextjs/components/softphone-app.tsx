'use client';

import { useCallback, useState } from 'react';
import dynamic from 'next/dynamic';

// The softphone component is browser-only (WebRTC + JsSIP), so we load it
// client-side only. `@sengsara/react-softphone` is linked via a local path
// dependency (see package.json -> "@sengsara/react-softphone": "file:../..").
const SoftPhone = dynamic(() => import('@sengsara/react-softphone'), {
  ssr: false,
  loading: () => <p style={{ opacity: 0.7 }}>Loading softphone…</p>,
});

type PersistentSetter<T> = (value: T) => void;

/**
 * Small localStorage-backed state helper. The stored value is read lazily on
 * the client; these values are not part of the server-rendered markup, so this
 * does not cause a hydration mismatch.
 */
function usePersistentState<T>(key: string, initial: T): [T, PersistentSetter<T>] {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initial;
    }
    try {
      const raw = window.localStorage.getItem(key);
      return raw !== null ? (JSON.parse(raw) as T) : initial;
    } catch {
      // Ignore malformed/unavailable storage.
      return initial;
    }
  });

  const setValuePersisted = useCallback<PersistentSetter<T>>(
    (next) => {
      setValue(next);
      try {
        window.localStorage.setItem(key, JSON.stringify(next));
      } catch {
        // Ignore unavailable storage.
      }
    },
    [key],
  );

  return [value, setValuePersisted];
}

// --- SIP configuration (provided through .env / .env.example) --------------
const domain = process.env.NEXT_PUBLIC_SIP_DOMAIN ?? 'your-sip-server.com';
const extension = process.env.NEXT_PUBLIC_SIP_EXTENSION ?? '1001';

const sipConfig = {
  domain,
  uri: `sip:${extension}@${domain}`,
  password: process.env.NEXT_PUBLIC_SIP_PASSWORD ?? 'your-sip-password',
  ws_servers:
    process.env.NEXT_PUBLIC_SIP_WS_SERVER ?? `wss://${domain}:8089/ws`,
  display_name: process.env.NEXT_PUBLIC_SIP_DISPLAY_NAME ?? extension,
  debug: process.env.NEXT_PUBLIC_SIP_DEBUG === 'true',
  session_timers_refresh_method: 'invite',
};

export default function SoftPhoneApp() {
  const [softPhoneOpen, setSoftPhoneOpen] = useState(false);

  const [callVolume, setCallVolume] = usePersistentState(
    'softphone-call-volume',
    0.8,
  );
  const [ringVolume, setRingVolume] = usePersistentState(
    'softphone-ring-volume',
    0.6,
  );
  const [notifications, setNotifications] = usePersistentState(
    'softphone-notifications',
    true,
  );
  const [connectOnStart, setConnectOnStart] = usePersistentState(
    'softphone-connect-on-start',
    // Auto-connect on load so the demo actually opens the SIP WebSocket.
    // The component only starts JsSIP when `connectOnStart` is true at mount
    // (or when the user flips the "Connected" switch in Settings).
    true,
  );

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-3xl font-semibold">📞 My Softphone App</h1>
      <p className="opacity-80">
        Connected target:{' '}
        <code className="rounded bg-black/[.06] px-1.5 py-0.5 font-mono dark:bg-white/[.08]">
          {sipConfig.uri}
        </code>
      </p>
      <p className="max-w-md text-sm opacity-60">
        Credentials are read from <code>.env</code>. The softphone component is
        referenced by path ({'{'}file:../..{'}'}), not installed from npm.
      </p>

      <button
        type="button"
        onClick={() => setSoftPhoneOpen(true)}
        className="cursor-pointer rounded bg-[#1976d2] px-6 py-3 text-base font-medium text-white transition-colors hover:bg-[#1565c0]"
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
    </div>
  );
}
