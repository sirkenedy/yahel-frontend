import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { OrderQuote, WorkspacePlan } from '@yahel/api-client';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { flowMessages as fm } from '../../../flow/messages';
import { BusinessFlowContext } from '../business-flow';
import type { BusinessFlowValue } from '../business-flow';
import type { BusinessFeedback } from '../feedback';
import { initialBusinessState } from '../machine';
import { businessMessages as m } from '../messages';
import { AdminStep } from './admin-step';
import { CardCodeStep } from './card-code-step';
import { CheckoutStep } from './checkout-step';
import { CreatingStep } from './creating-step';
import { DomainOkStep } from './domain-ok-step';
import { DomainQuestionStep } from './domain-question-step';
import { DomainStep } from './domain-step';
import { FindStep } from './find-step';
import { PlanStep } from './plan-step';
import { ReadyStep } from './ready-step';
import { RegistrantStep } from './registrant-step';
import { StartStep } from './start-step';
import { YouStep } from './you-step';

type Request = BusinessFlowValue['meta']['requests']['pay'];
const idle: Request = { isPending: false, feedback: null, clear: () => undefined };
const failing = (feedback: BusinessFeedback, more: Partial<Request> = {}): Request => ({ ...idle, feedback, ...more });
const naira = (amount: number) => ({ amount: amount * 100, currency: 'NGN' });
const password = 'Northwind Lagos 2026!';

const plan: WorkspacePlan = { id: 'business', name: 'Yahel Business', features: ['Mail on your own domain', '30 GB storage per person'], seatPrice: { monthly: naira(5000), yearly: naira(4200) }, yearlySaving: 16, trial: { days: 14, maxSeats: 10 }, taxRate: 7.5, enterpriseFrom: 300 };
const trialQuote: OrderQuote = {
  period: 'monthly',
  seats: 3,
  trial: true,
  promo: null,
  seatPrice: naira(5000),
  discountedSeatPrice: null,
  planToday: naira(15_000),
  schedule: [
    { from: null, kind: 'trial', amount: naira(0), per: null, discount: null, billedYearly: null },
    { from: '2026-12-05', kind: 'plan', amount: naira(15_000), per: 'month', discount: null, billedYearly: null },
  ],
  domain: null,
  dueToday: naira(0),
  taxRate: 7.5,
};
const paidQuote: OrderQuote = { ...trialQuote, seats: 12, trial: false, planToday: naira(60_000), dueToday: naira(60_000), schedule: [{ from: null, kind: 'first-period', amount: naira(60_000), per: 'month', discount: null, billedYearly: null }] };
const address = { street: '12 Admiralty Way', street2: '', city: 'Lekki', state: 'Lagos', localArea: '', postalCode: '106104', phoneCountry: 'NG', phone: '803 555 0142' };
const offers = [
  { domain: 'northwindstudio.com', yearly: naira(18_500), bestMatch: true },
  { domain: 'northwindstudio.ng', yearly: naira(9_000), bestMatch: false },
];

type State = BusinessFlowValue['state'];
type Overrides = { state?: Partial<State>; offers?: Partial<BusinessFlowValue['meta']['offers']>; requests?: Partial<BusinessFlowValue['meta']['requests']>; links?: Partial<BusinessFlowValue['meta']['links']>; backHref?: string | null };

const fakeActions = () => ({
  enterBusiness: vi.fn(), enterYou: vi.fn(), chooseDomainSource: vi.fn(), checkDomain: vi.fn(), confirmDomain: vi.fn(), buyInstead: vi.fn(), ownInstead: vi.fn(), typeSearch: vi.fn(), pickDomain: vi.fn(), continueWithDomain: vi.fn(),
  enterAddress: vi.fn(), enterAdmin: vi.fn(), choosePeriod: vi.fn(), applyPromo: vi.fn(), removePromo: vi.fn(), choosePlan: vi.fn(), chooseSeats: vi.fn(), edit: vi.fn(), pay: vi.fn(), confirmCard: vi.fn(), resendCardCode: vi.fn(),
  useDifferentCard: vi.fn(), createWorkspace: vi.fn(), startAgain: vi.fn(), retryPricing: vi.fn(),
}); // prettier-ignore

const answered: Partial<State> = { businessName: 'Northwind Studio', size: 'small', firstName: 'Amara', lastName: 'Okafor', contactEmail: 'amara@mail.example', birth: { day: 14, month: 3, year: 1994 }, ownedDomain: 'northwind.example', ownedDomainConfirmed: true, domain: 'northwind.example', adminUser: 'amara', adminAddress: 'amara@northwind.example', hasPassword: true, planChosen: true };

const flowValue = (actions: BusinessFlowValue['actions'], { state, offers: offered, requests, links, backHref = null }: Overrides = {}): BusinessFlowValue => {
  return {
    state: { ...initialBusinessState, step: 'start', hasPassword: false, domain: '', adminAddress: '', seats: 3, offers: { status: 'idle', value: null }, plan: { status: 'ready', value: plan }, quote: { status: 'ready', value: trialQuote }, ...state },
    actions,
    meta: {
      direction: 'forward',
      backHref,
      progress: { current: 1, total: 6, part: 'business' },
      offers: { domainsForSale: true, billing: true, contactEmail: true, marketing: true, ...offered },
      links: { signIn: '/signin', adminSignIn: '/admin/signin', personal: '/personal', help: 'https://yahel.example/help', businessTerms: 'https://yahel.example/business-terms', trialTerms: null, domainTerms: null, ...links },
      screens: { account: null, exits: { signIn: '/signin' }, serviceStatus: null },
      requests: { checkDomain: idle, applyPromo: idle, create: idle, pay: idle, confirmCard: idle, resendCardCode: idle, ...requests },
    },
  };
};

