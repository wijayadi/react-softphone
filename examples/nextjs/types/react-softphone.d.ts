declare module '@sengsara/react-softphone' {
  import type * as React from 'react';

  export interface SoftPhoneConfig {
    domain: string;
    uri: string;
    password: string;
    ws_servers: string;
    display_name?: string;
    debug?: boolean;
    session_timers_refresh_method?: string;
  }

  export interface SoftPhoneProps {
    config: SoftPhoneConfig;
    softPhoneOpen?: boolean;
    setSoftPhoneOpen?: (open: boolean) => void;
    callVolume?: number;
    ringVolume?: number;
    connectOnStart?: boolean;
    notifications?: boolean;
    timelocale?: string;
    asteriskAccounts?: unknown[];
    builtInLauncher?: boolean;
    launcherPosition?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
    launcherSize?: 'small' | 'medium' | 'large';
    launcherColor?: string;
    setConnectOnStartToLocalStorage?: (value: boolean) => void;
    setNotifications?: (value: boolean) => void;
    setCallVolume?: (value: number) => void;
    setRingVolume?: (value: number) => void;
  }

  const SoftPhone: React.ComponentType<SoftPhoneProps>;
  export default SoftPhone;
}
