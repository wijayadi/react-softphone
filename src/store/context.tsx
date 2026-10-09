import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useStore } from 'zustand';
import { createSoftphoneStore } from './createSoftphoneStore';
import type { SoftphoneInit, SoftphoneStore, SoftphoneStoreApi } from './types';
import type { SoftPhoneConfig } from '../types';

const SoftphoneStoreContext = createContext<SoftphoneStoreApi | null>(null);

export interface SoftphoneProviderProps extends Omit<SoftphoneInit, 'config'> {
  /** SIP config. Required unless an existing `store` is supplied. */
  config?: SoftPhoneConfig;
  /** Use an externally created store instead of creating one internally. */
  store?: SoftphoneStoreApi;
  children?: React.ReactNode;
}

/**
 * Session host: owns exactly one store (and therefore one JsSIP UA and one set
 * of audio elements), runs its lifecycle, and exposes it to any number of
 * descendant views via context.
 */
export function SoftphoneProvider({
  store,
  children,
  ...init
}: SoftphoneProviderProps) {
  const [internalStore] = useState<SoftphoneStoreApi>(() => {
    if (store) return store;
    if (!init.config) {
      throw new Error(
        'SoftphoneProvider requires either a `store` or a `config` prop.',
      );
    }
    return createSoftphoneStore(init as SoftphoneInit);
  });
  const activeStore = store ?? internalStore;

  const playerRef = useRef<HTMLAudioElement | null>(null);
  const ringerRef = useRef<HTMLAudioElement | null>(null);

  // Keep external callbacks/assets in sync with the store.
  useEffect(() => {
    activeStore.getState().setProps(init as SoftphoneInit);
  });

  // Media must be attached before mount so auto-connect/ring can use it.
  useEffect(() => {
    activeStore.getState().attachMedia({
      player: playerRef,
      ringer: ringerRef,
    });
  }, [activeStore]);

  useEffect(() => {
    activeStore.getState().mount();
    return () => activeStore.getState().unmount();
  }, [activeStore]);

  return (
    <SoftphoneStoreContext.Provider value={activeStore}>
      {children}
      <div hidden>
        <audio preload="auto" ref={playerRef} />
      </div>
      <div hidden>
        <audio preload="auto" ref={ringerRef} />
      </div>
    </SoftphoneStoreContext.Provider>
  );
}

/** Access the raw zustand store for the nearest softphone session. */
export function useSoftphoneStore(): SoftphoneStoreApi {
  const store = useContext(SoftphoneStoreContext);
  if (!store) {
    throw new Error(
      'useSoftphoneStore must be used within a <SoftphoneProvider>.',
    );
  }
  return store;
}

/** Select a slice of softphone state. Use `useShallow` for object selections. */
export function useSoftphone<T>(
  selector: (state: SoftphoneStore) => T,
): T {
  return useStore(useSoftphoneStore(), selector);
}

export { SoftphoneStoreContext };
