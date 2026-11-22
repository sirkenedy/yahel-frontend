import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import type { ReactElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flowMessages as fm } from '../../../flow/messages';
import { carried } from '../feedback';
import type { SignInFeedback } from '../feedback';
import { initialSignInState } from '../machine';
import { signInMessages as m } from '../messages';
import { SignInFlowContext } from '../sign-in-flow';
import type { SignInFlowValue } from '../sign-in-flow';
import { ChooseStep } from './choose-step';
import { CodeStep } from './code-step';
import { DoneStep } from './done-step';
import { EmailStep } from './email-step';
import { HelpSentStep } from './help-sent-step';
import { HelpStep } from './help-step';
import { NewPasswordStep } from './new-password-step';
import { PasskeyStep } from './passkey-step';
import { PasswordStep } from './password-step';
import { RecoverCodeStep } from './recover-code-step';
import { RecoverStep } from './recover-step';

type Request = SignInFlowValue['meta']['requests']['password'];
const clear = () => undefined;
const idle: Request = { isPending: false, feedback: null, clear };
const email = 'amara@northwind.example';
const profile = { id: '1', globalId: 'g', email, firstName: 'Amara', lastName: 'Okafor', displayName: 'Amara Okafor', photo: null };

type Overrides = { state?: Partial<SignInFlowValue['state']>; offers?: Partial<SignInFlowValue['meta']['offers']>; requests?: Partial<SignInFlowValue['meta']['requests']>; backHref?: string | null; screens?: Partial<SignInFlowValue['meta']['screens']> };

const fakeActions = () => ({
    chooseAccount: vi.fn(),
    enterEmail: vi.fn(),
    useAnotherAccount: vi.fn(),
    removeAccount: vi.fn(),
    signInWithPassword: vi.fn(),
    startPasskey: vi.fn(),
    verifyCode: vi.fn(),
    sendTextCode: vi.fn(),
    sendResetCode: vi.fn(),
    resendResetCode: vi.fn(),
    enterResetCode: vi.fn(),
    saveNewPassword: vi.fn(),
    requestHelp: vi.fn(),
    signOut: vi.fn(),
    continueToApp: vi.fn(),
});

const flowValue = (actions: SignInFlowValue['actions'], { state, offers, requests, backHref = null, screens }: Overrides = {}): SignInFlowValue => ({
  state: { ...initialSignInState, step: 'email', profile: null, accounts: [], recoveryOptions: null, textedTo: null, passkeyCancelled: false, resetCodeResent: false, removedAccount: null, ...state },
  actions,
  meta: {
    direction: 'forward',
    backHref,
      offers: { passkey: true, textCode: true, help: true, ...offers },
      requests: { password: idle, passkey: idle, code: idle, textCode: idle, sendResetCode: idle, resendResetCode: idle, newPassword: idle, help: idle, removeAccount: idle, signOut: idle, recoveryOptions: idle, ...requests },
      screens: { account: state?.email ?? null, exits: { signIn: '/signin/email', resetPassword: '/signin/recover' }, serviceStatus: null, ...screens },
    },
});

const setup = (ui: ReactElement, overrides: Overrides = {}) => {
  const actions = fakeActions();
  // A whole-screen state asks the query client for a maintenance window, so every step is rendered inside one.
  const { container } = render(
    <QueryClientProvider client={new QueryClient()}>
      <SignInFlowContext value={flowValue(actions, overrides)}>{ui}</SignInFlowContext>
    </QueryClientProvider>,
  );
  return { actions, container, user: userEvent.setup() };
};

const failing = (feedback: SignInFeedback, more: Partial<Request> = {}): Request => ({ isPending: false, feedback, clear, ...more });
const pending: Request = { isPending: true, feedback: null, clear };
// What the feedback map answers with, as the steps receive it.
const offline = { place: 'banner', tone: 'offline', title: fm.offlineTitle, text: fm.offlineText, next: 'retry' } as const;
const rateLimited = { place: 'banner', tone: 'warning', title: fm.tooManyTitle, text: fm.tooManyText } as const;
const wrongCredentials = { place: 'field', field: 'password', text: m.wrongCredentials } as const;
const wrongCode = { place: 'field', field: 'code', text: m.wrongCode } as const;
const refusedPassword = { place: 'field', field: 'password', text: m.passwordRefused } as const;
const deadCode = { place: 'banner', tone: 'danger', title: m.codeDeadTitle, text: m.tooManyCodes, next: 'sign-in-again' } as const;
const locked = { place: 'screen', screen: 'locked' } as const;

afterEach(() => {
  vi.useRealTimers();
});
const rowFor = (address: string) => screen.getByRole('button', { name: new RegExp(`^${m.continueAs}.*${address.replaceAll('.', '\\.')}`) });

