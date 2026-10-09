import type { StoreApi } from 'zustand/vanilla';
import type { MutableRefObject } from 'react';
import type {
  AsteriskAccount,
  CallLogEntry,
  SoftPhoneConfig,
  SoftPhoneProps,
  SoftPhoneState,
} from '../types';

/**
 * Session-related props. These are the props that the shared store needs; the
 * presentational shell props (drawer/launcher) stay on `<SoftPhone />`.
 */
export type SoftphoneInit = Pick<
  SoftPhoneProps,
  | 'config'
  | 'connectOnStart'
  | 'notifications'
  | 'callVolume'
  | 'ringVolume'
  | 'timelocale'
  | 'asteriskAccounts'
  | 'showConfigEditor'
  | 'assets'
  | 'lang'
  | 'onConfigChange'
  | 'setConnectOnStartToLocalStorage'
  | 'setNotifications'
  | 'setCallVolume'
  | 'setRingVolume'
>;

export interface DurationState {
  callDuration: number;
  callDurationIntrId: number;
  callDurationActive: boolean;
  ringDuration: number;
  ringDurationIntrId: number;
  ringDurationActive: boolean;
}

export interface SoftphoneNotification {
  open: boolean;
  message: string;
}

export interface SoftphoneStoreState {
  /** Core phone/call UI state (was `localStatePhone`). */
  phoneState: SoftPhoneState;
  /** Call history shown in the History tab. */
  calls: CallLogEntry[];
  /** Current dialer input. */
  dialState: string;
  /** Active channel tab (0-2). */
  activeChannel: number;
  /** Active bottom tab: 0 = Settings, 1 = History. */
  bodyTab: number;
  /** Active UI locale (`en` | `id` | `jp`). */
  locale: string;
  /** Snackbar notification. */
  notification: SoftphoneNotification;
  /** Draft config edited in the Settings form. */
  configDraft: SoftPhoneConfig;
  /** Config currently applied to the JsSIP UA. */
  activeConfig: SoftPhoneConfig;
  /** Per-channel call/ring durations, ticked centrally so views stay in sync. */
  durations: DurationState[];
  /** Timezone for call history timestamps. */
  timelocale: string;
  /** Accounts available for transfer. */
  asteriskAccounts: AsteriskAccount[];
  /** Whether the Settings tab shows the editable SIP account section. */
  showConfigEditor: boolean;
  /** Latest external props (callbacks/assets) kept in sync by the provider. */
  props: SoftphoneInit;
}

export interface SoftphoneStoreActions {
  /** Keep the externally supplied session props/callbacks in sync. */
  setProps(init: SoftphoneInit): void;
  /** Attach the view's hidden audio elements and start the duration ticker. */
  mount(): void;
  /** Stop the UA/tickers. */
  unmount(): void;
  /** Register the media elements owned by the session host view. */
  attachMedia(media: {
    player: MutableRefObject<HTMLAudioElement | null>;
    ringer: MutableRefObject<HTMLAudioElement | null>;
  }): void;

  setDial(value: string): void;
  appendDialKey(value: string): void;
  clearDial(): void;
  setActiveChannel(index: number): void;
  setBodyTab(index: number): void;
  /** Change the UI language. */
  setLang(locale: string): void;
  notify(message: string): void;
  dismissNotification(): void;

  connect(connectionStatus: boolean): void;
  reconnect(): void;
  setConfigField(field: string, value: string | boolean): void;
  setVolume(name: 'callVolume' | 'ringVolume', value: number): void;
  toggleAutoConnect(value: boolean): void;
  toggleNotifications(value: boolean): void;

  call(): void;
  hangup(): void;
  hold(sessionId: string, hold: boolean): void;
  answer(sessionId: string): void;
  reject(sessionId: string): void;
  toggleMicMute(): void;
  transfer(number?: string): void;
  attendedTransfer(type: string, number?: unknown): void;
}

export type SoftphoneStore = SoftphoneStoreState & SoftphoneStoreActions;
export type SoftphoneStoreApi = StoreApi<SoftphoneStore>;
