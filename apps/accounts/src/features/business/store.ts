import { createFlowStore } from '../../flow/flow-store';
import { initialBusinessState, reduce } from './machine';

/** The workspace sign-up flow's state for one page session. */
export const createBusinessStore = () => createFlowStore(initialBusinessState, reduce);

export type BusinessStore = ReturnType<typeof createBusinessStore>;
