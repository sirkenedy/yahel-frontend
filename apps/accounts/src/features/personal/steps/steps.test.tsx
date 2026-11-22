import { act, cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import type { ReactElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flowMessages as shared } from '../../../flow/messages';
import type { FlowRequest } from '../../../flow/use-flow-request';
import type { PersonalFeedback, PersonalField, PersonalNext } from '../feedback';
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

type Request = FlowRequest<PersonalField, PersonalNext>;
const idle: Request = { isPending: false, feedback: null, clear: () => undefined };
const pending: Request = { ...idle, isPending: true };
const telling = (feedback: PersonalFeedback, rest: Partial<Request> = {}): Request => ({ ...idle, feedback, ...rest });
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
  typeAddress: vi.fn(),
  chooseAddress: vi.fn(),
  useOwnEmail: vi.fn(),
  useYahelAddress: vi.fn(),
  chooseOwnEmail: vi.fn(),
  choosePassword: vi.fn(),
  keepPassword: vi.fn(),
  startPasskey: vi.fn(),
  continueWithoutPasskey: vi.fn(),
  enterRecovery: vi.fn(),
  skipRecovery: vi.fn(),
  setPreferences: vi.fn(),
  edit: vi.fn(),
  createAccount: vi.fn(),
  confirmEmail: vi.fn(),
  useDifferentAddress: vi.fn(),
  startAgain: vi.fn(),
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

// Steps are never given the password, so the fake context has none to give.
const answersOnly = ({ password, ...answers }: typeof initialPersonalState) => {
  void password;
  return answers;
};

const flowValue = (actions: PersonalFlowValue['actions'], { state, offers, links, requests, meta }: Overrides = {}): PersonalFlowValue => ({
  state: { ...answersOnly(initialPersonalState), step: 'name', hasPassword: false, address: '@yahel.example', fullName: '', addressCheck: { status: 'idle', alternatives: [] }, passkeyCancelled: false, emailCodeResent: false, phoneCodeResent: false, ...state },
  actions,
  meta: {
    direction: 'forward',
    backHref: null,
    progress: null,
    mailDomain: 'yahel.example',
    offers: { passkey: true, contact: true, preferences: true, ...offers },
    links: { signIn: '/signin', terms: 'https://yahel.example/terms', privacy: 'https://yahel.example/privacy', ...links },
    screens: { account: null, exits: { signIn: '/signin', signUp: '/personal' }, serviceStatus: null },
    requests: { passkey: idle, create: idle, confirmEmail: idle, resendEmailCode: idle, verifyPhone: idle, resendPhoneCode: idle, inviteContact: idle, ...requests },
    ...meta,
  },
});

const setup = (ui: ReactElement, overrides: Overrides = {}) => {
  const actions = fakeActions();
  // A whole-screen state asks the query client about the service, so every step is given one.
  const queryClient = new QueryClient();
  const within = (next: Overrides) => (
    <QueryClientProvider client={queryClient}>
      <PersonalFlowContext value={flowValue(actions, next)}>{ui}</PersonalFlowContext>
    </QueryClientProvider>
  );
  const view = render(within(overrides));
  return { actions, user: userEvent.setup(), rerender: (next: Overrides) => view.rerender(within(next)) };
};

/** The address step shows what the flow holds for the field, so its tests keep that as the flow would. */
const setupAddress = (overrides: Overrides = {}) => {
  const actions = fakeActions();
  function Held() {
    const [draft, setDraft] = useState(overrides.state?.addressDraft ?? overrides.state?.username ?? '');
    const typeAddress = (next: string) => {
      actions.typeAddress(next);
      setDraft(next);
    };
    return (
      <PersonalFlowContext value={flowValue({ ...actions, typeAddress }, { ...overrides, state: { ...overrides.state, addressDraft: draft } })}>
        <AddressStep />
      </PersonalFlowContext>
    );
  }
  render(<Held />);
  return { actions, user: userEvent.setup() };
};

const offline: PersonalFeedback = { place: 'banner', tone: 'offline', title: shared.offlineTitle, text: shared.offlineText, next: 'retry' };
const wrongCode: PersonalFeedback = { place: 'field', field: 'code', text: m.wrongCode };

/** "Send a new code" rests for half a minute after a code has gone out; this lets that time pass. */
const waitOutCoolDown = () => act(() => void vi.advanceTimersByTime(30_000));

afterEach(() => void vi.useRealTimers());

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

  it('leaves for the business sign-up when that is chosen', async () => {
    const { actions, user } = setup(<TypeStep />);

    await user.click(screen.getByRole('radio', { name: new RegExp(m.typeBusiness) }));
    await press(m.continue);

    expect(actions.startBusiness).toHaveBeenCalledTimes(1);
    expect(actions.startPersonal).not.toHaveBeenCalled();
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

    expect(screen.getByLabelText(m.year)).toBeInvalid();
    expect(screen.getByLabelText(m.year)).toHaveAccessibleDescription(m.tooYoungForAccount);
    expect(screen.getByLabelText(m.year)).toHaveFocus();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByLabelText(m.day)).toHaveValue('14');
    expect(screen.getByLabelText(m.month)).toHaveValue('3');
    expect(screen.getByLabelText(m.gender)).toHaveValue('woman');
  });
});

