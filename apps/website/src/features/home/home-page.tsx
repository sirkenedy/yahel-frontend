import { HomeHero } from './home-hero';
import { HomeProducts } from './home-products';
import { HomeAccounts, HomeClosing, HomePlans, HomeSecurity } from './home-sections';
import type { HomeHeroProps } from './home-hero';
import type { HomeProductsProps } from './home-products';
import { homeMessages as m } from './messages';
import './home.css';

export type HomePageProps = HomeHeroProps & Pick<HomeProductsProps, 'selectedId' | 'picks' | 'onSelect'>;

/** The home page: what Yahel is, what is in it, who it is for, whether it is safe, and what it costs. */
export function HomePage({ signInUrl, products, selectedId, picks, onSelect, onPickProduct, productsLink, accountsLink }: HomePageProps) {
  return (
    <>
      <title>{m.documentTitle}</title>
      <HomeHero signInUrl={signInUrl} products={products} onPickProduct={onPickProduct} productsLink={productsLink} accountsLink={accountsLink} />
      <HomeProducts products={products} selectedId={selectedId} picks={picks} onSelect={onSelect} productsLink={productsLink} />
      <HomeAccounts signInUrl={signInUrl} />
      <HomeSecurity />
      <HomePlans />
      <HomeClosing signInUrl={signInUrl} />
    </>
  );
}
