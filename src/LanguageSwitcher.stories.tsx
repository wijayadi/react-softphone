import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import LanguageSwitcher from './LanguageSwitcher';

const meta = {
  title: 'Softphone/LanguageSwitcher',
  component: LanguageSwitcher,
  parameters: {
    layout: 'centered'
  },
  args: {
    label: 'Language',
    size: 'small'
  }
} satisfies Meta<typeof LanguageSwitcher>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Controlled: Story = {
  render: (args) => {
    const [value, setValue] = useState('en');
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 220 }}>
        <LanguageSwitcher {...args} value={value} onChange={setValue} />
        <code>locale: {value}</code>
      </div>
    );
  }
};
