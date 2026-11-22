import { Link } from 'react-aria-components';
import type { ReactNode } from 'react';
import { FlowIcon } from './flow-icon';

const MAIN_ID = 'ws-flow-main';

interface FlowShellProps {
  /** Text of the link that jumps past the header, for keyboard and screen-reader users. */
  skipLabel: string;
  /** Blurs fields marked sensitive, unless focused, for screen shares and calls. */
  isPrivate?: boolean;
  children: ReactNode;
}

function FlowShellRoot({ skipLabel, isPrivate, children }: FlowShellProps) {
  return (
    <div className="ws-flow" data-private={isPrivate || undefined}>
      <a className="ws-flow__skip" href={`#${MAIN_ID}`}>
        {skipLabel}
      </a>
      {children}
    </div>
  );
}

interface FlowShellHeaderProps {
  /** The brand mark, usually a link home. */
  brand: ReactNode;
  /** Controls at the end of the header: a prompt and link, the theme control, the account. */
  children?: ReactNode;
}

function FlowShellHeader({ brand, children }: FlowShellHeaderProps) {
  return (
    <header className="ws-flow__header">
      <span className="ws-flow__brand">{brand}</span>
      <div className="ws-flow__header-actions">{children}</div>
    </header>
  );
}

interface FlowShellBrandLinkProps {
  href: string;
  /** Where the link leads, for assistive technology: "Yahel sign in". */
  label: string;
  /** The brand mark. */
  children: ReactNode;
}

/** The brand mark as a link. In-app addresses go through the router, so pressing it does not reload the page. */
function FlowShellBrandLink({ href, label, children }: FlowShellBrandLinkProps) {
  return (
    <Link className="ws-flow__brand-link" href={href} aria-label={label} translate="no">
      {children}
    </Link>
  );
}

/** Holds the question and, on flows that build something, the summary beside it. */
function FlowShellMain({ children }: { children: ReactNode }) {
  return (
    <main id={MAIN_ID} className="ws-flow__main" tabIndex={-1}>
      <div className="ws-flow__wrap">{children}</div>
    </main>
  );
}

/** The column that holds one question. */
function FlowShellQuestion({ children }: { children: ReactNode }) {
  return <div className="ws-flow__question">{children}</div>;
}

interface FlowShellSummaryProps {
  /** Names the panel for assistive technology, for example "Your account so far". */
  label: string;
  children: ReactNode;
}

/** The panel beside the question that fills in as the person answers. Hidden on narrow screens. */
function FlowShellSummary({ label, children }: FlowShellSummaryProps) {
  return (
    <aside className="ws-flow__summary" aria-label={label}>
      {children}
    </aside>
  );
}

interface FlowShellFooterProps {
  /** The data-location promise, for example "Your data stays in Africa." */
  dataLocation: string;
  /** Language, help, privacy and terms. */
  children?: ReactNode;
}

function FlowShellFooter({ dataLocation, children }: FlowShellFooterProps) {
  return (
    <footer className="ws-flow__footer">
      <span className="ws-flow__promise">
        <FlowIcon name="lock" />
        {dataLocation}
      </span>
      <span className="ws-flow__footer-links">{children}</span>
    </footer>
  );
}

interface FlowShellLanguageProps {
  /** What the value is, for assistive technology: "Language". */
  label: string;
  /** The language in use, written in that language. */
  children: string;
}

function FlowShellLanguage({ label, children }: FlowShellLanguageProps) {
  return (
    <span className="ws-flow__language">
      <FlowIcon name="globe" />
      <span className="ws-flow-hidden">{label}: </span>
      <span lang="en">{children}</span>
    </span>
  );
}

function FlowShellFooterLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a className="ws-flow__footer-link" href={href}>
      {children}
    </a>
  );
}

/**
 * The page frame every sign-in and sign-up screen shares: brand and controls on top, one question in the
 * middle with an optional summary beside it, and the footer with the data-location promise.
 */
export const FlowShell = Object.assign(FlowShellRoot, {
  Header: FlowShellHeader,
  BrandLink: FlowShellBrandLink,
  Main: FlowShellMain,
  Question: FlowShellQuestion,
  Summary: FlowShellSummary,
  Footer: FlowShellFooter,
  Language: FlowShellLanguage,
  FooterLink: FlowShellFooterLink,
});

export type { FlowShellProps, FlowShellHeaderProps, FlowShellSummaryProps, FlowShellFooterProps, FlowShellLanguageProps };