describe('ChooseStep', () => {
  const accounts = [
    { name: 'Amara Okafor', email: 'amara.okafor@yahel.example', kind: 'person' as const },
    { name: 'Amara Okafor', email, kind: 'organisation' as const, organisation: 'Northwind Studio' },
    { name: 'Kofi Mensah', email: 'kofi@northwind.example', kind: 'person' as const, signedOut: true },
  ];

  it('lists the accounts on this device with what kind each is', () => {
    setup(<ChooseStep />, { state: { step: 'choose', accounts } });

    const rows = within(screen.getByRole('list', { name: m.accountsLabel })).getAllByRole('listitem');
    expect(rows.map((row) => row.textContent)).toEqual([expect.stringContaining(m.personal), expect.stringContaining('Northwind Studio'), expect.stringContaining(m.signedOut), expect.stringContaining(m.useAnother)]);
  });

  it('continues as the account that is picked, or starts fresh for another', async () => {
    const { actions, user } = setup(<ChooseStep />, { state: { step: 'choose', accounts } });

    await user.click(rowFor(email));
    await user.click(screen.getByRole('button', { name: m.useAnother }));

    expect(actions.chooseAccount).toHaveBeenCalledWith(email);
    expect(actions.useAnotherAccount).toHaveBeenCalledTimes(1);
  });

  it('removes accounts only in remove mode, where rows can no longer be picked by mistake', async () => {
    const { actions, user } = setup(<ChooseStep />, { state: { step: 'choose', accounts } });
    expect(screen.queryByRole('button', { name: m.removeLabel(email) })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: m.removeAnAccount }));
    expect(rowFor(email)).toBeDisabled();
    await user.click(screen.getByRole('button', { name: m.removeLabel(email) }));
    expect(actions.removeAccount).toHaveBeenCalledWith(email);

    await user.click(screen.getByRole('button', { name: m.removeDone }));
    expect(rowFor(email)).toBeEnabled();
  });

  it.each([
    ['the row that takes its place', 'amara.okafor@yahel.example', m.removeLabel(email)],
    ['the row before it when it was the last', 'kofi@northwind.example', m.removeLabel(email)],
  ])('moves focus to %s once an account has been removed', async (_name, removed, focused) => {
    function Chooser() {
      const [left, setLeft] = useState(accounts);
      const actions = { ...fakeActions(), removeAccount: (address: string) => void setTimeout(() => setLeft((list) => list.filter((account) => account.email !== address)), 0) };
      return (
        <SignInFlowContext value={flowValue(actions, { state: { step: 'choose', accounts: left } })}>
          <ChooseStep />
        </SignInFlowContext>
      );
    }
    render(<Chooser />);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: m.removeAnAccount }));

    await user.click(screen.getByRole('button', { name: m.removeLabel(removed) }));

    await waitFor(() => expect(screen.queryByRole('button', { name: m.removeLabel(removed) })).not.toBeInTheDocument());
    expect(screen.getByRole('button', { name: focused })).toHaveFocus();
  });

  it('moves focus to "Use another account" when a removal leaves nothing else to remove', async () => {
    function Chooser() {
      const [left, setLeft] = useState(accounts.slice(0, 1));
      const actions = { ...fakeActions(), removeAccount: () => void setTimeout(() => setLeft([]), 0) };
      return (
        <SignInFlowContext value={flowValue(actions, { state: { step: 'choose', accounts: left } })}>
          <ChooseStep />
        </SignInFlowContext>
      );
    }
    render(<Chooser />);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: m.removeAnAccount }));

    await user.click(screen.getByRole('button', { name: m.removeLabel('amara.okafor@yahel.example') }));

    await waitFor(() => expect(screen.getByRole('button', { name: m.useAnother })).toHaveFocus());
  });

  it('confirms a removal and reports one that failed', () => {
    setup(<ChooseStep />, { state: { step: 'choose', accounts, removedAccount: email }, requests: { removeAccount: failing(offline) } });

    expect(screen.getByRole('status')).toHaveTextContent(m.removed(email));
    expect(screen.getByRole('alert')).toHaveTextContent(fm.offlineTitle);
    expect(screen.getByRole('alert')).toHaveTextContent(fm.offlineText);
  });
});

