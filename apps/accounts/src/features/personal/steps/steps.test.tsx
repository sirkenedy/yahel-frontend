import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { FlowRequest } from '../../../flow/use-flow-request';
import { initialPersonalState } from '../machine';
import { personalMessages as m } from '../messages';
import { PersonalFlowContext } from '../personal-flow';
import type { PersonalFlowValue } from '../personal-flow';
import { AddPasskeyStep } from './add-passkey-step';
import { AddressStep } from './address-step';
import { BirthStep } from './birth-step';
import { CodeStep } from './code-step';
import { ContactStep } from './contact-step';
import { CreatingStep } from './creating-step';
import { NameStep } from './name-step';
import { OwnCodeStep } from './own-code-step';
import { OwnEmailStep } from './own-email-step';
import { PasskeyStep } from './passkey-step';
import { PasswordStep } from './password-step';
import { ReadyStep } from './ready-step';
import { RecoveryStep } from './recovery-step';
import { ReviewStep } from './review-step';
import { TypeStep } from './type-step';

const idle: FlowRequest = { isPending: false, failure: null };
const pending: FlowRequest = { isPending: true, failure: null };
const failing = (failure: string): FlowRequest => ({ isPending: false, failure });
const attestation = { credentialId: 'id', clientDataJSON: 'c', attestationObject: 'a', transports: [] };

type Overrides = {
  state?: Partial<PersonalFlowValue['state']>;
  offers?: Partial<PersonalFlowValue['meta']['offers']>;
  links?: Partial<PersonalFlowValue['meta']['links']>;
  requests?: Partial<PersonalFlowValue['meta']['requests']>;
  meta?: Partial<Pick<PersonalFlowValue['meta'], 'backHref' | 'progress'>>;
};

const fakeActions = (): PersonalFlowValue['actions'] => ({
  startPersonal: vi.fn(),
  startBusiness: vi.fn(),
  enterName: vi.fn(),
  enterBirth: vi.fn(),
  considerAddress: vi.fn(),
  chooseAddress: vi.fn(),
  useOwnEmail: vi.fn(),
  useYahelAddress: vi.fn(),
  chooseOwnEmail: vi.fn(),
  choosePassword: vi.fn(),
  startPasskey: vi.fn(),
  continueWithoutPasskey: vi.fn(),
  enterRecovery: vi.fn(),
  skipRecovery: vi.fn(),
  setPreferences: vi.fn(),
  edit: vi.fn(),
  createAccount: vi.fn(),
  confirmEmail: vi.fn(),
  resendEmailCode: vi.fn(),
  verifyPhone: vi.fn(),
  resendPhoneCode: vi.fn(),
  skipPhone: vi.fn(),
  inviteContact: vi.fn(),
  continueToApp: vi.fn(),
});

const answered: Partial<PersonalFlowValue['state']> = {
  firstName: 'Amara',
  lastName: 'Okafor',
  fullName: 'Amara Okafor',
  birth: { day: 14, month: 3, year: 1994 },
  gender: 'woman',
  username: 'amara.okafor',
  address: 'amara.okafor@yahel.example',
  recovery: { country: 'NG', phone: '803 555 0142', email: 'amara.o@personal.example' },
  recoveryAnswered: true,
};

const flowValue = (actions: PersonalFlowValue['actions'], { state, offers, links, requests, meta }: Overrides = {}): PersonalFlowValue => ({
  state: { ...initialPersonalState, step: 'name', address: '@yahel.example', fullName: '', addressCheck: { status: 'idle', alternatives: [] }, passkeyCancelled: false, emailCodeResent: false, phoneCodeResent: false, existingAccount: false, ...state },
  actions,
  meta: {
    direction: 'forward',
    backHref: null,
    progress: null,
    mailDomain: 'yahel.example',
    offers: { passkey: true, business: false, contact: true, preferences: true, ...offers },
    links: { signIn: '/signin', terms: 'https://yahel.example/terms', privacy: 'https://yahel.example/privacy', ...links },
    requests: { passkey: idle, create: idle, confirmEmail: idle, resendEmailCode: idle, verifyPhone: idle, resendPhoneCode: idle, inviteContact: idle, ...requests },
    ...meta,
  },
});

