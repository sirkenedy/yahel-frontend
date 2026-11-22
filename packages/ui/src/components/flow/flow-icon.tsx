const outlines = {
  forward: 'M4.5 12h15M13.5 6l6 6-6 6',
  back: 'M19 12H5M11 6l-6 6 6 6',
  info: 'M12 3.5a8.5 8.5 0 1 1 0 17 8.5 8.5 0 0 1 0-17zM12 11v5M12 8v.1',
  check: 'M5 12.5l4.5 4.5L19 7',
  'check-circle': 'M12 3.5a8.5 8.5 0 1 1 0 17 8.5 8.5 0 0 1 0-17zM8.2 12.2l2.6 2.6 5-5.2',
  alert: 'M12 3.5a8.5 8.5 0 1 1 0 17 8.5 8.5 0 0 1 0-17zM12 7.8v5M12 16.2v.1',
  warning: 'M12 4 2.8 19.5h18.4zM12 10v4.5M12 17v.1',
  offline: 'M3.5 3.5l17 17M8.6 16.4a4.8 4.8 0 0 1 6.8 0M5.2 12.9a9.6 9.6 0 0 1 4-2.3M18.8 12.9a9.6 9.6 0 0 0-2.5-1.8M2 9.4a14.5 14.5 0 0 1 4.3-2.7M22 9.4A14.4 14.4 0 0 0 11 5.7M12 19.8v.1',
  clock: 'M12 3.5a8.5 8.5 0 1 1 0 17 8.5 8.5 0 0 1 0-17zM12 7.5V12l3 2',
  close: 'M6 6l12 12M18 6 6 18',
  pause: 'M12 3.5a8.5 8.5 0 1 1 0 17 8.5 8.5 0 0 1 0-17zM10 9v6M14 9v6',
  unlink: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1M4 4l16 16',
  wrench: 'M14.5 5.5a4 4 0 0 0-5 5L4 16l4 4 5.5-5.5a4 4 0 0 0 5-5l-2.5 2.5-2.5-.5-.5-2.5z',
  plus: 'M12 5v14M5 12h14',
  lock: 'M7 10.5V8a5 5 0 0 1 10 0v2.5M5.5 10.5h13v9.5h-13z',
  globe: 'M12 3.5a8.5 8.5 0 1 1 0 17 8.5 8.5 0 0 1 0-17zM3.5 12h17M12 3.5c2.3 2.4 3.4 5.2 3.4 8.5s-1.1 6.1-3.4 8.5c-2.3-2.4-3.4-5.2-3.4-8.5s1.1-6.1 3.4-8.5z',
  passkey: 'M8 11a4 4 0 0 1 8 0v2M12 11v4.5c0 2 1 3.5 2.5 4.5M8.5 15c0 2 .6 3.6 1.8 5M5.5 9a7 7 0 0 1 13 0M16 14.5c0 1.5-.2 3-.7 4.3',
  phone: 'M8 3.5h8a1.5 1.5 0 0 1 1.5 1.5v14a1.5 1.5 0 0 1-1.5 1.5H8A1.5 1.5 0 0 1 6.5 19V5A1.5 1.5 0 0 1 8 3.5zM11 17.5h2',
  mail: 'M4.5 6h15a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1zM4 7.5l8 6 8-6',
  moon: 'M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z',
  sun: 'M12 7.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9zM12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4',
  eye: 'M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12s-3.5 6.5-9.5 6.5S2.5 12 2.5 12zM12 9.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5z',
  'eye-off': 'M4 4l16 16M9.9 5.8A9 9 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a16 16 0 0 1-2.8 3.6M6.4 7.4A15.5 15.5 0 0 0 2.5 12s3.5 6.5 9.5 6.5a9 9 0 0 0 4-.9M10.200 10.300a2.5 2.5 0 0 0 3.5 3.5',
  person: 'M12 4.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7zM5 19.5c.6-3.300 3.400-5 7-5s6.400 1.700 7 5',
  people: 'M9 5.5a3 3 0 1 1 0 6 3 3 0 0 1 0-6zM3.5 18.5c.5-2.800 2.700-4 5.5-4s5 1.200 5.5 4M16 6a2.5 2.5 0 0 1 0 5M17.5 14.800c1.700.5 2.700 1.700 3 3.700',
  building: 'M5 20V5.5h8V20M13 10h6v10M3.5 20h17M8 9h2M8 12.5h2M8 16h2M16 13.5h.1M16 16.5h.1',
  'chevron-down': 'M6 9.5l6 6 6-6',
  'chevron-forward': 'M9.5 6l6 6-6 6',
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
