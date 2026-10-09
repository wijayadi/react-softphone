import React from 'react';
import {
  Alert,
  Box,
  IconButton,
  InputAdornment,
  Snackbar,
  TextField,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { Phone as PhoneIcon, Clear as XIcon } from '@mui/icons-material';
import CallQueue from './phoneBlocks/call-queue';
import KeypadBlock from './phoneBlocks/KeypadBlock';
import DtmfKeypad from './phoneBlocks/DtmfKeypad';
import SwipeCaruselBlock from './phoneBlocks/swipe-carusel-block';
import SwipeCaruselBodyBlock from './phoneBlocks/SwipeCaruselBodyBlock';
import StatusBlock from './phoneBlocks/status-block';
import { useSoftphone, useSoftphoneStore } from './store/context';
import { m } from './i18n';

export interface SoftPhonePanelProps {
  /** Optional className for embedding/styling the panel root. */
  className?: string;
  /** DOM id for the dial input (defaults to `phone-input`). */
  inputId?: string;
}

const PanelRoot = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  flexGrow: 1,
  overflow: 'hidden',
});

const PhoneTextFieldStyled = styled(TextField)(({ theme }) => ({
  margin: theme.spacing(2, 1, 1.5, 1),
  '& .MuiInputBase-root': {
    borderRadius: theme.shape.borderRadius * 1.5,
    backgroundColor: theme.palette.mode === 'dark'
      ? theme.palette.background.paper
      : theme.palette.grey[50],
    padding: theme.spacing(0.5, 1),
    transition: 'all 0.2s ease-in-out',
    '&:hover': {
      backgroundColor: theme.palette.mode === 'dark'
        ? theme.palette.action.hover
        : theme.palette.grey[100],
    },
    '&.Mui-focused': {
      boxShadow: `0 0 0 2px ${theme.palette.primary.main}25`,
    }
  },
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: theme.palette.mode === 'dark'
      ? 'rgba(255, 255, 255, 0.15)'
      : 'rgba(0, 0, 0, 0.1)',
  },
  '& .MuiInputBase-input': {
    fontSize: '1.25rem',
    letterSpacing: '0.05em',
    fontWeight: 500,
  }
}));

/**
 * Presentational softphone view. It subscribes to the nearest softphone store,
 * so rendering it multiple times mirrors the same session state. It does not
 * own the JsSIP session or the audio elements (the provider does).
 */
export function SoftPhonePanel({ className, inputId = 'phone-input' }: SoftPhonePanelProps) {
  const store = useSoftphoneStore();
  const phoneState = useSoftphone((s) => s.phoneState);
  const calls = useSoftphone((s) => s.calls);
  const dialState = useSoftphone((s) => s.dialState);
  const activeChannel = useSoftphone((s) => s.activeChannel);
  const bodyTab = useSoftphone((s) => s.bodyTab);
  const notification = useSoftphone((s) => s.notification);
  const configDraft = useSoftphone((s) => s.configDraft);
  const durations = useSoftphone((s) => s.durations);
  const timelocale = useSoftphone((s) => s.timelocale);
  const asteriskAccounts = useSoftphone((s) => s.asteriskAccounts);
  const showConfigEditor = useSoftphone((s) => s.showConfigEditor);
  const locale = useSoftphone((s) => s.locale);

  // Actions are stable for the lifetime of the store.
  const actions = store.getState();

  const dialNumberOnEnter = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      actions.call();
    }
  };

  return (
    <PanelRoot className={className} data-locale={locale}>
      <CallQueue
        calls={phoneState.phoneCalls}
        handleAnswer={(event) => actions.answer(event.currentTarget.value)}
        handleReject={(event) => actions.reject(event.currentTarget.value)}
      />

      <SwipeCaruselBlock
        durations={durations}
        setActiveChannel={actions.setActiveChannel}
        activeChannel={activeChannel}
        localStatePhone={phoneState}
      />

      <Box
        sx={{
          padding: theme => theme.spacing(2),
          backgroundColor: theme => theme.palette.background.paper,
          boxShadow: theme => theme.palette.mode === 'dark'
            ? '0 4px 8px rgba(0, 0, 0, 0.3)'
            : '0 2px 6px rgba(0, 0, 0, 0.1)',
          mb: 2
        }}
      >
        <PhoneTextFieldStyled
          value={dialState}
          id={inputId}
          label={m.phone_number()}
          fullWidth
          onKeyUp={dialNumberOnEnter}
          onChange={(event) => actions.setDial(event.target.value)}
          variant="outlined"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <PhoneIcon fontSize="small" color="primary" />
              </InputAdornment>
            ),
            endAdornment: dialState && (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={() => actions.clearDial()}
                  edge="end"
                  aria-label={m.clear_number()}
                >
                  <XIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            )
          }}
        />

        <Box sx={{ mt: 2 }}>
          <KeypadBlock
            handleCallAttendedTransfer={actions.attendedTransfer}
            handleCallTransfer={actions.transfer}
            handleMicMute={actions.toggleMicMute}
            handleHold={actions.hold}
            handleCall={actions.call}
            handleEndCall={actions.hangup}
            handlePressKey={(event) => actions.appendDialKey(event.currentTarget.value)}
            activeChanel={phoneState.displayCalls[activeChannel]}
            handleSettingsButton={() => {}}
            asteriskAccounts={asteriskAccounts}
            dialState={dialState}
            setDialState={actions.setDial}
          />
        </Box>

        {phoneState.displayCalls[activeChannel]?.inCall && (
          <DtmfKeypad onKey={actions.sendDtmf} />
        )}
      </Box>

      <Box sx={{ overflow: 'auto' }}>
        <SwipeCaruselBodyBlock
          localStatePhone={phoneState}
          handleConnectPhone={(_event, connectionStatus) => actions.connect(connectionStatus)}
          handleSettingsSlider={(name, value) => actions.setVolume(name as 'callVolume' | 'ringVolume', value)}
          handleConnectOnStart={(_event, value) => actions.toggleAutoConnect(value)}
          handleNotifications={(_event, value) => actions.toggleNotifications(value)}
          handleDarkMode={() => {}}
          calls={calls}
          timelocale={timelocale}
          callVolume={phoneState.callVolume}
          configDraft={configDraft}
          onConfigFieldChange={actions.setConfigField}
          onReconnect={actions.reconnect}
          reconnecting={phoneState.connectingPhone}
          showConfigEditor={showConfigEditor}
          tabValue={bodyTab}
          onTabChange={actions.setBodyTab}
        />
      </Box>

      <Box sx={{ padding: 1 }}>
        <StatusBlock
          connectedPhone={phoneState.connectedPhone}
          connectingPhone={phoneState.connectingPhone}
        />
      </Box>

      <Snackbar
        open={notification.open}
        autoHideDuration={3000}
        onClose={(_event, reason) => {
          if (reason !== 'clickaway') actions.dismissNotification();
        }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => actions.dismissNotification()}
          severity="warning"
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </PanelRoot>
  );
}

export default SoftPhonePanel;
