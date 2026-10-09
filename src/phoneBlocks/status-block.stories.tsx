import type { Meta, StoryObj } from '@storybook/react-vite';
import StatusBlock from './status-block';

const meta = {
  title: 'Phone Blocks/StatusBlock',
  component: StatusBlock,
  parameters: {
    layout: 'centered'
  },
  args: {
    connectingPhone: false,
    connectedPhone: false
  }
} satisfies Meta<typeof StatusBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Offline: Story = {};

export const Online: Story = {
  args: {
    connectedPhone: true
  }
};

export const Connecting: Story = {
  args: {
    connectingPhone: true,
    connectedPhone: false
  }
};

export const Disconnecting: Story = {
  args: {
    connectingPhone: true,
    connectedPhone: true
  }
};