describe('EmailStep', () => {
  it('takes a trimmed address forward', async () => {
    const { actions, user } = setup(<EmailStep />);

    await user.type(screen.getByLabelText(m.emailLabel), ` ${email} {Enter}`);

    expect(actions.enterEmail).toHaveBeenCalledWith(email);
  });

  it.each([
    ['', m.emailRequired],
    ['not-an-email', m.emailInvalid],
  ])('explains %j beside the field, focuses it and goes nowhere', async (typed, problem) => {
    const { actions, user } = setup(<EmailStep />);
    if (typed) await user.type(screen.getByLabelText(m.emailLabel), typed);

    await user.click(screen.getByRole('button', { name: m.continue }));

    expect(screen.getByLabelText(m.emailLabel)).toHaveAccessibleDescription(problem);
    expect(screen.getByLabelText(m.emailLabel)).toHaveFocus();
    expect(actions.enterEmail).not.toHaveBeenCalled();
  });

  it('re-checks the address on every key once it has been checked, and clears the error the moment it is right', async () => {
    const { user } = setup(<EmailStep />);
    const field = () => screen.getByLabelText(m.emailLabel);
    await user.click(screen.getByRole('button', { name: m.continue }));

    await user.type(field(), 'a');
    expect(field()).toHaveAttribute('aria-invalid', 'true');
    expect(field()).toHaveAccessibleDescription(m.emailInvalid);

    await user.type(field(), 'mara@northwind.example');
    expect(field()).not.toHaveAttribute('aria-invalid', 'true');
    expect(field()).not.toHaveAccessibleDescription(m.emailInvalid);
  });

  it('never shows an error while the address is first being typed, and checks it when the field is left', async () => {
    const { user } = setup(<EmailStep />);
    const field = () => screen.getByLabelText(m.emailLabel);

    await user.type(field(), 'amara@');
    expect(field()).not.toHaveAttribute('aria-invalid', 'true');

    await user.tab();
    expect(field()).toHaveAttribute('aria-invalid', 'true');
    expect(field()).toHaveAccessibleDescription(m.emailInvalid);
  });

  it('leaves a field that was never typed in alone when it is left', async () => {
    const { user } = setup(<EmailStep />);

    await user.click(screen.getByLabelText(m.emailLabel));
    await user.tab();

    expect(screen.getByLabelText(m.emailLabel)).not.toHaveAttribute('aria-invalid', 'true');
  });

  it('is set up for password managers', () => {
    setup(<EmailStep />);

    const input = screen.getByLabelText(m.emailLabel);
    expect(input).toHaveAttribute('type', 'email');
    expect(input).toHaveAttribute('name', 'email');
    expect(input).toHaveAttribute('autocomplete', 'username');
    expect(input).toHaveAttribute('spellcheck', 'false');
  });

  it('offers a passkey and account help only where they exist', async () => {
    const { actions, user } = setup(<EmailStep />);
    await user.click(screen.getByRole('button', { name: m.passkeySignIn }));
    expect(actions.startPasskey).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('link', { name: m.forgotEmail })).toHaveAttribute('href', '/signin/help');
  });

  it('hides the passkey and help when they are not offered', () => {
    setup(<EmailStep />, { offers: { passkey: false, help: false } });

    expect(screen.queryByRole('button', { name: m.passkeySignIn })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: m.forgotEmail })).not.toBeInTheDocument();
  });

  it('shows the way back when there is one', () => {
    setup(<EmailStep />, { backHref: '/signin/choose' });

    expect(screen.getByRole('link', { name: m.back })).toHaveAttribute('href', '/signin/choose');
  });
});

