import React, { useMemo } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import SoftPhonePanel from './SoftPhonePanel';
import LanguageSwitcher from './LanguageSwitcher';
import { SoftphoneProvider } from './store/context';
import { createSoftphoneStore } from './store/createSoftphoneStore';
import { mockAccounts, mockConfig } from './stories/fixtures';

const meta = {
  title: 'Softphone/SoftPhonePanel',
  component: SoftPhonePanel,
  parameters: {
    layout: 'fullscreen'
  },
  decorators: [
    (Story) => {
      const store = useMemo(
        () =>
          createSoftphoneStore({
            config: mockConfig,
            connectOnStart: false,
            notifications: false,
            timelocale: 'UTC',
            asteriskAccounts: mockAccounts
          }),
        []
      );
      return (
        <SoftphoneProvider store={store}>
          <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
            <div style={{ padding: 8 }}>
              <LanguageSwitcher store={store} />
            </div>
            <div style={{ display: 'flex', flexGrow: 1, minHeight: 0 }}>
              <Story />
            </div>
          </div>
        </SoftphoneProvider>
      );
    }
  ],
  args: {
    className: 'story-panel'
  }
} satisfies Meta<typeof SoftPhonePanel>;

export default meta;
type Story = StoryObj<typeof meta>;

const panelBox: React.CSSProperties = {
  width: 360,
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
  borderRight: '1px solid rgba(0,0,0,0.12)'
};

export const Default: Story = {
  decorators: [
    (Story) => (
      <div style={panelBox}>
        <Story />
      </div>
    )
  ]
};

/** Two panels bound to the same store: every change is mirrored in both. */
export const TwoPanelsSharedState: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 16, padding: 16 }}>
      <div style={panelBox}>
        <SoftPhonePanel inputId="mirror-a" />
      </div>
      <div style={panelBox}>
        <SoftPhonePanel inputId="mirror-b" />
      </div>
    </div>
  )
};
