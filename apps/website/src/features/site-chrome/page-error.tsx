import { Link, useLocation } from '@tanstack/react-router';
import { LinkButton } from '@yahel/ui';
import { chromeMessages as m } from './messages';

/** Shown in place of a page whose code could not be fetched. The bar and footer stay; trying again loads the address whole. */
export function PageError() {
  const address = useLocation({ select: (location) => location.href });
  return (
    <section className="site-container site-hero">
      <title>{m.loadFailedDocumentTitle}</title>
      <h1 className="ws-display-l">{m.loadFailedTitle}</h1>
      <p className="ws-lead site-measure" role="alert">
        {m.loadFailedBody}
      </p>
      <div className="site-actions">
        <LinkButton href={address}>{m.loadFailedRetry}</LinkButton>
        <Link to="/" className="site-link">
          {m.notFoundAction}
        </Link>
      </div>
    </section>
  );
}
