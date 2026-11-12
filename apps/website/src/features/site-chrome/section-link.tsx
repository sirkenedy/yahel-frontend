import type { ReactNode } from 'react';
import { useSectionLink } from '../../section-link';

/** A link to a section of the home page. `onChoose` runs before the page moves, for a menu to close or a product to be picked. */
export function SectionLink({ hash, onChoose, children }: { hash: string; onChoose?: () => void; children: ReactNode }) {
  const link = useSectionLink(hash);
  return (
    <a
      {...link}
      href={link.href}
      onClick={(event) => {
        onChoose?.();
        link.onClick?.(event);
      }}
    >
      {children}
    </a>
  );
}
