import { expect, test } from './support/test';
import type { Page } from '@playwright/test';
import { at, chooseCountry, fillMobile, signInWithPassword, stubPasskeys, visit } from './support/accounts';
import { claimedDomain, credentials, mockApi, phoneCode, publicEmailDomain, takenAddress } from './support/api';
import { business, card, createWorkspaceTo, fillAddress, fillCard, heading, proceed } from './support/business';
import { stubAdmin } from './support/admin';

type Api = Awaited<ReturnType<typeof mockApi>>;
const registrations = (api: Api) => api.calls.filter((call) => call.path === '/v1/auth/register-business');
const sentBy = (api: Api, index = 0) => registrations(api)[index]!.body as Record<string, unknown>;
const calls = (api: Api, path: string) => api.calls.filter((call) => call.path === path);
const alert = (page: Page, text: string | RegExp) => page.getByRole('alert').filter({ hasText: text });
const summary = (page: Page) => page.getByRole('group', { name: 'Order summary' });
/** Everything the page keeps outside memory, to search for things that must never be kept. */
const stored = (page: Page) => page.evaluate(() => JSON.stringify([{ ...localStorage }, { ...sessionStorage }, document.cookie, location.href]));

test.describe('accounts: create a workspace with a domain the business owns', () => {
  test('the account is made first, the phone check signs in, then the trial is paid for and Admin opens', async ({ page }) => {
    const api = await mockApi(page);
    await stubAdmin(page);
    await stubPasskeys(page, 'success');
    await createWorkspaceTo(page, 'ready');

    // No date of birth, a reachable email, and no session: nobody is signed in until the phone is checked.
    expect(sentBy(api)).toMatchObject({ email: business.adminAddress, firstName: business.firstName, lastName: business.lastName, businessName: business.name, domain: business.domain, contactEmail: business.contactEmail });
    expect(sentBy(api)).not.toHaveProperty('dateOfBirth');
    expect(sentBy(api)).not.toHaveProperty('deviceId');
    await expect(page.getByRole('main')).toContainText('Next, we’ll check it’s you, then you can start your free trial.');
    await expect(page.getByRole('main')).toContainText('Your admin sign-in');
    await expect(page.getByRole('main')).toContainText(business.adminAddress);
    await expect(page.getByRole('button', { name: /^Account: / })).toHaveCount(0);

    await proceed(page);
    await expect(heading(page, 'Verify it’s you.')).toBeVisible();
    await fillMobile(page, business.phone);
    await proceed(page, 'Send code');
    await expect(heading(page, 'Enter the code.')).toBeVisible();
    expect(calls(api, '/v1/auth/phone-challenge/send')[0]!.body).toEqual({ challengeToken: 'phone-check-1', phone: business.phone, countryCode: 'NG' });
    await page.getByLabel('6-character code').fill(phoneCode);
    await expect(heading(page, 'Welcome to your new account.')).toBeVisible();
    await expect(page.getByRole('button', { name: `Account: ${business.adminAddress}` })).toBeVisible();
    await proceed(page, 'I understand');

    await expect(heading(page, 'Try Yahel free for 14 days.')).toBeVisible();
    await proceed(page, 'Continue to checkout');
    const recap = page.getByRole('group', { name: 'Your workspace' });
    await expect(recap).toContainText(`${business.adminAddress}Signed in`);
    await expect(recap.getByRole('button')).toHaveCount(0);
    await proceed(page, 'Add your name and address');
    await fillAddress(page);
    await proceed(page, 'Save address');
    await expect(page.getByRole('group', { name: 'Contact information' })).toContainText(business.street);
    await proceed(page, 'Continue to payment');

    await expect(heading(page, 'Add your card.')).toBeVisible();
    await expect(page.getByText('Secure payment page')).toBeVisible();
    await fillCard(page);
    await proceed(page, 'Verify card');
    await page.getByLabel('6-digit code').fill(card.code);

    await expect(heading(page, 'Your free trial has started.')).toBeVisible();
    await proceed(page, 'Go to Admin');
    await expect(heading(page, 'Protect Admin with a passkey.')).toBeVisible();
    await expect(page.getByText('Recommended for admins')).toBeVisible();
    await proceed(page, 'Not now');
    await expect(page).toHaveTitle('Admin');

    expect(registrations(api)).toHaveLength(1);
    expect(calls(api, '/v1/auth/verify-email')).toHaveLength(0);
    expect(calls(api, '/v1/auth/verify-email/resend')).toHaveLength(0);
  });

  test('the domain is proved later: nothing asks to verify it during sign-up, and the screens say when it will be', async ({ page }) => {
    await mockApi(page);
    await createWorkspaceTo(page, 'domain-ok');
    await expect(page.getByRole('main')).toContainText(`Mail sent to ${business.domain} keeps working as it does today until you switch it to Yahel. You’ll prove you own it in Admin later.`);
  });

  test('a claimed domain, a public one and one that is not a domain are each told beside the field', async ({ page }) => {
    await mockApi(page);
    await createWorkspaceTo(page, 'domain');
    const domain = page.getByLabel('Your domain', { exact: true });

    await proceed(page);
    await expect(domain).toHaveAccessibleDescription(/Enter your domain\./);
    await domain.fill(publicEmailDomain);
    await proceed(page);
    await expect(domain).toHaveAccessibleDescription(/Public email domains can’t be used\./);
    await domain.fill(claimedDomain);
    await proceed(page);
    await expect(domain).toHaveAccessibleDescription(/This domain is already claimed\./);
    await expect(alert(page, 'Another organisation has claimed this domain')).toBeVisible();

    await domain.fill(business.domain);
    await proceed(page);
    await expect(heading(page, 'Use this domain to set up your account?')).toBeVisible();
  });

  test('a domain claimed by the time the workspace is created sends the person back to it, and nothing is made', async ({ page }) => {
    const api = await mockApi(page);
    await createWorkspaceTo(page, 'admin');
    api.failNext('/v1/auth/register-business', 409, 'DOMAIN_CONFLICT');
    await page.getByLabel('Password', { exact: true }).fill(business.password);
    await page.getByLabel('Confirm password').fill(business.password);
    await proceed(page, 'Agree and continue');

    await expect(heading(page, 'What’s your domain?')).toBeVisible();
    await expect(page.getByLabel('Your domain', { exact: true })).toHaveAccessibleDescription(/This domain is already claimed\./);
    await page.getByLabel('Your domain', { exact: true }).fill('harbourline-studio.example');
    await proceed(page);
    await proceed(page, 'Use this domain');
    await expect(heading(page, 'Create your admin sign-in.')).toBeVisible();
    await proceed(page, 'Agree and continue');
    await expect(heading(page, 'Your account is ready.')).toBeVisible();
    expect(registrations(api)).toHaveLength(2);
  });
});

