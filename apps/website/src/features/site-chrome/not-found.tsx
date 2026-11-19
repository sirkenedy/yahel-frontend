import { Link } from '@tanstack/react-router';
import { chromeMessages as m } from './messages';

export function NotFound() {
  return (
    <section className="site-container site-hero">
      <title>{m.notFoundDocumentTitle}</title>
      <h1 className="ws-display-l">{m.notFoundTitle}</h1>
      <p className="ws-lead site-measure">{m.notFoundBody}</p>
      <Link to="/" className="site-link">
        {m.notFoundAction}
      </Link>
    </section>
  );
}