describe('PasswordStep', () => {
  const state = { step: 'password' as const, email };

  it('shows whose password is wanted and submits it as typed', async () => {
    const { actions, user } = setup(<PasswordStep />, { state });
    expect(screen.getByText(email)).toBeInTheDocument();

    await user.type(screen.getByLabelText(m.passwordLabel), ' spaced secret {Enter}');

    expect(actions.signInWithPassword).toHaveBeenCalledWith(' spaced secret ');
  });

  it('asks for a password before sending anything', async () => {
    const { actions, user } = setup(<PasswordStep />, { state });

    await user.click(screen.getByRole('button', { name: m.signIn }));

    expect(screen.getByLabelText(m.passwordLabel)).toHaveAccessibleDescription(m.passwordRequired);
    expect(screen.getByLabelText(m.passwordLabel)).toHaveFocus();
    expect(actions.signInWithPassword).not.toHaveBeenCalled();
  });

  it('hides a revealed password again on submit and keeps what was typed', async () => {
    const { user } = setup(<PasswordStep />, { state });
    await user.type(screen.getByLabelText(m.passwordLabel), 'secret');
    await user.click(screen.getByRole('button', { name: m.showPassword }));
    expect(screen.getByLabelText(m.passwordLabel)).toHaveAttribute('type', 'text');

    await user.click(screen.getByRole('button', { name: m.signIn }));

    expect(screen.getByLabelText(m.passwordLabel)).toHaveAttribute('type', 'password');
    expect(screen.getByLabelText(m.passwordLabel)).toHaveValue('secret');
  });

  it('says so while signing in, and reports wrong credentials beside the password with focus on it', () => {
    setup(<PasswordStep />, { state, requests: { password: { isPending: true, feedback: wrongCredentials, clear } } });

    expect(screen.getByRole('button', { name: m.signingIn })).toBeInTheDocument();
    const field = screen.getByLabelText(m.passwordLabel);
    expect(field).toBeInvalid();
    expect(field).toHaveAccessibleDescription(m.wrongCredentials);
    expect(field).toHaveFocus();
    // It is the field's own message, not a banner above the form.
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('keeps the refusal until the password is edited', async () => {
    const { user } = setup(<PasswordStep />, { state, requests: { password: failing(wrongCredentials) } });

    await user.type(screen.getByLabelText(m.passwordLabel), 'x');

    expect(screen.getByLabelText(m.passwordLabel)).not.toHaveAccessibleDescription(m.wrongCredentials);
  });

  it('gives way to the paused screen when there were too many tries, with the way to reset and the way back', () => {
    setup(<PasswordStep />, { state, requests: { password: failing({ ...locked, retryAt: Date.now() + 600_000 }) } });

    expect(screen.getByRole('heading', { level: 1, name: fm.lockedTitle })).toHaveFocus();
    expect(screen.queryByLabelText(m.passwordLabel)).not.toBeInTheDocument();
    expect(screen.getByText(fm.lockedLede(email))).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(/^You can try again at \d{2}:\d{2}\. Resetting your password works right away\.$/);
    expect(screen.getByRole('link', { name: fm.resetPassword })).toHaveAttribute('href', '/signin/recover');
    expect(screen.getByRole('link', { name: fm.backToSignIn })).toHaveAttribute('href', '/signin/email');
    expect(document.title).toBe(fm.pageTitle(fm.lockedTitle));
  });

  it('shows an account that cannot sign in as its own screen, with support only where there is somewhere to send people', () => {
    const suspended = failing({ place: 'screen', screen: 'suspended' });
    const { container } = setup(<PasswordStep />, { state, requests: { password: suspended } });
    expect(screen.getByRole('heading', { level: 1, name: fm.suspendedTitle })).toBeInTheDocument();
    expect(screen.getByText(fm.suspendedLede(email))).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: fm.contactSupport })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: fm.useAnotherAccount })).toHaveAttribute('href', '/signin/email');
    container.remove();
  });

  it('explains a slow wait once signing in has taken a while', () => {
    vi.useFakeTimers();
    setup(<PasswordStep />, { state, requests: { password: pending } });
    expect(screen.queryByText(fm.slow)).not.toBeInTheDocument();

    act(() => void vi.advanceTimersByTime(1200));

    expect(screen.getByRole('status')).toHaveTextContent(fm.slow);
  });

  it('offers to reset the password when the account needs a new one, and to try again after a server error', async () => {
    const needsNew = { place: 'banner', tone: 'warning', title: m.newPasswordNeededTitle, text: m.newPasswordNeeded, next: 'reset-password' } as const;
    const first = setup(<PasswordStep />, { state, requests: { password: failing(needsNew) } });
    expect(within(screen.getByRole('alert')).getByRole('link', { name: m.resetYourPassword })).toHaveAttribute('href', '/signin/recover');
    first.container.remove();

    const serverError = { place: 'banner', tone: 'danger', title: fm.serverErrorTitle, text: fm.serverErrorText, next: 'retry', reference: 'req-7F3K' } as const;
    const { actions, user } = setup(<PasswordStep />, { state, requests: { password: failing(serverError) } });
    const banner = screen.getAllByRole('alert').at(-1)!;
    expect(banner).toHaveTextContent(`${fm.serverErrorText} ${fm.reference('req-7F3K')}`);

    // "Try again" submits the step's own form, with what is still typed in it.
    await user.type(screen.getAllByLabelText(m.passwordLabel).at(-1)!, 'correct horse');
    await user.click(within(banner).getByRole('button', { name: fm.tryAgain }));
    expect(actions.signInWithPassword).toHaveBeenCalledWith('correct horse');
  });

  it.each([
    ['challenge-expired', m.challengeExpiredTitle, m.challengeExpired],
    ['reset-done', m.resetDoneTitle, m.resetDoneSignInFailed],
  ] as const)('explains why the person is back here (%s), until a new attempt has its own result', (passwordPrompt, title, message) => {
    setup(<PasswordStep />, { state: { ...state, passwordPrompt } });
    expect(screen.getByRole('alert')).toHaveTextContent(title);
    expect(screen.getByRole('alert')).toHaveTextContent(message);
  });

  it('shows the latest attempt\'s failure in place of the earlier explanation', () => {
    setup(<PasswordStep />, { state: { ...state, passwordPrompt: 'reset-done' }, requests: { password: failing(wrongCredentials) } });

    expect(screen.getByLabelText(m.passwordLabel)).toHaveAccessibleDescription(m.wrongCredentials);
    expect(screen.queryByText(m.resetDoneSignInFailed)).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('names the step in the page title', () => {
    setup(<PasswordStep />, { state });

    expect(document.title).toBe('Enter your password · Yahel');
  });

  it('labels the field for password managers and pairs it with the account', () => {
    const { container } = setup(<PasswordStep />, { state });

    expect(screen.getByLabelText(m.passwordLabel)).toHaveAttribute('autocomplete', 'current-password');
    const hint = container.querySelector('input[autocomplete="username"]');
    expect(hint).toHaveValue(email);
    expect(hint).toHaveAttribute('type', 'text');
  });

  it('leads to recovery, and to a passkey where one is offered', async () => {
    const { actions, user } = setup(<PasswordStep />, { state });
    expect(screen.getByRole('link', { name: m.forgotPassword })).toHaveAttribute('href', '/signin/recover');

    await user.click(screen.getByRole('button', { name: m.usePasskey }));
    expect(actions.startPasskey).toHaveBeenCalledTimes(1);
  });
});

