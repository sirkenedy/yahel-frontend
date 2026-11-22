import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { armStepFailure, at, failNextStep, signInWithPassword } from './support/accounts';
import { emailCode, mockApi, strictCountry } from './support/api';
import { business, card, createWorkspace, createWorkspaceTo, fillAddress, fillCard, heading, proceed } from './support/business';

type Api = Awaited<ReturnType<typeof mockApi>>;
const registrations = (api: Api) => api.calls.filter((call) => call.path === '/v1/auth/register-business');
const sentBy = (api: Api, index = 0) => registrations(api)[index]!.body as Record<string, unknown>;
const alert = (page: Page, text: string | RegExp) => page.getByRole('alert').filter({ hasText: text });
const payButton = (page: Page) => page.getByRole('button', { name: /^(Start free trial|Pay .* and start( trial)?)$/ });
const summary = (page: Page) => page.getByRole('group', { name: 'Order summary' });
/** Everything the page keeps outside memory, to search for things that must never be kept. */
const stored = (page: Page) => page.evaluate(() => JSON.stringify([{ ...localStorage }, { ...sessionStorage }, document.cookie, location.href]));

test.describe('accounts: create a workspace with a domain the business owns', () => {
  test('from the business to its administrator’s sign-in, on a free trial', async ({ page }) => {
    const api = await mockApi(page);
    await createWorkspaceTo(page, 'checkout');

    await expect(page).toHaveURL(at('/business/checkout'));
    await expect(summary(page)).toContainText('Monthly plan · 10 people');
    await expect(summary(page).getByRole('list', { name: 'What you pay and when' }).getByRole('listitem')).toHaveText([/^Today\s*Free trial starts\s*₦0$/, /^From \d{1,2} \w{3} \d{4}\s*Monthly plan\s*₦50,000 \/ month$/]);
    await expect(summary(page)).toContainText(/Due today\s*₦0\s*\+ VAT/);
    await expect(page.getByRole('group', { name: 'Your workspace' })).toContainText(business.adminAddress);
    await expect(page.getByRole('group', { name: 'Your workspace' })).toContainText('Verify straight after setup');

    await fillCard(page);
    await proceed(page, 'Start free trial');
    await expect(heading(page, 'Confirm with your bank.')).toBeVisible();
    await expect(page.getByRole('main')).toContainText(`Visa •• ${card.lastFour}`);
    await expect(page.getByRole('main')).toContainText('Your bank sent a 6-digit code to ••• ••• ••42');
    await page.getByLabel('6-digit code').fill(card.code);
    await proceed(page, 'Confirm');

    await expect(heading(page, `${business.name} is ready.`)).toBeVisible();
    await expect(page).toHaveURL(at('/business/ready'));
    await expect(page.getByRole('main')).toContainText(business.adminAddress);
    expect(registrations(api)).toHaveLength(1);
    expect(sentBy(api)).toMatchObject({
      email: business.adminAddress,
      password: business.password,
      firstName: business.firstName,
      lastName: business.lastName,
      businessName: business.name,
      slug: business.slug,
      country: { name: 'Nigeria', code: 'NG', currency: 'NGN' },
      dateOfBirth: '1994-03-14T00:00:00.000Z',
      employeeCount: 10,
      domain: business.domain,
    });
    expect(sentBy(api).deviceId).toMatch(/^[0-9a-f-]{36}$/);
  });

  test('the domain is proved later: nothing asks to verify it during sign-up, and the screens say when it will be', async ({ page }) => {
    const api = await mockApi(page);
    await createWorkspaceTo(page, 'domain-ok');
    await expect(page.getByRole('main')).toContainText('You’ll prove it’s yours in Admin straight after sign-up.');
    await expect(page.getByRole('main')).toContainText(`you@${business.domain}`);

    await createWorkspace(page);
    await expect(page.getByRole('main')).toContainText('You’ll verify your domain, add your team and switch your mail.');
    expect(api.calls.filter((call) => call.path.includes('/tenants'))).toHaveLength(0);
  });

  test('the administrator step and Ready say plainly that the code goes to the new address, which must be a mailbox that opens now', async ({ page }) => {
    await mockApi(page);
    await createWorkspaceTo(page, 'admin');
    const before = page.getByRole('status').filter({ hasText: 'We’ll email a confirmation code to this new address' });
    await expect(before).toContainText(`this must be a mailbox on ${business.domain} that you can open now`);
    await expect(before).toContainText('don’t continue yet');

    await createWorkspace(page);
    const after = page.getByRole('status').filter({ hasText: 'Your confirmation code goes to your new address' });
    await expect(after).toContainText(`We’ve emailed a code to ${business.adminAddress}`);
    await expect(after).toContainText('Sign in only once that mailbox is one you can open');
  });

  test('the new administrator signs in, confirms the emailed code and is in', async ({ page }) => {
    await mockApi(page);
    await createWorkspace(page);
    await expect(page.getByRole('status').filter({ hasText: 'Your confirmation code goes to your new address' })).toContainText(business.adminAddress);

    await page.getByRole('link', { name: 'Sign in to Admin' }).click();
    await expect(page).toHaveURL(/\/signin\//);
    await signInWithPassword(page, { email: business.adminAddress, password: business.password });
    await expect(heading(page, 'Confirm your email.')).toBeVisible();
    await page.getByLabel('6-character code').fill(emailCode);
    await proceed(page, 'Verify');

    await expect(heading(page, 'Welcome back, Amara.')).toBeVisible();
  });

  test('a claimed domain, a public one and one that is not a domain are each told beside the field', async ({ page }) => {
    await mockApi(page);
    await createWorkspaceTo(page, 'domain');
    const domain = page.getByLabel('Your domain', { exact: true });

    await proceed(page);
    await expect(domain).toHaveAccessibleDescription(/Enter your domain\./);
    await domain.fill('northwind');
    await proceed(page);
    await expect(domain).toHaveAccessibleDescription(/Enter just the domain, like northwind\.example\./);
    await expect(domain).toBeFocused();

    await domain.fill('gmail.com');
    await proceed(page);
    await expect(domain).toHaveAccessibleDescription(/Public email domains can’t be used\./);
    await expect(alert(page, 'Another organisation has claimed this domain')).toHaveCount(0);

    await domain.fill('taken.example');
    await proceed(page);
    await expect(domain).toHaveAccessibleDescription(/This domain is already claimed\./);
    const banner = alert(page, 'Another organisation has claimed this domain');
    await expect(banner.getByRole('link', { name: 'Reset an admin’s password' })).toHaveAttribute('href', '/signin');
    await expect(banner.getByRole('link', { name: 'Contact support' })).toHaveAttribute('href', 'https://yahel.example/help');
    await expect(page).toHaveURL(at('/business/domain'));

    await domain.fill(business.domain);
    await expect(page.getByText('Looks good.')).toBeVisible();
    await proceed(page);
    await expect(heading(page, `Use this domain for ${business.name}?`)).toBeVisible();
  });

  test('a domain claimed by the time the workspace is created sends the person back to it, and nothing is made', async ({ page }) => {
    const api = await mockApi(page);
    await createWorkspaceTo(page, 'card-code');
    // Nothing could say so earlier: only creating the workspace claims the domain.
    api.failNext('/v1/auth/register-business', 409, 'DOMAIN_CONFLICT');
    await page.getByLabel('6-digit code').fill(card.code);
    await proceed(page, 'Confirm');

    await expect(heading(page, 'What’s your domain?')).toBeVisible();
    await expect(page.getByLabel('Your domain', { exact: true })).toHaveAccessibleDescription(/This domain is already claimed\./);
    await expect(alert(page, 'Another organisation has claimed this domain')).toBeVisible();

    await page.getByLabel('Your domain', { exact: true }).fill('harbourline-studio.example');
    await proceed(page);
    await proceed(page, 'Use this domain');
    // Everything else stands, so the way on is checkout, where the card is asked for again: it was never kept.
    await expect(heading(page, 'Review and check out.')).toBeVisible();
    await expect(page.getByLabel('Card number')).toHaveValue('');
    await fillCard(page);
    await proceed(page, 'Start free trial');
    await page.getByLabel('6-digit code').fill(card.code);
    await proceed(page, 'Confirm');
    await expect(heading(page, `${business.name} is ready.`)).toBeVisible();
    expect(registrations(api)).toHaveLength(2);
  });
});

test.describe('accounts: create a workspace with a domain bought here', () => {
  test('search, choose, give the registrant’s address, and pay for the domain with the trial', async ({ page }) => {
    const api = await mockApi(page);
    await createWorkspaceTo(page, 'find', { domain: 'bought' });

    await expect(page.getByLabel('Search for a domain')).toHaveValue('harbourline studio');
    const results = page.getByRole('radiogroup', { name: 'Available domains' });
    await expect(results.getByRole('radio')).toHaveCount(4);
    await expect(results.getByRole('radio', { name: 'harbourlinestudio.com Best match ₦18,500/yr' })).toBeVisible();
    await expect(results.getByRole('radio', { name: 'harbourlinestudio.ng ₦9,000/yr' })).toBeVisible();

    await proceed(page);
    await expect(page.getByLabel('Search for a domain')).toHaveAccessibleDescription(/Choose a domain from the list\./);
    await results.getByRole('radio', { name: /^harbourlinestudio\.com/ }).check({ force: true });
    await proceed(page);

    await expect(heading(page, `Register ${business.boughtDomain}`)).toBeVisible();
    await expect(page.getByRole('main')).toContainText(`Privacy protection is on for ${business.boughtDomain}`);
    await proceed(page);
    await expect(alert(page, '4 things to fix before you continue')).toContainText('Street address, City or town, State and Business phone.');
    await fillAddress(page);
    await proceed(page, 'Add building, LGA or postal code');
    await page.getByLabel('Postal code').fill('106104');
    await proceed(page);

    await expect(heading(page, 'Create your admin sign-in.')).toBeVisible();
    await expect(page.getByRole('main')).toContainText(`@${business.boughtDomain}`);
    await page.getByLabel('Password', { exact: true }).fill(business.password);
    await page.getByLabel('Confirm password').fill(business.password);
    await proceed(page, 'Agree and continue');
    await proceed(page, 'Continue to checkout');

    await expect(summary(page)).toContainText(business.boughtDomain);
    await expect(summary(page)).toContainText('₦18,500 / year');
    await expect(summary(page)).toContainText(/Due today\s*₦18,500\s*\+ VAT/);
    await expect(page.getByRole('group', { name: 'Your workspace' })).toContainText('12 Admiralty Way, Lekki, Lagos, 106104');
    await expect(page.getByRole('main')).toContainText('Domain Registration Agreement');
    await fillCard(page);
    await proceed(page, 'Pay ₦18,500 and start trial');
    await page.getByLabel('6-digit code').fill(card.code);
    await proceed(page, 'Confirm');

    await expect(heading(page, `${business.name} is ready.`)).toBeVisible();
    expect(sentBy(api)).toMatchObject({ email: business.boughtAdminAddress, domain: business.boughtDomain });
  });

  test('a search with nothing to find says so, and the person can use a domain they own instead', async ({ page }) => {
    await mockApi(page);
    await createWorkspaceTo(page, 'find', { domain: 'bought' });

    await page.getByLabel('Search for a domain').fill('!');
    await expect(page.getByText('No domains match that.')).toBeVisible();
    await page.getByLabel('Search for a domain').fill('harbour');
    await expect(page.getByRole('radio', { name: /^harbour\.africa/ })).toBeVisible();

    await proceed(page, 'I already own a domain');
    await expect(heading(page, 'What’s your domain?')).toBeVisible();
  });
});

test.describe('accounts: plan and checkout', () => {
  test('monthly or yearly, a promo code, and a team too big for the trial each change what is due', async ({ page }) => {
    await mockApi(page);
    await createWorkspaceTo(page, 'plan');
    const plan = page.getByRole('group', { name: 'Yahel Business' });

    await expect(heading(page, 'Try Yahel free for 14 days.')).toBeVisible();
    await expect(plan).toContainText('₦5,000');
    await expect(plan).toContainText('per person, a month');
    await expect(plan.getByRole('listitem')).toHaveCount(6);
    await page.getByRole('radio', { name: 'Yearly Save 16%' }).check({ force: true });
    await expect(plan).toContainText('₦4,200');

    await proceed(page, 'Add a promo code');
    await page.getByLabel('Promo code').fill('NOPE');
    await page.keyboard.press('Enter');
    await expect(page.getByLabel('Promo code')).toHaveAccessibleDescription(/That code isn’t valid\./);
    await expect(page).toHaveURL(at('/business/plan'));
    await page.getByLabel('Promo code').fill('launch');
    await proceed(page, 'Apply');
    await expect(plan).toContainText('LAUNCH · 20% off for 3 months');
    await expect(plan).toContainText('Was ₦4,200');
    await expect(plan).toContainText('₦3,360');
    await page.getByRole('button', { name: 'Remove promo code LAUNCH' }).click();
    await expect(plan).not.toContainText('LAUNCH');

    await proceed(page, 'Continue to checkout');
    await expect(summary(page)).toContainText('Yearly plan · 10 people');
    await expect(summary(page)).toContainText('Yearly plan, billed ₦504,000 a year');

    await page.getByRole('radio', { name: '3', exact: true }).check({ force: true });
    await expect(summary(page)).toContainText('Yearly plan · 3 people');
    await expect(payButton(page)).toHaveText('Start free trial');

    await page.getByRole('radio', { name: '11+', exact: true }).check({ force: true });
    await expect(alert(page, 'The free trial is for teams of up to 10')).toContainText('With 11 people, billing starts today');
    await expect(summary(page)).toContainText(/Due today\s*₦554,400\s*\+ VAT/);
    await page.getByLabel('Number of people').fill('7');
    await page.getByLabel('Number of people').blur();
    await expect(page.getByLabel('Number of people')).toHaveAccessibleDescription(/Enter 11 or more\./);
    await page.getByLabel('Number of people').fill('12');
    await expect(payButton(page)).toHaveText('Pay ₦604,800 and start');

    await page.getByRole('button', { name: 'Try with 10 people' }).click();
    await expect(payButton(page)).toHaveText('Start free trial');
    await expect(page.getByRole('radio', { name: '10', exact: true })).toBeChecked();

    await page.getByRole('button', { name: 'Change plan' }).click();
    await expect(heading(page, 'Try Yahel free for 14 days.')).toBeVisible();
    await page.getByRole('radio', { name: 'Monthly' }).check({ force: true });
    await proceed(page, 'Continue to checkout');
    await expect(summary(page)).toContainText('Monthly plan · 10 people');
  });

  test('a monthly plan for a large team is paid today, and the bank is told the amount', async ({ page }) => {
    await mockApi(page);
    await createWorkspaceTo(page, 'card-code', { seats: 12, promo: 'LAUNCH' });

    await expect(page.getByRole('main')).toContainText('to approve the ₦48,000 payment');
    await page.getByLabel('6-digit code').fill(card.code);
    await proceed(page, 'Confirm');
    await expect(heading(page, `${business.name} is ready.`)).toBeVisible();
  });

  test('checkout refuses a missing address and a card that cannot be right, each beside its field', async ({ page }) => {
    await mockApi(page);
    await createWorkspaceTo(page, 'plan');
    await proceed(page, 'Continue to checkout');

    await proceed(page, 'Start free trial');
    await expect(alert(page, 'Add your business address.')).toBeVisible();
    await expect(alert(page, '3 things to fix before you continue')).toContainText('Card number, Expiry and Security code.');
    await expect(page.getByLabel('Card number')).toHaveAccessibleDescription(/Enter your card number\./);
    await expect(page.getByLabel('Card number')).toBeFocused();

    await page.getByLabel('Card number').fill('4084 0840 8408 4082');
    await expect(page.getByLabel('Card number')).toHaveAccessibleDescription(/Check the card number\./);
    await page.getByLabel('Expiry').fill('1325');
    await expect(page.getByLabel('Expiry')).toHaveValue('13/25');
    await expect(page.getByLabel('Expiry')).toHaveAccessibleDescription(/Use MM\/YY\./);
    await page.getByLabel('Expiry').fill('0120');
    await expect(page.getByLabel('Expiry')).toHaveAccessibleDescription(/This card has expired\./);
    await page.getByLabel('Security code').fill('12');
    await expect(page.getByLabel('Security code')).toHaveAccessibleDescription(/3 or 4 digits\./);
    await page.getByLabel('Name on card').fill('');
    await proceed(page, 'Start free trial');
    await expect(page.getByLabel('Name on card')).toHaveAccessibleDescription(/Enter the name on the card\./);

    for (const [label, autocomplete] of [['Card number', 'cc-number'], ['Expiry', 'cc-exp'], ['Security code', 'cc-csc'], ['Name on card', 'cc-name']] as const) {
      await expect(page.getByLabel(label)).toHaveAttribute('autocomplete', autocomplete);
    }
    await expect(page.getByLabel('Card number')).toHaveAttribute('inputmode', 'numeric');
    await page.getByLabel('Card number').fill('4084084084084081');
    await expect(page.getByLabel('Card number')).toHaveValue('4084 0840 8408 4081');
    await expect(page.getByRole('main')).toContainText('Visa');
    await expect(page).toHaveURL(at('/business/checkout'));
  });

  test('a declined card is told plainly and another can be tried', async ({ page }) => {
    await mockApi(page);
    await createWorkspaceTo(page, 'done', { cardNumber: card.declined });

    await expect(alert(page, 'Your bank declined this card')).toContainText('Nothing was charged.');
    await expect(page).toHaveURL(at('/business/checkout'));
    await fillCard(page);
    await proceed(page, 'Start free trial');
    await expect(heading(page, 'Confirm with your bank.')).toBeVisible();
  });

  test('a wrong code and an expired one are told beside the boxes; too many wrong ones need a new code', async ({ page }) => {
    const api = await mockApi(page);
    await createWorkspaceTo(page, 'card-code');
    const code = page.getByLabel('6-digit code');

    await proceed(page, 'Confirm');
    await expect(code).toHaveAccessibleDescription(/Enter all 6 digits\./);
    await code.fill(card.expiredCode);
    await proceed(page, 'Confirm');
    await expect(code).toHaveAccessibleDescription(/That code has expired\./);
    await expect(code).toBeFocused();

    for (let tries = 0; tries < 4; tries += 1) {
      await code.fill(card.wrongCode);
      await proceed(page, 'Confirm');
      await expect(code).toHaveAccessibleDescription(/That code didn’t work\./);
      await expect(page.getByRole('button', { name: 'Confirm', exact: true })).toBeEnabled();
    }
    await code.fill(card.wrongCode);
    await proceed(page, 'Confirm');
    const dead = alert(page, 'This code no longer works');
    await expect(dead).toBeVisible();
    await expect(page.getByRole('button', { name: /^Send a new code in 0:\d{2}$/ })).toHaveAttribute('aria-disabled', 'true');
    await dead.getByRole('button', { name: 'Send a new code' }).click();
    await expect(page.getByText('Your bank sent a new code.')).toBeVisible();

    await code.fill(card.code);
    await proceed(page, 'Confirm');
    await expect(heading(page, `${business.name} is ready.`)).toBeVisible();
    expect(registrations(api)).toHaveLength(1);
  });

  test('"Use a different card" returns to checkout with nothing of the first card left', async ({ page }) => {
    await mockApi(page);
    await createWorkspaceTo(page, 'card-code');

    await proceed(page, 'Use a different card');
    await expect(heading(page, 'Review and check out.')).toBeVisible();
    await expect(page.getByLabel('Card number')).toHaveValue('');
    await expect(page.getByLabel('Security code')).toHaveValue('');
    await page.goForward();
    await expect(heading(page, 'Review and check out.')).toBeVisible();
  });
});

test.describe('accounts: what the workspace questions refuse', () => {
  test('the business, the person and the administrator’s sign-in each say what is missing', async ({ page }) => {
    await mockApi(page);
    await createWorkspaceTo(page, 'start');

    await proceed(page);
    await expect(page.getByLabel('Business name')).toHaveAccessibleDescription(/Enter your business name\./);
    await expect(page.getByLabel('Business name')).toBeFocused();
    await page.getByLabel('Business name').fill(business.name);
    await proceed(page);

    await proceed(page);
    await expect(alert(page, '5 things to fix before you continue')).toContainText('First name, Current email, Day, Month and Year.');
    await expect(page.getByLabel('First name')).toHaveAccessibleDescription(/Enter your first name\./);
    await page.getByLabel('First name').fill(business.firstName);
    await page.getByLabel('Current email').fill('amara');
    await expect(page.getByLabel('Current email')).toHaveAccessibleDescription(/Enter an email address, like name@example\.com\./);
    await page.getByLabel('Current email').fill(business.contactEmail);
    await page.getByLabel('Day').fill('31');
    await page.getByLabel('Month').selectOption({ label: 'April' });
    await page.getByLabel('Year').fill('1994');
    await proceed(page);
    await expect(page.getByLabel('Day')).toHaveAccessibleDescription(/Check the day\./);
    await page.getByLabel('Day').fill('14');
    await page.getByLabel('Year').fill(String(new Date().getFullYear() - 5));
    await proceed(page);
    await expect(page.getByLabel('Year')).toHaveAccessibleDescription(/You need to be 13 or older\./);
    await page.getByLabel('Year').fill(business.year);
    await proceed(page);

    await proceed(page);
    await page.getByLabel('Your domain', { exact: true }).fill(business.domain);
    await proceed(page);
    await proceed(page, 'Use this domain');

    const username = page.getByLabel('Username');
    await expect(username).toHaveValue('amara');
    await username.fill('a.');
    await proceed(page, 'Agree and continue');
    await expect(alert(page, '3 things to fix before you continue')).toContainText('Username, Password and Confirm password.');
    await expect(username).toHaveAccessibleDescription(/Use letters, numbers and full stops\./);
    await username.fill(business.adminUser);
    await page.getByLabel('Password', { exact: true }).fill('short');
    await expect(page.getByLabel('Password', { exact: true })).toHaveAccessibleDescription(/Use 8 or more characters, with a capital letter, a number and a symbol\./);
    await page.getByLabel('Password', { exact: true }).fill(business.password);
    await page.getByLabel('Confirm password').fill('Something else 1!');
    await expect(page.getByLabel('Confirm password')).toHaveAccessibleDescription(/These passwords don’t match\./);
    await page.getByLabel('Confirm password').fill(business.password);
    await proceed(page, 'Agree and continue');
    await expect(heading(page, 'Try Yahel free for 14 days.')).toBeVisible();
  });

  test('an age the country does not allow is told on the question about the person', async ({ page }) => {
    const api = await mockApi(page);
    await createWorkspaceTo(page, 'you', { country: 'Germany' });
    await page.getByLabel('First name').fill(business.firstName);
    await page.getByLabel('Current email').fill(business.contactEmail);
    await page.getByLabel('Day').fill('1');
    await page.getByLabel('Month').selectOption({ label: 'January' });
    await page.getByLabel('Year').fill(String(new Date().getFullYear() - 15));
    await proceed(page);
    await proceed(page);
    await page.getByLabel('Your domain', { exact: true }).fill(business.domain);
    await proceed(page);
    await proceed(page, 'Use this domain');
    await page.getByLabel('Password', { exact: true }).fill(business.password);
    await page.getByLabel('Confirm password').fill(business.password);
    await proceed(page, 'Agree and continue');
    await proceed(page, 'Continue to checkout');
    await proceed(page, 'Add business address');
    await page.getByLabel('Street address').fill(business.street);
    await page.getByLabel('City or town').fill('Berlin');
    await page.getByLabel('State or region').fill('Berlin');
    await page.getByLabel('Business phone').fill('30 5550142');
    await proceed(page, 'Save address');
    await fillCard(page);
    await payButton(page).click();
    await page.getByLabel('6-digit code').fill(card.code);
    await proceed(page, 'Confirm');

    await expect(heading(page, 'And who are you?')).toBeVisible();
    await expect(page.getByLabel('Year')).toHaveAccessibleDescription(/You’re not old enough to create a workspace in this country\./);
    expect(sentBy(api)).toMatchObject({ country: { name: 'Germany', code: strictCountry, currency: 'EUR' } });
  });

  test('an administrator’s address that already has a sign-in is refused without saying whose it is', async ({ page }) => {
    const api = await mockApi(page);
    await createWorkspaceTo(page, 'card-code');
    api.failNext('/v1/auth/register-business', 409, 'EMAIL_ALREADY_EXISTS');
    await page.getByLabel('6-digit code').fill(card.code);
    await proceed(page, 'Confirm');

    await expect(heading(page, 'Create your admin sign-in.')).toBeVisible();
    await expect(page.getByLabel('Username')).toHaveAccessibleDescription(/That address already has a Yahel sign-in\./);
    await expect(page.getByRole('link', { name: 'Sign in instead' })).toHaveAttribute('href', '/signin');
    // The password just chosen was tried against it, and opened nothing.
    expect(api.calls.filter((call) => call.path === '/v1/auth/login')).toHaveLength(1);
    await expect(page.getByText(/Signed in as/)).toHaveCount(0);
  });
});

test.describe('accounts: the workspace is created once', () => {
  test('a creation that fails says so, keeps everything and finishes on another try', async ({ page }) => {
    const api = await mockApi(page);
    await createWorkspaceTo(page, 'card-code');
    api.failNext('/v1/auth/register-business', 500, 'INTERNAL_ERROR');
    await page.getByLabel('6-digit code').fill(card.code);
    await proceed(page, 'Confirm');

    await expect(heading(page, 'We couldn’t finish creating your workspace.')).toBeVisible();
    await expect(page.getByRole('main')).toContainText('Your card was approved but nothing has been charged');
    await expect(alert(page, 'Something went wrong on our side')).toBeVisible();
    await proceed(page, 'Try again');

    await expect(heading(page, `${business.name} is ready.`)).toBeVisible();
    expect(registrations(api)).toHaveLength(2);
  });

  test('when the answer to creating is lost, another try finds the workspace and does not make a second', async ({ page }) => {
    const api = await mockApi(page);
    await createWorkspaceTo(page, 'card-code');
    api.failNext('/v1/auth/register-business', 'lost');
    await page.getByLabel('6-digit code').fill(card.code);
    await proceed(page, 'Confirm');

    await expect(alert(page, 'We can’t reach Yahel right now')).toBeVisible();
    await proceed(page, 'Try again');
    await expect(heading(page, `${business.name} is ready.`)).toBeVisible();
    // The second request was refused because the first had worked; the password just chosen proved the workspace is this person's.
    expect(registrations(api)).toHaveLength(2);
    expect(api.calls.filter((call) => call.path === '/v1/auth/login')).toHaveLength(1);
    await expect(page.getByText(/Signed in as/)).toHaveCount(0);
  });

  test('Back and Forward while the workspace is being created stay on creating, and it is created once', async ({ page }) => {
    const api = await mockApi(page);
    await createWorkspaceTo(page, 'card-code');
    let answer: () => void = () => undefined;
    const answered = new Promise<void>((resolve) => (answer = resolve));
    // Registered after the mock, so it is asked first: the answer to creating waits until the test lets it go.
    await page.route('**/api/v1/auth/register-business', async (route) => {
      await answered;
      await route.fallback();
    });
    await page.getByLabel('6-digit code').fill(card.code);
    await proceed(page, 'Confirm');
    await expect(heading(page, `Creating ${business.name}…`)).toBeVisible();

    await page.goBack();
    await expect(heading(page, `Creating ${business.name}…`)).toBeVisible();
    await expect(page).toHaveURL(at('/business/creating'));
    await expect(payButton(page)).toHaveCount(0);
    await page.goForward();
    await expect(page).toHaveURL(at('/business/creating'));

    answer();
    await expect(heading(page, `${business.name} is ready.`)).toBeVisible();
    expect(registrations(api)).toHaveLength(1);
  });

  test('a double press of Pay starts one payment, and paying again after Back still creates one workspace', async ({ page }) => {
    const api = await mockApi(page);
    await createWorkspaceTo(page, 'checkout');
    await fillCard(page);
    await payButton(page).dblclick();
    await expect(heading(page, 'Confirm with your bank.')).toBeVisible();

    await page.goBack();
    await expect(heading(page, 'Review and check out.')).toBeVisible();
    await fillCard(page);
    await payButton(page).click();
    await expect(heading(page, 'Confirm with your bank.')).toBeVisible();
    await page.getByLabel('6-digit code').fill(card.code);
    await proceed(page, 'Confirm');

    await expect(heading(page, `${business.name} is ready.`)).toBeVisible();
    expect(registrations(api)).toHaveLength(1);
  });

  test('two businesses of the same name get different short names, without the person being asked', async ({ page }) => {
    const api = await mockApi(page);
    await createWorkspace(page, { name: 'Northwind Studio' });

    expect(registrations(api)).toHaveLength(2);
    expect(sentBy(api, 0)).toMatchObject({ slug: 'northwind-studio' });
    expect(sentBy(api, 1)).toMatchObject({ slug: 'harbourline-example', businessName: 'Northwind Studio' });
  });
});

test.describe('accounts: moving about in workspace sign-up', () => {
  test('Back and Forward keep the answers; a reload starts again and nothing was kept outside memory', async ({ page }) => {
    await mockApi(page);
    await createWorkspaceTo(page, 'admin');
    await page.getByLabel('Password', { exact: true }).fill(business.password);
    await page.getByLabel('Confirm password').fill(business.password);
    await proceed(page, 'Agree and continue');
    await expect(heading(page, 'Try Yahel free for 14 days.')).toBeVisible();

    await page.goBack();
    await expect(heading(page, 'Create your admin sign-in.')).toBeVisible();
    // A password already chosen is never put back on screen.
    await expect(page.getByLabel('Password', { exact: true })).toHaveValue('');
    await expect(page.getByRole('status').filter({ hasText: 'Your password is saved.' })).toBeVisible();
    await page.goBack();
    await expect(heading(page, `Use this domain for ${business.name}?`)).toBeVisible();
    await page.goBack();
    await expect(page.getByLabel('Your domain', { exact: true })).toHaveValue(business.domain);
    await page.goForward();
    await page.goForward();
    await page.goForward();
    await expect(heading(page, 'Try Yahel free for 14 days.')).toBeVisible();

    await proceed(page, 'Continue to checkout');
    await fillCard(page);
    expect(page.url()).toBe(at('/business/checkout'));
    for (const secret of [business.password, card.number, card.number.replace(/ /g, ''), business.contactEmail]) expect(await stored(page)).not.toContain(secret);

    await page.reload();
    await expect(heading(page, 'Tell us about your business.')).toBeVisible();
    await expect(page.getByLabel('Business name')).toHaveValue('');
  });

  test('no card detail, bank code, password or contact email reaches web storage, cookies or the address, from checkout to Ready', async ({ page }) => {
    await mockApi(page);
    const name = 'Amara Q Cardholder';
    const secrets = [card.number, card.number.replace(/ /g, ''), card.expiry, card.securityCode, name, card.code, business.password, business.contactEmail];
    const nothingKept = async (where: string) => {
      // The device id is a random UUID that `@yahel/auth` keeps on purpose; a short code could appear in it by chance.
      const kept = await page.evaluate(() => JSON.stringify([Object.entries(localStorage).filter(([key]) => key !== 'yahel.device-id'), { ...sessionStorage }, document.cookie]));
      for (const secret of secrets) expect(kept, `${secret} at ${where}`).not.toContain(secret);
      for (const secret of secrets) expect(decodeURIComponent(page.url()), `${secret} in the address at ${where}`).not.toContain(secret);
      expect(page.url()).toBe(at(where));
    };
    await createWorkspaceTo(page, 'checkout');
    await fillCard(page);
    await page.getByLabel('Name on card').fill(name);
    await nothingKept('/business/checkout');

    await payButton(page).click();
    await expect(heading(page, 'Confirm with your bank.')).toBeVisible();
    await nothingKept('/business/card-code');
    await page.getByLabel('6-digit code').fill(card.code);
    await nothingKept('/business/card-code');

    await proceed(page, 'Confirm');
    await expect(heading(page, `${business.name} is ready.`)).toBeVisible();
    await nothingKept('/business/ready');
  });

  test('a step asked for out of turn leads to the first one that can be shown', async ({ page }) => {
    await mockApi(page);
    for (const step of ['checkout', 'card-code', 'creating', 'ready', 'admin', 'registrant', 'find', 'domain-ok']) {
      await page.goto(at(`/business/${step}`));
      await expect(heading(page, 'Tell us about your business.')).toBeVisible();
      await expect(page).toHaveURL(at('/business/start'));
    }
  });

  test('an answer changed from checkout returns there, and leaving for sign-in forgets everything', async ({ page }) => {
    await mockApi(page);
    await createWorkspaceTo(page, 'checkout');

    await page.getByRole('button', { name: 'Edit business', exact: true }).click();
    await expect(page.getByLabel('Business name')).toHaveValue(business.name);
    await page.getByLabel('Business name').fill('Harbourline Works');
    await proceed(page);
    await expect(heading(page, 'Review and check out.')).toBeVisible();
    await expect(page.getByRole('group', { name: 'Your workspace' })).toContainText('Harbourline Works');

    await page.getByRole('button', { name: 'Edit admin' }).click();
    await page.getByLabel('Username').fill('admin');
    await proceed(page, 'Agree and continue');
    await expect(page.getByRole('group', { name: 'Your workspace' })).toContainText(`admin@${business.domain}`);

    await page.goto(at('/signin'));
    await page.goto(at('/business/checkout'));
    await expect(heading(page, 'Tell us about your business.')).toBeVisible();
    await expect(page.getByLabel('Business name')).toHaveValue('');
  });

  test('a workspace screen that fails offers "Start again", and trying again does not keep the password', async ({ page }) => {
    await mockApi(page);
    await armStepFailure(page);
    await createWorkspaceTo(page, 'admin');
    await page.getByLabel('Password', { exact: true }).fill(business.password);
    await page.getByLabel('Confirm password').fill(business.password);
    await failNextStep(page);
    await proceed(page, 'Agree and continue');

    await expect(heading(page, 'Something went wrong on our side.')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Start again' })).toHaveAttribute('href', '/business');
    await expect(page.getByRole('link', { name: 'Back to sign in' })).toHaveCount(0);
    await page.getByRole('button', { name: 'Try again' }).click();

    await expect(heading(page, 'Tell us about your business.')).toBeVisible();
    await expect(page.getByLabel('Business name')).toHaveValue('');
  });

  test('the personal sign-up’s business choice leads here, and this flow leads back', async ({ page }) => {
    await mockApi(page);
    await page.goto(at('/personal'));
    await page.getByRole('radio', { name: /For my business or team/ }).check({ force: true });
    await proceed(page);
    await expect(heading(page, 'Tell us about your business.')).toBeVisible();
    await expect(page).toHaveURL(at('/business/start'));

    await page.getByRole('link', { name: 'Create a personal account instead' }).click();
    await expect(heading(page, 'Create your Yahel account.')).toBeVisible();
  });

  test('the whole flow can be completed with the keyboard alone', async ({ page }) => {
    await mockApi(page);
    await page.goto(at('/business'));
    const type = async (label: string | RegExp, text: string) => {
      await page.getByLabel(label, { exact: typeof label === 'string' }).focus();
      await page.keyboard.type(text);
    };

    await type('Business name', business.name);
    await page.keyboard.press('Tab');
    await expect(page.getByRole('radio', { name: '10–99' })).toBeFocused();
    await page.keyboard.press('ArrowLeft');
    await expect(page.getByRole('radio', { name: '2–9' })).toBeChecked();
    await page.keyboard.press('Enter');

    await type('First name', business.firstName);
    await type('Current email', business.contactEmail);
    await type('Day', business.day);
    await page.getByLabel('Month').focus();
    await page.keyboard.type('March');
    await type('Year', business.year);
    await page.keyboard.press('Enter');

    await expect(heading(page, 'Your domain.')).toBeVisible();
    await page.getByRole('radio', { name: /Use a domain I already own/ }).focus();
    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('radio', { name: /Buy a new domain/ })).toBeChecked();
    await page.keyboard.press('Enter');

    await expect(heading(page, 'Find your domain.')).toBeVisible();
    await page.getByRole('radio', { name: /^harbourlinestudio\.com/ }).focus();
    await page.keyboard.press('Space');
    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('radio', { name: /^harbourlinestudio\.ng/ })).toBeChecked();
    await page.keyboard.press('Enter');

    await type('Street address', business.street);
    await type('City or town', business.city);
    await page.getByLabel('State', { exact: true }).focus();
    await page.keyboard.type('Lagos');
    await type('Business phone', business.phone);
    await page.keyboard.press('Enter');

    await type('Password', business.password);
    await type('Confirm password', business.password);
    await page.keyboard.press('Enter');

    await expect(heading(page, 'Try Yahel free for 14 days.')).toBeVisible();
    await page.getByRole('radio', { name: 'Monthly' }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('radio', { name: /^Yearly/ })).toBeChecked();
    await page.keyboard.press('Enter');

    await expect(heading(page, 'Review and check out.')).toBeVisible();
    await page.getByRole('radio', { name: '2', exact: true }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('radio', { name: '3', exact: true })).toBeChecked();
    await type('Card number', card.number.replace(/ /g, ''));
    await type('Expiry', card.expiry.replace('/', ''));
    await type('Security code', card.securityCode);
    await page.keyboard.press('Enter');

    await expect(heading(page, 'Confirm with your bank.')).toBeVisible();
    // On a touch screen a new step puts focus on its heading, so the field is reached before typing.
    await page.getByLabel('6-digit code').focus();
    await page.keyboard.type(card.code);
    await page.keyboard.press('Enter');
    await expect(heading(page, `${business.name} is ready.`)).toBeVisible();
    await page.getByRole('link', { name: 'Sign in to Admin' }).focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/signin/);
  });
});
