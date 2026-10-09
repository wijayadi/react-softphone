import type { Meta, StoryObj } from '@storybook/react-vite';
import SwipeCaruselBodyBlock from './SwipeCaruselBodyBlock';
import { createSoftPhoneState, mockCalls, noop } from '../stories/fixtures';

const meta = {
  title: 'Phone Blocks/SwipeCaruselBodyBlock',
  component: SwipeCaruselBodyBlock,
  parameters: {
    layout: 'centered'
  },
  args: {
    localStatePhone: createSoftPhoneState(),
    handleConnectPhone: noop,
    handleSettingsSlider: noop,
    handleConnectOnStart: noop,
    handleNotifications: noop,
    handleDarkMode: noop,
    calls: [],
    timelocale: 'UTC',
    callVolume: 0.8
  }
} satisfies Meta<typeof SwipeCaruselBodyBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Settings: Story = {};

export const WithCallHistory: Story = {
  args: {
    calls: mockCalls
  }
};
