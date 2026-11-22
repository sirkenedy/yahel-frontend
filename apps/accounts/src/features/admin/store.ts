import { createFlowStore } from '../../flow/flow-store';
import { initialAdminState, reduce } from './machine';

/** The administrator's first sign-in, for one page session. */
export const createAdminStore = () => createFlowStore(initialAdminState, reduce);

export type AdminStore = ReturnType<typeof createAdminStore>;