const setup = (ui: ReactElement, overrides: Overrides = {}) => {
  const actions = fakeActions();
  const view = render(<PersonalFlowContext value={flowValue(actions, overrides)}>{ui}</PersonalFlowContext>);
  return { actions, user: userEvent.setup(), rerender: (next: Overrides) => view.rerender(<PersonalFlowContext value={flowValue(actions, next)}>{ui}</PersonalFlowContext>) };
};

const press = (name: string | RegExp) => userEvent.click(screen.getByRole('button', { name }));

describe('the step frame', () => {
  it('shows how far along the questions are, the way back, and names the page', () => {
    setup(<NameStep />, { meta: { backHref: '/personal/type', progress: { current: 1, part: 'name' } } });

    expect(screen.getByText('01 / 06 · Your name')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: m.back })).toHaveAttribute('href', '/personal/type');
    expect(document.title).toBe('What should we call you · Yahel');
  });

  it('shows no count on steps outside the six questions', () => {
    setup(<TypeStep />);

    expect(screen.queryByText(/\d\d \/ 06/)).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: m.back })).not.toBeInTheDocument();
  });
});

describe('TypeStep', () => {
  it('starts a personal account by default', async () => {
    const { actions } = setup(<TypeStep />);

    expect(screen.getByRole('radio', { name: new RegExp(m.typePersonal) })).toBeChecked();
    await press(m.continue);

    expect(actions.startPersonal).toHaveBeenCalledTimes(1);
  });

  it('leaves for the business sign-up when it has an address', async () => {
    const { actions, user } = setup(<TypeStep />, { offers: { business: true } });

    await user.click(screen.getByRole('radio', { name: new RegExp(m.typeBusiness) }));
    await press(m.continue);

    expect(actions.startBusiness).toHaveBeenCalledTimes(1);
    expect(actions.startPersonal).not.toHaveBeenCalled();
  });

  it('says business accounts are coming soon when there is nowhere to send the person, until they choose again', async () => {
    const { actions, user } = setup(<TypeStep />);

    await user.click(screen.getByRole('radio', { name: new RegExp(m.typeBusiness) }));
    await press(m.continue);
    expect(screen.getByRole('status')).toHaveTextContent(m.businessComingSoon);
    expect(actions.startBusiness).not.toHaveBeenCalled();

    await user.click(screen.getByRole('radio', { name: new RegExp(m.typePersonal) }));
    expect(screen.queryByText(m.businessComingSoon)).not.toBeInTheDocument();
  });
});

describe('NameStep', () => {
  it('needs a first name, and says so beside the field', async () => {
    const { actions } = setup(<NameStep />);

    await press(m.continue);

    expect(screen.getByText(m.firstNameRequired)).toBeInTheDocument();
    expect(screen.getByLabelText(m.firstName)).toHaveFocus();
    expect(actions.enterName).not.toHaveBeenCalled();
  });

  it('passes on trimmed names, the last one optional, and offers the browser’s saved names', async () => {
    const { actions, user } = setup(<NameStep />);

    expect(screen.getByLabelText(m.firstName)).toHaveAttribute('autocomplete', 'given-name');
    expect(screen.getByLabelText(m.lastName)).toHaveAccessibleDescription(m.optional);
    await user.type(screen.getByLabelText(m.firstName), ' Amara {Enter}');

    expect(actions.enterName).toHaveBeenCalledWith('Amara', '');
  });

  it('starts from what was answered before', () => {
    setup(<NameStep />, { state: answered });

    expect(screen.getByLabelText(m.firstName)).toHaveValue('Amara');
    expect(screen.getByLabelText(m.lastName)).toHaveValue('Okafor');
  });
});

