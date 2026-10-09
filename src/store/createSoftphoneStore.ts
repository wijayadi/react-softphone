import { createStore } from 'zustand/vanilla';
import _ from 'lodash';
import { WebSocketInterface } from 'jssip';
import CallsFlowControl from '../CallsFlowControl';
import {
  AUDIO_PATHS,
  NOTIFICATION_DEFAULTS,
  debugError,
  debugLog,
  hasNotificationAPI,
  isBrowser,
  logError,
  logInfo,
  logWarn,
} from '../constants';
import { parseDialTarget } from '../utils/dial';
import { m, getSoftphoneLocale, setSoftphoneLocale, translateDialReason } from '../i18n';
import type { SoftPhoneAssets, SoftPhoneState } from '../types';
import type {
  DurationState,
  SoftphoneInit,
  SoftphoneStore,
  SoftphoneStoreApi,
} from './types';

const clamp01 = (value: number): number => {
  if (typeof value !== 'number' || Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(1, value));
};

const emptyDuration = (): DurationState => ({
  callDuration: 0,
  callDurationIntrId: 0,
  callDurationActive: false,
  ringDuration: 0,
  ringDurationIntrId: 0,
  ringDurationActive: false,
});

const emptyDurations = (): DurationState[] => [
  emptyDuration(),
  emptyDuration(),
  emptyDuration(),
];

const resolveAssets = (assets?: SoftPhoneAssets) => ({
  ringingSound: assets?.ringingSound ?? AUDIO_PATHS.RINGING,
  ringbackSound: assets?.ringbackSound ?? AUDIO_PATHS.RINGBACK,
  notificationIcon: assets?.notificationIcon ?? NOTIFICATION_DEFAULTS.ICON,
});

const createDefaultPhoneState = (init: SoftphoneInit): SoftPhoneState => {
  const channel = (id: number, info: string) => ({
    id,
    info,
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
  });

  return {
    displayCalls: [channel(0, 'Ch 1'), channel(1, 'Ch 2'), channel(2, 'Ch 3')],
    connectOnStart: init.connectOnStart ?? true,
    notifications: init.notifications as boolean,
    phoneCalls: [],
    connectedPhone: false,
    connectingPhone: false,
    activeCalls: [],
    callVolume:
      typeof init.callVolume === 'number' && !isNaN(init.callVolume)
        ? init.callVolume
        : 0.5,
    ringVolume:
      typeof init.ringVolume === 'number' && !isNaN(init.ringVolume)
        ? init.ringVolume
        : 0.5,
    userPresence: 'available',
    darkMode: false,
  };
};

const tickDurations = (
  durations: DurationState[],
  displayCalls: SoftPhoneState['displayCalls'],
): DurationState[] => {
  let next: DurationState[] | null = null;
  const ensure = () => {
    if (!next) next = durations.slice();
    return next;
  };

  displayCalls.forEach((displayCall, key) => {
    const current = (next ?? durations)[key];
    if (displayCall.inCall) {
      if (!displayCall.inAnswer && !current.ringDurationActive) {
        const copy = ensure();
        copy[key] = { ...copy[key], ringDuration: copy[key].ringDuration + 1 };
      } else if (displayCall.inAnswer && !current.callDurationActive) {
        const copy = ensure();
        copy[key] = {
          ...copy[key],
          callDuration: copy[key].callDuration + 1,
          ringDurationActive: false,
        };
      }
    } else if (current.callDuration !== 0 || current.ringDuration !== 0) {
      const copy = ensure();
      copy[key] = {
        ...copy[key],
        callDuration: 0,
        callDurationActive: false,
        ringDuration: 0,
        ringDurationActive: false,
      };
    }
  });

  return next ?? durations;
};

/**
 * Create a zustand store for a single softphone session. All call logic and
 * state live here so any number of views can subscribe to the same session.
 */