test.describe('accounts: create a workspace with a domain bought here', () => {
  test('search, the domain held, the registrant’s address, the phone check from the business phone, and the domain paid for with the trial', async ({ page }) => {
    const api = await mockApi(page);
    await createWorkspaceTo(page, 'found', { domain: 'bought' });
    await expect(page.getByRole('main')).toContainText('It’s available. We’ll hold it for you while you finish signing up.');
    await expect(page.getByRole('main')).toContainText(`sales@${business.boughtDomain}`);
    await proceed(page);
    await fillAddress(page);
    await proceed(page);
    await page.getByLabel('Password', { exact: true }).fill(business.password);
    await page.getByLabel('Confirm password').fill(business.password);
    await proceed(page, 'Agree and continue');
    await proceed(page);

    // The number given for the registry is where the phone step starts.
    await expect(page.getByLabel('Mobile number')).toHaveValue(business.phone);
    await proceed(page, 'Send code');
    await page.getByLabel('6-character code').fill(phoneCode);
    await proceed(page, 'I understand');
    await proceed(page, 'Continue to checkout');
    await expect(summary(page)).toContainText(business.boughtDomain);
    await expect(page.getByRole('main')).toContainText('Today you only pay for the domain.');
    await proceed(page, 'Continue to payment');
    await fillCard(page);
    await proceed(page, 'Pay ₦18,500');
    await page.getByLabel('6-digit code').fill(card.code);
    await expect(page.getByRole('main')).toContainText(`${business.boughtDomain} is being registered and will be ready in a few minutes.`);
    expect(sentBy(api)).toMatchObject({ domain: business.boughtDomain, email: business.boughtAdminAddress });
  });
});

