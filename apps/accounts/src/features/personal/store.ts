import { createFlowStore } from '../../flow/flow-store';
import { initialPersonalState, reduce } from './machine';

/** The personal sign-up flow's state for one page session. */
export const createPersonalStore = () => createFlowStore(initialPersonalState, reduce);

export type PersonalStore = ReturnType<typeof createPersonalStore>;
