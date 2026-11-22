import type { FlowTone } from '@yahel/ui';
import { useSyncExternalStore } from 'react';

/** A passing confirmation. `id` tells two toasts with the same words apart, so the second restarts the clock. */
export interface Toast {
  id: number;
  text: string;
  tone: FlowTone;
}

let current: Toast | null = null;
let issued = 0;
const listeners = new Set<() => void>();
const set = (next: Toast | null) => {
  current = next;
  listeners.forEach((listener) => listener());
};
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => void listeners.delete(listener);
};

/** Says that something worked. One toast shows at a time; a new one takes the last one's place. Never the only place an error is told. */
export const say = (text: string, tone: FlowTone = 'success') => set({ id: ++issued, text, tone });
export const dismissToast = () => set(null);
export const useToast = () => useSyncExternalStore(subscribe, () => current);