test.describe('accounts: plan and checkout, once signed in', () => {
  test('a team too big for the trial is paid today, and the bank is told the amount', async ({ page }) => {
    await mockApi(page);
    await createWorkspaceTo(page, 'checkout', { seats: 12, promo: 'LAUNCH' });
    await expect(alert(page, 'The free trial is for teams of up to 10')).toBeVisible();
    await proceed(page, 'Continue to payment');
    await fillCard(page);
    await page.getByRole('button', { name: /^Pay ₦/ }).click();
    await expect(page.getByRole('main')).toContainText('to approve the ₦48,000 payment');
  });

  test('checkout asks for the name and address; the payment page refuses a card that cannot be right', async ({ page }) => {
    await mockApi(page);
    await createWorkspaceTo(page, 'plan');
    await proceed(page, 'Continue to checkout');
    await proceed(page, 'Continue to payment');
    await expect(alert(page, 'Add your name and address.')).toBeVisible();
    await proceed(page, 'Add your name and address');
    await fillAddress(page);
    await proceed(page, 'Save address');
    await proceed(page, 'Continue to payment');

    await proceed(page, 'Verify card');
    await expect(alert(page, '3 things to fix before you continue')).toContainText('Card number, Expiry and Security code.');
    await page.getByLabel('Expiry').fill('0120');
    await expect(page.getByLabel('Expiry')).toHaveAccessibleDescription(/This card has expired\./);
    for (const [label, autocomplete] of [['Card number', 'cc-number'], ['Expiry', 'cc-exp'], ['Security code', 'cc-csc'], ['Name on card', 'cc-name']] as const) {
      await expect(page.getByLabel(label)).toHaveAttribute('autocomplete', autocomplete);
    }

    await expect(page.getByRole('group', { name: 'Billing address' })).toHaveCount(0);
    await page.getByRole('checkbox', { name: 'Billing address is the same as my business address' }).uncheck();
    await expect(page.getByRole('group', { name: 'Billing address' })).toHaveAccessibleDescription('The address your bank has for this card. It’s used to check the card, not for your workspace.');
    await fillCard(page);
    await proceed(page, 'Verify card');
    await expect(alert(page, '3 things to fix before you continue')).toContainText('Street address, City or town and State.');
    await page.getByLabel('Street address').fill('12 Marina Road');
    await page.getByLabel('City or town').fill('Ikeja');
    await page.getByLabel('State', { exact: true }).selectOption('Lagos');
    await proceed(page, 'Verify card');
    await expect(heading(page, 'Confirm with your bank.')).toBeVisible();
  });

  test('a declined card is told plainly, a wrong code beside the boxes, and another card can be tried', async ({ page }) => {
    await mockApi(page);
    await createWorkspaceTo(page, 'done', { cardNumber: card.declined });
    await expect(alert(page, 'Your bank declined this card')).toContainText('Nothing was charged.');
    await expect(page).toHaveURL(at('/business/gateway'));

    await fillCard(page);
    await proceed(page, 'Verify card');
    await page.getByLabel('6-digit code').fill(card.wrongCode);
    await expect(page.getByLabel('6-digit code')).toHaveAccessibleDescription(/That code didn’t work\./);
    await proceed(page, 'Use a different card');
    await expect(heading(page, 'Add your card.')).toBeVisible();
    await expect(page.getByLabel('Card number')).toHaveValue('');
  });
});

