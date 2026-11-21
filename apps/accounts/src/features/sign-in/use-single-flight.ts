import { useRef } from 'react';

type Mutate<Variables> = (variables: Variables, options: { onSettled: () => void }) => void;

/**
 * Wraps a mutation so that a second call is ignored until the first has settled. The check is a ref, not
 * the mutation's `isPending`, because two presses can arrive before React has rendered the pending state.
 */
export function useSingleFlight<Variables = void>(mutate: Mutate<Variables>) {
  const running = useRef(false);
  return (variables: Variables) => {
    if (running.current) return false;
    running.current = true;
    mutate(variables, {
      onSettled: () => {
        running.current = false;
      },
    });
    return true;
  };
}
