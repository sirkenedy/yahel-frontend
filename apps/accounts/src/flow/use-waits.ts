import { useEffect, useState, useSyncExternalStore } from 'react';

const SLOW_AFTER = 1200;

/** True once `busy` has lasted long enough that the person may wonder whether anything is happening. */
export function useSlow(busy: boolean) {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    if (!busy) return;
    const timer = setTimeout(() => setSlow(true), SLOW_AFTER);
    return () => {
      clearTimeout(timer);
      setSlow(false);
    };
  }, [busy]);
  return busy && slow;
}

const everySecond = (onTick: () => void) => {
  const timer = setInterval(onTick, 1000);
  return () => clearInterval(timer);
};
const noTicks = () => () => undefined;

/** Whole seconds left until `until` (a time in milliseconds), counted down once a second; 0 when it has passed or there is none. */
export function useSecondsLeft(until: number | null | undefined) {
  const left = () => (until ? Math.max(0, Math.ceil((until - Date.now()) / 1000)) : 0);
  return useSyncExternalStore(until ? everySecond : noTicks, left);
}

const subscribeToConnection = (onChange: () => void) => {
  window.addEventListener('online', onChange);
  window.addEventListener('offline', onChange);
  return () => {
    window.removeEventListener('online', onChange);
    window.removeEventListener('offline', onChange);
  };
};

/** Whether the browser says the device has a connection. */
export const useOnline = () => useSyncExternalStore(subscribeToConnection, () => navigator.onLine);
