import { useMutation } from '@tanstack/react-query';
import { useRef, useState } from 'react';

/** One request the flow can make: whether it is running, and what went wrong last time in plain words. */
export interface FlowRequest {
  isPending: boolean;
  failure: string | null;
}

export interface FlowRequestOptions<Input, Outcome> {
  /** Counts the steps shown so far. A result is shown only during the visit in which its request began. */
  visit: number;
  /** `flow` for a request that starts on one step and is awaited on the next. */
  scope?: 'step' | 'flow';
  /** Puts a failure into words for the person. Each flow brings its own, so nothing here knows a flow's wording. */
  describe: (error: unknown) => string;
  /**
   * Does the work. What it resolves with is kept by the query client until the next request, so it must
   * be a plain outcome ("signed-in", a masked number), never a password, a code or a token.
   */
  run: (input: Input) => Promise<Outcome>;
  onDone?: (outcome: Outcome) => void;
  onFailed?: (error: unknown) => void;
}

/**
 * A request owned by the flow, on top of a TanStack mutation, with three guarantees the flow relies on.
 * A second `start` is ignored until the first has settled, even when both arrive before React has
 * rendered; the lock is released by the request itself, so leaving the step mid-request cannot strand it.
 * The input (often a password or a code) is handed over through a ref and dropped as it is read, so it
 * never sits in the mutation cache. And a failure belongs to the visit it happened in: coming back to
 * the step later starts clean, without anything having to be reset.
 */
export function useFlowRequest<Input = void, Outcome = void>({ visit, scope = 'step', describe, run, onDone, onFailed }: FlowRequestOptions<Input, Outcome>) {
  const running = useRef(false);
  const held = useRef<{ input: Input } | null>(null);
  const [startedIn, setStartedIn] = useState<number | null>(null);

  const mutation = useMutation({
    gcTime: 0,
    mutationFn: () => {
      const next = held.current;
      held.current = null;
      if (!next) throw new Error('A flow request ran without its input.');
      return run(next.input);
    },
    onSuccess: onDone,
    onError: onFailed,
    onSettled: () => {
      running.current = false;
    },
  });

  /** Returns false when a request of this kind is already running. */
  const start = (input: Input) => {
    if (running.current) return false;
    running.current = true;
    held.current = { input };
    setStartedIn(visit);
    mutation.mutate();
    return true;
  };

  const current = scope === 'flow' || startedIn === visit;
  return {
    start,
    isPending: mutation.isPending,
    failure: current && mutation.error ? describe(mutation.error) : null,
    outcome: current ? mutation.data : undefined,
  };
}

/** What a step needs to know about a request, without the means to start it. */
export const requestStatus = ({ isPending, failure }: FlowRequest): FlowRequest => ({ isPending, failure });
