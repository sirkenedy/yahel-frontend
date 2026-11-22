import { BrandMark, FlowButton, FlowIcon, FlowLink, FlowShell } from '@yahel/ui';
import type { ReactNode } from 'react';
import { chromeMessages as m } from './messages';
import { useTheme } from './use-theme';

export interface AppFrameLinks {
  home: string;
  /** Where the brand link leads, in words. Sign in unless said otherwise. */
  homeLabel?: string;
  /** Shown as "New to Yahel? Create an account" when given. */
  signUp?: string | null;
  /** Shown as "Have an account? Sign in" when given. */
  signIn?: string | null;
  help: string | null;
  privacy: string | null;
  terms: string | null;
}

export interface AppFrameProps {
  links: AppFrameLinks;
  /** A control that blurs personal details for screen shares and calls, on screens that ask for them. */
  privacy?: { isOn: boolean; onToggle: () => void } | null;
  children: ReactNode;
}

/** The frame around every account screen: brand, theme control, the question, and the footer. */
export function AppFrame({ links, privacy, children }: AppFrameProps) {
  const { theme, toggle } = useTheme();
  return (
    <FlowShell skipLabel={m.skipToQuestion} isPrivate={privacy?.isOn}>
      <FlowShell.Header
        brand={
          <FlowShell.BrandLink href={links.home} label={links.homeLabel ?? m.brandHome}>
            <BrandMark label={m.brand} />
          </FlowShell.BrandLink>
        }
      >
        {links.signUp ? (
          <>
            <span className="ws-flow__prompt">{m.newHere}</span>
            <FlowLink href={links.signUp}>{m.createAccount}</FlowLink>
          </>
        ) : null}
        {links.signIn ? (
          <>
            <span className="ws-flow__prompt">{m.haveAccount}</span>
            <FlowLink href={links.signIn}>{m.signIn}</FlowLink>
          </>
        ) : null}
        {privacy ? (
          <FlowButton variant="round" aria-pressed={privacy.isOn} aria-label={privacy.isOn ? m.showDetails : m.hideDetails} onPress={privacy.onToggle}>
            <FlowIcon name={privacy.isOn ? 'eye' : 'eye-off'} />
          </FlowButton>
        ) : null}
        <FlowButton variant="round" aria-label={theme === 'dark' ? m.switchToLight : m.switchToDark} onPress={toggle}>
          <FlowIcon name={theme === 'dark' ? 'sun' : 'moon'} />
        </FlowButton>
      </FlowShell.Header>
      <FlowShell.Main>
        <FlowShell.Question>{children}</FlowShell.Question>
      </FlowShell.Main>
      <FlowShell.Footer dataLocation={m.dataLocation}>
        <FlowShell.Language label={m.language}>{m.currentLanguage}</FlowShell.Language>
        {links.help ? <FlowShell.FooterLink href={links.help}>{m.help}</FlowShell.FooterLink> : null}
        {links.privacy ? <FlowShell.FooterLink href={links.privacy}>{m.privacy}</FlowShell.FooterLink> : null}
        {links.terms ? <FlowShell.FooterLink href={links.terms}>{m.terms}</FlowShell.FooterLink> : null}
      </FlowShell.Footer>
    </FlowShell>
  );
}