describe('PasskeyStep', () => {
  it('waits for the device while the prompt is open', () => {
    setup(<PasskeyStep />, { state: { step: 'passkey' }, requests: { passkey: pending } });

    expect(screen.getByRole('status')).toHaveTextContent(m.passkeyWaiting);
    expect(screen.getByRole('button', { name: m.tryAgain })).toBeDisabled();
  });

  it('treats a closed prompt as a pause, not an error, with both ways forward', async () => {
    const { actions, user } = setup(<PasskeyStep />, { state: { step: 'passkey', passkeyCancelled: true } });

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(m.passkeyCancelled);
    expect(screen.getByRole('link', { name: m.usePasswordInstead })).toHaveAttribute('href', '/signin/email');

    await user.click(screen.getByRole('button', { name: m.tryAgain }));
    expect(actions.startPasskey).toHaveBeenCalledTimes(1);
  });

  it('falls back to the password step when the account is already known', () => {
    setup(<PasskeyStep />, { state: { step: 'passkey', email } });

    expect(screen.getByRole('link', { name: m.usePasswordInstead })).toHaveAttribute('href', '/signin/password');
  });

  it('reports a passkey that did not work', () => {
    setup(<PasskeyStep />, { state: { step: 'passkey' }, requests: { passkey: failing({ place: 'banner', tone: 'danger', text: m.passkeyFailed }) } });

    expect(screen.getByRole('alert')).toHaveTextContent(m.passkeyFailed);
  });
});

describe('CodeStep', () => {
  const state = { step: 'code' as const, email, challengeToken: 'c-1' };

  it('verifies six digits, however they arrive', async () => {
    const { actions, user } = setup(<CodeStep />, { state });

    await user.click(screen.getByLabelText(m.codeLabel));
    await user.paste('482 910');
    await user.keyboard('{Enter}');

    expect(actions.verifyCode).toHaveBeenCalledWith('482910');
  });

  it('asks for all six before sending', async () => {
    const { actions, user } = setup(<CodeStep />, { state });
    await user.type(screen.getByLabelText(m.codeLabel), '4829');

    await user.click(screen.getByRole('button', { name: m.verify }));

    expect(screen.getByLabelText(m.codeLabel)).toHaveAccessibleDescription(m.codeIncomplete);
    expect(actions.verifyCode).not.toHaveBeenCalled();
  });

  it('can text a code instead, and says where it went', async () => {
    const { actions, user } = setup(<CodeStep />, { state: { ...state, textedTo: '+234 ••• ••• ••42' } });

    await user.click(screen.getByRole('button', { name: m.textMeACode }));

    expect(actions.sendTextCode).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('status')).toHaveTextContent(m.textSent('+234 ••• ••• ••42'));
  });

  it('does not offer a text where texting is unavailable', () => {
    setup(<CodeStep />, { state, offers: { textCode: false } });

    expect(screen.queryByRole('button', { name: m.textMeACode })).not.toBeInTheDocument();
  });

  it('takes a backup code in an ordinary field and switches back', async () => {
    const { actions, user } = setup(<CodeStep />, { state });

    await user.click(screen.getByRole('button', { name: m.useBackupCode }));
    await user.type(screen.getByLabelText(m.backupLabel), ' a1b2c3d4e5 {Enter}');
    expect(actions.verifyCode).toHaveBeenCalledWith('a1b2c3d4e5');

    await user.click(screen.getByRole('button', { name: m.useAppCode }));
    expect(screen.getByLabelText(m.codeLabel)).toHaveValue('');
  });

  it('asks for a backup code before sending an empty one', async () => {
    const { actions, user } = setup(<CodeStep />, { state });
    await user.click(screen.getByRole('button', { name: m.useBackupCode }));

    await user.click(screen.getByRole('button', { name: m.verify }));

    expect(screen.getByLabelText(m.backupLabel)).toHaveAccessibleDescription(m.backupRequired);
    expect(actions.verifyCode).not.toHaveBeenCalled();
  });

  it('reports a wrong code beside the code, and a failed text above the form', () => {
    const first = setup(<CodeStep />, { state, requests: { code: failing(wrongCode) } });
    const field = screen.getByLabelText(m.codeLabel);
    expect(field).toBeInvalid();
    expect(field).toHaveAccessibleDescription(m.wrongCode);
    expect(field).toHaveFocus();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    first.container.remove();

    setup(<CodeStep />, { state, requests: { textCode: failing(rateLimited) } });
    expect(screen.getAllByRole('alert').at(-1)).toHaveTextContent(`${fm.tooManyTitle}${fm.tooManyText}`);
  });

  it('counts down a wait the server asked for, then says the wait is over', () => {
    vi.useFakeTimers();
    setup(<CodeStep />, { state, requests: { textCode: failing({ ...rateLimited, retryAt: Date.now() + 24_000 }) } });
    expect(screen.getByRole('alert')).toHaveTextContent(fm.tryAgainIn('0:24'));

    act(() => void vi.advanceTimersByTime(4000));
    expect(screen.getByRole('alert')).toHaveTextContent(fm.tryAgainIn('0:20'));

    act(() => void vi.advanceTimersByTime(20_000));
    expect(screen.getByRole('alert')).toHaveTextContent(fm.tryAgainNow);
  });

  it('says when a code can no longer work, and leads back to signing in again', () => {
    setup(<CodeStep />, { state, requests: { code: failing(deadCode) } });

    const banner = screen.getByRole('alert');
    expect(banner).toHaveTextContent(m.codeDeadTitle);
    expect(banner).toHaveTextContent(m.tooManyCodes);
    expect(within(banner).getByRole('link', { name: m.signInAgain })).toHaveAttribute('href', '/signin/password');
  });
});