const setup = (ui: ReactElement, overrides: Overrides = {}) => {
  const actions = fakeActions();
  const { container } = render(
    <QueryClientProvider client={new QueryClient()}>
      <BusinessFlowContext value={flowValue(actions, overrides)}>{ui}</BusinessFlowContext>
    </QueryClientProvider>,
  );
  return { actions, container, user: userEvent.setup() };
};
const press = (name: string | RegExp) => userEvent.click(screen.getByRole('button', { name }));
const field = (label: string) => screen.getByLabelText(label);

describe('StartStep', () => {
  it('asks for the business, its size and its country, and shows how far along the questions are', async () => {
    const { actions, user } = setup(<StartStep />);
    expect(screen.getByRole('heading', { level: 1, name: m.startTitle })).toBeInTheDocument();
    expect(screen.getByText(/^01 \/ 06 · Your business$/)).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: m.sizes.medium })).toBeChecked();
    expect(field(m.country)).toHaveValue('NG');
    expect(field(m.businessName)).toHaveAttribute('autocomplete', 'organization');

    await user.type(field(m.businessName), ' Northwind Studio ');
    await user.click(screen.getByRole('radio', { name: m.sizes.small }));
    await user.selectOptions(field(m.country), 'Kenya');
    await press(m.continue);

    expect(actions.enterBusiness).toHaveBeenCalledWith({ businessName: 'Northwind Studio', size: 'small', country: 'KE' });
  });

  it('refuses to go on without a name, beside the field', async () => {
    const { actions } = setup(<StartStep />);
    await press(m.continue);

    expect(field(m.businessName)).toHaveAccessibleDescription(m.businessNameRequired);
    expect(field(m.businessName)).toHaveFocus();
    expect(actions.enterBusiness).not.toHaveBeenCalled();
  });

  it('starts from what was answered before, and leads to a personal account instead', () => {
    setup(<StartStep />, { state: { businessName: 'Northwind Studio', size: 'huge', country: 'GH' } });

    expect(field(m.businessName)).toHaveValue('Northwind Studio');
    expect(screen.getByRole('radio', { name: m.sizes.huge })).toBeChecked();
    expect(field(m.country)).toHaveValue('GH');
    expect(screen.getByRole('link', { name: m.personalInstead })).toHaveAttribute('href', '/personal');
  });
});

describe('YouStep', () => {
  const fill = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.type(field(m.firstName), 'Amara');
    await user.type(field(m.contactEmail), 'amara@mail.example');
    await user.type(field(m.day), '14');
    await user.selectOptions(field(m.month), 'March');
    await user.type(field(m.year), '1994');
  };

  it('takes the name, a reachable email and the date of birth the backend requires', async () => {
    const { actions, user } = setup(<YouStep />, { state: { businessName: 'Northwind Studio' } });
    expect(screen.getByText(m.youLedeWithEmail)).toBeInTheDocument();
    await fill(user);
    await press(m.continue);

    expect(actions.enterYou).toHaveBeenCalledWith({ firstName: 'Amara', lastName: '', contactEmail: 'amara@mail.example', birth: { day: 14, month: 3, year: 1994 } });
  });

  it('sums up several problems above the form and names each beside its field', async () => {
    const { actions } = setup(<YouStep />);
    await press(m.continue);

    expect(screen.getByText(fm.thingsToFix(5))).toBeInTheDocument();
    expect(field(m.firstName)).toHaveAccessibleDescription(m.firstNameRequired);
    expect(field(m.contactEmail)).toHaveAccessibleDescription(new RegExp(m.contactEmailInvalid.replace(/[.]/g, '\\.')));
    expect(field(m.firstName)).toHaveFocus();
    expect(actions.enterYou).not.toHaveBeenCalled();
  });

  it('does not ask for an email where nothing would use it', async () => {
    const { actions, user } = setup(<YouStep />, { offers: { contactEmail: false } });
    expect(screen.queryByLabelText(m.contactEmail)).not.toBeInTheDocument();
    expect(screen.getByText(m.youLede)).toBeInTheDocument();

    await user.type(field(m.firstName), 'Amara');
    await user.type(field(m.day), '14');
    await user.selectOptions(field(m.month), 'March');
    await user.type(field(m.year), '1994');
    await press(m.continue);
    expect(actions.enterYou).toHaveBeenCalledWith(expect.objectContaining({ contactEmail: '' }));
  });

  it('says beside the year when the country does not allow the age given', () => {
    setup(<YouStep />, { state: { ...answered, rejection: { step: 'you', reason: 'underage' } } });

    expect(field(m.year)).toHaveAccessibleDescription(m.tooYoungForWorkspace);
    expect(field(m.year)).toHaveFocus();
  });
});