describe('BirthStep', () => {
  const fill = async (user: ReturnType<typeof userEvent.setup>, day: string, month: string, year: string) => {
    if (day) await user.type(screen.getByLabelText(m.day), day);
    if (month) await user.selectOptions(screen.getByLabelText(m.month), month);
    if (year) await user.type(screen.getByLabelText(m.year), year);
  };

  it('asks for the date as one group, in the order the locale writes it, with fields the browser can fill', () => {
    setup(<BirthStep />);

    const group = screen.getByRole('group', { name: m.birthLabel });
    expect([...group.querySelectorAll('input, select')].map((field) => field.getAttribute('autocomplete'))).toEqual(['bday-day', 'bday-month', 'bday-year']);
    expect(within(screen.getByLabelText(m.month)).getAllByRole('option')).toHaveLength(13);
  });

  it('passes on a complete date and the gender chosen', async () => {
    const { actions, user } = setup(<BirthStep />);

    await fill(user, '14', 'March', '1994');
    await user.selectOptions(screen.getByLabelText(m.gender), m.genders.woman);
    await press(m.continue);

    expect(actions.enterBirth).toHaveBeenCalledWith({ day: 14, month: 3, year: 1994 }, 'woman');
  });

  it('says what is wrong with each part and focuses the first', async () => {
    const { actions } = setup(<BirthStep />);

    await press(m.continue);

    expect(screen.getByText(m.dayInvalid)).toBeInTheDocument();
    expect(screen.getByText(m.monthRequired)).toBeInTheDocument();
    expect(screen.getByText(m.yearInvalid)).toBeInTheDocument();
    expect(screen.getByLabelText(m.day)).toHaveFocus();
    expect(actions.enterBirth).not.toHaveBeenCalled();
  });

  it('refuses a day the month does not have, and someone under thirteen', async () => {
    const { actions, user } = setup(<BirthStep />);

    await fill(user, '31', 'April', '1994');
    await press(m.continue);
    expect(screen.getByText(m.dayInvalid)).toBeInTheDocument();

    await user.clear(screen.getByLabelText(m.day));
    await user.clear(screen.getByLabelText(m.year));
    await fill(user, '1', '', String(new Date().getFullYear() - 5));
    await press(m.continue);

    expect(screen.getByText(m.tooYoung)).toBeInTheDocument();
    expect(actions.enterBirth).not.toHaveBeenCalled();
  });

  it('explains why it asks, on request', async () => {
    setup(<BirthStep />);
    const why = screen.getByRole('button', { name: m.whyWeAsk });
    expect(why).toHaveAttribute('aria-expanded', 'false');

    await userEvent.click(why);

    expect(why).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('status')).toHaveTextContent(m.whyWeAskAnswer);
  });

  it('says so when the server found the person too young, and starts from the earlier answer', () => {
    setup(<BirthStep />, { state: { ...answered, rejection: { step: 'birth', reason: 'underage' } } });

    expect(screen.getByRole('alert')).toHaveTextContent(m.tooYoungForAccount);
    expect(screen.getByLabelText(m.day)).toHaveValue('14');
    expect(screen.getByLabelText(m.month)).toHaveValue('3');
    expect(screen.getByLabelText(m.gender)).toHaveValue('woman');
  });
});

