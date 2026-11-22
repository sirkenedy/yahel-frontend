import { createStore } from 'zustand/vanilla';

/**
 * Holds one flow's state for a page session, in memory only. Created once per app load and passed in
 * router context; the only way to change it is to dispatch an event to the flow's own `reduce`.
 */
export function createFlowStore<State, Event>(initial: State, reduce: (state: State, event: Event) => State) {
  const store = createStore<State>(() => initial);
  return {
    getState: store.getState,
    getInitialState: store.getInitialState,
    subscribe: store.subscribe,
    dispatch: (event: Event) => store.setState(reduce(store.getState(), event), true),
  };
}

export type FlowStore<State, Event> = ReturnType<typeof createFlowStore<State, Event>>;