describe('DomainQuestionStep', () => {
  it('offers a domain already owned or one bought here, and goes on with the one chosen', async () => {
    const { actions, user } = setup(<DomainQuestionStep />);
    expect(screen.getByRole('radio', { name: new RegExp(m.ownDomain) })).toBeChecked();

    await user.click(screen.getByRole('radio', { name: new RegExp(m.buyDomain) }));
    await press(m.continue);
    expect(actions.chooseDomainSource).toHaveBeenCalledWith('bought');
  });
});

describe('DomainStep', () => {
  it('checks a domain that looks like one, tidied', async () => {
    const { actions, user } = setup(<DomainStep />);
    await user.type(field(m.domainLabel), ' Northwind.Example');
    await user.tab();
    expect(screen.getByRole('status')).toHaveTextContent(m.domainLooksGood);
    await press(m.continue);

    expect(actions.checkDomain).toHaveBeenCalledWith('northwind.example');
  });

  it('refuses what is not a domain without asking anyone', async () => {
    const { actions, user } = setup(<DomainStep />);
    await press(m.continue);
    expect(field(m.domainLabel)).toHaveAccessibleDescription(m.domainRequired);
    await user.type(field(m.domainLabel), 'northwind');
    expect(field(m.domainLabel)).toHaveAccessibleDescription(m.domainInvalid);
    expect(actions.checkDomain).not.toHaveBeenCalled();
  });

  it('tells a claimed domain beside the field and above the form, with two ways forward', () => {
    setup(<DomainStep />, { state: { ownedDomain: 'taken.example', rejection: { step: 'domain', reason: 'claimed' } } });

    expect(field(m.domainLabel)).toHaveAccessibleDescription(m.domainClaimed);
    const banner = screen.getByRole('alert');
    expect(banner).toHaveTextContent(m.domainClaimedTitle);
    expect(within(banner).getByRole('link', { name: m.resetAdminPassword })).toHaveAttribute('href', '/signin');
    expect(within(banner).getByRole('link', { name: m.contactSupport })).toHaveAttribute('href', 'https://yahel.example/help');
  });

  it('tells a public domain beside the field only, and offers support only where there is somewhere to send people', () => {
    const first = setup(<DomainStep />, { state: { ownedDomain: 'gmail.com', rejection: { step: 'domain', reason: 'public' } } });
    expect(field(m.domainLabel)).toHaveAccessibleDescription(m.domainPublic);
    expect(screen.queryByText(m.domainClaimedTitle)).not.toBeInTheDocument();
    first.container.remove();

    setup(<DomainStep />, { state: { rejection: { step: 'domain', reason: 'claimed' } }, links: { help: null } });
    expect(screen.queryByRole('link', { name: m.contactSupport })).not.toBeInTheDocument();
  });

  it('says it is checking, and offers a domain to buy only where one can be bought', async () => {
    const { actions } = setup(<DomainStep />, { requests: { checkDomain: { ...idle, isPending: true } } });
    expect(screen.getByRole('button', { name: m.checking })).toBeInTheDocument();
    await press(m.buyInstead);
    expect(actions.buyInstead).toHaveBeenCalledTimes(1);

    setup(<DomainStep />, { offers: { domainsForSale: false } });
    expect(screen.getAllByRole('button', { name: m.buyInstead })).toHaveLength(1);
  });
});

describe('DomainOkStep', () => {
  it('shows what the team’s addresses will look like and takes a yes', async () => {
    const { actions } = setup(<DomainOkStep />, { state: answered });
    expect(screen.getByRole('heading', { level: 1, name: m.domainOkTitle('Northwind Studio') })).toBeInTheDocument();
    expect(screen.getByText('you@northwind.example')).toBeInTheDocument();
    expect(screen.getByText(m.domainOkLede)).toBeInTheDocument();

    await press(m.useThisDomain);
    expect(actions.confirmDomain).toHaveBeenCalledTimes(1);
  });
});

describe('FindStep', () => {
  const found = { status: 'ready' as const, value: offers };

  it('lists what can be bought with its price, marks the best match, and reports each key typed', async () => {
    const { actions, user } = setup(<FindStep />, { state: { search: 'northwind studio', offers: found } });
    expect(screen.getByRole('radio', { name: 'northwindstudio.com Best match ₦18,500/yr' })).not.toBeChecked();
    expect(screen.getByRole('radio', { name: 'northwindstudio.ng ₦9,000/yr' })).toBeInTheDocument();
    expect(screen.getByText(m.resultsNote)).toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: /northwindstudio\.ng/ }));
    expect(actions.pickDomain).toHaveBeenCalledWith(offers[1]);
    await user.type(field(m.searchLabel), 's');
    expect(actions.typeSearch).toHaveBeenLastCalledWith('northwind studios');
  });

  it('asks for a choice before going on, and goes on once there is one', async () => {
    const first = setup(<FindStep />, { state: { search: 'northwind', offers: found } });
    await press(m.continue);
    expect(field(m.searchLabel)).toHaveAccessibleDescription(m.chooseDomain);
    expect(field(m.searchLabel)).toHaveFocus();
    expect(first.actions.continueWithDomain).not.toHaveBeenCalled();
    first.container.remove();

    const { actions } = setup(<FindStep />, { state: { search: 'northwind', offers: found, bought: offers[0]!, domainSource: 'bought' } });
    expect(screen.getByRole('radio', { name: /northwindstudio\.com/ })).toBeChecked();
    await press(m.continue);
    expect(actions.continueWithDomain).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['loading', m.searching],
    ['failed', m.searchFailed],
    ['idle', m.noResults],
  ] as const)('says so while the search is %s', (status, words) => {
    setup(<FindStep />, { state: { offers: { status, value: null } } });
    expect(screen.getByText(words)).toBeInTheDocument();
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
  });

  it('says when the domain picked has gone, and leads to a domain already owned', async () => {
    const { actions } = setup(<FindStep />, { state: { offers: found, rejection: { step: 'find', reason: 'claimed' } } });
    expect(screen.getByRole('alert')).toHaveTextContent(m.pickedDomainGone);
    await press(m.ownInstead);
    expect(actions.ownInstead).toHaveBeenCalledTimes(1);
  });
});