test.describe('accounts: countries from the backend', () => {
  // These are about the default, which comes from where the browser is.
  test.use({ timezoneId: 'Africa/Lagos' });

  test('every country the backend lists is offered A to Z with its flag, starting on where the browser is, and one without states asks for the state in words', async ({ page }) => {
    await mockApi(page);
    await createWorkspaceTo(page, 'start');
    const country = page.getByRole('combobox', { name: /^Country or region/ });
    await expect(country).toHaveText('🇳🇬 Nigeria');
    await country.click();
    await expect(page.getByRole('option')).toHaveText(['🇨🇦Canada CA', '🇬🇭Ghana GH', '🇯🇲Jamaica JM', '🇰🇪Kenya KE', '🇳🇬Nigeria NG', '🇬🇧United Kingdom GB', '🇺🇸United States US']);
    await expect(page.getByRole('option', { name: 'Nigeria NG' })).toHaveAttribute('aria-selected', 'true');

    await createWorkspaceTo(page, 'registrant', { domain: 'bought', country: 'Kenya' });
    await expect(page.getByRole('textbox', { name: 'State or region' })).toBeVisible();
    await expect(page.getByRole('combobox', { name: /^Country code/ })).toHaveText('🇰🇪 +254');
  });

  test('the country list is a compact panel with a search: a dialling code finds the country, the keyboard picks it, and Escape gives focus back', async ({ page }) => {
    await mockApi(page);
    await createWorkspaceTo(page, 'start');
    const country = page.getByRole('combobox', { name: /^Country or region/ });

    await country.focus();
    await page.keyboard.press('ArrowDown');
    const search = page.getByRole('textbox', { name: 'Search country' });
    await expect(search).toBeFocused();
    const listbox = page.getByRole('listbox', { name: 'Country or region' });
    // The list scrolls inside a panel no taller than its 296 px list, the search and the panel's padding: it never fills the page.
    const panel = await listbox.locator('..').boundingBox();
    expect(panel?.height).toBeLessThanOrEqual(296 + 46 + 40);
    expect((await listbox.boundingBox())?.height).toBeLessThanOrEqual(296);

    await search.fill('233');
    await expect(page.getByRole('option')).toHaveText(['🇬🇭Ghana GH']);
    await search.fill('');
    await search.pressSequentially('ken');
    await page.keyboard.press('Enter');
    await expect(listbox).toBeHidden();
    await expect(country).toBeFocused();
    await expect(country).toHaveText('🇰🇪 Kenya');

    await page.keyboard.press('Enter');
    await expect(search).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(listbox).toBeHidden();
    await expect(country).toBeFocused();
    await expect(country).toHaveText('🇰🇪 Kenya');
  });

  test.describe('in another country', () => {
    test.use({ timezoneId: 'America/Toronto', locale: 'en-CA' });

    test('the country starts on the one the browser’s time zone is in, and the person can change it', async ({ page }) => {
      await mockApi(page);
      await createWorkspaceTo(page, 'start');
      const country = page.getByRole('combobox', { name: /^Country or region/ });
      await expect(country).toHaveText('🇨🇦 Canada');
      await chooseCountry(page, 'Country or region', 'Ghana');
      await expect(country).toHaveText('🇬🇭 Ghana');
    });
  });

  test('a list that does not load says so beside the field, and Try again loads it', async ({ page }) => {
    await mockApi(page);
    await page.route('**/api/v1/countries/public', (route) => route.abort('internetdisconnected'));
    await createWorkspaceTo(page, 'start');
    await expect(page.getByText('This list didn’t load. Try again in a moment.')).toBeVisible();

    await page.unroute('**/api/v1/countries/public');
    await page.getByRole('button', { name: 'Try again' }).click();
    await expect(page.getByRole('combobox', { name: /^Country or region/ })).toHaveText('🇳🇬 Nigeria');
  });
});

