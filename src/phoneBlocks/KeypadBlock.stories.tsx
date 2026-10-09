import type { Meta, StoryObj } from '@storybook/react-vite';
import KeypadBlock from './KeypadBlock';
import { createDisplayCall, mockAccounts, noop } from '../stories/fixtures';

const meta = {
  title: 'Phone Blocks/KeypadBlock',
  component: KeypadBlock,
  parameters: {
    layout: 'centered'
  },
  args: {
    activeChanel: createDisplayCall(),
    asteriskAccounts: mockAccounts,
    dialState: '',
    setDialState: noop,
    handleCall: noop,
    handleEndCall: noop,
    handleMicMute: noop,
    handleHold: noop,
    handleCallTransfer: noop,
    handleCallAttendedTransfer: noop,
    handlePressKey: noop
  }
} satisfies Meta<typeof KeypadBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Ready: Story = {};

export const InCall: Story = {
  args: {
    activeChanel: createDisplayCall({
      inCall: true,
      inAnswer: true,
      callInfo: 'Answered',
      callNumber: '1002',
      direction: 'outgoing',
      sessionId: 'call-1'
    })
  }
};

export const OnHold: Story = {
  args: {
    activeChanel: createDisplayCall({
      inCall: true,
      inAnswer: true,
      hold: true,
      callInfo: 'On Hold',
      callNumber: '1002',
      sessionId: 'call-1'
    })
  }
};

export const Muted: Story = {
  args: {
    activeChanel: createDisplayCall({
      inCall: true,
      inAnswer: true,
      muted: 1,
      callInfo: 'Answered',
      callNumber: '1002',
      sessionId: 'call-1'
    })
  }
};

export const TransferControls: Story = {
  args: {
    activeChanel: createDisplayCall({
      inCall: true,
      inAnswer: true,
      inAnswerTransfer: true,
      inTransfer: true,
      transferControl: true,
      callInfo: 'Attended Transfer',
      callNumber: '1002',
      sessionId: 'call-1'
    })
  }
};