describe('RegistrantStep', () => {
  const buying: Partial<State> = { ...answered, domainSource: 'bought', bought: offers[0]!, domain: 'northwindstudio.com' };

  it('takes the registrant’s address for a domain bought here, with privacy protection said plainly', async () => {
    const { actions, user } = setup(<RegistrantStep />, { state: buying });
    expect(screen.getByRole('heading', { level: 1, name: m.registrantTitle('northwindstudio.com') })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(m.privacyOn('northwindstudio.com'));
    expect(field(m.phoneCountry)).toHaveValue('NG');

    await user.type(field(m.street), '12 Admiralty Way');
    await user.type(field(m.city), 'Lekki');
    await user.selectOptions(field(m.state), 'Lagos');
    await user.type(field(m.phone), '803 555 0142');
    await press(m.moreAddress);
    await user.type(field(m.localArea), 'Eti-Osa');
    await user.type(field(m.postalCode), '106104');
    await press(m.continue);

    expect(actions.enterAddress).toHaveBeenCalledWith({ street: '12 Admiralty Way', street2: '', city: 'Lekki', state: 'Lagos', localArea: 'Eti-Osa', postalCode: '106104', phoneCountry: 'NG', phone: '803 555 0142' });
  });

  it('names every missing part, and words the state for the country', async () => {
    const { actions } = setup(<RegistrantStep />, { state: { ...buying, country: 'KE' } });
    await press(m.continue);

    expect(screen.getByRole('alert')).toHaveTextContent(fm.thingsToFix(4));
    expect(field(m.street)).toHaveAccessibleDescription(m.streetRequired);
    expect(field(m.region)).toHaveAccessibleDescription(m.regionRequired);
    expect(field(m.phone)).toHaveAccessibleDescription(m.phoneInvalid);
    expect(screen.queryByLabelText(m.localArea)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: m.moreAddressElsewhere })).toHaveAttribute('aria-expanded', 'false');
    expect(actions.enterAddress).not.toHaveBeenCalled();
  });

  it('is the business’s address, saved from checkout, when the domain is one it owns', () => {
    setup(<RegistrantStep />, { state: { ...answered, address } });

    expect(screen.getByRole('heading', { level: 1, name: m.addressTitle })).toBeInTheDocument();
    expect(screen.getByText(m.addressLede)).toBeInTheDocument();
    expect(field(m.street)).toHaveValue('12 Admiralty Way');
    expect(field(m.postalCode)).toHaveValue('106104');
    expect(screen.getByRole('button', { name: m.saveAddress })).toBeInTheDocument();
    expect(screen.queryByText(/Privacy protection/)).not.toBeInTheDocument();
  });
});

