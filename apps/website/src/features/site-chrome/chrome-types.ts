import type { AppIconName } from '@yahel/ui';

/** A product as the bar and footer list it. The route supplies the list. */
export interface ChromeProduct {
  id: AppIconName;
  name: string;
  host: string;
}

export interface ProductLinksProps {
  products: readonly ChromeProduct[];
  /** Shows a product in the home page's Products section and moves focus there. */
  onPickProduct: (id: AppIconName) => void;
}