export function createSoftphoneStore(init: SoftphoneInit): SoftphoneStoreApi {
  // Apply the requested locale before any message is evaluated. When no `lang`
  // is given, keep whatever locale is already active (e.g. set by the host).
  const initialLocale =
    init.lang !== undefined ? setSoftphoneLocale(init.lang) : getSoftphoneLocale();
  const controller = new CallsFlowControl();
  let media: {
    player: { current: HTMLAudioElement | null };
    ringer: { current: HTMLAudioElement | null };
  } = { player: { current: null }, ringer: { current: null } };
  let tickerId: ReturnType<typeof setInterval> | null = null;
  let lastConfigJson = JSON.stringify(init.config);

  const store = createStore<SoftphoneStore>((set, get) => {
    const patchPhone = (
      updater: (state: SoftPhoneState) => Partial<SoftPhoneState>,
    ) => {
      set((s) => ({ phoneState: { ...s.phoneState, ...updater(s.phoneState) } }));
    };

    const requestNotificationPermission = () => {
      if (hasNotificationAPI()) {
        window.Notification.requestPermission().then((permission) => {
          debugLog('Notification permission:', permission);
        });
      } else {
        debugLog('Notification API not available in this environment');
      }
    };

    const handleIncomingNotification = (caller: string) => {
      const { notificationIcon } = resolveAssets(get().props.assets);
      if (hasNotificationAPI()) {
        const createNotification = () => {
          try {
            const notification = new window.Notification(
              m.notification_title(),
              { icon: notificationIcon, body: m.notification_caller({ name: caller }) },
            );
            notification.addEventListener('click', () => {
              if (isBrowser()) {
                window.parent.focus();
                window.focus();
                notification.close();
              }
            });
          } catch (error) {
            debugError('Error creating notification:', error);
          }
        };

        if (window.Notification.permission === 'granted') {
          createNotification();
        } else if (window.Notification.permission === 'default') {
          window.Notification.requestPermission().then((permission) => {
            if (permission === 'granted') createNotification();
          });
        }
      }
    };

    // --- JsSIP controller events ---------------------------------------------
    const emitEngine = (event: string, payload: any) => {
      switch (event) {
        case 'connecting':
          logInfo('SIP transport connecting…', payload);
          break;
        case 'connected':
          logInfo('SIP transport connected');
          controller.connectedPhone = true;
          patchPhone(() => ({ connectingPhone: false, connectedPhone: true }));
          break;
        case 'registered':
          logInfo('SIP registration succeeded', payload && payload.response);
          break;
        case 'unregistered':
          logWarn('SIP unregistered', payload && payload.response);
          break;
        case 'disconnected':
          logWarn('SIP transport disconnected', payload);
          controller.connectedPhone = false;
          patchPhone(() => ({ connectingPhone: false, connectedPhone: false }));
          break;
        case 'registrationFailed':
          logError(
            `SIP registration failed: ${
              (payload && payload.response && payload.response.status_code) || ''
            } ${
              (payload &&
                payload.response &&
                payload.response.reason_phrase) ||
              (payload && payload.cause) ||
              ''
            }`.trim(),
            payload,
          );
          break;
        default:
          break;
      }
    };

    const emitCall = (type: string, payload: any, data: any) => {
      const before = get().phoneState;

      switch (type) {
        case 'reinvite':
          set((s) => ({
            phoneState: {
              ...s.phoneState,
              displayCalls: _.map(s.phoneState.displayCalls, (a) =>
                a.sessionId === payload
                  ? {
                      ...a,
                      allowAttendedTransfer: true,
                      allowTransfer: true,
                      inAnswerTransfer: true,
                      inTransfer: true,
                      attendedTransferOnline:
                        data.request.headers['P-Asserted-Identity'][0].raw.split(
                          ' ',
                        )[0],
                    }
                  : a,
              ),
            },
          }));
          break;

        case 'incomingCall': {
          const caller =
            payload.remote_identity.display_name !== ''
              ? `${payload.remote_identity.display_name || ''}`
              : payload.remote_identity.uri.user;
          set((s) => ({
            phoneState: {
              ...s.phoneState,
              phoneCalls: [
                ...s.phoneState.phoneCalls,
                {
                  callNumber: caller,
                  sessionId: payload.id,
                  ring: false,
                  duration: 0,
                  direction: payload.direction,
                },
              ],
            },
          }));
          debugLog('Incoming call received, preparing notification');
          handleIncomingNotification(caller);
          break;
        }

        case 'outgoingCall': {
          const newState = _.cloneDeep(before);
          newState.displayCalls[get().activeChannel] = {
            ...before.displayCalls[get().activeChannel],
            inCall: true,
            hold: false,
            inAnswer: false,
            direction: payload.direction,
            sessionId: payload.id,
            callNumber: payload.remote_identity.uri.user,
            callInfo: 'Ringing',
          };
          set((s) => ({
            phoneState: { ...s.phoneState, displayCalls: newState.displayCalls },
            dialState: '',
          }));
          break;
        }

        case 'callEnded': {
          set((s) => ({
            phoneState: {
              ...s.phoneState,
              phoneCalls: before.phoneCalls.filter(
                (item) => item.sessionId !== payload,
              ),
              displayCalls: _.map(s.phoneState.displayCalls, (a) =>
                a.sessionId === payload
                  ? {
                      ...a,
                      inCall: false,
                      inAnswer: false,
                      hold: false,
                      muted: 0,
                      inTransfer: false,
                      inAnswerTransfer: false,
                      allowFinishTransfer: false,
                      allowTransfer: true,
                      allowAttendedTransfer: true,
                      inConference: false,
                      callInfo: 'Ready',
                    }
                  : a,
              ),
            },
          }));

          const firstCheck = before.phoneCalls.filter(
            (item) =>
              item.sessionId === payload && item.direction === 'incoming',
          );
          const secondCheck = before.displayCalls.filter(
            (item) => item.sessionId === payload,
          );
          if (firstCheck.length === 1) {
            set((s) => ({
              calls: [
                {
                  status: 'missed',
                  sessionId: firstCheck[0].sessionId,
                  direction: firstCheck[0].direction,
                  number: firstCheck[0].callNumber,
                  time: new Date(),
                },
                ...s.calls,
              ],
            }));
          } else if (secondCheck.length === 1) {
            set((s) => ({
              calls: [
                {
                  status: secondCheck[0].inAnswer ? 'answered' : 'missed',
                  sessionId: secondCheck[0].sessionId,
                  direction: secondCheck[0].direction,
                  number: secondCheck[0].callNumber,
                  time: new Date(),
                },
                ...s.calls,
              ],
            }));
          }
          break;
        }

        case 'callAccepted': {
          let displayCallId = data.customPayload;
          let acceptedCall = before.phoneCalls.filter(
            (item) => item.sessionId === payload,
          );
          if (!acceptedCall[0]) {
            acceptedCall = before.displayCalls.filter(
              (item) => item.sessionId === payload,
            ) as unknown as typeof acceptedCall;
            displayCallId = (acceptedCall[0] as any).id;
          }
          set((s) => ({
            phoneState: {
              ...s.phoneState,
              phoneCalls: before.phoneCalls.filter(
                (item) => item.sessionId !== payload,
              ),
              displayCalls: _.map(s.phoneState.displayCalls, (a) =>
                a.id === displayCallId
                  ? {
                      ...a,
                      callNumber: acceptedCall[0].callNumber,
                      sessionId: payload,
                      duration: 0,
                      direction: acceptedCall[0].direction,
                      inCall: true,
                      inAnswer: true,
                      hold: false,
                      callInfo: 'Answered',
                    }
                  : a,
              ),
            },
          }));
          break;
        }

        case 'hold':
          patchPhone((state) => ({
            displayCalls: _.map(state.displayCalls, (a) =>
              a.sessionId === payload ? { ...a, hold: true } : a,
            ),
          }));
          break;
        case 'unhold':
          patchPhone((state) => ({
            displayCalls: _.map(state.displayCalls, (a) =>
              a.sessionId === payload ? { ...a, hold: false } : a,
            ),
          }));
          break;
        case 'unmute':
          patchPhone((state) => ({
            displayCalls: _.map(state.displayCalls, (a) =>
              a.sessionId === payload ? { ...a, muted: 0 } : a,
            ),
          }));
          break;
        case 'mute':
          patchPhone((state) => ({
            displayCalls: _.map(state.displayCalls, (a) =>
              a.sessionId === payload ? { ...a, muted: 1 } : a,
            ),
          }));
          break;
        case 'notify':
          get().notify(payload);
          break;
        default:
          break;
      }
    };

    controller.engineEvent = emitEngine;
    controller.onCallActionConnection = emitCall;

    const startTicker = () => {
      if (tickerId !== null) return;
      tickerId = setInterval(() => {
        set((s) => ({
          durations: tickDurations(s.durations, s.phoneState.displayCalls),
        }));
      }, 1000);
    };

    return {
      phoneState: createDefaultPhoneState(init),
      calls: [],
      dialState: '',
      activeChannel: 0,
      bodyTab: 0,
      locale: initialLocale,
      notification: { open: false, message: '' },
      configDraft: init.config,
      activeConfig: init.config,
      durations: emptyDurations(),
      timelocale: init.timelocale ?? 'UTC',
      asteriskAccounts: init.asteriskAccounts ?? [],
      showConfigEditor: init.showConfigEditor ?? true,
      props: init,

      // --- lifecycle ---------------------------------------------------------
      setProps: (next) => {
        const incoming = next as Partial<SoftphoneInit>;
        const hasConfig = incoming.config !== undefined;
        const serialized = hasConfig ? JSON.stringify(incoming.config) : null;
        const configChanged =
          hasConfig && serialized !== null && serialized !== lastConfigJson;
        if (configChanged && serialized !== null) lastConfigJson = serialized;
        const nextLocale =
          incoming.lang !== undefined
            ? setSoftphoneLocale(incoming.lang)
            : undefined;
        set((s) => ({
          props: { ...s.props, ...incoming },
          timelocale: incoming.timelocale ?? s.timelocale,
          asteriskAccounts: incoming.asteriskAccounts ?? s.asteriskAccounts,
          showConfigEditor: incoming.showConfigEditor ?? s.showConfigEditor,
          ...(nextLocale !== undefined ? { locale: nextLocale } : {}),
          ...(configChanged ? { configDraft: incoming.config } : {}),
        }));
      },

      attachMedia: (nextMedia) => {
        media = nextMedia;
        controller.player = nextMedia.player as any;
        controller.ringer = nextMedia.ringer as any;

        const { phoneState, props } = get();
        const assets = resolveAssets(props.assets);
        const safeCallVolume = clamp01(phoneState.callVolume);
        const safeRingVolume = clamp01(phoneState.ringVolume);
        const playerEl = nextMedia.player.current;
        const ringerEl = nextMedia.ringer.current;

        try {
          if (playerEl) {
            playerEl.defaultMuted = false;
            playerEl.autoplay = true;
            playerEl.volume = safeCallVolume;
          }
          if (ringerEl) {
            ringerEl.src = assets.ringingSound;
            ringerEl.loop = true;
            ringerEl.volume = safeRingVolume;
          }
          const ringbackTone = new Audio(assets.ringbackSound);
          ringbackTone.loop = true;
          ringbackTone.volume = safeRingVolume;
          controller.ringbackTone = ringbackTone;

          if ('mediaSession' in navigator) {
            navigator.mediaSession.setActionHandler('play', () => {
              debugLog(
                'Media play key blocked to prevent playing the ringer',
              );
            });
          }
        } catch (error) {
          debugError('Media session error:', error);
        }
      },

      mount: () => {
        const { activeConfig, phoneState } = get();
        controller.config = {
          ...activeConfig,
          sockets: new WebSocketInterface(activeConfig.ws_servers as string),
        };
        controller.init();
        if (phoneState.connectOnStart) {
          get().connect(true);
        }
        startTicker();
      },

      unmount: () => {
        if (tickerId !== null) {
          clearInterval(tickerId);
          tickerId = null;
        }
        controller.destroy();
      },

      // --- dialer ------------------------------------------------------------
      setDial: (value) => set({ dialState: value }),
      appendDialKey: (value) =>
        set((s) => ({ dialState: s.dialState + value })),
      clearDial: () => set({ dialState: '' }),
      setActiveChannel: (index) => set({ activeChannel: index }),
      setBodyTab: (index) => set({ bodyTab: index }),
      setLang: (locale) => set({ locale: setSoftphoneLocale(locale) }),

      notify: (message) => {
        if (message) set({ notification: { open: true, message } });
      },
      dismissNotification: () =>
        set((s) => ({ notification: { ...s.notification, open: false } })),

      // --- connection / config ----------------------------------------------
      connect: (connectionStatus) => {
        patchPhone(() => ({ connectingPhone: true }));
        if (connectionStatus === true) {
          logInfo('User requested connect');
          controller.start();
        } else {
          logInfo('User requested disconnect');
          controller.stop();
        }
      },

      setConfigField: (field, value) =>
        set((s) => ({ configDraft: { ...s.configDraft, [field]: value } })),

      reconnect: () => {
        const draft = get().configDraft;
        const missing: string[] = [];
        if (!draft.domain) missing.push(m.domain());
        if (!draft.uri) missing.push(m.sip_uri());
        if (!draft.ws_servers) missing.push(m.websocket_server());
        if (missing.length) {
          get().notify(m.missing_config({ fields: missing.join(', ') }));
          return;
        }

        lastConfigJson = JSON.stringify(draft);
        patchPhone(() => ({ connectingPhone: true, connectedPhone: false }));

        try {
          controller.config = {
            ...draft,
            sockets: new WebSocketInterface(draft.ws_servers as string),
          };
          set({ activeConfig: draft });
          controller.reconnect();
          get().props.onConfigChange?.(draft);
        } catch (error) {
          logError('Failed to apply SIP configuration', error);
          get().notify(m.failed_apply_config());
          patchPhone(() => ({ connectingPhone: false }));
        }
      },

      setVolume: (name, value) => {
        const safeValue = clamp01(value);
        patchPhone(() => ({ [name]: safeValue }) as Partial<SoftPhoneState>);

        if (name === 'ringVolume') {
          if (media.ringer.current) media.ringer.current.volume = safeValue;
          if (controller.ringbackTone) {
            controller.ringbackTone.volume = safeValue;
          }
          get().props.setRingVolume?.(safeValue);
        } else if (name === 'callVolume') {
          if (media.player.current) media.player.current.volume = safeValue;
          get().props.setCallVolume?.(safeValue);
        }
      },

      toggleAutoConnect: (value) => {
        patchPhone(() => ({ connectOnStart: value }));
        get().props.setConnectOnStartToLocalStorage?.(value);
      },

      toggleNotifications: (value) => {
        patchPhone(() => ({ notifications: value }));
        get().props.setNotifications?.(value);
        if (value) requestNotificationPermission();
      },

      // --- call actions ------------------------------------------------------
      call: () => {
        const { dialState, activeConfig } = get();
        const target = parseDialTarget(dialState, activeConfig && activeConfig.domain);
        logInfo('Dial submit', { input: dialState, target });
        if (!target.valid) {
          logError(`Invalid dial input "${dialState}": ${target.reason}`);
          get().notify(
            m.invalid_number({ reason: translateDialReason(target.reason) }),
          );
          return;
        }
        controller.call(dialState);
      },

      hangup: () => {
        const { phoneState, activeChannel } = get();
        controller.hungup(phoneState.displayCalls[activeChannel].sessionId);
      },

      hold: (sessionId, hold) => {
        if (hold === false) controller.hold(sessionId);
        else if (hold === true) controller.unhold(sessionId);
      },

      answer: (sessionId) => {
        const { phoneState, activeChannel } = get();
        controller.activeChanel = phoneState.displayCalls[activeChannel];
        controller.answer(sessionId);
      },
      reject: (sessionId) => controller.hungup(sessionId),
      toggleMicMute: () => controller.setMicMuted(),

      transfer: (transferedNumber) => {
        const { dialState, phoneState, activeChannel } = get();
        if (!dialState && !transferedNumber) return;
        set((s) => ({
          phoneState: {
            ...s.phoneState,
            displayCalls: _.map(s.phoneState.displayCalls, (a) =>
              a.id === activeChannel
                ? {
                    ...a,
                    transferNumber: dialState || transferedNumber,
                    inTransfer: true,
                    allowAttendedTransfer: false,
                    allowFinishTransfer: false,
                    allowTransfer: false,
                    callInfo: 'Transferring...',
                  }
                : a,
            ),
          },
        }));
        if (controller.activeCall) {
          controller.activeCall.sendDTMF(`##${dialState || transferedNumber}`);
        }
        void phoneState;
      },

      attendedTransfer: (type, number) => {
        const { dialState, phoneState, activeChannel } = get();
        switch (type) {
          case 'transfer':
            set((s) => ({
              phoneState: {
                ...s.phoneState,
                displayCalls: _.map(s.phoneState.displayCalls, (a) =>
                  a.id === activeChannel
                    ? {
                        ...a,
                        transferNumber: dialState || number,
                        allowAttendedTransfer: false,
                        allowTransfer: false,
                        transferControl: true,
                        allowFinishTransfer: false,
                        callInfo: 'Attended Transfer',
                        inTransfer: true,
                      }
                    : a,
                ),
              },
            }));
            if (controller.activeCall) {
              controller.activeCall.sendDTMF(`*2${dialState || number}`);
            }
            break;
          case 'merge':
            set((s) => ({
              phoneState: {
                ...s.phoneState,
                displayCalls: _.map(s.phoneState.displayCalls, (a) =>
                  a.sessionId ===
                  phoneState.displayCalls[activeChannel].sessionId
                    ? { ...a, inTransfer: false, attendedTransferOnline: '' }
                    : a,
                ),
              },
            }));
            if (controller.activeCall) controller.activeCall.sendDTMF('*5');
            break;
          case 'swap':
            if (controller.activeCall) controller.activeCall.sendDTMF('*6');
            break;
          case 'finish':
            if (controller.activeCall) controller.activeCall.sendDTMF('*4');
            break;
          case 'cancel':
            set((s) => ({
              phoneState: {
                ...s.phoneState,
                displayCalls: _.map(s.phoneState.displayCalls, (a) =>
                  a.sessionId ===
                  phoneState.displayCalls[activeChannel].sessionId
                    ? {
                        ...a,
                        inTransfer: false,
                        attendedTransferOnline: '',
                        transferControl: false,
                        allowTransfer: true,
                        allowAttendedTransfer: true,
                      }
                    : a,
                ),
              },
            }));
            if (controller.activeCall) controller.activeCall.sendDTMF('*3');
            break;
          default:
            break;
        }
      },
    };
  });

  return store;
}
