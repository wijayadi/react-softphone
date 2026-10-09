import type { Meta, StoryObj } from '@storybook/react-vite';
import CallQueue from './call-queue';
import { noop } from '../stories/fixtures';
import type { PhoneCall } from '../types';

const incomingCall: PhoneCall = {
  callNumber: '1003-Area 51-Acme',
  sessionId: 'call-2',
  ring: true,
  duration: 0,
  direction: 'incoming'
};

const meta = {
  title: 'Phone Blocks/CallQueue',
  component: CallQueue,
  parameters: {
    layout: 'centered'
  },
  args: {
    calls: [],
    handleAnswer: noop,
    handleReject: noop
  }
} satisfies Meta<typeof CallQueue>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

export const IncomingCall: Story = {
  args: {
    calls: [incomingCall]
  }
};

export const MultipleCalls: Story = {
  args: {
    calls: [
      incomingCall,
      {
        callNumber: '1004-Downtown-Example Corp',
        sessionId: 'call-3',
        ring: true,
        duration: 0,
        direction: 'incoming'
      }
    ]
  }
};
