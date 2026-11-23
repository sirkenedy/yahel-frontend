import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { flowMessages as fm } from '../../../flow/messages';
import { AdminFlowContext } from '../admin-flow';
import type { AdminFlowValue } from '../admin-flow';
import { carried } from '../feedback';
import type { AdminFeedback } from '../feedback';
import { initialAdminState } from '../machine';
import { adminMessages as m } from '../messages';
import { AddPasskeyStep } from './add-passkey-step';
import { CodeStep } from './code-step';
import { ConfirmEmailStep } from './confirm-email-step';
import { PasskeyStep } from './passkey-step';
import { PhoneStep } from './phone-step';
import { SignInStep } from './signin-step';
import { WelcomeStep } from './welcome-step';

type Request = AdminFlowValue['meta']['requests']['password'];
const clear = () => undefined;
const idle: Request = { isPending: false, feedback: null, clear };
const email = 'amara@harbourline.example';
const handedOver = { email, handedOver: true, address: email, domain: 'harbourline.example', organisation: 'Harbourline Studio' };

type Overrides = { state?: Partial<AdminFlowValue['state']>; requests?: Partial<AdminFlowValue['meta']['requests']>; meta?: Partial<Omit<AdminFlowValue['meta'], 'requests'>> };

const fakeActions = () => ({ signIn: vi.fn(), confirmEmail: vi.fn(), resendEmailCode: vi.fn(), sendPhoneCode: vi.fn(), resendPhoneCode: vi.fn(), verifyPhone: vi.fn(), understand: vi.fn(), startPasskey: vi.fn(), signOut: vi.fn(), openAdmin: vi.fn() });

const flowValue = (actions: AdminFlowValue['actions'], { state, requests, meta }: Overrides = {}): AdminFlowValue => ({
  state: { ...initialAdminState, step: 'signin', address: null, domain: null, organisation: null, hasPasskey: false, passkeyCancelled: false, passkeyUnprepared: false, ...state },
  actions,
  meta: {
    direction: 'forward',
    backHref: null,
    passkeySupported: true,
    passkeyPreparing: false,
    links: { admin: 'https://admin.yahel.example/', signIn: '/signin', resetPassword: '/signin', help: 'https://yahel.example/help', businessTerms: 'https://yahel.example/business-terms', privacy: 'https://yahel.example/privacy' },
    requests: { password: idle, confirmEmail: idle, resendEmailCode: idle, sendPhoneCode: idle, resendPhoneCode: idle, verifyPhone: idle, passkey: idle, signOut: idle, ...requests },
    screens: { account: state?.address ?? null, exits: { signIn: '/admin/signin', resetPassword: '/signin', support: 'https://yahel.example/help' } },
    ...meta,
  },
});

const setup = (ui: ReactElement, overrides: Overrides = {}) => {
  const actions = fakeActions();
  // A whole-screen state asks the query client for a maintenance window, so every step is rendered inside one.
  render(
    <QueryClientProvider client={new QueryClient()}>
      <AdminFlowContext value={flowValue(actions, overrides)}>{ui}</AdminFlowContext>
    </QueryClientProvider>,
  );
  return { actions, user: userEvent.setup() };
};

const failing = (feedback: AdminFeedback): Request => ({ isPending: false, feedback, clear });
const pending: Request = { isPending: true, feedback: null, clear };
const heading = (name: string) => screen.getByRole('heading', { level: 1, name });

describe('SignInStep', () => {
  it('shows the handed-over address instead of asking for it, and signs in with the password alone', async () => {
    const { actions, user } = setup(<SignInStep />, { state: handedOver });

    expect(heading(m.signInTitle)).toBeInTheDocument();
    expect(screen.getByText(m.signInLede)).toBeInTheDocument();
    expect(screen.getByText(email)).toBeInTheDocument();
    expect(screen.queryByLabelText(m.emailLabel)).not.toBeInTheDocument();

    await user.type(screen.getByLabelText(m.passwordLabel), 'Harbourline Lagos 2026!{Enter}');
    expect(actions.signIn).toHaveBeenCalledWith('Harbourline Lagos 2026!', undefined);
  });

  it('asks for the address when nothing was handed over, checking both fields before sending', async () => {
    const { actions, user } = setup(<SignInStep />);

    expect(screen.getByText(m.signInLedeTyped)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: m.signIn }));
    expect(screen.getByLabelText(m.emailLabel)).toHaveAccessibleDescription(m.emailRequired);
    expect(screen.getByLabelText(m.passwordLabel)).toHaveAccessibleDescription(m.passwordRequired);
    expect(screen.getByLabelText(m.emailLabel)).toHaveFocus();
    expect(actions.signIn).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText(m.emailLabel), ' Kayode@Northwind.example ');
    await user.type(screen.getByLabelText(m.passwordLabel), 'pw{Enter}');
    expect(actions.signIn).toHaveBeenCalledWith('pw', 'kayode@northwind.example');
  });

  it('tells a wrong password beside the field', () => {
    setup(<SignInStep />, { state: handedOver, requests: { password: failing({ place: 'field', field: 'password', text: fm.wrongCredentials }) } });
    expect(screen.getByLabelText(m.passwordLabel)).toHaveAccessibleDescription(fm.wrongCredentials);
  });

  it('shows that the button is busy while signing in', () => {
    setup(<SignInStep />, { state: handedOver, requests: { password: pending } });
    expect(screen.getByRole('button', { name: m.signingIn })).toHaveAttribute('aria-disabled', 'true');
  });

  it('says the address is confirmed when the sign-in after confirming failed', () => {
    setup(<SignInStep />, { state: { ...handedOver, signInPrompt: 'email-confirmed' } });
    expect(screen.getByText(fm.emailConfirmedTitle)).toBeInTheDocument();
  });

  it('a second step leads to Yahel’s own sign-in', () => {
    setup(<SignInStep />, { state: { ...handedOver, signInPrompt: 'second-step' } });
    expect(screen.getByText(carried['second-step'].title)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: m.signInToYahel })).toHaveAttribute('href', '/signin');
  });

  it('gives way to the paused screen after too many tries', () => {
    setup(<SignInStep />, { state: handedOver, requests: { password: failing({ place: 'screen', screen: 'locked' }) } });
    expect(heading(fm.lockedTitle)).toBeInTheDocument();
    expect(screen.queryByLabelText(m.passwordLabel)).not.toBeInTheDocument();
  });

  it('offers a way to reset the password', () => {
    setup(<SignInStep />, { state: handedOver });
    expect(screen.getByRole('link', { name: m.forgotPassword })).toHaveAttribute('href', '/signin');
  });
});

describe('ConfirmEmailStep', () => {
  it('takes the emailed code in six boxes and names the address it went to', async () => {
    const { actions, user } = setup(<ConfirmEmailStep />, { state: { ...handedOver, step: 'confirm-email' }, meta: { backHref: '/admin/signin' } });

    expect(heading(fm.confirmStepTitle)).toBeInTheDocument();
    expect(screen.getByText(fm.confirmStepLede(email))).toBeInTheDocument();
    expect(screen.getByRole('link', { name: m.back })).toHaveAttribute('href', '/admin/signin');
    await user.type(screen.getByLabelText(fm.emailedCode.codeLabel), 'B4nQ7x{Enter}');
    expect(actions.confirmEmail).toHaveBeenCalledWith('B4nQ7x');
  });

  it('tells a spent code with a way to a new one', async () => {
    const { actions, user } = setup(<ConfirmEmailStep />, { state: handedOver, requests: { confirmEmail: failing({ place: 'banner', tone: 'danger', title: fm.codeDeadTitle, text: fm.tooManyEmailCodes, next: 'resend' }) } });

    await user.click(screen.getByRole('button', { name: fm.emailedCode.sendNewCode }));
    expect(actions.resendEmailCode).toHaveBeenCalledTimes(1);
  });
});

describe('PhoneStep', () => {
  it('asks for a mobile number with its country, and sends it with the country chosen', async () => {
    const { actions, user } = setup(<PhoneStep />, { state: { ...handedOver, step: 'phone' } });

    expect(heading(m.phoneTitle)).toBeInTheDocument();
    expect(screen.getByLabelText(m.country)).toHaveValue('NG');
    await user.selectOptions(screen.getByLabelText(m.country), 'GH');
    await user.type(screen.getByLabelText(m.mobileNumber), '024 555 0142{Enter}');
    expect(actions.sendPhoneCode).toHaveBeenCalledWith({ country: 'GH', number: '024 555 0142' });
  });

  it('checks the number before sending it', async () => {
    const { actions, user } = setup(<PhoneStep />, { state: handedOver });

    await user.click(screen.getByRole('button', { name: m.sendCode }));
    expect(screen.getByLabelText(m.mobileNumber)).toHaveAccessibleDescription(m.phoneRequired);
    await user.type(screen.getByLabelText(m.mobileNumber), 'call me{Enter}');
    expect(screen.getByLabelText(m.mobileNumber)).toHaveAccessibleDescription(m.phoneInvalid);
    expect(actions.sendPhoneCode).not.toHaveBeenCalled();
  });

  it('tells a number the backend will not take beside the field', () => {
    setup(<PhoneStep />, { state: handedOver, requests: { sendPhoneCode: failing({ place: 'field', field: 'phone', text: m.phoneRefused }) } });
    expect(screen.getByLabelText(m.mobileNumber)).toHaveAccessibleDescription(m.phoneRefused);
  });
});

describe('CodeStep', () => {
  const sent = { ...handedOver, step: 'code' as const, phone: { country: 'NG', number: '803 555 0142' } };

  it('names the number by its last two digits only and takes the code', async () => {
    const { actions, user } = setup(<CodeStep />, { state: sent, meta: { backHref: '/admin/phone' } });

    expect(screen.getByText(m.codeLede('+234 ••• ••• ••42'))).toBeInTheDocument();
    expect(document.body).not.toHaveTextContent('5550142');
    expect(screen.getByRole('link', { name: m.back })).toHaveAttribute('href', '/admin/phone');
    await user.type(screen.getByLabelText(fm.emailedCode.codeLabel), 'K9mP2r{Enter}');
    expect(actions.verifyPhone).toHaveBeenCalledWith('K9mP2r');
  });

  it('a new code can be asked for only after a pause', () => {
    setup(<CodeStep />, { state: sent });
    expect(screen.getByRole('button', { name: /^Send a new code in 0:\d{2}$/ })).toHaveAttribute('aria-disabled', 'true');
  });
});

describe('WelcomeStep', () => {
  it('says what being an administrator means, for this address, organisation and domain, with the agreements linked', async () => {
    const { actions, user } = setup(<WelcomeStep />, { state: { ...handedOver, step: 'welcome' } });

    const facts = within(screen.getByRole('list')).getAllByRole('listitem');
    expect(facts.map((fact) => fact.textContent)).toEqual([
      `${m.welcomeBelongs(email, 'Harbourline Studio')} ${m.welcomeDecide}`,
      `${m.welcomeManage('harbourline.example')} ${m.welcomeManageDetail}`,
      `${m.welcomeTeam} ${m.welcomeTeamDetail}`,
      expect.stringContaining(m.welcomeAgreement),
    ]);
    expect(screen.getByRole('link', { name: new RegExp(m.businessAgreement) })).toHaveAttribute('href', 'https://yahel.example/business-terms');
    expect(screen.getByRole('link', { name: new RegExp(m.privacyPolicy) })).toHaveAttribute('href', 'https://yahel.example/privacy');

    await user.click(screen.getByRole('button', { name: m.understand }));
    expect(actions.understand).toHaveBeenCalledTimes(1);
  });

  it('says “your organisation” when nothing has named it', () => {
    setup(<WelcomeStep />, { state: { ...handedOver, organisation: null } });
    expect(screen.getAllByRole('listitem')[0]).toHaveTextContent(m.welcomeBelongs(email, m.yourOrganisation));
  });
});

describe('AddPasskeyStep', () => {
  it('requires a passkey: one action, no way to skip, and no way on to Admin yet', async () => {
    const { actions, user } = setup(<AddPasskeyStep />, { state: { ...handedOver, step: 'add-passkey' } });

    expect(heading(m.addPasskeyTitle)).toBeInTheDocument();
    expect(screen.getByText(m.passkeyRequired)).toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(1);
    expect(screen.queryByRole('button', { name: m.continueToAdmin })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: m.addPasskey }));
    expect(actions.startPasskey).toHaveBeenCalledTimes(1);
  });

  it('holds the button while the challenge is fetched, so a press always opens the prompt', async () => {
    const { actions, user } = setup(<AddPasskeyStep />, { state: handedOver, meta: { passkeyPreparing: true } });

    await user.click(screen.getByRole('button', { name: fm.passkeyPreparing }));

    expect(actions.startPasskey).not.toHaveBeenCalled();
  });

  it('while a prompt left with Back is still open, says it is waiting for the device and takes no second press', async () => {
    const { actions, user } = setup(<AddPasskeyStep />, { state: handedOver, requests: { passkey: pending } });

    await user.click(screen.getByRole('button', { name: m.passkeyWaiting }));

    expect(actions.startPasskey).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: m.addPasskey })).not.toBeInTheDocument();
  });

  it('on a device that cannot make one, says so and offers only to sign out', async () => {
    const { actions, user } = setup(<AddPasskeyStep />, { state: handedOver, meta: { passkeySupported: false } });

    expect(screen.getByText(m.unsupportedTitle)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: m.addPasskey })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: m.continueToAdmin })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: m.signOut }));
    expect(actions.signOut).toHaveBeenCalledTimes(1);
  });

  it('once a passkey exists, leads on to Admin', async () => {
    const { actions, user } = setup(<AddPasskeyStep />, { state: { ...handedOver, hasPasskey: true } });

    expect(heading(m.passkeyDoneTitle)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: m.continueToAdmin }));
    expect(actions.openAdmin).toHaveBeenCalledTimes(1);
  });
});

describe('PasskeyStep', () => {
  it('waits for the device while the prompt is open', () => {
    setup(<PasskeyStep />, { state: { ...handedOver, step: 'passkey' }, requests: { passkey: pending }, meta: { backHref: '/admin/add-passkey' } });

    expect(screen.getByText(m.passkeyWaiting)).toBeInTheDocument();
    expect(screen.getByText(m.passkeyWaitingDetail(email))).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: m.tryAgain })).not.toBeInTheDocument();
  });

  it('after a dismissed prompt, says nothing was saved and offers another try', async () => {
    const { actions, user } = setup(<PasskeyStep />, { state: { ...handedOver, passkeyCancelled: true } });

    expect(screen.getByText(m.passkeyCancelled)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: m.tryAgain }));
    expect(actions.startPasskey).toHaveBeenCalledTimes(1);
  });

  it('says plainly when a press found no challenge ready, rather than that the prompt was closed', async () => {
    const { actions, user } = setup(<PasskeyStep />, { state: { ...handedOver, passkeyUnprepared: true } });

    expect(screen.getByText(fm.passkeyUnprepared)).toBeInTheDocument();
    expect(screen.queryByText(m.passkeyCancelled)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: m.tryAgain }));
    expect(actions.startPasskey).toHaveBeenCalledTimes(1);
  });

  it('a passkey the server would not save is a warning, and the step’s own button is the retry', () => {
    setup(<PasskeyStep />, { state: handedOver, requests: { passkey: failing({ place: 'banner', tone: 'warning', text: m.passkeyFailed, next: 'retry' }) } });

    expect(screen.getByText(m.passkeyFailed)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: m.tryAgain })).toHaveLength(1);
  });
});
