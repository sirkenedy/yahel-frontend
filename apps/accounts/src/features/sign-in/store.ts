import { createFlowStore } from '../../flow/flow-store';
import { initialSignInState, reduce } from './machine';

/** The sign-in flow's state for one page session. */
export const createSignInStore = () => createFlowStore(initialSignInState, reduce);

export type SignInStore = ReturnType<typeof createSignInStore>;
