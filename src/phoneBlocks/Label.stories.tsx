import type { Meta, StoryObj } from '@storybook/react-vite';
import Label from './Label';

const meta = {
  title: 'Phone Blocks/Label',
  component: Label,
  parameters: {
    layout: 'centered'
  },
  args: {
    children: 'Label',
    color: 'secondary'
  }
} satisfies Meta<typeof Label>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Secondary: Story = {};

export const Primary: Story = {
  args: {
    color: 'primary',
    children: 'Primary'
  }
};

export const Success: Story = {
  args: {
    color: 'success',
    children: 'Success'
  }
};

export const Warning: Story = {
  args: {
    color: 'warning',
    children: 'Warning'
  }
};

export const Error: Story = {
  args: {
    color: 'error',
    children: 'Error'
  }
};
