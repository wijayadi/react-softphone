import type { Meta, StoryObj } from '@storybook/react-vite';
import DtmfKeypad from './DtmfKeypad';
import { noop } from '../stories/fixtures';

const meta = {
  title: 'Phone Blocks/DtmfKeypad',
  component: DtmfKeypad,
  parameters: {
    layout: 'centered'
  },
  decorators: [
    (Story) => (
      <div style={{ width: 240 }}>
        <Story />
      </div>
    )
  ],
  args: {
    onKey: noop,
    disabled: false
  }
} satisfies Meta<typeof DtmfKeypad>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Disabled: Story = {
  args: {
    disabled: true
  }
};
