import { Link } from '@tanstack/react-router';
import { chromeMessages as m } from './messages';

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-container site-footer__row">
        <span>{m.copyright}</span>
        <nav className="site-footer__links" aria-label={m.footerLabel}>
          <Link to="/" activeOptions={{ exact: true }}>
            {m.home}
          </Link>
          <Link to="/about">{m.about}</Link>
          <Link to="/careers">{m.careers}</Link>
          <a href="#top">{m.privacy}</a>
          <a href="#top">{m.terms}</a>
        </nav>
      </div>
    </footer>
  );
}
