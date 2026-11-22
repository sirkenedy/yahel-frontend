import { useEffect, useState } from 'react';

/** The value as it was once it stopped changing for `delay` milliseconds, so work is not done for every keystroke. */
export function useDebouncedValue<Value>(value: Value, delay: number) {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return settled;
}