test.describe('accounts: what the workspace questions refuse', () => {
  test('the business, the person and the administrator’s sign-in each say what is missing; no date of birth is asked', async ({ page }) => {
    await mockApi(page);
    await createWorkspaceTo(page, 'you');
    await expect(page.getByLabel('Day')).toHaveCount(0);
    await proceed(page);
    await expect(alert(page, '2 things to fix before you continue')).toContainText('First name and Current email.');
    await page.getByLabel('First name').fill(business.firstName);
    await page.getByLabel('Current email').fill(business.contactEmail);
    await proceed(page);
    await page.getByRole('radio', { name: /Use a domain you own/ }).check({ force: true });
    await proceed(page);
    await page.getByLabel('Your domain', { exact: true }).fill(business.domain);
    await proceed(page);
    await proceed(page, 'Use this domain');

    await page.getByLabel('Username').fill('a.');
    await proceed(page, 'Agree and continue');
    await expect(alert(page, '3 things to fix before you continue')).toContainText('Username, Password and Confirm password.');
  });

  test('an administrator’s address that already has a sign-in is refused without saying whose it is', async ({ page }) => {
    const api = await mockApi(page);
    await createWorkspaceTo(page, 'admin');
    api.failNext('/v1/auth/register-business', 409, 'EMAIL_ALREADY_EXISTS');
    await page.getByLabel('Password', { exact: true }).fill(business.password);
    await page.getByLabel('Confirm password').fill(business.password);
    await proceed(page, 'Agree and continue');

    await expect(page.getByLabel('Username')).toHaveAccessibleDescription(/That address already has a Yahel sign-in\./);
    expect(calls(api, '/v1/auth/login')).toHaveLength(1);
    await expect(page.getByRole('button', { name: /^Account: / })).toHaveCount(0);
  });

  test('when the answer to creating is lost, another try finds this person’s waiting administrator and makes no second workspace', async ({ page }) => {
    const api = await mockApi(page);
    await createWorkspaceTo(page, 'admin');
    api.failNext('/v1/auth/register-business', 'lost');
    await page.getByLabel('Password', { exact: true }).fill(business.password);
    await page.getByLabel('Confirm password').fill(business.password);
    await proceed(page, 'Agree and continue');
    await expect(heading(page, 'We couldn’t finish creating your workspace.')).toBeVisible();

    await proceed(page, 'Try again');
    await expect(heading(page, 'Your account is ready.')).toBeVisible();
    expect(registrations(api)).toHaveLength(2);
    // The address already existed: the password just chosen was answered with this person's phone check.
    expect(calls(api, '/v1/auth/login')).toHaveLength(1);
    await proceed(page);
    await fillMobile(page, business.phone);
    await proceed(page, 'Send code');
    expect(calls(api, '/v1/auth/phone-challenge/send')[0]!.body).toMatchObject({ challengeToken: 'phone-check-2' });
  });
});

test.describe('accounts: workspace sign-up as a release build runs it', () => {
  test('a domain owned and the admin sign-in, Ready, the phone check, the welcome, then Admin, with no payment and no demo label', async ({ page }) => {
    const api = await mockApi(page);
    await stubAdmin(page);
    await visit(page, '/business?stand-ins=off');
    await page.getByLabel('Business name').fill(business.name);
    await proceed(page);
    await page.getByLabel('First name').fill(business.firstName);
    await page.getByLabel('Last name').fill(business.lastName);
    await proceed(page);
    await page.getByLabel('Your domain', { exact: true }).fill(business.domain);
    await proceed(page);
    await proceed(page, 'Use this domain');
    await page.getByLabel('Password', { exact: true }).fill(business.password);
    await page.getByLabel('Confirm password').fill(business.password);
    await proceed(page, 'Agree and continue');

    await expect(heading(page, 'Your account is ready.')).toBeVisible();
    await expect(page.getByRole('main')).toContainText('Next, we’ll check it’s you.');
    await expect(page.getByRole('note')).toHaveCount(0);
    await proceed(page);
    await fillMobile(page, business.phone);
    await proceed(page, 'Send code');
    await page.getByLabel('6-character code').fill(phoneCode);
    await proceed(page, 'I understand');
    await expect(heading(page, 'Protect Admin with a passkey.')).toBeVisible();
    expect(sentBy(api)).not.toHaveProperty('contactEmail');
  });
});

test.describe('accounts: moving about in workspace sign-up', () => {
  test('Back and Forward keep the answers before the workspace; once it exists, Back cannot reach them', async ({ page }) => {
    await mockApi(page);
    await createWorkspaceTo(page, 'admin');
    await page.goBack();
    await expect(heading(page, 'Use this domain to set up your account?')).toBeVisible();
    await page.goForward();
    await page.getByLabel('Password', { exact: true }).fill(business.password);
    await page.getByLabel('Confirm password').fill(business.password);
    await proceed(page, 'Agree and continue');
    await expect(heading(page, 'Your account is ready.')).toBeVisible();
    await page.goBack();
    await expect(heading(page, 'Your account is ready.')).toBeVisible();
  });

  test('no card detail, bank code, password or contact email reaches web storage, cookies or the address', async ({ page }) => {
    await mockApi(page);
    await createWorkspaceTo(page, 'card-code');
    const kept = await stored(page);
    for (const secret of [card.number, card.number.replace(/ /g, ''), card.securityCode, business.password, business.contactEmail, phoneCode, 'phone-check']) expect(kept).not.toContain(secret);
  });
});

