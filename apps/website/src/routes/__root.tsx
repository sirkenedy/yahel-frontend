import { Outlet, createRootRoute } from '@tanstack/react-router';
import { signInUrl } from '../config';
import { pickProduct } from '../features/products/product-selection';
import { products } from '../features/products/products';
import { NotFound } from '../features/site-chrome/not-found';
import { SiteFooter } from '../features/site-chrome/site-footer';
import { SiteHeader } from '../features/site-chrome/site-header';

export const Route = createRootRoute({
  component: () => (
    <div id="top" className="ws-site site">
      <SiteHeader signInUrl={signInUrl} products={products} onPickProduct={pickProduct} />
      <main className="site__main">
        <Outlet />
      </main>
      <SiteFooter products={products} onPickProduct={pickProduct} />
    </div>
  ),
  notFoundComponent: NotFound,
});