describe('DoneStep', () => {
  it('greets the person by first name and shows which account is signed in', () => {
    setup(<DoneStep />, { state: { step: 'done', email, profile } });

    expect(screen.getByRole('heading', { name: 'Welcome back, Amara.' })).toBeInTheDocument();
    expect(screen.getByText(email)).toBeInTheDocument();
  });

  it('greets without a name when the profile has none', () => {
    setup(<DoneStep />, { state: { step: 'done', email, profile: { ...profile, firstName: null } } });

    expect(screen.getByRole('heading', { name: 'Welcome back.' })).toBeInTheDocument();
  });

  it('continues to the app or signs out for another account', async () => {
    const { actions, user } = setup(<DoneStep />, { state: { step: 'done', email, profile } });

    await user.click(screen.getByRole('button', { name: m.openYahel }));
    await user.click(screen.getByRole('button', { name: m.useAnother }));

    expect(actions.continueToApp).toHaveBeenCalledTimes(1);
    expect(actions.signOut).toHaveBeenCalledTimes(1);
  });

  it('cannot continue while signing out', () => {
    setup(<DoneStep />, { state: { step: 'done', email, profile }, requests: { signOut: pending } });

    expect(screen.getByRole('button', { name: m.openYahel })).toBeDisabled();
    expect(screen.getByRole('button', { name: m.signingOut })).toBeInTheDocument();
  });
});

describe('HelpStep and HelpSentStep', () => {
  it('sends a trimmed contact and promises never to ask for secrets', async () => {
    const { actions, user } = setup(<HelpStep />, { state: { step: 'help' } });
    expect(screen.getByRole('status')).toHaveTextContent(m.helpPromise);

    await user.type(screen.getByLabelText(m.helpLabel), ' +234 803 555 0142 {Enter}');

    expect(actions.requestHelp).toHaveBeenCalledWith('+234 803 555 0142');
  });

  it('asks for a contact before sending', async () => {
    const { actions, user } = setup(<HelpStep />, { state: { step: 'help' } });

    await user.click(screen.getByRole('button', { name: m.sendRequest }));

    expect(screen.getByLabelText(m.helpLabel)).toHaveAccessibleDescription(m.helpRequired);
    expect(actions.requestHelp).not.toHaveBeenCalled();
  });

  it('reports a request that could not be sent', () => {
    setup(<HelpStep />, { state: { step: 'help' }, requests: { help: failing(rateLimited) } });

    expect(screen.getByRole('alert')).toHaveTextContent(fm.tooManyTitle);
    expect(screen.getByRole('alert')).toHaveTextContent(fm.tooManyText);
  });

  it('confirms the request and leads back to sign-in', () => {
    setup(<HelpSentStep />, { state: { step: 'help-sent', helpRequested: true } });

    expect(screen.getByRole('heading', { name: m.helpSentTitle })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: m.backToSignIn })).toHaveAttribute('href', '/signin/email');
  });
});