describe('AddressStep', () => {
  it('shows the mail domain after the name and tells the flow what is typed, lower case with full stops for spaces', async () => {
    const { actions, user } = setup(<AddressStep />);

    await user.type(screen.getByLabelText(m.addressLabel), 'Amara O');

    expect(screen.getByText('@yahel.example')).toBeInTheDocument();
    expect(screen.getByLabelText(m.addressLabel)).toHaveValue('amara.o');
    expect(actions.considerAddress).toHaveBeenLastCalledWith('amara.o');
  });

  it.each([
    ['', m.addressRequired],
    ['abc', m.addressTooShort],
    ['amara_o', m.addressCharacters],
    ['amara..o', m.addressDots],
  ])('holds back "%s"', async (typed, problem) => {
    const { actions, user } = setup(<AddressStep />);

    if (typed) await user.type(screen.getByLabelText(m.addressLabel), typed);
    await press(m.continue);

    expect(screen.getByText(problem)).toBeInTheDocument();
    expect(actions.chooseAddress).not.toHaveBeenCalled();
  });

  it('says a free address is free and lets it be chosen', async () => {
    const { actions } = setup(<AddressStep />, { state: { ...answered, addressCheck: { status: 'available', alternatives: [] } } });

    expect(screen.getByText(m.addressAvailable)).toBeInTheDocument();
    await press(m.continue);

    expect(actions.chooseAddress).toHaveBeenCalledWith('amara.okafor');
  });

  it('says a taken address is taken, nothing more, and will not choose it', async () => {
    const { actions } = setup(<AddressStep />, { state: { ...answered, username: 'amara', addressCheck: { status: 'taken', alternatives: ['amara1', 'amara.mail'] } } });

    expect(screen.getByText(m.addressTaken)).toBeInTheDocument();
    expect(screen.queryByText(m.addressAvailable)).not.toBeInTheDocument();
    await press(m.continue);

    expect(actions.chooseAddress).not.toHaveBeenCalled();
  });

  it('fills in a free alternative with one press', async () => {
    const { actions } = setup(<AddressStep />, { state: { ...answered, username: 'amara', addressCheck: { status: 'taken', alternatives: ['amara1', 'amara.mail'] } } });

    await userEvent.click(within(screen.getByRole('group', { name: m.alsoFree })).getByRole('button', { name: 'amara.mail' }));

    expect(screen.getByLabelText(m.addressLabel)).toHaveValue('amara.mail');
    expect(actions.considerAddress).toHaveBeenLastCalledWith('amara.mail');
  });

  it('says when it is checking, and lets the person continue when it could not check', async () => {
    const { actions, rerender } = setup(<AddressStep />, { state: { ...answered, addressCheck: { status: 'checking', alternatives: [] } } });
    expect(screen.getByText(m.addressChecking)).toBeInTheDocument();

    rerender({ state: { ...answered, addressCheck: { status: 'unknown', alternatives: [] } } });
    expect(screen.getByText(m.addressUnchecked)).toBeInTheDocument();
    await press(m.continue);

    expect(actions.chooseAddress).toHaveBeenCalledWith('amara.okafor');
  });

  it('says the address was taken when creating the account found it so, until it is changed', async () => {
    const { user } = setup(<AddressStep />, { state: { ...answered, rejection: { step: 'address', reason: 'taken' } } });
    expect(screen.getByText(m.addressTakenPlain)).toBeInTheDocument();

    await user.type(screen.getByLabelText(m.addressLabel), '1');

    expect(screen.queryByText(m.addressTakenPlain)).not.toBeInTheDocument();
  });

  it('offers an existing email instead', async () => {
    const { actions } = setup(<AddressStep />);

    await press(m.useOwnEmail);

    expect(actions.useOwnEmail).toHaveBeenCalledTimes(1);
  });
});

describe('OwnEmailStep', () => {
  it('needs an email address', async () => {
    const { actions, user } = setup(<OwnEmailStep />);

    await user.type(screen.getByLabelText(m.ownEmailLabel), 'amara{Enter}');

    expect(screen.getByText(m.ownEmailInvalid)).toBeInTheDocument();
    expect(actions.chooseOwnEmail).not.toHaveBeenCalled();
  });

  it('passes the address on in lower case, and offers a Yahel address instead', async () => {
    const { actions, user } = setup(<OwnEmailStep />);

    await user.type(screen.getByLabelText(m.ownEmailLabel), ' Amara@Mail.example {Enter}');
    await press(m.useYahelAddress);

    expect(actions.chooseOwnEmail).toHaveBeenCalledWith('amara@mail.example');
    expect(actions.useYahelAddress).toHaveBeenCalledTimes(1);
  });

  it('says when the server would not take that kind of address', () => {
    setup(<OwnEmailStep />, { state: { ownEmail: 'amara@northwind.example', rejection: { step: 'own-email', reason: 'not-personal' } } });

    expect(screen.getByText(m.ownEmailNotPersonal)).toBeInTheDocument();
  });
});