describe('AdminStep', () => {
  it('suggests a username on the domain, takes a password twice and the two choices, and says what continuing agrees to', async () => {
    const { actions, user } = setup(<AdminStep />, { state: { ...answered, adminUser: '', hasPassword: false } });
    expect(field(m.username)).toHaveValue('amara');
    expect(screen.getByText('@northwind.example')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: new RegExp(m.businessAgreement) })).toHaveAttribute('href', 'https://yahel.example/business-terms');
    expect(screen.getByText(new RegExp(m.trialTerms))).toBeInTheDocument();
    for (const label of [m.password, m.confirmPassword]) expect(field(label)).toHaveAttribute('autocomplete', 'new-password');

    await user.type(field(m.password), password);
    expect(screen.getByText(m.strength('Strong', password.length))).toBeInTheDocument();
    await user.type(field(m.confirmPassword), password);
    await user.click(screen.getByRole('checkbox', { name: m.productNews }));
    await press(m.agreeAndContinue);

    expect(actions.enterAdmin).toHaveBeenCalledWith({ adminUser: 'amara', password, marketing: { productNews: true, teamTips: false } });
  });

  it('refuses a username that is not one, a weak password and a different second password', async () => {
    const { actions, user } = setup(<AdminStep />, { state: { ...answered, hasPassword: false } });
    await user.clear(field(m.username));
    await user.type(field(m.username), 'a.');
    await user.type(field(m.password), 'short');
    await user.type(field(m.confirmPassword), 'other');
    await press(m.agreeAndContinue);

    expect(screen.getByRole('alert')).toHaveTextContent(fm.thingsToFix(3));
    expect(field(m.username)).toHaveAccessibleDescription(m.usernameInvalid);
    expect(field(m.password)).toHaveAccessibleDescription(new RegExp('Use 8 or more characters'));
    expect(field(m.confirmPassword)).toHaveAccessibleDescription(m.confirmMismatch);
    expect(actions.enterAdmin).not.toHaveBeenCalled();
  });

  it('never shows a password already chosen: empty fields keep it, a new one replaces it', async () => {
    const { actions, user } = setup(<AdminStep />, { state: answered });
    expect(field(m.password)).toHaveValue('');
    expect(screen.getByRole('status')).toHaveTextContent(m.passwordKept);
    await press(m.agreeAndContinue);
    expect(actions.enterAdmin).toHaveBeenLastCalledWith({ adminUser: 'amara', password: null, marketing: { productNews: false, teamTips: false } });

    await user.type(field(m.password), password);
    await press(m.agreeAndContinue);
    expect(field(m.confirmPassword)).toHaveAccessibleDescription(m.confirmRequired);
    expect(actions.enterAdmin).toHaveBeenCalledTimes(1);
  });

  it('says an address is taken beside the username, with the way to sign in, and never whose it is', () => {
    setup(<AdminStep />, { state: { ...answered, rejection: { step: 'admin', reason: 'taken' } } });

    expect(field(m.username)).toHaveAccessibleDescription(new RegExp(m.usernameTaken.replace(/[.]/g, '\\.')));
    expect(screen.getByRole('link', { name: m.signInInstead })).toHaveAttribute('href', '/signin');
  });

  it('without a checkout, creates the workspace from here and asks for nothing that has nowhere to go', () => {
    setup(<AdminStep />, { state: answered, offers: { billing: false, marketing: false }, links: { businessTerms: null } });

    expect(screen.getByRole('button', { name: m.agreeAndCreate })).toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    expect(screen.queryByText(new RegExp(m.trialTerms))).not.toBeInTheDocument();
    expect(screen.getByText(new RegExp(m.businessAgreement)).closest('a')).toBeNull();
  });
});

describe('PlanStep', () => {
  it('shows the plan as the server sells it, the trial it comes with, and goes on to checkout', async () => {
    const { actions, user } = setup(<PlanStep />, { state: answered });
    expect(screen.getByRole('heading', { level: 1, name: m.planTitleTrial(14) })).toBeInTheDocument();
    const card = screen.getByRole('group', { name: 'Yahel Business' });
    expect(card).toHaveTextContent('₦5,000');
    expect(card).toHaveTextContent(m.perPersonMonth);
    expect(within(card).getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByRole('radio', { name: `${m.yearly} ${m.save(16)}` })).not.toBeChecked();
    expect(screen.getByRole('link', { name: m.enterprise(300) })).toHaveAttribute('href', 'https://yahel.example/help');

    await user.click(screen.getByRole('radio', { name: /Yearly/ }));
    expect(actions.choosePeriod).toHaveBeenCalledWith('yearly');
    await press(m.toCheckout);
    expect(actions.choosePlan).toHaveBeenCalledTimes(1);
  });

  it('shows the yearly price when that is chosen, and says when the team is too big for the trial', () => {
    setup(<PlanStep />, { state: { ...answered, period: 'yearly', seats: 12, quote: { status: 'ready', value: { ...paidQuote, period: 'yearly' } } } });

    expect(screen.getByRole('heading', { level: 1, name: m.planTitle('Yahel Business') })).toBeInTheDocument();
    expect(screen.getByText(m.planLede(10))).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Yahel Business' })).toHaveTextContent('₦4,200');
  });

  it('takes a promo code with a press or with Enter, without leaving for checkout', async () => {
    const { actions, user } = setup(<PlanStep />, { state: answered });
    await press(m.addPromo);
    await press(m.apply);
    expect(field(m.promoLabel)).toHaveAccessibleDescription(m.promoRequired);

    await user.type(field(m.promoLabel), ' launch{Enter}');
    expect(actions.applyPromo).toHaveBeenCalledWith('launch');
    expect(actions.choosePlan).not.toHaveBeenCalled();
  });

  it('says beside the field when a code is refused, and shows an applied one with the price it gives', async () => {
    const first = setup(<PlanStep />, { state: answered, requests: { applyPromo: failing({ place: 'field', field: 'promo', text: m.promoInvalid }) } });
    await press(m.addPromo);
    expect(field(m.promoLabel)).toHaveAccessibleDescription(m.promoInvalid);
    first.container.remove();

    const promo = { code: 'LAUNCH', percent: 20, months: 3 };
    const { actions } = setup(<PlanStep />, { state: { ...answered, promo, quote: { status: 'ready', value: { ...trialQuote, promo, discountedSeatPrice: naira(4000) } } } });
    const card = screen.getByRole('group', { name: 'Yahel Business' });
    expect(card).toHaveTextContent('Was ₦5,000');
    expect(card).toHaveTextContent('₦4,000');
    expect(card).toHaveTextContent(m.promoApplied('LAUNCH', 20, 3));
    await press(m.removePromo('LAUNCH'));
    expect(actions.removePromo).toHaveBeenCalledTimes(1);
  });

  it('invents no plan when the prices have not come: it says so and asks again on request', async () => {
    const first = setup(<PlanStep />, { state: { ...answered, plan: { status: 'loading', value: null } } });
    expect(screen.getByText(m.planLoading)).toBeInTheDocument();
    expect(screen.queryByText(/₦/)).not.toBeInTheDocument();
    first.container.remove();

    const { actions } = setup(<PlanStep />, { state: { ...answered, plan: { status: 'failed', value: null } } });
    expect(screen.getByRole('alert')).toHaveTextContent(m.planUnavailableTitle);
    await press(m.tryAgain);
    expect(actions.retryPricing).toHaveBeenCalledTimes(1);
  });
});

