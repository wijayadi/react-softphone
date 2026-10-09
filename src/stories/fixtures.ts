import type {
  AsteriskAccount,
  CallLogEntry,
  DisplayCall,
  SoftPhoneConfig,
  SoftPhoneState,
} from '../types';

export const noop = () => {};

export const mockConfig: SoftPhoneConfig = {
  domain: 'sip.example.com',
  uri: 'sip:1001@sip.example.com',
  password: 'secret',
  ws_servers: 'wss://sip.example.com:8089/ws',
  display_name: '1001',
  debug: false,
  session_timers_refresh_method: 'invite',
};

export const createDisplayCall = (
  overrides: Partial<DisplayCall> = {},
): DisplayCall => ({
  id: 0,
  info: 'Ch 1',
  hold: false,
  muted: 0,
  autoMute: 0,
  inCall: false,
  inAnswer: false,
  inTransfer: false,
  callInfo: 'Ready',
  inAnswerTransfer: false,
  allowTransfer: true,
  transferControl: false,
  allowAttendedTransfer: true,
  transferNumber: '',
  attendedTransferOnline: '',
  inConference: false,
  callNumber: '',
  duration: 0,
  side: '',
  sessionId: '',
  ...overrides,
});

export const createSoftPhoneState = (
  overrides: Partial<SoftPhoneState> = {},
): SoftPhoneState => ({
  displayCalls: [
    createDisplayCall({ id: 0, info: 'Ch 1' }),
    createDisplayCall({ id: 1, info: 'Ch 2' }),
    createDisplayCall({ id: 2, info: 'Ch 3' }),
  ],
  connectOnStart: false,
  notifications: false,
  phoneCalls: [],
  connectedPhone: true,
  connectingPhone: false,
  activeCalls: [],
  callVolume: 0.8,
  ringVolume: 0.6,
  userPresence: 'available',
  darkMode: false,
  ...overrides,
});

export const mockAccounts: AsteriskAccount[] = [
  { accountId: '1001', label: 'Reception', online: 1 },
  { accountId: '1002', label: 'Support', online: 1 },
  { accountId: '1003', label: 'Sales', online: 0 },
];

export const mockCalls: CallLogEntry[] = [
  {
    status: 'answered',
    sessionId: 'call-1',
    direction: 'outgoing',
    number: '1002',
    time: new Date('2026-01-02T10:15:00Z'),
  },
  {
    status: 'missed',
    sessionId: 'call-2',
    direction: 'incoming',
    number: '1003',
    time: new Date('2026-01-02T09:05:00Z'),
  },
];