describe('PasswordStep', () => {
  const field = () => screen.getByLabelText(m.passwordLabel, { selector: 'input' });

  it('states the rule, and holds back a password that is too short or too plain', async () => {
    const { actions, user } = setup(<PasswordStep />, { state: answered });
    expect(field()).toHaveAccessibleDescription(m.passwordHelp);
    expect(field()).toHaveAttribute('autocomplete', 'new-password');

    await user.type(field(), 'short{Enter}');
    expect(screen.getByText(m.passwordTooShort)).toBeInTheDocument();

    await user.clear(field());
    await user.type(field(), 'sunrise over lekki 94{Enter}');
    expect(screen.getByText(m.passwordTooPlain)).toBeInTheDocument();
    expect(actions.choosePassword).not.toHaveBeenCalled();
  });

  it('shows the strength in words as it is typed, and passes a good password on', async () => {
    const { actions, user } = setup(<PasswordStep />, { state: answered });

    await user.type(field(), 'Sunrise over Lekki 94');
    expect(screen.getByText(m.strength('Strong', 21))).toBeInTheDocument();
    await press(m.continue);

    expect(actions.choosePassword).toHaveBeenCalledWith('Sunrise over Lekki 94');
  });

  it('hides a revealed password again on submit, and tells password managers whose it is', async () => {
    const { user, } = setup(<PasswordStep />, { state: answered });

    await user.type(field(), 'Sunrise over Lekki 94');
    await press(m.showPassword);
    expect(field()).toHaveAttribute('type', 'text');
    await press(m.continue);

    expect(field()).toHaveAttribute('type', 'password');
    expect(document.querySelector('input[autocomplete="username"]')).toHaveValue('amara.okafor@yahel.example');
  });
});

describe('AddPasskeyStep and PasskeyStep', () => {
  it('offers a passkey or not now', async () => {
    const { actions } = setup(<AddPasskeyStep />);
    expect(screen.getByText(m.passwordStillWorks)).toBeInTheDocument();

    await press(m.addPasskey);
    await press(m.notNow);

    expect(actions.startPasskey).toHaveBeenCalledTimes(1);
    expect(actions.continueWithoutPasskey).toHaveBeenCalledTimes(1);
  });

  it('does not offer a second passkey once one is made', async () => {
    const { actions } = setup(<AddPasskeyStep />, { state: { passkey: attestation } });

    expect(screen.getByText(m.passkeyReady)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: m.addPasskey })).not.toBeInTheDocument();
    await press(m.continue);

    expect(actions.continueWithoutPasskey).toHaveBeenCalledTimes(1);
  });

  it('waits for the device, with a way to carry on by password', async () => {
    const { actions } = setup(<PasskeyStep />, { requests: { passkey: pending } });

    expect(screen.getByRole('status')).toHaveTextContent(m.passkeyWaiting);
    expect(screen.queryByRole('button', { name: m.tryAgain })).not.toBeInTheDocument();
    await press(m.usePasswordInstead);

    expect(actions.continueWithoutPasskey).toHaveBeenCalledTimes(1);
  });

  it('says when the prompt was closed or the device failed, and offers another try', async () => {
    const { actions, rerender } = setup(<PasskeyStep />, { state: { passkeyCancelled: true } });
    expect(screen.getByRole('status')).toHaveTextContent(m.passkeyCancelled);

    rerender({ requests: { passkey: failing(m.passkeyFailed) } });
    expect(screen.getByRole('alert')).toHaveTextContent(m.passkeyFailed);
    await press(m.tryAgain);

    expect(actions.startPasskey).toHaveBeenCalledTimes(1);
  });
});