describe('CheckoutStep', () => {
  const ready: Partial<State> = { ...answered, address };
  const fillCard = async (user: ReturnType<typeof userEvent.setup>, number = '4084084084084081') => {
    await user.type(field(m.cardNumber), number);
    await user.type(field(m.expiry), '0831');
    await user.type(field(m.securityCode), '737');
  };

  it('shows the order as the server priced it, what was answered, and the trial’s terms', () => {
    setup(<CheckoutStep />, { state: ready });
    const summary = screen.getByRole('group', { name: m.orderSummary });
    expect(summary).toHaveTextContent('Monthly plan · 3 people');
    expect(within(summary).getAllByRole('listitem').map((item) => item.textContent)).toEqual(['TodayFree trial starts₦0', 'From 5 Dec 2026Monthly plan₦15,000 / month']);
    expect(summary).toHaveTextContent('Due today₦0 + VAT');
    expect(summary).toHaveTextContent(m.seatsNote(3, 7.5));
    expect(screen.getByText(m.checkoutLedeTrial('5 Dec 2026'))).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: '3' })).toBeChecked();

    const recap = screen.getByRole('group', { name: m.yourOrder });
    expect(recap).toHaveTextContent('Northwind Studio2–9 people · Nigeria');
    expect(recap).toHaveTextContent(`northwind.example${m.domainOwned}`);
    expect(recap).toHaveTextContent('amara@northwind.example');
    expect(recap).toHaveTextContent('12 Admiralty Way, Lekki, Lagos, 106104');
    expect(screen.getByRole('button', { name: m.startTrial })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(m.demoPayment);
  });

  it('hands the card to the flow once, formatted as typed, with the right hints for the browser', async () => {
    const { actions, user } = setup(<CheckoutStep />, { state: ready });
    for (const [label, autocomplete] of [[m.cardNumber, 'cc-number'], [m.expiry, 'cc-exp'], [m.securityCode, 'cc-csc'], [m.nameOnCard, 'cc-name']] as const) expect(field(label)).toHaveAttribute('autocomplete', autocomplete);
    for (const label of [m.cardNumber, m.expiry, m.securityCode]) expect(field(label)).toHaveAttribute('inputmode', 'numeric');
    expect(field(m.nameOnCard)).toHaveValue('Amara Okafor');

    await fillCard(user);
    expect(field(m.cardNumber)).toHaveValue('4084 0840 8408 4081');
    expect(field(m.expiry)).toHaveValue('08/31');
    expect(screen.getByText('Visa')).toBeInTheDocument();
    await press(m.startTrial);

    expect(actions.pay).toHaveBeenCalledTimes(1);
    expect(actions.pay).toHaveBeenCalledWith({ number: '4084 0840 8408 4081', expiry: '08/31', securityCode: '737', name: 'Amara Okafor' });
  });

  it('refuses a card that cannot be right and a missing address, and pays for nothing', async () => {
    const { actions, user } = setup(<CheckoutStep />, { state: answered });
    await user.type(field(m.cardNumber), '4084084084084082');
    await user.type(field(m.expiry), '0120');
    await user.type(field(m.securityCode), '12');
    await user.clear(field(m.nameOnCard));
    await press(m.startTrial);

    expect(field(m.cardNumber)).toHaveAccessibleDescription(new RegExp(m.cardNumberInvalid.replace('.', '\\.')));
    expect(field(m.expiry)).toHaveAccessibleDescription(new RegExp(m.expired.replace('.', '\\.')));
    expect(field(m.securityCode)).toHaveAccessibleDescription(new RegExp(m.securityCodeInvalid.replace('.', '\\.')));
    expect(field(m.nameOnCard)).toHaveAccessibleDescription(m.nameOnCardRequired);
    expect(screen.getAllByRole('alert').map((alert) => alert.textContent)).toEqual(expect.arrayContaining([expect.stringContaining(m.addressRequired) as string]));
    expect(actions.pay).not.toHaveBeenCalled();

    await press(m.addAddress);
    expect(actions.edit).toHaveBeenCalledWith('address');
  });

  it('does not pay without an address even when the card is fine', async () => {
    const { actions, user } = setup(<CheckoutStep />, { state: answered });
    await fillCard(user);
    await press(m.startTrial);

    expect(screen.getByRole('alert')).toHaveTextContent(m.addressRequired);
    expect(actions.pay).not.toHaveBeenCalled();
  });

  it('changes how many people with a chip, and takes a larger team as a number', async () => {
    const { actions, user } = setup(<CheckoutStep />, { state: ready });
    await user.click(screen.getByRole('radio', { name: '7' }));
    expect(actions.chooseSeats).toHaveBeenLastCalledWith(7);
    await user.click(screen.getByRole('radio', { name: m.moreSeats(11) }));
    expect(actions.chooseSeats).toHaveBeenLastCalledWith(11);
  });

  it('for a team too big for the trial, says what is due today and offers the trial with ten', async () => {
    const { actions, user } = setup(<CheckoutStep />, { state: { ...ready, seats: 12, quote: { status: 'ready', value: paidQuote } } });
    expect(screen.getByRole('radio', { name: m.moreSeats(11) })).toBeChecked();
    expect(field(m.seatsMoreLabel)).toHaveValue('12');
    const notice = screen.getByRole('alert');
    expect(notice).toHaveTextContent(m.noTrialTitle(10));
    expect(notice).toHaveTextContent(m.noTrialText(12, '₦60,000', 14));
    expect(screen.getByRole('button', { name: m.payAndStart('₦60,000') })).toBeInTheDocument();
    expect(screen.getByText(m.checkoutLede(10))).toBeInTheDocument();

    await user.clear(field(m.seatsMoreLabel));
    await user.type(field(m.seatsMoreLabel), '25');
    expect(actions.chooseSeats).toHaveBeenLastCalledWith(25);
    await user.clear(field(m.seatsMoreLabel));
    await user.type(field(m.seatsMoreLabel), '4');
    await user.tab();
    expect(field(m.seatsMoreLabel)).toHaveAccessibleDescription(m.seatsMoreInvalid(11));

    await press(m.tryWith(10));
    expect(actions.chooseSeats).toHaveBeenLastCalledWith(10);
  });

  it('adds a domain bought here to the order, to what is due and to what paying agrees to', () => {
    const domain = { name: 'northwindstudio.com', yearly: naira(18_500) };
    setup(<CheckoutStep />, { state: { ...ready, domainSource: 'bought', domain: domain.name, quote: { status: 'ready', value: { ...trialQuote, domain, dueToday: naira(18_500) } } } });

    const summary = screen.getByRole('group', { name: m.orderSummary });
    expect(summary).toHaveTextContent('northwindstudio.com');
    expect(summary).toHaveTextContent('₦18,500 / year');
    expect(screen.getByRole('button', { name: m.payAndStartTrial('₦18,500') })).toBeInTheDocument();
    expect(screen.getByText(new RegExp(m.domainAgreement))).toBeInTheDocument();
    expect(screen.getByRole('group', { name: m.yourOrder })).toHaveTextContent(m.domainBought);
  });

  it('leads back to each answer from its line, and to the plan from the summary', async () => {
    const { actions } = setup(<CheckoutStep />, { state: ready });
    for (const [name, row] of [[m.editBusiness, 'business'], [m.editDomain, 'domain'], [m.editAdmin, 'admin'], [m.editAddress, 'address'], [m.changePlan, 'plan']] as const) {
      await press(name);
      expect(actions.edit).toHaveBeenLastCalledWith(row);
    }
  });

  it('tells a declined card above the form, and says it is checking the card while it is', () => {
    setup(<CheckoutStep />, { state: ready, requests: { pay: failing({ place: 'banner', tone: 'danger', title: m.cardDeclinedTitle, text: m.cardDeclined }, { isPending: true }) } });

    expect(screen.getByRole('alert')).toHaveTextContent(m.cardDeclinedTitle);
    expect(screen.getByRole('button', { name: m.checkingCard })).toBeInTheDocument();
  });

  it('shows no price and takes no card while the order has not been priced', () => {
    setup(<CheckoutStep />, { state: { ...ready, quote: { status: 'loading', value: null } } });

    expect(screen.getByText(m.planLoading)).toBeInTheDocument();
    expect(screen.queryByLabelText(m.cardNumber)).not.toBeInTheDocument();
  });
});

