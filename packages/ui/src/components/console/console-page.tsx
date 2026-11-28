import { Link } from 'react-aria-components';
import type { ReactNode } from 'react';
import { FlowIcon } from '../flow/flow-icon';
import type { FlowIconName } from '../flow/flow-icon';

export interface ConsoleCrumb {
  label: string;
  /** A crumb with an address is a link; the last one never is. */
  href?: string;
}

export interface ConsolePageProps {
  /** Where the page sits in the menu: "Directory / Users". The last crumb is this page. */
  crumbs?: readonly ConsoleCrumb[];
  crumbsLabel?: string;
  title: ReactNode;
  /** Under the title: what the page is for, or a count. */
  lede?: ReactNode;
  /** Before the title, such as a face. */
  leading?: ReactNode;
  /** At the end of the title row: at most two buttons. */
  actions?: ReactNode;
  children?: ReactNode;
}

/** One console page: where it is, its title and actions, then its content. The title is the page's only h1. */
export function ConsolePage({ crumbs, crumbsLabel, title, lede, leading, actions, children }: ConsolePageProps) {
  return (
    <section className="ws-console-page" aria-labelledby="ws-console-title">
      {crumbs?.length ? (
        <nav aria-label={crumbsLabel}>
          <ol className="ws-console-crumbs">
            {crumbs.map((crumb, index) => {
              const last = index === crumbs.length - 1;
              return (
                <li key={`${crumb.label}-${index}`}>
                  {crumb.href && !last ? (
                    <Link className="ws-console-link" href={crumb.href}>
                      {crumb.label}
                    </Link>
                  ) : (
                    <span aria-current={last ? 'page' : undefined}>{crumb.label}</span>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      ) : null}
      <div className="ws-console-page__head">
        {leading}
        <div className="ws-console-page__titles">
          <h1 id="ws-console-title" className="ws-console-title" tabIndex={-1}>
            {title}
          </h1>
          {lede ? <p className="ws-console-lede">{lede}</p> : null}
        </div>
        {actions ? <div className="ws-flow-step__actions">{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}

export interface ConsoleCardProps {
  title: string;
  icon?: FlowIconName;
  /** At the end of the heading: a link such as "View all". */
  action?: ReactNode;
  children: ReactNode;
  /** The heading level inside the page: 2 by default. */
  level?: 2 | 3;
}

/** A titled card of facts or shortcuts on a console page. */
export function ConsoleCard({ title, icon, action, children, level = 2 }: ConsoleCardProps) {
  const Heading = level === 2 ? 'h2' : 'h3';
  return (
    <section className="ws-console-card" aria-label={title}>
      <div className="ws-console-card__head">
        {icon ? (
          <span className="ws-console-card__icon" aria-hidden="true">
            <FlowIcon name={icon} />
          </span>
        ) : null}
        <Heading className="ws-console-section-title">{title}</Heading>
        {action}
      </div>
      {children}
    </section>
  );
}

export interface ConsoleFactsProps {
  /** Label and value pairs, in order. A value may be a tag. */
  facts: readonly { label: string; value: ReactNode }[];
}

/** Facts about one thing: "Ownership: Verified". */
export function ConsoleFacts({ facts }: ConsoleFactsProps) {
  return (
    <dl className="ws-console-facts">
      {facts.map((fact) => (
        <div key={fact.label}>
          <dt>{fact.label}</dt>
          <dd>{fact.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export interface ConsolePlaceholderProps {
  icon?: FlowIconName;
  title: string;
  children: ReactNode;
  /** What is planned for the page, as short phrases. */
  planned?: readonly string[];
  plannedLabel?: string;
  /** A way on: "Back to Home". */
  action?: ReactNode;
  /** Centred, for an empty table or a search with no results. */
  align?: 'start' | 'center';
}

/** A page or a region with nothing to show yet: what it is, why it is empty, and a way on. */
export function ConsolePlaceholder({ icon = 'clock', title, children, planned, plannedLabel, action, align = 'start' }: ConsolePlaceholderProps) {
  return (
    <div className="ws-console-empty" data-align={align}>
      <span className="ws-console-empty__icon" aria-hidden="true">
        <FlowIcon name={icon} />
      </span>
      <p className="ws-console-empty__title">{title}</p>
      <div className="ws-console-empty__body">{children}</div>
      {planned?.length ? (
        <ul className="ws-console-empty__planned" aria-label={plannedLabel}>
          {planned.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
      {action}
    </div>
  );
}

export type StatusTagTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

const toneIcon: Record<StatusTagTone, FlowIconName> = { neutral: 'clock', success: 'check-circle', warning: 'warning', danger: 'alert', info: 'info' };

export interface StatusTagProps {
  tone?: StatusTagTone;
  /** Defaults to the tone's icon. */
  icon?: FlowIconName;
  children: string;
}

/** A state in a word and an icon: "Active", "Invited", "Suspended". Never colour alone. */
export function StatusTag({ tone = 'neutral', icon, children }: StatusTagProps) {
  return (
    <span className="ws-console-tag" data-tone={tone}>
      <FlowIcon name={icon ?? toneIcon[tone]} />
      {children}
    </span>
  );
}