describe('RecoveryStep', () => {
  it('starts on Nigeria, lists countries by name with their codes, and passes on what was typed', async () => {
    const { actions, user } = setup(<RecoveryStep />, { state: answered });
    const country = screen.getByLabelText(m.country);

    expect(country).toHaveValue('NG');
    expect(within(country).getByRole('group', { name: m.countryGroups.africa })).toBeInTheDocument();
    await user.selectOptions(country, '+233 Ghana');
    await press(m.continue);

    expect(actions.enterRecovery).toHaveBeenCalledWith({ country: 'GH', phone: '803 555 0142', email: 'amara.o@personal.example' });
  });

  it('wants a phone or an email, or Skip', async () => {
    const { actions } = setup(<RecoveryStep />);

    await press(m.continue);
    expect(screen.getByText(m.recoveryEmpty)).toBeInTheDocument();
    expect(screen.getByLabelText(m.mobileNumber)).toHaveFocus();
    await press(m.skip);

    expect(actions.enterRecovery).not.toHaveBeenCalled();
    expect(actions.skipRecovery).toHaveBeenCalledTimes(1);
  });

  it('checks the number and the email, and refuses the address the person will sign in with', async () => {
    const { actions, user } = setup(<RecoveryStep />, { state: { address: 'amara.okafor@yahel.example' } });

    await user.type(screen.getByLabelText(m.mobileNumber), '803');
    await user.type(screen.getByLabelText(m.recoveryEmail), 'amara.okafor@yahel.example{Enter}');

    expect(screen.getByText(m.phoneInvalid)).toBeInTheDocument();
    expect(screen.getByText(m.recoveryEmailSame)).toBeInTheDocument();
    expect(actions.enterRecovery).not.toHaveBeenCalled();
  });
});

describe('ReviewStep', () => {
  const row = (label: string) => screen.getByText(label, { selector: 'dt' }).parentElement!;

  it('lists the account as answered, with the private lines hidden', () => {
    setup(<ReviewStep />, { state: { ...answered, passkey: attestation } });

    const receipt = screen.getByRole('group', { name: m.reviewLabel });
    expect(within(receipt).getAllByRole('term').map((term) => term.textContent)).toEqual(Object.values(m.rows));
    expect(row(m.rows.name)).toHaveTextContent('Amara Okafor');
    expect(row(m.rows.address)).toHaveTextContent('amara.okafor@yahel.example');
    expect(row(m.rows.signIn)).toHaveTextContent(m.signInPasswordAndPasskey);
    expect(row(m.rows.birthday)).not.toHaveTextContent('1994');
    expect(row(m.rows.birthday)).toHaveTextContent(m.hiddenValue);
    expect(row(m.rows.recovery)).toHaveTextContent('•••••• 42');
    expect(row(m.rows.recovery)).not.toHaveTextContent('personal.example');
  });

  it('shows the private lines on request, and hides them again', async () => {
    setup(<ReviewStep />, { state: answered });

    await press(m.showPrivate);
    expect(row(m.rows.birthday)).toHaveTextContent('14 March 1994');
    expect(row(m.rows.recovery)).toHaveTextContent('+234 ••• ••• ••42 · amara.o@personal.example');

    await press(m.hidePrivate);
    expect(row(m.rows.birthday)).not.toHaveTextContent('1994');
  });

  it('says plainly when there is a password only and no way back in', () => {
    setup(<ReviewStep />, { state: { ...answered, recovery: { country: 'NG', phone: '', email: '' } } });

    expect(row(m.rows.signIn)).toHaveTextContent(m.signInPassword);
    expect(row(m.rows.recovery)).toHaveTextContent(m.recoveryNone);
  });

  it('lets every line be changed', async () => {
    const { actions } = setup(<ReviewStep />, { state: answered });

    for (const label of Object.values(m.editLabels)) await press(label);

    expect(vi.mocked(actions.edit).mock.calls.map(([target]) => target)).toEqual(['name', 'address', 'birthday', 'signIn', 'recovery']);
  });

  it('keeps both choices off unless the person turns one on', async () => {
    const { actions } = setup(<ReviewStep />, { state: answered });
    expect(screen.getByRole('checkbox', { name: m.tips })).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: m.activity })).not.toBeChecked();

    await userEvent.click(screen.getByRole('checkbox', { name: m.activity }));

    expect(actions.setPreferences).toHaveBeenCalledWith({ productNews: false, activityHistory: true });
  });

  it('hides the choices where they cannot be saved, and links the terms only when it has their address', () => {
    setup(<ReviewStep />, { state: answered, offers: { preferences: false }, links: { terms: null } });

    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: m.agreement.terms })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: m.agreement.privacy })).toHaveAttribute('href', 'https://yahel.example/privacy');
  });

  it('creates the account on agreement', async () => {
    const { actions } = setup(<ReviewStep />, { state: answered });

    await press(m.create);

    expect(actions.createAccount).toHaveBeenCalledTimes(1);
  });
});

