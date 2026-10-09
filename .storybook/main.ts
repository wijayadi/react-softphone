import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
  framework: {
    name: '@storybook/react-vite',
    options: {}
  },
  async viteFinal(viteConfig) {
    // The library build sets `build.lib`, which is incompatible with the app
    // build Storybook performs. Remove it while keeping the rest of the config.
    if (viteConfig.build && 'lib' in viteConfig.build) {
      delete (viteConfig.build as { lib?: unknown }).lib;
    }
    return viteConfig;
  }
};

export default config;
