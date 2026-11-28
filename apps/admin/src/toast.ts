import { createStore, useStore } from 'zustand';

export type ToastTone = 'success' | 'danger' | 'info';

interface ToastState {
  toast: { id: number; tone: ToastTone; text: string } | null;
}

const store = createStore<ToastState>(() => ({ toast: null }));
let next = 0;

/** Says, once and briefly, what an action did. A new one replaces the last. */
export const notify = (text: string, tone: ToastTone = 'success') => store.setState({ toast: { id: ++next, tone, text } });
export const dismissToast = () => store.setState({ toast: null });
export const useToast = () => useStore(store, (state) => state.toast);