test.describe('accounts: a workspace made while signed in', () => {
  test('from a personal account, its name and address fill the empty fields once, and stay editable', async ({ page }) => {
    await mockApi(page);
    await signInWithPassword(page, { email: takenAddress, password: 'Harmattan-in-Ibadan-88' });
    await heading(page, 'Welcome back, Kemi.').waitFor();

    await createWorkspaceTo(page, 'you');

    await expect(page.getByLabel('First name')).toHaveValue('Kemi');
    await expect(page.getByLabel('Last name')).toHaveValue('Adeyemi');
    await expect(page.getByLabel('Current email')).toHaveValue(takenAddress);
    await expect(page.getByText(`Filled in from ${takenAddress}.`)).toBeVisible();
    await expect(page.getByLabel('Day')).toHaveCount(0);

    await page.getByLabel('First name').fill('');
    await page.getByRole('link', { name: 'Back' }).click();
    await proceed(page);
    await heading(page, 'And who are you?').waitFor();
    await expect(page.getByLabel('Last name')).toHaveValue('Adeyemi');
  });

  test('from a personal account with a confirmed phone, the new administrator still checks its phone and is the account the tab ends on', async ({ page }) => {
    const api = await mockApi(page, { verifiedPhones: [takenAddress] });
    await stubAdmin(page);
    await signInWithPassword(page, { email: takenAddress, password: 'Harmattan-in-Ibadan-88' });
    await heading(page, 'Welcome back, Kemi.').waitFor();

    await createWorkspaceTo(page, 'ready');
    expect(sentBy(api)).toMatchObject({ email: business.adminAddress, contactEmail: business.contactEmail });
    expect(business.contactEmail).not.toBe(takenAddress);

    await proceed(page);
    await expect(heading(page, 'Verify it’s you.')).toBeVisible();
    await expect(page.getByRole('button', { name: /^Account: / })).toHaveCount(0);
    await fillMobile(page, business.phone);
    await proceed(page, 'Send code');
    await expect(heading(page, 'Enter the code.')).toBeVisible();
    await expect(page.getByRole('button', { name: /^Account: / })).toHaveCount(0);
    await page.getByLabel('6-character code').fill(phoneCode);

    await expect(heading(page, 'Welcome to your new account.')).toBeVisible();
    const main = page.getByRole('main');
    await expect(main).toContainText(business.adminAddress);
    await expect(main).toContainText(`Admins manage every account on ${business.domain}.`);
    await expect(main).toContainText(business.name);
    await expect(main).not.toContainText(takenAddress);
    expect(calls(api, '/v1/auth/phone-challenge/send')).toHaveLength(1);
    expect(calls(api, '/v1/auth/phone-challenge/verify')).toHaveLength(1);
    expect(api.calls.filter((call) => call.path.startsWith('/v1/me/recovery/phone'))).toHaveLength(0);

    await page.getByRole('button', { name: `Account: ${business.adminAddress}` }).click();
    const menu = page.getByRole('dialog', { name: 'Accounts' });
    await expect(menu.getByRole('region', { name: 'Signed in as' })).toContainText(`Admin · ${business.name}`);
    await expect(menu.getByRole('list', { name: 'Other accounts on this device' })).toContainText(takenAddress);
    expect(api.remembered()).toEqual(expect.arrayContaining([expect.objectContaining({ email: takenAddress, signedIn: true }), expect.objectContaining({ email: business.adminAddress, signedIn: true })]));
  });

  test('from a business account, nothing is filled in', async ({ page }) => {
    await mockApi(page);
    await signInWithPassword(page);
    await heading(page, 'Welcome back, Amara.').waitFor();

    await createWorkspaceTo(page, 'you');

    await expect(page.getByLabel('First name')).toHaveValue('');
    await expect(page.getByLabel('Current email')).toHaveValue('');
    await expect(page.getByText(/^Filled in from/)).toHaveCount(0);
    await expect(page.getByRole('button', { name: `Account: ${credentials.email}` })).toHaveCount(0);
  });
});
