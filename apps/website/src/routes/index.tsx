import { createFileRoute } from '@tanstack/react-router';
import { signInUrl } from '../config';
import { HomePage } from '../features/home/home-page';
import { pickProduct, showProduct, useProductSelection } from '../features/products/product-selection';
import { products } from '../features/products/products';
import { useSectionLink } from '../section-link';

function Home() {
  const selection = useProductSelection();
  return (
    <HomePage
      signInUrl={signInUrl}
      products={products}
      selectedId={selection.id}
      picks={selection.picks}
      onSelect={showProduct}
      onPickProduct={pickProduct}
      productsLink={useSectionLink('products')}
      accountsLink={useSectionLink('accounts')}
    />
  );
}

export const Route = createFileRoute('/')({ component: Home });
