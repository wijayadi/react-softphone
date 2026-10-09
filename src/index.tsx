import React, { useState } from 'react';
import {
  Drawer,
  Fab,
  IconButton,
  Typography,
  Box,
  Divider,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Phone as PhoneIcon,
  Close as CloseIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import SoftPhonePanel from './SoftPhonePanel';
import { SoftphoneProvider } from './store/context';
import { createSoftphoneStore } from './store/createSoftphoneStore';
import { m } from './i18n';
import type { SoftphoneInit, SoftphoneStoreApi } from './store/types';
import type {
  LauncherPosition,
  LauncherSize,
  SoftPhoneProps,
} from './types';

const DrawerStyled = styled(Drawer)(({ theme }) => ({
  width: '320px',
  flexShrink: 0,
  '& .MuiDrawer-paper': {
    width: '320px',
    boxSizing: 'border-box',
    boxShadow: theme.shadows[3],
    borderRadius: theme.shape.borderRadius * 2 + 'px 0 0 ' + theme.shape.borderRadius * 2 + 'px',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: theme.palette.background.paper,
    borderRight: 'none',
    overflow: 'hidden'
  }
}));

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  justifyContent: 'space-between',
  height: '48px'
}));

// Launcher styles
const LauncherFab = styled(Fab)<{ position: LauncherPosition; size: LauncherSize }>(({ theme, position, size }) => {
  const positions = {
    'bottom-right': { bottom: 24, right: 24 },
    'bottom-left': { bottom: 24, left: 24 },
    'top-right': { top: 24, right: 24 },
    'top-left': { top: 24, left: 24 }
  };

  const sizes = {
    small: { width: 40, height: 40 },
    medium: { width: 56, height: 56 },
    large: { width: 72, height: 72 }
  };

  return {
    position: 'fixed',
    zIndex: theme.zIndex.speedDial,
    boxShadow: theme.shadows[6],
    '&:hover': {
      boxShadow: theme.shadows[8],
    },
    ...positions[position],
    ...sizes[size]
  };
});

export type SoftPhoneComponentProps = SoftPhoneProps;

function SoftPhone({
  config,
  timelocale,
  setConnectOnStartToLocalStorage,
  connectOnStart,
  asteriskAccounts,
  setNotifications,
  notifications,
  setCallVolume,
  setRingVolume,
  softPhoneOpen,
  setSoftPhoneOpen = () => {},
  callVolume,
  ringVolume,
  builtInLauncher = false,
  launcherPosition = 'bottom-right',
  launcherSize = 'medium',
  launcherColor = 'primary',
  assets,
  showConfigEditor = true,
  onConfigChange,
  lang,
  store: externalStore,
}: SoftPhoneProps) {
  const init: SoftphoneInit = {
    config,
    timelocale,
    setConnectOnStartToLocalStorage,
    connectOnStart,
    asteriskAccounts,
    setNotifications,
    notifications,
    setCallVolume,
    setRingVolume,
    callVolume,
    ringVolume,
    assets,
    showConfigEditor,
    onConfigChange,
    lang,
  };

  // Create a store once per mount when one is not supplied. The provider is the
  // session host; it owns the JsSIP UA and the audio elements.
  const [internalStore] = useState<SoftphoneStoreApi>(() =>
    externalStore ?? createSoftphoneStore(init),
  );
  const store = externalStore ?? internalStore;

  // Built-in launcher state (shell concern).
  const [launcherOpen, setLauncherOpen] = useState(false);
  const isOpen = builtInLauncher ? launcherOpen : Boolean(softPhoneOpen);

  const handleLauncherToggle = () => {
    if (builtInLauncher) {
      const next = !launcherOpen;
      setLauncherOpen(next);
      setSoftPhoneOpen(next);
    }
  };

  const handleCloseDrawer = () => {
    if (builtInLauncher) {
      setLauncherOpen(false);
      setSoftPhoneOpen(false);
    } else {
      setSoftPhoneOpen(false);
    }
  };

  return (
    <SoftphoneProvider store={store} {...init}>
      {builtInLauncher && (
        <LauncherFab
          color={launcherColor as any}
          position={launcherPosition}
          size={launcherSize}
          onClick={handleLauncherToggle}
          aria-label={m.launcher_toggle()}
        >
          {isOpen ? <CloseIcon /> : <PhoneIcon />}
        </LauncherFab>
      )}

      <DrawerStyled anchor="right" open={isOpen} variant="persistent">
        <Box sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <DrawerHeader>
            <Typography variant="subtitle1" fontWeight={500}>{m.app_title()}</Typography>
            <IconButton
              onClick={handleCloseDrawer}
              data-testid="hide-soft-phone-button"
              size="large"
              sx={{
                m: 0.5,
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.04)'
                }
              }}
            >
              <ChevronRightIcon />
            </IconButton>
          </DrawerHeader>

          <Divider />

          <SoftPhonePanel />
        </Box>
      </DrawerStyled>
    </SoftphoneProvider>
  );
}

export default SoftPhone;

// --- shared-state API -------------------------------------------------------
export { SoftPhonePanel } from './SoftPhonePanel';
export { LanguageSwitcher } from './LanguageSwitcher';
export {
  SoftphoneProvider,
  useSoftphone,
  useSoftphoneStore,
} from './store/context';
export { createSoftphoneStore } from './store/createSoftphoneStore';
export type {
  SoftphoneStore,
  SoftphoneStoreApi,
  SoftphoneStoreState,
  SoftphoneStoreActions,
  SoftphoneInit,
  SoftphoneProviderProps,
} from './store';
export type { SoftPhonePanelProps } from './SoftPhonePanel';
export type { LanguageSwitcherProps } from './LanguageSwitcher';

export type {
  SoftPhoneProps,
  SoftPhoneConfig,
  SoftPhoneAssets,
  SoftPhoneState,
  DisplayCall,
  PhoneCall,
  CallLogEntry,
  AsteriskAccount,
  LauncherPosition,
  LauncherSize,
} from './types';
