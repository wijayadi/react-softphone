import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import SoftPhone from '../../src/index';
import SoftPhonePanel from '../../src/SoftPhonePanel';
import { SoftphoneProvider } from '../../src/store/context';
import { createSoftphoneStore } from '../../src/store/createSoftphoneStore';
import type { AsteriskAccount, SoftPhoneConfig } from '../../src/types';

// Deterministic config for tests. The real WebSocket is replaced by e2e/fake-sip.js.
const config: SoftPhoneConfig = {
  domain: '127.0.0.1',
  uri: 'sip:1000@127.0.0.1',
  password: 'test-secret',
  ws_servers: 'wss://127.0.0.1:8089/ws',
  display_name: '1000',
  debug: false,
  session_timers_refresh_method: 'invite',
};

// Query-string switches so a single harness can cover the component's prop
// variations (launcher, hidden config editor, offline mode, mirrored panels).
const params = new URLSearchParams(window.location.search);
const flag = (key: string, fallback: boolean): boolean => {
  const value = params.get(key);
  if (value === null) return fallback;
  return value === '1' || value === 'true';
};

const initial = {
  softPhoneOpen: flag('softPhoneOpen', true),
  builtInLauncher: flag('builtInLauncher', false),
  showConfigEditor: flag('showConfigEditor', true),
  connectOnStart: flag('connectOnStart', true),
  notifications: flag('notifications', false),
  mirror: flag('mirror', false),
  lang: params.get('lang') ?? 'en',
};

const sampleAccounts: AsteriskAccount[] = [
  { accountId: '1001', label: 'Reception', online: 1 },
  { accountId: '1002', label: 'Support', online: 0 },
];

// Exposed to Playwright so tests can assert callback wiring without relying
// purely on DOM state.
(window as unknown as { __test: Record<string, unknown> }).__test = {
  configChanges: [],
  softPhoneOpen: initial.softPhoneOpen,
  connectOnStart: initial.connectOnStart,
  notifications: initial.notifications,
  callVolume: 0.5,
  ringVolume: 0.5,
  lang: initial.lang,
};

function Harness() {
  const [softPhoneOpen, setSoftPhoneOpen] = useState(initial.softPhoneOpen);
  const [callVolume, setCallVolume] = useState(0.5);
  const [ringVolume, setRingVolume] = useState(0.5);
  const [notifications, setNotifications] = useState(initial.notifications);
  const [connectOnStart, setConnectOnStart] = useState(initial.connectOnStart);

  return (
    <SoftPhone
      softPhoneOpen={softPhoneOpen}
      setSoftPhoneOpen={(open) => {
        (window as unknown as { __test: Record<string, unknown> }).__test.softPhoneOpen = open;
        setSoftPhoneOpen(open);
      }}
      callVolume={callVolume}
      ringVolume={ringVolume}
      connectOnStart={connectOnStart}
      notifications={notifications}
      config={config}
      setConnectOnStartToLocalStorage={(value) => {
        (window as unknown as { __test: Record<string, unknown> }).__test.connectOnStart = value;
        setConnectOnStart(value);
      }}
      setNotifications={(value) => {
        (window as unknown as { __test: Record<string, unknown> }).__test.notifications = value;
        setNotifications(value);
      }}
      setCallVolume={(value) => {
        (window as unknown as { __test: Record<string, unknown> }).__test.callVolume = value;
        setCallVolume(value);
      }}
      setRingVolume={(value) => {
        (window as unknown as { __test: Record<string, unknown> }).__test.ringVolume = value;
        setRingVolume(value);
      }}
      onConfigChange={(next) => {
        ((window as unknown as { __test: { configChanges: SoftPhoneConfig[] } }).__test.configChanges).push(next);
      }}
      builtInLauncher={initial.builtInLauncher}
      showConfigEditor={initial.showConfigEditor}
      asteriskAccounts={sampleAccounts}
      timelocale="UTC"
      lang={initial.lang}
    />
  );
}

/**
 * Two panels bound to one shared store: any state change (dialer, tabs, call,
 * connection) is mirrored in both views.
 */
function MirrorHarness() {
  const [store] = useState(() =>
    createSoftphoneStore({
      config,
      connectOnStart: initial.connectOnStart,
      notifications: initial.notifications,
      timelocale: 'UTC',
      showConfigEditor: initial.showConfigEditor,
      asteriskAccounts: sampleAccounts,
      lang: initial.lang,
    }),
  );

  (window as unknown as { __test: Record<string, unknown> }).__test.store = store;

  return (
    <SoftphoneProvider store={store}>
      <div style={{ display: 'flex', gap: 16, padding: 16 }}>
        <div style={{ width: 340 }}>
          <SoftPhonePanel inputId="phone-input-a" />
        </div>
        <div style={{ width: 340 }}>
          <SoftPhonePanel inputId="phone-input-b" />
        </div>
      </div>
    </SoftphoneProvider>
  );
}

createRoot(document.getElementById('root')!).render(
  initial.mirror ? <MirrorHarness /> : <Harness />,
);
