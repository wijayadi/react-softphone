import type { Meta, StoryObj } from '@storybook/react-vite';
import SoftPhone from './index';
import { mockAccounts, mockConfig, noop } from './stories/fixtures';

const meta = {
  title: 'Softphone/SoftPhone',
  component: SoftPhone,
  parameters: {
    layout: 'fullscreen'
  },
  args: {
    config: mockConfig,
    softPhoneOpen: true,
    setSoftPhoneOpen: noop,
    connectOnStart: false,
    notifications: false,
    callVolume: 0.8,
    ringVolume: 0.6,
    timelocale: 'UTC',
    asteriskAccounts: mockAccounts,
    setConnectOnStartToLocalStorage: noop,
    setNotifications: noop,
    setCallVolume: noop,
    setRingVolume: noop
  }
} satisfies Meta<typeof SoftPhone>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Closed: Story = {
  args: {
    softPhoneOpen: false
  }
};

export const WithBuiltInLauncher: Story = {
  args: {
    builtInLauncher: true,
    softPhoneOpen: false,
    launcherPosition: 'bottom-right',
    launcherSize: 'medium',
    launcherColor: 'primary'
  }
};

export const WithTransferAccounts: Story = {
  args: {
    asteriskAccounts: mockAccounts
  }
};
