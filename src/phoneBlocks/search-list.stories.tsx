import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import SearchList from './search-list';
import { mockAccounts, noop } from '../stories/fixtures';

const meta = {
  title: 'Phone Blocks/SearchList',
  component: SearchList,
  parameters: {
    layout: 'centered'
  },
  args: {
    asteriskAccounts: mockAccounts,
    onClickList: noop,
    ariaDescribedby: 'transferBox',
    anchorEl: null,
    setAnchorEl: noop
  }
} satisfies Meta<typeof SearchList>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The popover is anchored to a real element, so the story renders a small
 * launcher button and opens the list against it.
 */
function Demo(args: React.ComponentProps<typeof SearchList>) {
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);

  return (
    <div>
      <button
        type="button"
        onClick={(event) => setAnchorEl(event.currentTarget)}
      >
        Open transfer list
      </button>
      <SearchList {...args} anchorEl={anchorEl} setAnchorEl={setAnchorEl} />
    </div>
  );
}

export const Default: Story = {
  render: (args) => <Demo {...args} />
};

export const AllOffline: Story = {
  args: {
    asteriskAccounts: mockAccounts.map((account) => ({ ...account, online: 0 }))
  },
  render: (args) => <Demo {...args} />
};
