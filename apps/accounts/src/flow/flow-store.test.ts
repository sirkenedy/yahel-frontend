import { describe, expect, it, vi } from 'vitest';
import { createFlowStore } from './flow-store';

const reduce = (state: { count: number }, event: { add: number }) => ({ count: state.count + event.add });

describe('createFlowStore', () => {
  it('changes only through events given to the flow’s reducer, and tells subscribers', () => {
    const store = createFlowStore({ count: 0 }, reduce);
    const heard = vi.fn();
    store.subscribe(heard);

    store.dispatch({ add: 2 });
    store.dispatch({ add: 3 });

    expect(store.getState()).toEqual({ count: 5 });
    expect(store.getInitialState()).toEqual({ count: 0 });
    expect(heard).toHaveBeenCalledTimes(2);
  });

  it('keeps each store’s state apart', () => {
    const first = createFlowStore({ count: 0 }, reduce);
    first.dispatch({ add: 1 });

    expect(createFlowStore({ count: 0 }, reduce).getState()).toEqual({ count: 0 });
  });
});
