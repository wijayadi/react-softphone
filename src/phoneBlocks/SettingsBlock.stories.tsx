import type { Meta, StoryObj } from '@storybook/react-vite';
import SettingsBlock from './SettingsBlock';
import { createSoftPhoneState, mockConfig, noop } from '../stories/fixtures';

const meta = {
  title: 'Phone Blocks/SettingsBlock',
  component: SettingsBlock,
  parameters: {
    layout: 'centered'
  },
  decorators: [
    (Story) => (
      <div style={{ width: 320 }}>
        <Story />
      </div>
    )
  ],
  args: {
    localStatePhone: createSoftPhoneState(),
    handleConnectPhone: noop,
    handleSettingsSlider: noop,
    handleConnectOnStart: noop,
    handleNotifications: noop,
    handleDarkMode: noop,
    configDraft: mockConfig,
    onConfigFieldChange: noop,
    onReconnect: noop,
    showConfigEditor: true
  }
} satisfies Meta<typeof SettingsBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Disconnected: Story = {
  args: {
    localStatePhone: createSoftPhoneState({
      connectedPhone: false,
      connectOnStart: false,
      notifications: false,
      callVolume: 0,
      ringVolume: 0
    })
  }
};

export const ConnectedWithNotifications: Story = {
  args: {
    localStatePhone: createSoftPhoneState({
      connectedPhone: true,
      connectOnStart: true,
      notifications: true,
      callVolume: 0.8,
      ringVolume: 0.6
    })
  }
};

export const ConfigEditorHidden: Story = {
  args: {
    showConfigEditor: false
  }
};
