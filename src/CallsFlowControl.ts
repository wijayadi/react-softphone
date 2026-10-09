import { UA, debug } from 'jssip';
import _ from 'lodash';
import { debugLog, debugError, debugWarn, logInfo, logWarn, logError, describeSipEvent } from './constants';
import { parseDialTarget } from './utils/dial';
import { m, translateDialReason } from './i18n';
import type { SipEventDescription } from './constants';

// Map common SIP failure responses to actionable messages.
const FRIENDLY_SIP_FAILURES: Record<number, () => string> = {
  400: () => m.sip_400(),
  401: () => m.sip_401(),
  403: () => m.sip_403(),
  404: () => m.sip_404(),
  408: () => m.sip_408(),
  480: () => m.sip_480(),
  486: () => m.sip_486(),
  487: () => m.sip_487(),
  488: () => m.sip_488(),
  500: () => m.sip_500(),
  503: () => m.sip_503(),
  603: () => m.sip_603(),
};

const friendlyFailure = (info: SipEventDescription): string => {
  if (info.cause === 'User Denied Media Access') {
    return m.sip_media_denied();
  }
  const match = info.response ? String(info.response).match(/^(\d{3})/) : null;
  const code = match ? Number(match[1]) : null;
  if (code && FRIENDLY_SIP_FAILURES[code]) {
    return FRIENDLY_SIP_FAILURES[code]();
  }
  return `${info.cause}${info.response ? ` (${info.response})` : ''}`;
};

/**
 * Internal JsSIP call flow controller. Not part of the package's public API;
 * it is instantiated once (module scope) and driven by the `<SoftPhone />`
 * component.
 */
