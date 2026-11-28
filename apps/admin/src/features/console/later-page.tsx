import { ConsolePage, ConsolePlaceholder, FlowLink } from '@yahel/ui';
import { consoleMessages, laterMessages as m, navWords } from './messages';
import { crumbsOf, isNavId } from './nav-tree';
import type { NavId } from './nav-tree';

const BackHome = ({ slot }: { slot: string }) => (
  <FlowLink href={`/u/${slot}/`} variant="quiet">
    {m.backHome}
  </FlowLink>
);

/** A page of the menu whose screens are not built yet: its name, what it will be for, and the way back. */
export function LaterPage({ slot, page }: { slot: string; page: string }) {
  if (!isNavId(page)) {
    return (
      <ConsolePage title={m.title}>
        <ConsolePlaceholder title={m.notFound} action={<BackHome slot={slot} />}>
          {m.body}
        </ConsolePlaceholder>
      </ConsolePage>
    );
  }
  const words: { label: string; about?: string } = navWords[page];
  return (
    <ConsolePage crumbs={crumbsOf(slot, page)} crumbsLabel={consoleMessages.crumbs} title={words.label} lede={words.about}>
      <ConsolePlaceholder title={m.title} action={<BackHome slot={slot} />}>
        {m.body}
      </ConsolePlaceholder>
    </ConsolePage>
  );
}

export interface PlannedPageProps {
  slot: string;
  /** Where the page sits in the menu. */
  id: NavId;
  title: string;
  body: string;
  planned: readonly string[];
}

/** A designed section page that says what is coming and when: Billing, Security, Apps. */
export function PlannedPage({ slot, id, title, body, planned }: PlannedPageProps) {
  return (
    <ConsolePage crumbs={crumbsOf(slot, id)} crumbsLabel={consoleMessages.crumbs} title={title}>
      <ConsolePlaceholder title={m.title} planned={planned} plannedLabel={m.planned} action={<BackHome slot={slot} />}>
        {body}
      </ConsolePlaceholder>
    </ConsolePage>
  );
}
