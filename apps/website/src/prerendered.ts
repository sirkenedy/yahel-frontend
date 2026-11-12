/**
 * Whether the HTML already in the root was drawn for exactly this address. The build marks each page it writes
 * with its path. A host may answer an address it has no file for with the home page, and a link into a section
 * changes which bar link is marked: in both cases what the browser would draw differs from what is there.
 */
export const isPrerenderedFor = (page: string | undefined, { pathname, hash }: Pick<Location, 'pathname' | 'hash'>) => page !== undefined && page === `${pathname}${hash}`;
