import { useId } from 'react';

export interface AdminMarkProps {
  /** Read out in place of the drawing and the words: "Yahel Admin". */
  label: string;
  /** The brand word, drawn in bold: "yahel". */
  word: string;
  /** The product word after it, drawn muted: "admin". */
  product: string;
  /** A few words after the mark naming where the person is, such as "Domain setup". */
  context?: string;
}

/** Admin's mark: the house emblem, then "yahel admin" in the display face. */
export function AdminMark({ label, word, product, context }: AdminMarkProps) {
  const id = useId();
  return (
    <span className="ws-console-mark" translate="no">
      <span className="ws-console-mark" role="img" aria-label={label}>
        <AdminEmblem id={id} />
        <span className="ws-console-mark__word" aria-hidden="true">
          <b>{word}</b>
          <span className="ws-console-mark__product">{product}</span>
        </span>
      </span>
      {context ? <span className="ws-console-mark__label">{context}</span> : null}
    </span>
  );
}

/** The emblem alone, for the favicon's shape and small places. Decorative. */
export function AdminEmblem({ id }: { id: string }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <defs>
        <mask id={`${id}m`} maskUnits="userSpaceOnUse" x="-4" y="-4" width="56" height="56">
          <rect x="-4" y="-4" width="56" height="56" fill="white" />
          <path d="M2 21.3h44" stroke="black" strokeWidth="2.6" fill="none" />
          <path d="M19 43V33a5 5 0 0 1 10 0v10z" fill="black" />
        </mask>
      </defs>
      <g mask={`url(#${id}m)`}>
        <path className="ws-console-mark__roof" d="M24 4 44 20H4z" />
        <path className="ws-console-mark__body" d="M8 20h32v18a5 5 0 0 1-5 5H13a5 5 0 0 1-5-5z" />
      </g>
    </svg>
  );
}
