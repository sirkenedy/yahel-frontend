import type { AppIconName } from '@yahel/ui';
import type { AnchorHTMLAttributes } from 'react';

/** A product as the home page shows it. The route supplies the list. */
export interface HomeProduct {
  id: AppIconName;
  name: string;
  host: string;
  line: string;
}

/** A link to a section of this page, made by the route so that the router moves the page there. */
export type SectionLink = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };
