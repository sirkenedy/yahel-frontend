const outlines = {
  forward: 'M4.5 12h15M13.5 6l6 6-6 6',
  back: 'M19 12H5M11 6l-6 6 6 6',
  info: 'M12 3.5a8.5 8.5 0 1 1 0 17 8.5 8.5 0 0 1 0-17zM12 11v5M12 8v.1',
  check: 'M5 12.5l4.5 4.5L19 7',
  plus: 'M12 5v14M5 12h14',
  lock: 'M7 10.5V8a5 5 0 0 1 10 0v2.5M5.5 10.5h13v9.5h-13z',
  globe: 'M12 3.5a8.5 8.5 0 1 1 0 17 8.5 8.5 0 0 1 0-17zM3.5 12h17M12 3.5c2.3 2.4 3.4 5.2 3.4 8.5s-1.1 6.1-3.4 8.5c-2.3-2.4-3.4-5.2-3.4-8.5s1.1-6.1 3.4-8.5z',
  passkey: 'M8 11a4 4 0 0 1 8 0v2M12 11v4.5c0 2 1 3.5 2.5 4.5M8.5 15c0 2 .6 3.6 1.8 5M5.5 9a7 7 0 0 1 13 0M16 14.5c0 1.5-.2 3-.7 4.3',
  phone: 'M8 3.5h8a1.5 1.5 0 0 1 1.5 1.5v14a1.5 1.5 0 0 1-1.5 1.5H8A1.5 1.5 0 0 1 6.5 19V5A1.5 1.5 0 0 1 8 3.5zM11 17.5h2',
  mail: 'M4.5 6h15a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1zM4 7.5l8 6 8-6',
  moon: 'M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z',
  sun: 'M12 7.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9zM12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4',
} as const;

export type FlowIconName = keyof typeof outlines;

export interface FlowIconProps {
  name: FlowIconName;
}

/** A decorative line icon. It is hidden from assistive technology: the text beside it carries the meaning. */
export function FlowIcon({ name }: FlowIconProps) {
  return (
    <svg className="ws-flow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={outlines[name]} />
    </svg>
  );
}
