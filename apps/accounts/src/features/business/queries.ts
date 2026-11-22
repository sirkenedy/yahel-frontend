import { queryOptions } from '@tanstack/react-query';
import type { DomainMarket, OrderRequest, WorkspaceBilling } from '@yahel/api-client';

// These run before any account exists, so the keys carry the feature and no account context. Nothing
// typed about a card ever reaches a query: an order is a plan, a period, a number of people and a domain.

/** The plan on sale in a country. */
export const planQuery = (billing: WorkspaceBilling | null, country: string) =>
  queryOptions({
    queryKey: ['business', 'plan', country],
    queryFn: () => billing!.plan(country),
    enabled: billing !== null,
    staleTime: 5 * 60_000,
  });

/** The server's sums for an order. The interface shows them and works out no price of its own. */
export const quoteQuery = (billing: WorkspaceBilling | null, order: OrderRequest | null) =>
  queryOptions({
    queryKey: ['business', 'quote', order],
    queryFn: () => billing!.quote(order!),
    enabled: billing !== null && order !== null,
    staleTime: 60_000,
  });

const MIN_SEARCH = 2;

/** Domains like the words typed that can be bought. A superseded search is cancelled. */
export const domainSearchQuery = (market: DomainMarket | null, query: string) =>
  queryOptions({
    queryKey: ['business', 'domain-search', query],
    queryFn: ({ signal }) => market!.search(query, signal),
    enabled: market !== null && query.trim().length >= MIN_SEARCH,
    staleTime: 60_000,
    retry: false,
  });
