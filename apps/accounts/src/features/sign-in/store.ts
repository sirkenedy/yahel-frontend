import { createStore } from 'zustand/vanilla';
import { initialSignInState, reduce } from './machine';
import type { SignInEvent, SignInState } from './machine';

/** Holds the flow's state for one page session. Created once per app load and passed in router context. */
export function createSignInStore() {
  const store = createStore<SignInState>(() => initialSignInState);
  return {
    getState: store.getState,
    getInitialState: store.getInitialState,
    subscribe: store.subscribe,
    dispatch: (event: SignInEvent) => store.setState(reduce(store.getState(), event), true),
  };
}

export type SignInStore = ReturnType<typeof createSignInStore>;