describe('RecoverStep', () => {
  const options = [
    { method: 'phone' as const, destination: '+234 ••• ••• ••42' },
    { method: 'email' as const, destination: 'a•••@northwind.example' },
  ];
  const state = { step: 'recover' as const, email, recoveryOptions: options };

  it('offers each masked destination and sends to the first unless another is picked', async () => {
    const { actions, user } = setup(<RecoverStep />, { state });
    expect(screen.getByRole('radio', { name: m.recoverByPhone(options[0]!.destination) })).toBeChecked();

    await user.click(screen.getByRole('button', { name: m.sendCode }));
    expect(actions.sendResetCode).toHaveBeenLastCalledWith('phone');

    await user.click(screen.getByRole('radio', { name: m.recoverByEmail(options[1]!.destination) }));
    await user.click(screen.getByRole('button', { name: m.sendCode }));
    expect(actions.sendResetCode).toHaveBeenLastCalledWith('email');
  });

  it('waits for the destinations before anything can be sent', () => {
    setup(<RecoverStep />, { state: { ...state, recoveryOptions: null }, requests: { recoveryOptions: pending } });

    expect(screen.getByText(m.recoverLoading)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: m.sendCode })).toBeDisabled();
  });

  it('says the code is being sent, and reports a failure', () => {
    setup(<RecoverStep />, { state, requests: { sendResetCode: { isPending: true, feedback: offline, clear } } });

    expect(screen.getByRole('button', { name: m.sendingCode })).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(fm.offlineTitle);
    expect(screen.getByRole('alert')).toHaveTextContent(fm.offlineText);
  });

  it('words the way out for one destination or several, and hides it where help is not offered', () => {
    setup(<RecoverStep />, { state });
    expect(screen.getByRole('link', { name: m.cantUseThese })).toHaveAttribute('href', '/signin/help');
  });

  it('has no help link without a help desk', () => {
    setup(<RecoverStep />, { state: { ...state, recoveryOptions: options.slice(1) }, offers: { help: false } });

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /^Email/ })).toBeChecked();
  });
});

