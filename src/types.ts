// Shared types for the softphone component. These describe the public props
// and the shape of the internal call/state objects. They are exported so
// TypeScript consumers can type their integration code.

export interface SoftPhoneConfig {
  /** SIP domain, e.g. `sip.example.com`. */
  domain: string;
  /** Full SIP URI, e.g. `sip:1001@sip.example.com`. */
  uri: string;
  /** SIP password. */
  password?: string;
  /** WebSocket server URL (or list of URLs). */
  ws_servers: string | string[];
  /** Display name used for outbound calls. */
  display_name?: string;
  /** Enable verbose JsSIP/Ui debug logging. */
  debug?: boolean;
  /** JsSIP session timers refresh method. */
  session_timers_refresh_method?: string;
  /** Any additional JsSIP UA configuration options. */
  [key: string]: unknown;
}

export interface AsteriskAccount {
  /** Account/extension identifier used as the transfer target. */
  accountId: string;
  /** Human readable label shown in the transfer list. */
  label?: string;
  /** Whether the account is currently online. */
  online?: number | string | boolean;
  [key: string]: unknown;
}

export interface DisplayCall {
  id: number;
  info: string;
  hold: boolean;
  muted: number;
  autoMute: number;
  inCall: boolean;
  inAnswer: boolean;
  inTransfer: boolean;
  callInfo: string;
  inAnswerTransfer: boolean;
  allowTransfer: boolean;
  transferControl: boolean;
  allowAttendedTransfer: boolean;
  transferNumber: string;
  attendedTransferOnline: string;
  inConference: boolean;
  callNumber: string;
  duration: number;
  side: string;
  sessionId: string;
  direction?: string;
  allowFinishTransfer?: boolean;
}

export interface PhoneCall {
  callNumber: string;
  sessionId: string;
  ring: boolean;
  duration: number;
  direction: string;
}

export interface CallLogEntry {
  status: 'missed' | 'answered';
  sessionId: string;
  direction: string;
  number: string;
  time: Date;
}

export interface SoftPhoneState {
  displayCalls: DisplayCall[];
  connectOnStart: boolean;
  notifications: boolean;
  phoneCalls: PhoneCall[];
  connectedPhone: boolean;
  connectingPhone: boolean;
  activeCalls: unknown[];
  callVolume: number;
  ringVolume: number;
  userPresence: string;
  darkMode: boolean;
}

/**
 * URLs/data URIs for the media assets used by the softphone. Every field is
 * optional and falls back to the built-in defaults.
 */
export interface SoftPhoneAssets {
  /** Incoming call ringtone URL. Defaults to `/sound/ringing.ogg`. */
  ringingSound?: string;
  /** Outgoing call ringback tone URL. Defaults to `/sound/ringback.ogg`. */
  ringbackSound?: string;
  /** Icon used for browser call notifications. Defaults to the built-in icon. */
  notificationIcon?: string;
}

export type LauncherPosition =
  | 'bottom-right'
  | 'bottom-left'
  | 'top-right'
  | 'top-left';

export type LauncherSize = 'small' | 'medium' | 'large';

export interface SoftPhoneProps {
  /** SIP configuration object (required). */
  config: SoftPhoneConfig;
  /** Timezone used to render call history timestamps. */
  timelocale?: string;
  /** Persist the auto-connect preference. */
  setConnectOnStartToLocalStorage?: (value: boolean) => void;
  /** Auto-connect on mount. */
  connectOnStart?: boolean;
  /** Accounts available for call transfer. */
  asteriskAccounts?: AsteriskAccount[];
  /** Persist the notifications preference. */
  setNotifications?: (value: boolean) => void;
  /** Enable browser notifications for incoming calls. */
  notifications?: boolean;
  /** Persist the call volume preference. */
  setCallVolume?: (value: number) => void;
  /** Persist the ring volume preference. */
  setRingVolume?: (value: number) => void;
  /** Controls softphone drawer visibility (when not using the built-in launcher). */
  softPhoneOpen?: boolean;
  /** Callback fired when the drawer visibility changes. */
  setSoftPhoneOpen?: (open: boolean) => void;
  /** Call audio volume (0-1). */
  callVolume?: number;
  /** Ring audio volume (0-1). */
  ringVolume?: number;
  /** Render the built-in floating launcher button. */
  builtInLauncher?: boolean;
  /** Position of the built-in launcher. */
  launcherPosition?: LauncherPosition;
  /** Size of the built-in launcher. */
  launcherSize?: LauncherSize;
  /** Color of the built-in launcher. */
  launcherColor?: string;
  /** Override the media asset URLs (ringtone, ringback tone, notification icon). */
  assets?: SoftPhoneAssets;
  /** Show the editable SIP account (config) section in Settings. Default `true`. */
  showConfigEditor?: boolean;
  /** Called with the new config after the user applies it via Reconnect. */
  onConfigChange?: (config: SoftPhoneConfig) => void;
}