describe('CreatingStep', () => {
  const creating = (stage: 'account' | 'signing-in' | 'finishing', created = false) => ({ ...answered, creation: { ...initialPersonalState.creation, started: true, stage, created } });

  it('says what is happening while it works', () => {
    const { rerender } = setup(<CreatingStep />, { state: creating('account'), requests: { create: pending } });
    expect(screen.getByRole('heading', { name: m.creatingTitle })).toBeInTheDocument();
    expect(screen.getByText(m.creatingLede('amara.okafor@yahel.example'))).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(m.creatingStages.account);

    rerender({ state: creating('signing-in', true), requests: { create: pending } });
    expect(screen.getByRole('status')).toHaveTextContent(m.creatingStages['signing-in']);
  });

  it('on failure says nothing is lost, and offers another try or the review', async () => {
    const { actions } = setup(<CreatingStep />, { state: creating('account'), requests: { create: failing(m.offline) } });

    expect(screen.getByRole('alert')).toHaveTextContent(m.offline);
    expect(screen.getByText(m.creatingFailedLede)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: m.backToReview })).toHaveAttribute('href', '/personal/review');
    await press(m.tryAgain);

    expect(actions.createAccount).toHaveBeenCalledTimes(1);
  });

  it('once the account exists, offers only another try: the answers are final', () => {
    setup(<CreatingStep />, { state: creating('signing-in', true), requests: { create: failing(m.offline) } });

    expect(screen.getByText(m.createdButUnfinished)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: m.backToReview })).not.toBeInTheDocument();
  });

  it('sends someone whose address already has an account to sign in', () => {
    setup(<CreatingStep />, { state: { ...creating('signing-in'), existingAccount: true } });

    expect(screen.getByRole('alert')).toHaveTextContent(m.existingAccount);
    expect(screen.getByRole('link', { name: m.signInInstead })).toHaveAttribute('href', '/signin');
    expect(screen.queryByRole('button', { name: m.tryAgain })).not.toBeInTheDocument();
  });
});

describe('OwnCodeStep and CodeStep', () => {
  const code = () => screen.getByLabelText(m.codeLabel);

  it('asks for the emailed code and passes six characters on', async () => {
    const { actions, user } = setup(<OwnCodeStep />, { state: { address: 'amara@mail.example' } });
    expect(screen.getByText(m.ownCodeLede('amara@mail.example'))).toBeInTheDocument();

    await user.type(code(), 'B4nQ{Enter}');
    expect(screen.getByText(m.codeIncomplete)).toBeInTheDocument();
    await user.type(code(), '7x{Enter}');

    expect(actions.confirmEmail).toHaveBeenCalledWith('B4nQ7x');
  });

  it('sends a new emailed code on request, and points to sign-in without saying the address has an account', async () => {
    const { actions, rerender } = setup(<OwnCodeStep />);

    await press(m.sendNewCode);
    expect(actions.resendEmailCode).toHaveBeenCalledTimes(1);
    expect(screen.getByText(m.ownCodeHint)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: m.signInInstead })).toHaveAttribute('href', '/signin');

    rerender({ state: { emailCodeResent: true }, requests: { confirmEmail: failing(m.wrongCode) } });
    expect(screen.getByRole('status')).toHaveTextContent(m.newCodeSent);
    expect(screen.getByRole('alert')).toHaveTextContent(m.wrongCode);
  });

  it('asks for the texted code, naming the masked number', async () => {
    const { actions, user } = setup(<CodeStep />, { state: answered });
    expect(screen.getByText(m.codeLede('+234 ••• ••• ••42'))).toBeInTheDocument();

    await user.type(code(), 'K9mP2r{Enter}');

    expect(actions.verifyPhone).toHaveBeenCalledWith('K9mP2r');
  });

  it('sends a new text or skips the phone, and shows progress while verifying', async () => {
    const { actions, rerender } = setup(<CodeStep />, { state: answered });

    await press(m.sendNewCode);
    await press(m.skipForNow);
    expect(actions.resendPhoneCode).toHaveBeenCalledTimes(1);
    expect(actions.skipPhone).toHaveBeenCalledTimes(1);

    rerender({ state: { ...answered, phoneCodeResent: true }, requests: { verifyPhone: pending } });
    expect(screen.getByRole('status')).toHaveTextContent(m.newCodeSent);
    expect(screen.getByRole('button', { name: m.verifying })).toBeInTheDocument();
  });
});

