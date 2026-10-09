import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import SoftPhone from '../../src/index';
import type { SoftPhoneConfig } from '../../src/types';

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

function Harness() {
  const [softPhoneOpen, setSoftPhoneOpen] = useState(true);
  const [callVolume] = useState(0.5);
  const [ringVolume] = useState(0.5);
  const [notifications] = useState(false);
  const [connectOnStart] = useState(true);

  return (
    <SoftPhone
      softPhoneOpen={softPhoneOpen}
      setSoftPhoneOpen={setSoftPhoneOpen}
      callVolume={callVolume}
      ringVolume={ringVolume}
      connectOnStart={connectOnStart}
      notifications={notifications}
      config={config}
      setConnectOnStartToLocalStorage={() => {}}
      setNotifications={() => {}}
      setCallVolume={() => {}}
      setRingVolume={() => {}}
      builtInLauncher={false}
      asteriskAccounts={[]}
      timelocale="UTC"
    />
  );
}

createRoot(document.getElementById('root')!).render(<Harness />);