describe('AddressStep', () => {
  it('shows the mail domain after the name and tells the flow what is typed, lower case with full stops for spaces', async () => {
    const { actions, user } = setupAddress();

    await user.type(screen.getByLabelText(m.addressLabel), 'Amara O');

    expect(screen.getByText('@yahel.example')).toBeInTheDocument();
    expect(screen.getByLabelText(m.addressLabel)).toHaveValue('amara.o');
    expect(actions.typeAddress).toHaveBeenLastCalledWith('amara.o');
  });

  it.each([
    ['', m.addressRequired],
    ['abc', m.addressTooShort],
    ['amara_o', m.addressCharacters],
    ['amara..o', m.addressDots],
  ])('holds back "%s"', async (typed, problem) => {
    const { actions, user } = setupAddress();

    if (typed) await user.type(screen.getByLabelText(m.addressLabel), typed);
    await press(m.continue);

    expect(screen.getByText(problem)).toBeInTheDocument();
    expect(actions.chooseAddress).not.toHaveBeenCalled();
  });

  it('says a free address is free and lets it be chosen', async () => {
    const { actions } = setupAddress({ state: { ...answered, addressCheck: { status: 'available', alternatives: [] } } });

    expect(screen.getByText(m.addressAvailable)).toBeInTheDocument();
    await press(m.continue);

    expect(actions.chooseAddress).toHaveBeenCalledWith('amara.okafor');
  });

  it('says a taken address is taken, nothing more, and will not choose it', async () => {
    const { actions } = setupAddress({ state: { ...answered, username: 'amara', addressCheck: { status: 'taken', alternatives: ['amara1', 'amara.mail'] } } });

    expect(screen.getByText(m.addressTaken)).toBeInTheDocument();
    expect(screen.queryByText(m.addressAvailable)).not.toBeInTheDocument();
    await press(m.continue);

    expect(actions.chooseAddress).not.toHaveBeenCalled();
  });

  it('fills in a free alternative with one press', async () => {
    const { actions } = setupAddress({ state: { ...answered, username: 'amara', addressCheck: { status: 'taken', alternatives: ['amara1', 'amara.mail'] } } });

    await userEvent.click(within(screen.getByRole('group', { name: m.alsoFree })).getByRole('button', { name: 'amara.mail' }));

    expect(screen.getByLabelText(m.addressLabel)).toHaveValue('amara.mail');
    expect(actions.typeAddress).toHaveBeenLastCalledWith('amara.mail');
  });

  it('says when it is checking, and lets the person continue when it could not check', async () => {
    const checking = setupAddress({ state: { ...answered, addressCheck: { status: 'checking', alternatives: [] } } });
    expect(screen.getByText(m.addressChecking)).toBeInTheDocument();
    cleanup();

    const { actions } = setupAddress({ state: { ...answered, addressCheck: { status: 'unknown', alternatives: [] } } });
    expect(screen.getByText(m.addressUnchecked)).toBeInTheDocument();
    await press(m.continue);

    expect(actions.chooseAddress).toHaveBeenCalledWith('amara.okafor');
    expect(checking.actions.chooseAddress).not.toHaveBeenCalled();
  });

  it('shows what the flow holds for the field, so the field and what is said about it agree', () => {
    setupAddress({ state: { ...answered, username: '', addressDraft: 'amara', addressCheck: { status: 'taken', alternatives: [] } } });

    expect(screen.getByLabelText(m.addressLabel)).toHaveValue('amara');
    expect(screen.getByText(m.addressTakenPlain)).toBeInTheDocument();
  });

  it('says the address was taken when creating the account found it so, until it is changed', async () => {
    const { user } = setupAddress({ state: { ...answered, rejection: { step: 'address', reason: 'taken' } } });
    expect(screen.getByText(m.addressTakenPlain)).toBeInTheDocument();

    await user.type(screen.getByLabelText(m.addressLabel), '1');

    expect(screen.queryByText(m.addressTakenPlain)).not.toBeInTheDocument();
  });

  it('offers an existing email instead', async () => {
    const { actions } = setupAddress();

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
    expect(screen.getByText('Use 8 or more characters, with a capital letter, a number and a symbol.')).toBeInTheDocument();

    await user.clear(field());
    // Once checked, the field is checked again on every key: emptied, it asks for a password (the words are also the step's heading).
    expect(field()).toBeInvalid();
    expect(screen.getAllByText(m.newPasswordRequired)).toHaveLength(2);
    await user.type(field(), 'sunrise over lekki 94{Enter}');
    // A space is a symbol, as the backend counts it.
    expect(screen.getByText('Add a capital letter.')).toBeInTheDocument();
    expect(actions.choosePassword).not.toHaveBeenCalled();
  });

  it('shows the strength in words as it is typed, and passes a good password on', async () => {
    const { actions, user } = setup(<PasswordStep />, { state: answered });

    await user.type(field(), 'Sunrise over Lekki 94');
    expect(screen.getByText(m.strength('Strong', 21))).toBeInTheDocument();
    await press(m.continue);

    expect(actions.choosePassword).toHaveBeenCalledWith('Sunrise over Lekki 94');
  });

  it('never puts a password already chosen back on screen: the field is empty, and leaving it empty keeps the password', async () => {
    const { actions } = setup(<PasswordStep />, { state: { ...answered, hasPassword: true } });

    expect(field()).toHaveValue('');
    expect(screen.getByRole('status')).toHaveTextContent(m.passwordKept);
    await press(m.continue);

    expect(actions.keepPassword).toHaveBeenCalledTimes(1);
    expect(actions.choosePassword).not.toHaveBeenCalled();
  });

  it('replaces a password already chosen when a new one is typed, by the same rule', async () => {
    const { actions, user } = setup(<PasswordStep />, { state: { ...answered, hasPassword: true } });

    await user.type(field(), 'short{Enter}');
    expect(screen.getByText(m.newPasswordTooShort('a capital letter, a number and a symbol'))).toBeInTheDocument();
    await user.clear(field());
    await user.type(field(), 'Harmattan in Jos 2026!{Enter}');

    expect(actions.choosePassword).toHaveBeenCalledWith('Harmattan in Jos 2026!');
    expect(actions.keepPassword).not.toHaveBeenCalled();
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

    rerender({ requests: { passkey: telling({ place: 'banner', tone: 'warning', text: m.passkeyFailed }) } });
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
    expect(screen.getByRole('link', { name: new RegExp(`^${m.agreement.privacy}`) })).toHaveAttribute('href', 'https://yahel.example/privacy');
  });

  it('opens the terms and the privacy policy in a new tab, so reading them does not lose the answers', () => {
    setup(<ReviewStep />, { state: answered });

    for (const name of [m.agreement.terms, m.agreement.privacy]) {
      const link = screen.getByRole('link', { name: new RegExp(`^${name} ?\\(${m.opensInNewTab}\\)$`) });
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    }
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
    const again = vi.fn();
    const { actions } = setup(<CreatingStep />, { state: creating('account'), requests: { create: telling(offline, { again }) } });

    const banner = screen.getByRole('alert');
    expect(banner).toHaveTextContent(shared.offlineTitle);
    expect(banner).toHaveTextContent(shared.offlineText);
    expect(screen.getByText(m.creatingFailedLede)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: m.backToReview })).toHaveAttribute('href', '/personal/review');

    // One "Try again", the step's own: the banner does not repeat it.
    expect(within(banner).queryByRole('button')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: m.tryAgain }));
    expect(actions.createAccount).toHaveBeenCalledTimes(1);
    expect(again).not.toHaveBeenCalled();
  });

  it('once the account exists, offers only another try: the answers are final', () => {
    setup(<CreatingStep />, { state: creating('signing-in', true), requests: { create: telling(offline) } });

    expect(screen.getByText(m.createdButUnfinished)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: m.backToReview })).not.toBeInTheDocument();
  });

  it('offers to start again from nothing, until the account exists', async () => {
    const { actions, rerender } = setup(<CreatingStep />, { state: creating('account'), requests: { create: telling(offline) } });

    await press(m.startAgain);
    expect(actions.startAgain).toHaveBeenCalledTimes(1);

    rerender({ state: creating('signing-in', true), requests: { create: telling(offline) } });
    expect(screen.queryByRole('button', { name: m.startAgain })).not.toBeInTheDocument();
  });

  it('does not say it is reserving an address the person already owns', () => {
    setup(<CreatingStep />, { state: { ...creating('account'), addressKind: 'own', address: 'amara@mail.example' }, requests: { create: pending } });

    expect(screen.getByText(m.creatingLedeOwnEmail('amara@mail.example'))).toBeInTheDocument();
    expect(screen.queryByText(/Reserving/)).not.toBeInTheDocument();
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
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const { actions, rerender } = setup(<OwnCodeStep />);

    // A code has just been sent, so the link waits, and says for how long.
    const waiting = screen.getByRole('button', { name: m.sendNewCodeIn('0:30') });
    expect(waiting).toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(waiting);
    expect(actions.resendEmailCode).not.toHaveBeenCalled();

    waitOutCoolDown();
    await press(m.sendNewCode);
    expect(actions.resendEmailCode).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: m.sendNewCodeIn('0:30') })).toBeInTheDocument();
    expect(screen.getByText(m.ownCodeHint)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: m.signInInstead })).toHaveAttribute('href', '/signin');

    // A wrong code is told beside the code, with focus on it; the confirmation of a resend is a toast, not part of the step.
    rerender({ state: { emailCodeResent: true }, requests: { confirmEmail: telling(wrongCode) } });
    expect(code()).toBeInvalid();
    expect(code()).toHaveAccessibleDescription(m.wrongCode);
    expect(code()).toHaveFocus();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByText(m.emailCodeAskedAgain)).not.toBeInTheDocument();
  });

  it('offers a way back to a different address, so a mistyped one does not strand the person', async () => {
    const { actions } = setup(<OwnCodeStep />, { state: { address: 'amra@mail.example' } });

    await press(m.useDifferentAddress);

    expect(actions.useDifferentAddress).toHaveBeenCalledTimes(1);
  });

  it('asks for the texted code, naming the masked number', async () => {
    const { actions, user } = setup(<CodeStep />, { state: answered });
    expect(screen.getByText(m.codeLede('+234 ••• ••• ••42'))).toBeInTheDocument();

    await user.type(code(), 'K9mP2r{Enter}');

    expect(actions.verifyPhone).toHaveBeenCalledWith('K9mP2r');
  });

  it('sends a new text or skips the phone, and shows progress while verifying', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const { actions, rerender } = setup(<CodeStep />, { state: answered });

    expect(screen.getByRole('button', { name: m.sendNewCodeIn('0:30') })).toHaveAttribute('aria-disabled', 'true');
    waitOutCoolDown();
    await press(m.sendNewCode);
    await press(m.skipForNow);
    expect(actions.resendPhoneCode).toHaveBeenCalledTimes(1);
    expect(actions.skipPhone).toHaveBeenCalledTimes(1);

    rerender({ state: { ...answered, phoneCodeResent: true }, requests: { verifyPhone: pending } });
    expect(screen.queryByText(m.newCodeSent)).not.toBeInTheDocument();
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
    expect(screen.queryByText(m.unsaved.phoneSkipped)).not.toBeInTheDocument();
    expect(screen.getByText(m.unsaved.passkey)).toBeInTheDocument();
    expect(screen.getByText(m.trustInvited('chidi.eze@personal.example'))).toBeInTheDocument();
    // What was not saved is a warning; the invitation is good news.
    expect(screen.getAllByRole('alert').map((notice) => [notice.getAttribute('data-tone'), notice.textContent])).toEqual([
      ['warning', m.unsaved.phone],
      ['warning', m.unsaved.passkey],
    ]);
    expect(screen.getByRole('status')).toHaveAttribute('data-tone', 'success');
    expect(screen.getByRole('status')).toHaveTextContent(m.trustInvited('chidi.eze@personal.example'));
    expect(screen.queryByRole('link', { name: new RegExp(m.trustTitle) })).not.toBeInTheDocument();
  });

  it('tells a phone whose code was skipped from one the server would not take', () => {
    setup(<ReadyStep />, { state: { ...answered, creation: { ...initialPersonalState.creation, unsaved: ['phoneSkipped'] } } });

    expect(screen.getByText(m.unsaved.phoneSkipped)).toBeInTheDocument();
    expect(screen.queryByText(m.unsaved.phone)).not.toBeInTheDocument();
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

    rerender({ state: answered, requests: { inviteContact: telling({ place: 'banner', tone: 'warning', title: shared.tooManyTitle, text: shared.tooManyText }) } });
    expect(screen.getByRole('alert')).toHaveTextContent(shared.tooManyTitle);
    expect(screen.getByRole('alert')).toHaveTextContent(shared.tooManyText);
  });
});