describe('RecoverCodeStep', () => {
  const state = { step: 'recover-code' as const, email, recovery: { method: 'email' as const, destination: 'a•••@northwind.example' } };

  it('takes a six-character code of letters and numbers forward', async () => {
    const { actions, user } = setup(<RecoverCodeStep />, { state });

    await user.type(screen.getByLabelText(m.recoverCodeLabel), 'A7kZq2{Enter}');

    expect(actions.enterResetCode).toHaveBeenCalledWith('A7kZq2');
  });

  it('asks for the whole code', async () => {
    const { actions, user } = setup(<RecoverCodeStep />, { state });
    await user.type(screen.getByLabelText(m.recoverCodeLabel), 'A7k');

    await user.click(screen.getByRole('button', { name: m.verify }));

    expect(screen.getByLabelText(m.recoverCodeLabel)).toHaveAccessibleDescription(m.recoverCodeIncomplete);
    expect(actions.enterResetCode).not.toHaveBeenCalled();
  });

  it('sends a new code on request, once the pause after the last one is over, and counts the pause down in the link', () => {
    vi.useFakeTimers();
    const { actions } = setup(<RecoverCodeStep />, { state });
    const link = () => screen.getByRole('button', { name: /^Send a new code/ });

    // A code has just been sent when the step appears.
    expect(link()).toHaveAccessibleName(m.sendNewCodeIn('0:30'));
    expect(link()).toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(link());
    expect(actions.resendResetCode).not.toHaveBeenCalled();

    act(() => void vi.advanceTimersByTime(6000));
    expect(link()).toHaveAccessibleName(m.sendNewCodeIn('0:24'));

    act(() => void vi.advanceTimersByTime(24_000));
    expect(link()).toHaveAccessibleName(m.sendNewCode);
    expect(link()).not.toHaveAttribute('aria-disabled');
    fireEvent.click(link());
    expect(actions.resendResetCode).toHaveBeenCalledTimes(1);

    // Each press starts the pause again.
    expect(link()).toHaveAccessibleName(m.sendNewCodeIn('0:30'));
    // The confirmation is a toast from the request, not a notice left on the step.
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('explains when the code was turned down at the next step, beside the code', () => {
    setup(<RecoverCodeStep />, { state: { ...state, resetCodeRejected: true } });

    const field = screen.getByLabelText(m.recoverCodeLabel);
    expect(field).toBeInvalid();
    expect(field).toHaveAccessibleDescription(m.recoverCodeRejected);
    expect(field).toHaveFocus();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('says a spent code no longer works and offers a new one, until one has been asked for', async () => {
    const first = setup(<RecoverCodeStep />, { state: { ...state, resetCodeRejected: true, resetCodeSpent: true } });
    const banner = screen.getByRole('alert');
    expect(banner).toHaveTextContent(carried.spent.title);
    expect(banner).toHaveTextContent(m.tooManyResetCodes);

    await first.user.click(within(banner).getByRole('button', { name: m.sendNewCode }));
    expect(first.actions.resendResetCode).toHaveBeenCalledTimes(1);
    first.container.remove();

    setup(<RecoverCodeStep />, { state: { ...state, resetCodeRejected: true, resetCodeSpent: true, resetCodeResent: true } });
    expect(screen.queryByText(m.tooManyResetCodes)).not.toBeInTheDocument();
  });

  it('reports a new code that could not be sent, and can ask again', async () => {
    const again = vi.fn();
    const { user } = setup(<RecoverCodeStep />, { state, requests: { resendResetCode: failing(offline, { again }) } });

    await user.click(within(screen.getByRole('alert')).getByRole('button', { name: fm.tryAgain }));

    expect(again).toHaveBeenCalledTimes(1);
  });
});

describe('NewPasswordStep', () => {
  const state = { step: 'new-password' as const, email, resetCode: 'A7kZq2' };

  it('saves a password that meets the rules', async () => {
    const { actions, user } = setup(<NewPasswordStep />, { state });

    await user.type(screen.getByLabelText(m.newPasswordLabel), 'Sunrise over Lekki 94!{Enter}');

    expect(actions.saveNewPassword).toHaveBeenCalledWith('Sunrise over Lekki 94!');
  });

  it.each([
    ['Sh-1a', 'Use 8 or more characters.'],
    ['sunrise', 'Use 8 or more characters, with a capital letter, a number and a symbol.'],
    ['sunrise over lekki', 'Add a capital letter and a number.'],
  ])('turns down %j with the reason and keeps the rule in view', async (typed, problem) => {
    const { actions, user } = setup(<NewPasswordStep />, { state });
    await user.type(screen.getByLabelText(m.newPasswordLabel), typed);

    await user.click(screen.getByRole('button', { name: m.saveAndSignIn }));

    const field = screen.getByLabelText(m.newPasswordLabel);
    expect(field).toHaveAccessibleDescription(expect.stringContaining(problem));
    expect(field).toHaveAccessibleDescription(expect.stringContaining(m.newPasswordHelp));
    expect(actions.saveNewPassword).not.toHaveBeenCalled();
  });

  it('rates the password in words as it is typed', async () => {
    const { user } = setup(<NewPasswordStep />, { state });
    expect(screen.queryByText(/characters$/)).not.toBeInTheDocument();

    await user.type(screen.getByLabelText(m.newPasswordLabel), 'abc');
    expect(screen.getByText('Too weak · 3 characters')).toBeInTheDocument();

    await user.type(screen.getByLabelText(m.newPasswordLabel), 'defghijklmnop1');
    expect(screen.getByText('Too weak · 17 characters')).toBeInTheDocument();

    await user.clear(screen.getByLabelText(m.newPasswordLabel));
    await user.type(screen.getByLabelText(m.newPasswordLabel), 'Abcdef1!');
    expect(screen.getByText('Fair · 8 characters')).toBeInTheDocument();

    await user.type(screen.getByLabelText(m.newPasswordLabel), 'ghij');
    expect(screen.getByText('Good · 12 characters')).toBeInTheDocument();

    await user.type(screen.getByLabelText(m.newPasswordLabel), 'kl');
    expect(screen.getByText('Strong · 14 characters')).toBeInTheDocument();
  });

  it('asks for a password before saving nothing, and marks a good one once it has been checked', async () => {
    const { actions, user } = setup(<NewPasswordStep />, { state });
    const field = () => screen.getByLabelText(m.newPasswordLabel);

    await user.click(screen.getByRole('button', { name: m.saveAndSignIn }));
    expect(field()).toHaveAccessibleDescription(expect.stringContaining(m.newPasswordRequired));
    expect(actions.saveNewPassword).not.toHaveBeenCalled();

    await user.type(field(), 'Sunrise over Lekki 94!');
    expect(field()).not.toHaveAttribute('aria-invalid', 'true');
    // The tick inside the field, beside the show control.
    expect(field().parentElement?.querySelector('svg')).toBeInTheDocument();
  });

  it('tells browsers this is a new password', () => {
    setup(<NewPasswordStep />, { state });

    expect(screen.getByLabelText(m.newPasswordLabel)).toHaveAttribute('autocomplete', 'new-password');
  });

  it('says so while saving and reports a refusal', () => {
    setup(<NewPasswordStep />, { state, requests: { newPassword: { isPending: true, feedback: refusedPassword, clear } } });

    expect(screen.getByRole('button', { name: m.saving })).toBeInTheDocument();
    const field = screen.getByLabelText(m.newPasswordLabel);
    expect(field).toBeInvalid();
    expect(field).toHaveAccessibleDescription(expect.stringContaining(m.passwordRefused));
    expect(field).toHaveFocus();
  });
});
