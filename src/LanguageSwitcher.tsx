import React from 'react';
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import { useStore } from 'zustand';
import { LOCALE_LABELS, SUPPORTED_LOCALES } from './i18n';
import type { SoftphoneStoreApi } from './store/types';

export interface LanguageSwitcherProps {
  /** Controlled value; ignored when `store` is provided. */
  value?: string;
  /** Controlled change handler; ignored when `store` is provided. */
  onChange?: (locale: string) => void;
  /** Bind to a softphone store (reads/writes its `locale`). */
  store?: SoftphoneStoreApi;
  /** Field label. */
  label?: string;
  size?: 'small' | 'medium';
  variant?: 'outlined' | 'standard' | 'filled';
  fullWidth?: boolean;
}

interface SwitcherUIProps {
  value: string;
  onChange: (locale: string) => void;
  label: string;
  size: 'small' | 'medium';
  variant: 'outlined' | 'standard' | 'filled';
  fullWidth?: boolean;
}

function SwitcherUI({
  value,
  onChange,
  label,
  size,
  variant,
  fullWidth,
}: SwitcherUIProps) {
  const handleChange = (event: SelectChangeEvent) => {
    onChange(event.target.value);
  };

  return (
    <FormControl size={size} variant={variant} fullWidth={fullWidth}>
      <InputLabel id="softphone-language-label">{label}</InputLabel>
      <Select
        labelId="softphone-language-label"
        id="softphone-language"
        value={value}
        label={label}
        onChange={handleChange}
      >
        {SUPPORTED_LOCALES.map((locale) => (
          <MenuItem key={locale} value={locale}>
            {LOCALE_LABELS[locale] ?? locale}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

function StoreLanguageSwitcher({
  store,
  label = 'Language',
  size = 'small',
  variant = 'outlined',
  fullWidth,
}: LanguageSwitcherProps & { store: SoftphoneStoreApi }) {
  const locale = useStore(store, (state) => state.locale);
  return (
    <SwitcherUI
      value={locale}
      onChange={(next) => store.getState().setLang(next)}
      label={label}
      size={size}
      variant={variant}
      fullWidth={fullWidth}
    />
  );
}

/**
 * Language switcher for the built-in locales (`en`, `id`, `jp`). Use it
 * controlled (`value`/`onChange`) or bound to a store (`store`).
 */
export function LanguageSwitcher(props: LanguageSwitcherProps) {
  if (props.store) {
    return <StoreLanguageSwitcher {...props} store={props.store} />;
  }
  return (
    <SwitcherUI
      value={props.value ?? 'en'}
      onChange={props.onChange ?? (() => {})}
      label={props.label ?? 'Language'}
      size={props.size ?? 'small'}
      variant={props.variant ?? 'outlined'}
      fullWidth={props.fullWidth}
    />
  );
}

export default LanguageSwitcher;
