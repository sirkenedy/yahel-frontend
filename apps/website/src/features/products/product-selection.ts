import { useSyncExternalStore } from 'react';
import type { ProductId } from './products';

export interface ProductSelection {
  /** The product the Products section is showing. */
  id: ProductId;
  /** How many times a product has been picked from outside the section. Each pick asks the section to take focus. */
  picks: number;
}

// The bar's menu, the hero's icons, the footer and the Products section sit far apart and must agree on one product.
const first: ProductSelection = { id: 'mail', picks: 0 };
let selection = first;
const listeners = new Set<() => void>();

const set = (next: ProductSelection) => {
  selection = next;
  for (const listener of listeners) listener();
};
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => void listeners.delete(listener);
};

/** Shows a product from inside the Products section: its own tabs. Focus is already there. */
export const showProduct = (id: ProductId) => set({ id, picks: selection.picks });

/** Picks a product from somewhere else on the site: the section shows it and takes focus. */
export const pickProduct = (id: ProductId) => set({ id, picks: selection.picks + 1 });

export const resetProductSelection = () => set(first);

export const useProductSelection = () => useSyncExternalStore(subscribe, () => selection, () => first);