describe('CardCodeStep', () => {
  const paying: Partial<State> = { ...answered, payment: { id: 'pay_1', card: { brand: 'Visa', lastFour: '4081' }, sentTo: '••• ••• ••42', authorised: false } };

  it('names the card by its last four digits, says where the bank sent its code, and submits six digits', async () => {
    const { actions, user } = setup(<CardCodeStep />, { state: paying });
    expect(screen.getByText(m.cardEnding('Visa', '4081'))).toBeInTheDocument();
    expect(screen.getByText(m.cardCodeLedeTrial('••• ••• ••42'))).toBeInTheDocument();
    expect(field(m.cardCodeLabel)).toHaveAttribute('autocomplete', 'one-time-code');
    expect(field(m.cardCodeLabel)).toHaveAttribute('inputmode', 'numeric');

    await user.type(field(m.cardCodeLabel), '48a2913');
    await press(m.confirm);
    expect(actions.confirmCard).toHaveBeenCalledWith('482913');
  });

  it('says the amount the bank is approving when something is due, and falls back when the bank named no number', () => {
    setup(<CardCodeStep />, { state: { ...paying, payment: { ...paying.payment!, sentTo: null, card: { brand: null, lastFour: '4081' } }, quote: { status: 'ready', value: paidQuote } } });

    expect(screen.getByText(m.cardCodeLede(m.bankPhone, '₦60,000'))).toBeInTheDocument();
    expect(screen.getByText('Card ending in 4081')).toBeInTheDocument();
  });

  it('asks for all six digits, and shows a refused code beside the boxes', async () => {
    const first = setup(<CardCodeStep />, { state: paying });
    await press(m.confirm);
    expect(field(m.cardCodeLabel)).toHaveAccessibleDescription(m.cardCodeIncomplete);
    expect(first.actions.confirmCard).not.toHaveBeenCalled();
    first.container.remove();

    setup(<CardCodeStep />, { state: paying, requests: { confirmCard: failing({ place: 'field', field: 'code', text: m.bankCodeExpired }) } });
    expect(field(m.cardCodeLabel)).toHaveAccessibleDescription(m.bankCodeExpired);
  });

  it('offers a new code when the old one is dead, and another card at any time', async () => {
    const { actions } = setup(<CardCodeStep />, { state: paying, requests: { confirmCard: failing({ place: 'banner', tone: 'danger', title: m.bankCodeDeadTitle, text: m.bankCodeDead, next: 'resend' }) } });
    await userEvent.click(within(screen.getByRole('alert')).getByRole('button', { name: m.sendNewCode }));
    expect(actions.resendCardCode).toHaveBeenCalledTimes(1);

    await press(m.differentCard);
    expect(actions.useDifferentCard).toHaveBeenCalledTimes(1);
  });
});

