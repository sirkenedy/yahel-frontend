import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { initialSignInState } from '../machine';
import { signInMessages as m } from '../messages';
import { SignInFlowContext } from '../sign-in-flow';
import type { FlowRequest, SignInFlowValue } from '../sign-in-flow';
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

const idle: FlowRequest = { isPending: false, failure: null };
const email = 'amara@northwind.example';
const profile = { id: '1', globalId: 'g', email, firstName: 'Amara', lastName: 'Okafor', displayName: 'Amara Okafor', photo: null };

type Overrides = { state?: Partial<SignInFlowValue['state']>; offers?: Partial<SignInFlowValue['meta']['offers']>; requests?: Partial<SignInFlowValue['meta']['requests']>; backHref?: string | null };

const setup = (ui: ReactElement, { state, offers, requests, backHref = null }: Overrides = {}) => {
  const actions = {
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
  };
  const value: SignInFlowValue = {
    state: { ...initialSignInState, step: 'email', profile: null, accounts: [], recoveryOptions: null, textedTo: null, passkeyCancelled: false, resetCodeResent: false, removedAccount: null, ...state },
    actions,
    meta: {
      direction: 'forward',
      backHref,
      offers: { passkey: true, textCode: true, help: true, ...offers },
      requests: { password: idle, passkey: idle, code: idle, textCode: idle, sendResetCode: idle, resendResetCode: idle, newPassword: idle, help: idle, removeAccount: idle, signOut: idle, recoveryOptions: idle, ...requests },
    },
  };
  const { container } = render(<SignInFlowContext value={value}>{ui}</SignInFlowContext>);
  return { actions, container, user: userEvent.setup() };
};

const failing = (failure: string): FlowRequest => ({ isPending: false, failure });
const pending: FlowRequest = { isPending: true, failure: null };
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

  it('confirms a removal and reports one that failed', () => {
    setup(<ChooseStep />, { state: { step: 'choose', accounts, removedAccount: email }, requests: { removeAccount: failing(m.offline) } });

    expect(screen.getByRole('status')).toHaveTextContent(m.removed(email));
    expect(screen.getByRole('alert')).toHaveTextContent(m.offline);
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

  it('clears the error as soon as the address is edited', async () => {
    const { user } = setup(<EmailStep />);
    await user.click(screen.getByRole('button', { name: m.continue }));

    await user.type(screen.getByLabelText(m.emailLabel), 'a');

    expect(screen.getByLabelText(m.emailLabel)).not.toHaveAttribute('aria-invalid', 'true');
  });

  it('is set up for password managers and passkey autofill', () => {
    setup(<EmailStep />);

    const input = screen.getByLabelText(m.emailLabel);
    expect(input).toHaveAttribute('type', 'email');
    expect(input).toHaveAttribute('name', 'email');
    expect(input).toHaveAttribute('autocomplete', 'username webauthn');
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

  it('says so while signing in and reports a failure as an alert', () => {
    setup(<PasswordStep />, { state, requests: { password: { isPending: true, failure: m.wrongCredentials } } });

    expect(screen.getByRole('button', { name: m.signingIn })).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(m.wrongCredentials);
  });

  it('labels the field for password managers and pairs it with the account', () => {
    const { container } = setup(<PasswordStep />, { state });

    expect(screen.getByLabelText(m.passwordLabel)).toHaveAttribute('autocomplete', 'current-password');
    expect(container.querySelector('input[autocomplete="username"]')).toHaveValue(email);
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
    setup(<PasskeyStep />, { state: { step: 'passkey' }, requests: { passkey: failing(m.passkeyFailed) } });

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

  it('reports a wrong code and a failed text', () => {
    setup(<CodeStep />, { state, requests: { code: failing(m.wrongCode) } });
    expect(screen.getByRole('alert')).toHaveTextContent(m.wrongCode);
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
    setup(<HelpStep />, { state: { step: 'help' }, requests: { help: failing(m.tooManyAttempts) } });

    expect(screen.getByRole('alert')).toHaveTextContent(m.tooManyAttempts);
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
    setup(<RecoverStep />, { state, requests: { sendResetCode: { isPending: true, failure: m.offline } } });

    expect(screen.getByRole('button', { name: m.sendingCode })).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(m.offline);
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

  it('sends a new code on request and confirms it', async () => {
    const { actions, user } = setup(<RecoverCodeStep />, { state: { ...state, resetCodeResent: true } });

    await user.click(screen.getByRole('button', { name: m.sendNewCode }));

    expect(actions.resendResetCode).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('status')).toHaveTextContent(m.newCodeSent);
  });

  it('explains when the code was turned down at the next step', () => {
    setup(<RecoverCodeStep />, { state: { ...state, resetCodeRejected: true } });

    expect(screen.getByRole('alert')).toHaveTextContent(m.recoverCodeRejected);
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
    ['Short-1a', m.newPasswordTooShort],
    ['sunrise over lekki', m.newPasswordTooPlain],
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
    expect(screen.getByText('Strong · 17 characters')).toBeInTheDocument();
  });

  it('tells browsers this is a new password', () => {
    setup(<NewPasswordStep />, { state });

    expect(screen.getByLabelText(m.newPasswordLabel)).toHaveAttribute('autocomplete', 'new-password');
  });

  it('says so while saving and reports a refusal', () => {
    setup(<NewPasswordStep />, { state, requests: { newPassword: { isPending: true, failure: m.passwordRefused } } });

    expect(screen.getByRole('button', { name: m.saving })).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(m.passwordRefused);
  });
});
