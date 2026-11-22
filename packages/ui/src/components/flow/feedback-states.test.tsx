import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CodeInput, FlowButton, FlowConnectionBar, FlowLink, FlowNotice, FlowPreview, FlowReference, FlowShell, FlowSlowHint, FlowState, FlowStep, FlowTextField, FlowToast } from '../../index';
import type { FlowTone } from '../../index';

describe('FlowNotice as a banner', () => {
  it.each<[FlowTone, string]>([
    ['danger', 'alert'],
    ['warning', 'alert'],
    ['offline', 'alert'],
    ['info', 'status'],
    ['success', 'status'],
  ])('announces a %s banner as an %s and marks its tone for its colour and icon', (tone, role) => {
    render(
      <FlowNotice tone={tone} title="Something went wrong on our side">
        Nothing was lost.
      </FlowNotice>,
    );

    const banner = screen.getByRole(role);
    expect(banner).toHaveAttribute('data-tone', tone);
    expect(banner).toHaveTextContent('Something went wrong on our side');
    expect(banner).toHaveTextContent('Nothing was lost.');
    expect(banner.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('gives each tone its own icon, so colour is never the only signal', () => {
    const outlines = (['danger', 'warning', 'offline', 'info', 'success'] as const).map((tone) => {
      const { container, unmount } = render(<FlowNotice tone={tone}>Words</FlowNotice>);
      const outline = container.querySelector('path')?.getAttribute('d');
      unmount();
      return outline;
    });

    expect(new Set(outlines).size).toBe(5);
  });

  it('carries its actions inside the announcement', async () => {
    const onPress = vi.fn();
    render(
      <FlowNotice
        tone="danger"
        title="This code no longer works"
        actions={
          <FlowButton variant="chip" onPress={onPress}>
            Send a new code
          </FlowButton>
        }
      >
        Get a new one and try again.
      </FlowNotice>,
    );

    await userEvent.click(within(screen.getByRole('alert')).getByRole('button', { name: 'Send a new code' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('stays a short note when it has no title', () => {
    render(<FlowNotice>Resetting your password works right away.</FlowNotice>);

    expect(screen.getByRole('status')).not.toHaveAttribute('data-banner');
  });
});

describe('field states', () => {
  it('marks an invalid field with an icon inside it as well as the message, and offers one way out', () => {
    render(<FlowTextField label="Your email address" value="amara@" onChange={() => undefined} error="That doesn’t look like an email address." action={<FlowLink href="/personal/address">Get a Yahel address instead</FlowLink>} />);

    const field = screen.getByLabelText('Your email address');
    expect(field).toBeInvalid();
    expect(field).toHaveAccessibleDescription('That doesn’t look like an email address.');
    expect(field.parentElement?.querySelector('svg')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Get a Yahel address instead' })).toHaveAttribute('href', '/personal/address');
  });

  it('shows a tick inside a field whose value meets its format, and none once it is invalid', () => {
    const { rerender } = render(<FlowTextField label="Email" value="amara@northwind.example" onChange={() => undefined} isValid />);
    const control = () => screen.getByLabelText('Email').parentElement;

    expect(control()?.querySelectorAll('svg')).toHaveLength(1);
    expect(screen.getByLabelText('Email')).toBeValid();

    rerender(<FlowTextField label="Email" value="amara@" onChange={() => undefined} isValid error="That doesn’t look like an email address." />);
    expect(screen.getByLabelText('Email')).toBeInvalid();
    expect(control()?.querySelectorAll('svg')).toHaveLength(1);
  });

  it('shows no mark and no action on a field that is neither valid nor invalid', () => {
    render(<FlowTextField label="First name" value="Amara" onChange={() => undefined} action={<FlowLink href="/x">Elsewhere</FlowLink>} />);

    expect(screen.getByLabelText('First name').parentElement?.querySelector('svg')).toBeNull();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('describes a code by its error, with an icon beside the words', () => {
    render(<CodeInput label="6-character code" value="4F9K0" onChange={() => undefined} characters="alphanumeric" error="That code didn’t work. Check it and try again." />);

    const code = screen.getByLabelText('6-character code');
    expect(code).toBeInvalid();
    expect(code).toHaveAccessibleDescription('That code didn’t work. Check it and try again.');
  });
});

describe('FlowToast', () => {
  it('says what happened, closes when asked, and leaves when its time runs out', async () => {
    const onClose = vi.fn();
    const { container } = render(
      <FlowToast closeLabel="Dismiss" onClose={onClose}>
        New code sent. Older codes no longer work.
      </FlowToast>,
    );

    expect(screen.getByText('New code sent. Older codes no longer work.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(onClose).toHaveBeenCalledTimes(1);

    // The bar under the toast is its clock: the end of its animation is the end of the toast.
    // jsdom has no animations, so React listens for the prefixed event there; a browser sends the plain one.
    fireEvent(container.querySelector('.ws-flow-toast__bar')!, new Event('webkitAnimationEnd', { bubbles: true }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('arrives inside a region the shell keeps on the page, so it is announced', () => {
    const { rerender } = render(<FlowShell skipLabel="Skip">content</FlowShell>);
    const regions = () => [...document.querySelectorAll('[aria-live="polite"]')];
    expect(regions()).toHaveLength(2);

    rerender(
      <FlowShell
        skipLabel="Skip"
        banner={<FlowConnectionBar lead="You’re offline.">What you’ve typed is safe on this device.</FlowConnectionBar>}
        toast={
          <FlowToast closeLabel="Dismiss" onClose={() => undefined}>
            You’re back online.
          </FlowToast>
        }
      >
        content
      </FlowShell>,
    );

    expect(regions()[0]).toHaveTextContent('You’re offline. What you’ve typed is safe on this device.');
    expect(regions()[1]).toHaveTextContent('You’re back online.');
  });
});

describe('FlowSlowHint', () => {
  it('is a polite status', () => {
    render(<FlowSlowHint>Still working.</FlowSlowHint>);

    expect(screen.getByRole('status')).toHaveTextContent('Still working.');
  });
});

describe('FlowStep.Resubmit', () => {
  it('submits the step’s form from outside it', async () => {
    const onSubmit = vi.fn((event: { preventDefault: () => void }) => event.preventDefault());
    render(
      <FlowStep>
        <FlowStep.Heading>Enter your password.</FlowStep.Heading>
        <FlowStep.Resubmit>Try again</FlowStep.Resubmit>
        <FlowStep.Form onSubmit={onSubmit}>
          <FlowTextField label="Password" value="x" onChange={() => undefined} />
        </FlowStep.Form>
      </FlowStep>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});

describe('FlowState', () => {
  const state = (
    <FlowState
      tone="warning"
      icon="clock"
      title="Sign-in is paused for a while."
      lede="There were too many tries."
      actions={
        <>
          <FlowLink variant="primary" href="/signin/recover">
            Reset your password
          </FlowLink>
          <FlowLink variant="quiet" href="/signin">
            Back to sign in
          </FlowLink>
        </>
      }
    >
      <FlowNotice>Resetting your password works right away.</FlowNotice>
    </FlowState>
  );

  it('names the page by its heading, moves focus to it and offers its ways out', () => {
    render(state);

    const heading = screen.getByRole('heading', { level: 1, name: 'Sign-in is paused for a while.' });
    expect(heading).toHaveFocus();
    expect(screen.getByRole('region', { name: 'Sign-in is paused for a while.' })).toHaveTextContent('There were too many tries.');
    expect(screen.getByRole('link', { name: 'Reset your password' })).toHaveAttribute('href', '/signin/recover');
    expect(screen.getByRole('link', { name: 'Back to sign in' })).toHaveAttribute('href', '/signin');
    expect(screen.getByRole('status')).toHaveTextContent('Resetting your password works right away.');
  });

  it('draws its icon in the tone, hidden from assistive technology', () => {
    const { container } = render(state);

    const icon = container.querySelector('.ws-flow-state__icon');
    expect(icon).toHaveAttribute('data-tone', 'warning');
    expect(icon?.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });
});

describe('FlowReference', () => {
  it('lists what to quote and copies a value when asked', async () => {
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
    render(
      <FlowReference title="If you contact us, quote this">
        <FlowReference.Row label="Reference" value="Y-7F3K-2Q" copy={{ label: 'Copy', doneLabel: 'Copied' }} />
        <FlowReference.Row label="Time" value="22 Nov 2026, 14:07" />
      </FlowReference>,
    );

    expect(screen.getByText('If you contact us, quote this')).toBeInTheDocument();
    expect(screen.getAllByRole('term').map((label) => label.textContent)).toEqual(['Reference', 'Time']);
    expect(screen.getAllByRole('definition').map((value) => value.textContent)).toEqual(['Y-7F3K-2Q', '22 Nov 2026, 14:07']);

    await user.click(screen.getByRole('button', { name: 'Copy' }));
    expect(writeText).toHaveBeenCalledWith('Y-7F3K-2Q');
    expect(await screen.findByRole('button', { name: 'Copied' })).toBeInTheDocument();
  });
});

describe('FlowPreview', () => {
  it('shows a label, an optional tag and the value with its important part picked out, read as one phrase', () => {
    render(
      <FlowPreview label="Your team’s addresses will look like" tag="Your domain" lead="you@">
        northwind.example
      </FlowPreview>,
    );

    const preview = screen.getByText('Your team’s addresses will look like').parentElement!;
    expect(preview.textContent).toBe('Your team’s addresses will look like Your domain you@northwind.example');
    expect(screen.getByText('northwind.example').tagName).toBe('STRONG');
    expect(screen.getByText('northwind.example').parentElement).toHaveAttribute('translate', 'no');
  });

  it('needs neither a tag nor a lead', () => {
    render(<FlowPreview label="Your admin sign-in">amara@northwind.example</FlowPreview>);

    expect(screen.getByText('Your admin sign-in').parentElement!.textContent).toBe('Your admin sign-in amara@northwind.example');
  });
});

