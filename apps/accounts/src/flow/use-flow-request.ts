import { useMutation } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import type { Feedback } from './feedback';

/** One request the flow can make: whether it is running, and what went wrong last time, described for the person. */
export interface FlowRequest<Field extends string = string, Next extends string = string> {
  isPending: boolean;
  feedback: Feedback<Field, Next> | null;
  /** Puts the feedback away, so the step is shown again as it was. */
  clear: () => void;
  /** Makes the request again, when it needs nothing typed to do so. */
  again?: () => void;
}

/** What a running request can ask about the visit it began in. */
export interface RequestVisit {
  /** The step the request began on is still the one on screen, not left and not returned to since. */
  isCurrent: () => boolean;
}

export interface FlowRequestOptions<Input, Outcome, Field extends string, Next extends string> {
  /** Counts the steps shown so far. A result is shown only during the visit in which its request began. */
  visit: number;
  /** `flow` for a request that starts on one step and is awaited on the next. */
  scope?: 'step' | 'flow';
  /** Describes a failure for the person. Each flow brings its own rows, so nothing here knows a flow's wording. */
  describe: (error: unknown) => Feedback<Field, Next>;
  /**
   * Does the work. What it resolves with is kept by the query client until the next request, so it must
   * be a plain outcome ("signed-in", a masked number), never a password, a code or a token.
   */
  run: (input: Input, during: RequestVisit) => Promise<Outcome>;
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
export function useFlowRequest<Input = void, Outcome = void, Field extends string = string, Next extends string = string>({ visit, scope = 'step', describe, run, onDone, onFailed }: FlowRequestOptions<Input, Outcome, Field, Next>) {
  const running = useRef(false);
  const held = useRef<{ input: Input; visit: number } | null>(null);
  const latestVisit = useRef(visit);
  useEffect(() => {
    latestVisit.current = visit;
    // Once the flow has left the screen altogether, no request that began in it is current any more.
    return () => {
      latestVisit.current = -1;
    };
  }, [visit]);
  const [startedIn, setStartedIn] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<Feedback<Field, Next> | null>(null);

  const mutation = useMutation({
    gcTime: 0,
    // Asked even when the browser says it is offline, so the request fails at once and the person is told, instead of waiting unseen for a connection.
    networkMode: 'always',
    mutationFn: () => {
      const next = held.current;
      held.current = null;
      if (!next) throw new Error('A flow request ran without its input.');
      return run(next.input, { isCurrent: () => latestVisit.current === next.visit });
    },
    onSuccess: onDone,
    onError: (error) => {
      setFeedback(describe(error));
      onFailed?.(error);
    },
    onSettled: () => {
      running.current = false;
    },
  });

  /** Returns false when a request of this kind is already running. */
  const start = (input: Input) => {
    if (running.current) return false;
    running.current = true;
    held.current = { input, visit };
    setStartedIn(visit);
    setFeedback(null);
    mutation.mutate();
    return true;
  };

  const current = scope === 'flow' || startedIn === visit;
  return {
    start,
    isPending: mutation.isPending,
    feedback: current ? feedback : null,
    clear: () => setFeedback(null),
    outcome: current ? mutation.data : undefined,
  };
}

/**
 * What a step needs to know about a request, without the means to start it with something of its own.
 * Pass `again` for a request that takes no input, so "Try again" can make it once more.
 */
export const requestStatus = <Field extends string, Next extends string>({ isPending, feedback, clear }: FlowRequest<Field, Next>, again?: () => unknown): FlowRequest<Field, Next> => ({
  isPending,
  feedback,
  clear,
  ...(again ? { again: () => void again() } : {}),
});
