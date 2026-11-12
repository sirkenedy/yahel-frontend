import { productMessages as m } from './messages';

/** The nine products, in the order the site always lists them. */
export const productIds = ['mail', 'calendar', 'drive', 'docs', 'sheets', 'slides', 'chat', 'meet', 'admin'] as const;

export type ProductId = (typeof productIds)[number];

export interface Product {
  id: ProductId;
  name: string;
  /** The address the product is opened at. */
  host: string;
  /** What it is for, in one line. */
  line: string;
}

export const products: readonly Product[] = productIds.map((id) => ({ id, host: `${id}.${m.domain}`, ...m.products[id] }));
