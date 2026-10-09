import React from 'react';
import { styled } from '@mui/material/styles';
import {
  Box,
  Button,
  Divider,
  FormControlLabel,
  Paper,
  Switch,
  TextField,
  Typography
} from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import type { SoftPhoneConfig } from '../types';

export interface ConfigBlockProps {
  /** Current (draft) SIP configuration being edited. */
  config: SoftPhoneConfig;
  /** Called on every field edit with the field name and its new value. */
  onChange: (field: string, value: string | boolean) => void;
  /** Apply the draft config and reconnect the SIP transport. */
  onReconnect: () => void;
  /** Disables the Reconnect button while a connection attempt is in flight. */
  reconnecting?: boolean;
}

const Root = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1.5),
  flexGrow: 1
}));

const SettingsCard = styled(Paper)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius * 2,
  padding: theme.spacing(2),
  boxShadow: theme.palette.mode === 'dark'
    ? '0 4px 8px rgba(0, 0, 0, 0.3)'
    : '0 2px 6px rgba(0, 0, 0, 0.1)',
  marginBottom: theme.spacing(1)
}));

const SettingHeader = styled(Typography)(({ theme }) => ({
  fontWeight: 500,
  marginBottom: theme.spacing(0.5),
  color: theme.palette.text.primary,
  fontSize: '0.8rem'
}));

function ConfigBlock({
  config,
  onChange,
  onReconnect,
  reconnecting = false
}: ConfigBlockProps) {
  const wsServers = Array.isArray(config.ws_servers)
    ? config.ws_servers.join(', ')
    : (config.ws_servers ?? '');

  return (
    <Root>
      <SettingsCard>
        <SettingHeader>SIP Account</SettingHeader>
        <Divider sx={{ mb: 1 }} />
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <TextField
            label="Domain"
            value={config.domain ?? ''}
            onChange={(event) => onChange('domain', event.target.value)}
            size="small"
            fullWidth
            autoComplete="off"
          />
          <TextField
            label="SIP URI"
            placeholder="sip:1001@example.com"
            value={config.uri ?? ''}
            onChange={(event) => onChange('uri', event.target.value)}
            size="small"
            fullWidth
            autoComplete="off"
          />
          <TextField
            label="WebSocket Server"
            placeholder="wss://example.com:8089/ws"
            value={wsServers}
            onChange={(event) => onChange('ws_servers', event.target.value)}
            size="small"
            fullWidth
            autoComplete="off"
          />
          <TextField
            label="Password"
            type="password"
            value={(config.password as string) ?? ''}
            onChange={(event) => onChange('password', event.target.value)}
            size="small"
            fullWidth
            autoComplete="new-password"
          />
          <TextField
            label="Display Name"
            value={(config.display_name as string) ?? ''}
            onChange={(event) => onChange('display_name', event.target.value)}
            size="small"
            fullWidth
            autoComplete="off"
          />
          <TextField
            label="Session Timers Refresh Method"
            value={(config.session_timers_refresh_method as string) ?? ''}
            onChange={(event) => onChange('session_timers_refresh_method', event.target.value)}
            size="small"
            fullWidth
            autoComplete="off"
          />
          <FormControlLabel
            control={(
              <Switch
                checked={Boolean(config.debug)}
                onChange={(event) => onChange('debug', event.target.checked)}
                name="debug"
                color="primary"
                size="small"
              />
            )}
            label="Debug logging"
          />
          <Button
            variant="contained"
            color="primary"
            size="small"
            onClick={onReconnect}
            disabled={reconnecting}
            startIcon={<RefreshIcon />}
            sx={{ mt: 0.5 }}
          >
            {reconnecting ? 'Reconnecting…' : 'Reconnect'}
          </Button>
        </Box>
      </SettingsCard>
    </Root>
  );
}

export default ConfigBlock;