describe('feedback on the steps', () => {
  // The browser has its own opinion of an email field's value; what matters here is what the step has said.
  const markedWrong = (field: HTMLElement) => field.getAttribute('aria-invalid') === 'true';
  const mark = (label: string) => screen.getByLabelText(label).parentElement?.querySelector('svg') ?? null;

  it('sums up two or more problems above the form, and takes the summary away as they are fixed', async () => {
    const { user } = setup(<NameStep />);
    await user.type(screen.getByLabelText(m.firstName), 'A'.repeat(51));
    await user.type(screen.getByLabelText(m.lastName), 'O'.repeat(51));
    await press(m.continue);

    const summary = screen.getByRole('alert');
    expect(summary).toHaveTextContent(shared.thingsToFix(2));
    expect(summary).toHaveTextContent(`${m.firstName} and ${m.lastName}.`);
    expect(screen.getByLabelText(m.firstName)).toHaveFocus();

    await user.clear(screen.getByLabelText(m.lastName));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByLabelText(m.firstName)).toBeInvalid();
  });

  it('shows no summary for a single problem: the field says it', async () => {
    setup(<NameStep />);
    await press(m.continue);

    expect(screen.getByLabelText(m.firstName)).toHaveAccessibleDescription(m.firstNameRequired);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('names every part of a date that is wrong, in the order they are shown', async () => {
    setup(<BirthStep />);
    await press(m.continue);

    const summary = screen.getByText(shared.thingsToFix(3)).closest<HTMLElement>('[role="alert"]')!;
    for (const part of [m.day, m.month, m.year]) expect(summary).toHaveTextContent(part);
  });

  it('sums up a wrong phone number and a wrong recovery email', async () => {
    const { actions, user } = setup(<RecoveryStep />, { state: answered });
    await user.clear(screen.getByLabelText(m.mobileNumber));
    await user.type(screen.getByLabelText(m.mobileNumber), '12');
    await user.clear(screen.getByLabelText(m.recoveryEmail));
    await user.type(screen.getByLabelText(m.recoveryEmail), 'amara@');
    await press(m.continue);

    expect(screen.getByRole('alert')).toHaveTextContent(shared.thingsToFix(2));
    expect(screen.getByRole('alert')).toHaveTextContent(`${m.mobileNumber} and ${m.recoveryEmail}.`);
    expect(actions.enterRecovery).not.toHaveBeenCalled();
  });

  it('never shows a problem while a field is first typed in, checks it on leaving, then on every key', async () => {
    const { user } = setup(<OwnEmailStep />);
    const email = screen.getByLabelText(m.ownEmailLabel);

    await user.type(email, 'amara@');
    expect(markedWrong(email)).toBe(false);
    expect(mark(m.ownEmailLabel)).toBeNull();

    await user.tab();
    expect(markedWrong(email)).toBe(true);
    expect(email).toHaveAccessibleDescription(m.ownEmailInvalid);

    // Fixing it: the problem goes with the key that puts it right, and the tick arrives.
    await user.type(email, 'mail.example');
    expect(markedWrong(email)).toBe(false);
    expect(mark(m.ownEmailLabel)).not.toBeNull();

    await user.type(email, '{Backspace}'.repeat(12));
    expect(markedWrong(email)).toBe(true);
  });

  it('leaves a field alone that was only passed through', async () => {
    const { user } = setup(<OwnEmailStep />);
    screen.getByLabelText(m.ownEmailLabel).focus();
    await user.tab();

    expect(markedWrong(screen.getByLabelText(m.ownEmailLabel))).toBe(false);
  });

  it('ticks only fields with a format to get right, never a name', async () => {
    const { user } = setup(<NameStep />);
    await user.type(screen.getByLabelText(m.firstName), 'Amara');
    await user.tab();

    expect(screen.getByLabelText(m.firstName)).toBeValid();
    expect(mark(m.firstName)).toBeNull();
  });

  it('says the server would not take a kind of address beside the field, with focus on it, until the address is edited', async () => {
    const { user } = setup(<OwnEmailStep />, { state: { ownEmail: 'amara@northwind.example', rejection: { step: 'own-email', reason: 'not-personal' } } });
    const email = screen.getByLabelText(m.ownEmailLabel);

    expect(markedWrong(email)).toBe(true);
    expect(email).toHaveAccessibleDescription(m.ownEmailNotPersonal);
    expect(email).toHaveFocus();

    await user.type(email, 'x');
    expect(markedWrong(email)).toBe(false);
    expect(screen.queryByText(m.ownEmailNotPersonal)).not.toBeInTheDocument();
  });

  it('says a spent code no longer works above the form, and offers a new one there', async () => {
    const spent: PersonalFeedback = { place: 'banner', tone: 'danger', title: m.codeDeadTitle, text: m.tooManyCodes, next: 'resend' };
    const { actions } = setup(<CodeStep />, { state: answered, requests: { verifyPhone: telling(spent) } });

    const banner = screen.getByRole('alert');
    expect(banner).toHaveTextContent(m.codeDeadTitle);
    expect(banner).toHaveTextContent(m.tooManyCodes);
    await userEvent.click(within(banner).getByRole('button', { name: m.sendNewCode }));

    expect(actions.resendPhoneCode).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText(m.codeLabel)).toBeValid();
  });

  it('offers the review from a banner that says the details were refused', () => {
    const refused: PersonalFeedback = { place: 'banner', tone: 'danger', title: m.detailsRefusedTitle, text: m.detailsRefused, next: 'review' };
    setup(<CreatingStep />, { state: { ...answered, creation: { ...initialPersonalState.creation, started: true } }, requests: { create: telling(refused) } });

    expect(within(screen.getByRole('alert')).getByRole('link', { name: m.backToReview })).toHaveAttribute('href', '/personal/review');
  });

  it('gives the whole screen to a state the person cannot continue from, in place of the step', async () => {
    const again = vi.fn();
    setup(<CreatingStep />, { state: { ...answered, creation: { ...initialPersonalState.creation, started: true } }, requests: { create: telling({ place: 'screen', screen: 'maintenance' }, { again }) } });

    expect(screen.getByRole('heading', { level: 1, name: shared.maintenanceTitle })).toHaveFocus();
    expect(screen.queryByRole('heading', { name: m.creatingTitle })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: m.creatingFailedTitle })).not.toBeInTheDocument();
    expect(document.title).toBe(shared.pageTitle(shared.maintenanceTitle));
    await press(shared.tryAgain);

    expect(again).toHaveBeenCalledTimes(1);
  });

  it('sends someone whose session ended to sign in again, from any step', () => {
    setup(<ContactStep />, { state: answered, requests: { inviteContact: telling({ place: 'screen', screen: 'session-ended' }) } });

    expect(screen.getByRole('heading', { level: 1, name: shared.sessionEndedTitle })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: shared.signInAgain })).toHaveAttribute('href', '/signin');
    expect(screen.queryByLabelText(m.contactLabel)).not.toBeInTheDocument();
  });

  it('explains a long wait under the button, and stops when the wait is over', () => {
    vi.useFakeTimers();
    const { rerender } = setup(<CodeStep />, { state: answered, requests: { verifyPhone: pending } });
    expect(screen.queryByText(shared.slow)).not.toBeInTheDocument();

    act(() => void vi.advanceTimersByTime(1200));
    expect(screen.getByRole('status')).toHaveTextContent(shared.slow);

    rerender({ state: answered });
    expect(screen.queryByText(shared.slow)).not.toBeInTheDocument();
  });
});
