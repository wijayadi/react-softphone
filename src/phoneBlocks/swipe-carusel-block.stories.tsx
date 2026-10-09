import type { Meta, StoryObj } from '@storybook/react-vite';
import SwipeCaruselBlock from './swipe-carusel-block';
import { createDisplayCall, createSoftPhoneState, noop } from '../stories/fixtures';

const meta = {
  title: 'Phone Blocks/SwipeCaruselBlock',
  component: SwipeCaruselBlock,
  parameters: {
    layout: 'centered'
  },
  args: {
    localStatePhone: createSoftPhoneState(),
    activeChannel: 0,
    setActiveChannel: noop,
    setLocalStatePhone: noop
  }
} satisfies Meta<typeof SwipeCaruselBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Ready: Story = {};

export const ActiveCall: Story = {
  args: {
    localStatePhone: createSoftPhoneState({
      displayCalls: [
        createDisplayCall({
          id: 0,
          inCall: true,
          inAnswer: true,
          callInfo: 'Answered',
          callNumber: '1002',
          direction: 'outgoing',
          sessionId: 'call-1'
        }),
        createDisplayCall({ id: 1, info: 'Ch 2' }),
        createDisplayCall({ id: 2, info: 'Ch 3' })
      ]
    })
  }
};

export const Ringing: Story = {
  args: {
    localStatePhone: createSoftPhoneState({
      displayCalls: [
        createDisplayCall({
          id: 0,
          inCall: true,
          inAnswer: false,
          callInfo: 'Ringing',
          callNumber: '1003',
          direction: 'incoming',
          sessionId: 'call-2'
        }),
        createDisplayCall({ id: 1, info: 'Ch 2' }),
        createDisplayCall({ id: 2, info: 'Ch 3' })
      ]
    })
  }
};

export const OnHold: Story = {
  args: {
    localStatePhone: createSoftPhoneState({
      displayCalls: [
        createDisplayCall({
          id: 0,
          inCall: true,
          inAnswer: true,
          hold: true,
          callInfo: 'On Hold',
          callNumber: '1002',
          sessionId: 'call-1'
        }),
        createDisplayCall({ id: 1, info: 'Ch 2' }),
        createDisplayCall({ id: 2, info: 'Ch 3' })
      ]
    })
  }
};

export const InTransfer: Story = {
  args: {
    localStatePhone: createSoftPhoneState({
      displayCalls: [
        createDisplayCall({
          id: 0,
          inCall: true,
          inAnswer: true,
          inTransfer: true,
          callInfo: 'Transferring...',
          callNumber: '1002',
          transferNumber: '1003',
          attendedTransferOnline: '1003',
          sessionId: 'call-1'
        }),
        createDisplayCall({ id: 1, info: 'Ch 2' }),
        createDisplayCall({ id: 2, info: 'Ch 3' })
      ]
    })
  }
};
