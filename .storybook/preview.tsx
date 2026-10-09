import React from 'react';
import type { Preview } from '@storybook/react-vite';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import {
  LOCALE_LABELS,
  SUPPORTED_LOCALES,
  setSoftphoneLocale,
} from '../src/i18n';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i
      }
    }
  },
  globalTypes: {
    locale: {
      description: 'Softphone language',
      defaultValue: 'en',
      toolbar: {
        icon: 'globe',
        items: SUPPORTED_LOCALES.map((locale) => ({
          value: locale,
          title: LOCALE_LABELS[locale] ?? locale
        })),
        dynamicTitle: true
      }
    }
  },
  decorators: [
    (Story, context) => {
      const locale = (context.globals.locale as string) ?? 'en';
      // Keep the runtime locale in sync with the toolbar, then remount the
      // story so stores/messages pick up the new locale.
      setSoftphoneLocale(locale);
      return (
        <ThemeProvider theme={createTheme()}>
          <CssBaseline />
          <Story key={locale} />
        </ThemeProvider>
      );
    }
  ]
};

export default preview;