describe('CreatingStep', () => {
  const creating: Partial<State> = { ...answered, creation: { started: true, created: false, tenantId: null, settled: false, finished: false } };

  it('says what is being made while it is', () => {
    setup(<CreatingStep />, { state: creating, requests: { create: { ...idle, isPending: true } } });

    expect(screen.getByRole('heading', { level: 1, name: m.creatingTitle('Northwind Studio') })).toBeInTheDocument();
    expect(screen.getByText(m.creatingLede('amara@northwind.example'))).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(m.almostThere);
    expect(screen.queryByText(m.nothingHappening)).not.toBeInTheDocument();
  });

  it('says so when nothing is happening', () => {
    setup(<CreatingStep />, { state: creating });
    expect(screen.getByRole('alert')).toHaveTextContent(m.nothingHappening);
  });

  it('after a failure offers another try, the way back and a fresh start, and says a card approved was not charged', async () => {
    const failed = failing({ place: 'banner', tone: 'danger', title: fm.serverErrorTitle, text: fm.serverErrorText, next: 'retry' });
    const { actions } = setup(<CreatingStep />, { state: { ...creating, payment: { id: 'pay_1', card: { brand: 'Visa', lastFour: '4081' }, sentTo: null, authorised: true } }, requests: { create: failed } });
    expect(screen.getByRole('heading', { level: 1, name: m.creatingFailedTitle })).toBeInTheDocument();
    expect(screen.getByText(m.creatingFailedPaid)).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(fm.serverErrorTitle);
    expect(screen.getByRole('link', { name: m.backToCheckout })).toHaveAttribute('href', '/business/checkout');
    // The banner's own retry is left out: the step's button is the retry.
    expect(screen.getAllByRole('button', { name: m.tryAgain })).toHaveLength(1);

    await press(m.tryAgain);
    expect(actions.createWorkspace).toHaveBeenCalledTimes(1);
    await press(m.startAgain);
    expect(actions.startAgain).toHaveBeenCalledTimes(1);
  });

  it('once the workspace exists, offers only to finish, and without a checkout leads back to the admin sign-in', () => {
    const failed = failing({ place: 'banner', tone: 'offline', title: fm.unreachableTitle, text: fm.unreachableText, next: 'retry' });
    const first = setup(<CreatingStep />, { state: { ...creating, creation: { ...creating.creation!, created: true } }, requests: { create: failed } });
    expect(screen.getByText(m.createdButUnfinished)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: m.backToCheckout })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: m.startAgain })).not.toBeInTheDocument();
    first.container.remove();

    setup(<CreatingStep />, { state: creating, requests: { create: failed }, offers: { billing: false } });
    expect(screen.getByText(m.creatingFailedLede)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: m.backToAdmin })).toHaveAttribute('href', '/business/admin');
  });

  it('gives way to a whole-screen state when the service is down', () => {
    setup(<CreatingStep />, { state: creating, requests: { create: failing({ place: 'screen', screen: 'maintenance' }) } });
    expect(screen.getByRole('heading', { level: 1, name: fm.maintenanceTitle })).toBeInTheDocument();
  });
});

describe('ReadyStep', () => {
  it('names the workspace and the administrator’s sign-in, says a code will be asked for, and leads to signing in', () => {
    setup(<ReadyStep />, { state: { ...answered, creation: { started: true, created: true, tenantId: 't1', settled: true, finished: true } } });

    expect(screen.getByRole('heading', { level: 1, name: m.readyTitle('Northwind Studio') })).toBeInTheDocument();
    expect(screen.getByText(m.readyLede)).toBeInTheDocument();
    expect(screen.getByText('amara@northwind.example')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(m.readyCodeNote('amara@northwind.example'));
    expect(screen.getByRole('link', { name: m.signInToAdmin })).toHaveAttribute('href', '/admin/signin');
    expect(screen.queryByRole('link', { name: m.back })).not.toBeInTheDocument();
  });
});