describe('ReadyStep and ContactStep', () => {
  it('welcomes the person by name with their address, and leads on to Yahel', async () => {
    const { actions } = setup(<ReadyStep />, { state: answered });

    expect(screen.getByRole('heading', { name: m.readyTitle('Amara') })).toBeInTheDocument();
    expect(screen.getByText(m.readyLede('amara.okafor@yahel.example'))).toBeInTheDocument();
    expect(screen.getByRole('link', { name: new RegExp(m.trustTitle) })).toHaveAttribute('href', '/personal/contact');
    await press(m.openYahel);

    expect(actions.continueToApp).toHaveBeenCalledTimes(1);
  });

  it('says what could not be saved, and who was invited', () => {
    setup(<ReadyStep />, { state: { ...answered, contactInvited: 'chidi.eze@personal.example', creation: { ...initialPersonalState.creation, unsaved: ['phone', 'passkey'] } } });

    expect(screen.getByText(m.unsaved.phone)).toBeInTheDocument();
    expect(screen.getByText(m.unsaved.passkey)).toBeInTheDocument();
    expect(screen.getByText(m.trustInvited('chidi.eze@personal.example'))).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: new RegExp(m.trustTitle) })).not.toBeInTheDocument();
  });

  it('does not offer a trusted contact where there is nowhere to send the invitation', () => {
    setup(<ReadyStep />, { state: answered, offers: { contact: false } });

    expect(screen.queryByRole('link', { name: new RegExp(m.trustTitle) })).not.toBeInTheDocument();
  });

  it('invites someone else, and says what they will and will not see', async () => {
    const { actions, user } = setup(<ContactStep />, { state: answered });
    expect(screen.getAllByRole('listitem')).toHaveLength(3);

    await user.type(screen.getByLabelText(m.contactLabel), 'amara.o@personal.example{Enter}');
    expect(screen.getByText(m.contactOwn)).toBeInTheDocument();

    await user.clear(screen.getByLabelText(m.contactLabel));
    await user.type(screen.getByLabelText(m.contactLabel), ' Chidi.Eze@personal.example{Enter}');

    expect(actions.inviteContact).toHaveBeenCalledWith('chidi.eze@personal.example');
    expect(screen.getByRole('link', { name: m.notNow })).toHaveAttribute('href', '/personal/ready');
  });

  it('needs an address to invite, and shows a failed invitation', async () => {
    const { actions, rerender } = setup(<ContactStep />, { state: answered });

    await press(m.sendInvitation);
    expect(screen.getByText(m.contactRequired)).toBeInTheDocument();
    expect(actions.inviteContact).not.toHaveBeenCalled();

    rerender({ state: answered, requests: { inviteContact: failing(m.tooManyAttempts) } });
    expect(screen.getByRole('alert')).toHaveTextContent(m.tooManyAttempts);
  });
});
