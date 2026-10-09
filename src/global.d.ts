// Ambient declarations for the softphone component.

declare global {
  interface Window {
    /** Enables verbose `[SoftPhone]` debug logging when set to true. */
    __SOFTPHONE_DEBUG__?: boolean;
  }
}

export {};
