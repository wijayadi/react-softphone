import React from 'react';
import { Button } from '@mui/material';
import { styled } from '@mui/material/styles';
import { m } from '../i18n';

export interface DtmfKeypadProps {
  /** Called with the pressed key (`0-9`, `*`, `#`). */
  onKey: (key: string) => void;
  /** Disable every key (e.g. when there is no active call). */
  disabled?: boolean;
}

/** Standard DTMF layout: 1-9, *, 0, #. */
export const DTMF_KEYS = [
  '1', '2', '3',
  '4', '5', '6',
  '7', '8', '9',
  '*', '0', '#',
] as const;

const Grid = styled('div')(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: theme.spacing(1),
  marginTop: theme.spacing(1)
}));

const Key = styled(Button)(({ theme }) => ({
  minWidth: 0,
  padding: theme.spacing(1, 0),
  fontSize: '1.1rem',
  fontWeight: 600,
  lineHeight: 1,
  borderRadius: theme.shape.borderRadius
}));

function DtmfKeypad({ onKey, disabled = false }: DtmfKeypadProps) {
  return (
    <Grid role="group" aria-label={m.dtmf_keypad()}>
      {DTMF_KEYS.map((key) => (
        <Key
          key={key}
          variant="outlined"
          size="small"
          disabled={disabled}
          aria-label={key}
          onClick={() => onKey(key)}
        >
          {key}
        </Key>
      ))}
    </Grid>
  );
}

export default DtmfKeypad;
