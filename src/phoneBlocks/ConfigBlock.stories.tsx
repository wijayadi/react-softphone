import type { Meta, StoryObj } from '@storybook/react-vite';
import ConfigBlock from './ConfigBlock';
import { mockConfig, noop } from '../stories/fixtures';

const meta = {
  title: 'Phone Blocks/ConfigBlock',
  component: ConfigBlock,
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
    config: mockConfig,
    onChange: noop,
    onReconnect: noop,
    reconnecting: false
  }
} satisfies Meta<typeof ConfigBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Reconnecting: Story = {
  args: {
    reconnecting: true
  }
};

export const Empty: Story = {
  args: {
    config: {
      domain: '',
      uri: '',
      ws_servers: '',
      password: '',
      display_name: '',
      debug: false
    }
  }
};