function CallsFlowControl(this: any) {
  this.onUserAgentAction = () => {};

  this.notify = (message: string) => {
    this.onCallActionConnection('notify', message);
  };
  this.tmpEvent = () => {
    console.log(this.activeCall);
    console.log(this.callsQueue);
    console.log(this.holdCallsQueue);
  };
  this.onCallActionConnection = () => {};
  this.engineEvent = () => {};
  this.setMicMuted = () => {
    if (this.micMuted && this.activeCall) {
      this.activeCall.unmute();
      this.micMuted = false;
      this.onCallActionConnection('unmute', this.activeCall.id);
    } else if (!this.micMuted && this.activeCall) {
      this.micMuted = true;
      this.activeCall.mute();
      this.onCallActionConnection('mute', this.activeCall.id);
    }
  };
  this.hold = (sessionId: string) => {
    // If there is an active call with id that is requested then fire hold
    if (this.activeCall.id === sessionId) {
      this.activeCall.hold();
    }
  };
  this.unhold = (sessionId: string) => {
    // If we dont have active call then unhold the the call with requested id
    if (!this.activeCall) {
      // Find the Requested call in hold calls array
      const toUnhold = _.find(this.holdCallsQueue, { id: sessionId });
      // If we found the call in hold calls array the fire unhold function
      if (toUnhold) {
        toUnhold.unhold();
      }
    } else {
      debugLog('Please exit from all active calls to unhold');
      this.notify(m.exit_active_calls_to_unhold());

    }
  };
  this.micMuted = false;
  this.activeCall = null;
  this.activeChanel = null;
  this.callsQueue = [];
  this.holdCallsQueue = [];
  this.player = {};
  this.ringer = null;
  this.connectedPhone = null;
  this.config = {};
  this.initiated = false;
  this.mediaErrorNotified = false;
  this.playRing = () => {
    if (this.ringer && this.ringer.current) {
      try {
        this.ringer.current.currentTime = 0;
        this.ringer.current.play().catch((err: unknown) => console.error('Ringtone play error:', err));
      } catch (err) {
        console.error('Failed to play ringtone:', err);
      }
    }
  };
  this.stopRing = () => {
    this.ringer.current.currentTime = 0;
    this.ringer.current.pause();
  };

  this.startRingback = () => {
    if (this.ringbackTone) {
      try {
        this.ringbackTone.currentTime = 0; // Reset to the start
        this.ringbackTone.play().catch((err: unknown) => console.error('Ringback tone play error:', err));
      } catch (e) {
        console.error('Failed to play ringback tone:', e);
      }
    }
  };

  this.stopRingback = () => {
    if (this.ringbackTone) {
      try {
        this.ringbackTone.pause();
        this.ringbackTone.currentTime = 0; // Reset to the start for future calls
      } catch (e) {
        console.error('Failed to stop ringback tone:', e);
      }
    }
  };

  this.removeCallFromQueue = (callId: string) => {
    _.remove(this.callsQueue, (calls: { id: string }) => calls.id === callId);
  };
  this.addCallToHoldQueue = (callId: string) => {
    if (this.activeCall.id === callId) {
      this.holdCallsQueue.push(this.activeCall);
    }
  };
  this.removeCallFromActiveCall = (callId: string) => {
    if (this.activeCall && callId === this.activeCall.id) {
      this.activeCall = null;
    }
  };
  this.removeCallFromHoldQueue = (callId: string) => {
    _.remove(this.holdCallsQueue, (calls: { id: string }) => calls.id === callId);
  };
  this.connectAudio = () => {
    this.activeCall.connection.addEventListener('addstream', (event: { stream: MediaStream }) => {
      this.player.current.srcObject = event.stream;
    });
  };

  this.sessionEvent = (type: string, data: any, cause: unknown, callId: string) => {
    switch (type) {
      case 'terminated':
        debugLog(`Call ${callId} terminated`);
        break;
      case 'progress': {
        const status = data && data.response ? data.response.status_code : undefined;
        const reasonPhrase = data && data.response ? data.response.reason_phrase : '';
        logInfo(`Call ${callId} progress: ${status || ''} ${reasonPhrase || ''} (${(data && data.originator) || 'unknown'})`);
        if (data && data.originator === 'remote') {
          // Play ringback tone for outgoing calls only
          if (status === 180) {
            this.startRingback();
          }
          if (status === 183) {
            this.stopRingback();
          }
        }
        break;
      }
      case 'accepted':
        logInfo(`Call ${callId} accepted`);
        break;
      case 'reinvite':
        this.onCallActionConnection('reinvite', callId, data);
        break;
      case 'hold':
        this.onCallActionConnection('hold', callId);
        this.addCallToHoldQueue(callId);
        this.removeCallFromActiveCall(callId);
        break;
      case 'unhold':
        this.onCallActionConnection('unhold', callId);
        this.activeCall = _.find(this.holdCallsQueue, { id: callId });
        this.removeCallFromHoldQueue(callId);
        break;
      case 'dtmf':
        break;
      case 'muted':
        this.onCallActionConnection('muted', callId);
        break;
      case 'unmuted':
        break;
      case 'confirmed':
        logInfo(`Call ${callId} confirmed (media established)`);
        this.stopRingback();
        if (!this.activeCall) {
          this.activeCall = _.find(this.callsQueue, { id: callId });
        }
        this.removeCallFromQueue(callId);
        this.onCallActionConnection('callAccepted', callId, this.activeCall);
        break;
      case 'connecting':
        debugLog(`Call ${callId} connecting...`);
        break;
      case 'sending':
        debugLog(`Call ${callId} sending...`);
        break;
      case 'peerconnection':
      case 'sdp':
      case 'icecandidate':
      case 'update':
        debugLog(`Call ${callId} ${type}`);
        break;
      case 'getusermediafailed': {
        const err = data || {};
        logError(
          `getUserMedia failed for call ${callId}: ${err.name || 'Error'}${
            err.message ? ` - ${err.message}` : ''
          }`,
          err
        );
        this.notify(
          m.microphone_failed({ error: err.name || 'Error' }),
        );
        // JsSIP emits 'failed' right after this with cause
        // "User Denied Media Access"; avoid notifying twice.
        this.mediaErrorNotified = true;
        break;
      }
      case 'ended': {
        const info = describeSipEvent(data);
        logInfo(
          `Call ${callId} ended (${info.originator}) cause=${info.cause}${
            info.response ? ` response=${info.response}` : ''
          }`
        );
        this.onCallActionConnection('callEnded', callId);
        this.removeCallFromQueue(callId);
        this.removeCallFromActiveCall(callId);
        this.removeCallFromHoldQueue(callId);
        if (this.callsQueue.length === 0) {
          this.stopRing();
        }
        break;
      }
      case 'failed': {
        const info = describeSipEvent(data);
        const responseSuffix = info.response ? ` (${info.response})` : '';
        logError(
          `Call ${callId} FAILED (${info.originator}) cause=${info.cause}${responseSuffix}`,
          data
        );
        if (!this.mediaErrorNotified) {
          this.notify(m.call_failed({ reason: friendlyFailure(info) }));
        }
        this.mediaErrorNotified = false;
        this.stopRingback();
        this.onCallActionConnection('callEnded', callId);
        this.removeCallFromQueue(callId);
        this.removeCallFromActiveCall(callId);
        if (this.callsQueue.length === 0) {
          this.stopRing();
        }
        break;
      }
      default:
        debugLog(`Call ${callId} event: ${type}`, data);
        break;
    }
  };

  this.handleNewRTCSession = (rtcPayload: { session: any }) => {
    const { session: call } = rtcPayload;
    if (call.direction === 'incoming') {
      this.callsQueue.push(call);
      this.onCallActionConnection('incomingCall', call);
      if (!this.activeCall) {
        this.playRing();
      }
    } else {
      this.activeCall = call;
      this.onCallActionConnection('outgoingCall', call);
      this.connectAudio();
    }
    const defaultCallEventsToHandle = [
      'peerconnection',
      'connecting',
      'sending',
      'progress',
      'accepted',
      'newDTMF',
      'newInfo',
      'hold',
      'unhold',
      'muted',
      'unmuted',
      'reinvite',
      'update',
      'refer',
      'replaces',
      'sdp',
      'icecandidate',
      'getusermediafailed',
      'ended',
      'failed',
      'connecting',
      'confirmed'
    ];
    _.forEach(defaultCallEventsToHandle, (eventType) => {
      call.on(eventType, (data: unknown, cause: unknown) => {
        this.sessionEvent(eventType, data, cause, call.id);
      });
    });
  };

  this.validateConfig = () => {
    const problems = [];
    if (!this.config.domain) problems.push('missing domain');
    if (!this.config.uri) problems.push('missing uri');
    if (!this.config.ws_servers) problems.push('missing ws_servers');
    if (problems.length) {
      logError(`Invalid SIP configuration: ${problems.join(', ')}`, {
        domain: this.config.domain,
        uri: this.config.uri,
        ws_servers: this.config.ws_servers
      });
    }
  };
  this.init = () => {
    try {
      this.validateConfig();
      if (this.phone) {
        // React StrictMode (and remounts) can run the mount effect twice.
        // Reuse the existing UA instead of creating a second transport.
        logInfo('JsSIP UA already initialized, reusing existing instance');
        this.initiated = true;
        return;
      }
      logInfo('Initializing JsSIP UA', {
        domain: this.config.domain,
        uri: this.config.uri,
        ws_servers: this.config.ws_servers
      });
      this.phone = new UA(this.config);
      this.phone.on('newRTCSession', this.handleNewRTCSession.bind(this));
      const binds = [
        'connected',
        'disconnected',
        'registered',
        'unregistered',
        'registrationFailed',
        'invite',
        'message',
        'connecting'
      ];
      _.forEach(binds, (value) => {
        this.phone.on(value, (e: unknown) => {
          this.engineEvent(value, e);
        });
      });
      this.initiated = true;
    } catch (e) {
      logError('Failed to initialize JsSIP UA', e);
    }
  };

  this.call = (to: string) => {
    const target = parseDialTarget(to, this.config.domain);
    logInfo('call() requested', { input: to, target });

    if (!target.valid) {
      logError(`Invalid dial target "${to}": ${target.reason}`);
      this.notify(m.invalid_number({ reason: translateDialReason(target.reason) }));
      return;
    }

    if (!this.connectedPhone) {
      logError('Cannot place call: not connected to the VoIP server');
      this.notify(m.please_connect());
      return;
    }

    if (!this.phone) {
      logError('Cannot place call: the phone (UA) has not been initialized');
      this.notify(m.phone_not_initialized());
      return;
    }

    if (this.activeCall) {
      logWarn('Cannot place call: an active call already exists');
      this.notify(m.active_call_exists());
      return;
    }

    logInfo(`Placing call to ${target.uri}`);
    try {
      this.phone.call(target.uri, {
        mediaConstraints: { audio: true, video: false },
        sessionTimersExpires: 600
      });
    } catch (error) {
      logError('phone.call() threw an error', error);
      this.notify(
        m.failed_to_start_call({
          error: (error && (error as Error).message) || String(error),
        }),
      );
    }
  };

  this.answer = (sessionId: string) => {
    if (this.activeCall) {
      console.log('Already has active call');
      return;
    }
    try {
      this.stopRing();
      this.activeCall = _.find(this.callsQueue, { id: sessionId });
      if (this.activeCall) {
        this.activeCall.customPayload = this.activeChanel.id;
        this.activeCall.answer({
          mediaConstraints: { audio: true },
        });
        this.connectAudio();
      }
    } catch (err) {
      console.error('Error answering call:', err);
      this.notify(m.error_answering_call());
    }
  };

  this.hungup = (e: string) => {
    try {
      this.phone._sessions[e].terminate();
    } catch (s) {
      console.log(s);
      console.log('Call already terminated');
    }
  };

  this.start = () => {
    if (!this.initiated) {
      logError('Cannot start: UA has not been initialized (call init() first)');
      this.notify(m.initialize_phone_first());
      return;
    }

    if (this.config.debug) {
      debug.enable('JsSIP:*');
    } else {
      debug.disable();
    }
    logInfo(`Starting JsSIP UA, opening WebSocket to ${this.config.ws_servers}`);
    try {
      this.phone.start();
    } catch (error) {
      logError('Failed to start JsSIP UA', error);
      this.notify(
        m.failed_to_connect({
          error: (error && (error as Error).message) || String(error),
        }),
      );
    }
  };

  // Tear down the current UA (if any) and bring a fresh one up using the
  // currently assigned `this.config`. Used by the editable SIP account UI.
  this.reconnect = () => {
    try {
      if (this.phone) {
        try {
          this.phone.stop();
        } catch (e) {
          debugWarn('Error stopping JsSIP UA during reconnect', e);
        }
        this.phone = null;
      }
      this.initiated = false;
      this.init();
      this.start();
    } catch (error) {
      logError('Failed to reconnect JsSIP UA', error);
      this.notify(
        m.failed_to_reconnect({
          error: (error && (error as Error).message) || String(error),
        }),
      );
    }
  };

  this.stop = () => {
    logInfo('Stopping JsSIP UA');
    this.phone.stop();
  };

  // Tear down the UA and clear queues. Called when the owning session view
  // unmounts so a new session can be created cleanly.
  this.destroy = () => {
    try {
      if (this.phone) {
        try {
          this.phone.stop();
        } catch (e) {
          debugWarn('Error stopping JsSIP UA during destroy', e);
        }
      }
    } catch (e) {
      debugWarn('Error during JsSIP UA destroy', e);
    }
    this.phone = null;
    this.initiated = false;
    this.activeCall = null;
    this.callsQueue = [];
    this.holdCallsQueue = [];
    this.micMuted = false;
    this.mediaErrorNotified = false;
  };
}

export default CallsFlowControl;
