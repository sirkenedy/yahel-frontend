import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { accountsUrl, appUrl, armStepFailure, at, failNextStep, fillMobile, openPasswordStep, signInWithPassword, stubApp, stubPasskeys, visit } from './support/accounts';
import { credentials, emailCode, mockApi, pendingEmail, pendingPassword, phoneCode, registeredEmail, requestId, takenAddress } from './support/api';
import type { MockApi } from './support/api';
import { heading, person, signUp, signUpTo, signUpToPasskeyOffer } from './support/personal';

const calls = (api: MockApi, path: string) => api.calls.filter((call) => call.path === path);
const registrations = (api: MockApi) => calls(api, '/v1/auth/register');
const proceed = (page: Page, name = 'Continue') => page.getByRole('button', { name, exact: true }).click();
const code = (page: Page) => page.getByLabel('6-character code');

test.describe('personal account: a new Yahel address', () => {
  test('the questions in order, the review, then an account that is signed in', async ({ page }) => {
    const api = await mockApi(page);
    await signUp(page);

    await expect(page).toHaveURL(at('/personal/ready'));
    await expect(page.getByText(`${person.address} is ready. Every Yahel app now opens with it.`)).toBeVisible();
    expect(registrations(api)).toHaveLength(1);
    expect(registrations(api)[0]!.body).toEqual({ email: person.address, firstName: 'Amara', lastName: 'Okafor', dateOfBirth: '1994-03-14T00:00:00.000Z', password: person.password, recoveryEmail: person.recoveryEmail });
    expect(calls(api, '/v1/auth/login')[0]!.body).toMatchObject({ email: person.address, password: person.password });
    expect(calls(api, '/v1/me/recovery/email')).toHaveLength(0);
    expect(calls(api, '/v1/auth/verify-email')).toHaveLength(0);
  });

  test('each question says how far along it is', async ({ page }) => {
    await mockApi(page);
    await signUpTo(page, 'name');
    await expect(page.getByText('01 / 06 · Your name')).toBeVisible();

    await signUpTo(page, 'review');
    await expect(page.getByText('06 / 06 · Review')).toBeVisible();
  });

  test('the address is checked as it is typed, and a taken one offers free alternatives one tap away', async ({ page }) => {
    await mockApi(page);
    await signUpTo(page, 'address');
    const field = page.getByLabel('Your Yahel address');

    await field.fill('Amara');
    await expect(field).toHaveValue('amara');
    await expect(page.getByText('That address is taken. Try one of these.')).toBeVisible();
    await proceed(page);
    await expect(heading(page, 'Pick your address.')).toBeVisible();

    await page.getByRole('group', { name: 'Also free' }).getByRole('button', { name: 'amara.mail' }).click();
    await expect(field).toHaveValue('amara.mail');
    await expect(page.getByText('Available. It’s yours if you want it.')).toBeVisible();
    await proceed(page);

    await expect(heading(page, 'Create a password.')).toBeVisible();
  });

  test('before anything is typed, free addresses made from the name are offered', async ({ page }) => {
    await mockApi(page);
    await signUpTo(page, 'address');

    await page.getByRole('group', { name: 'Also free' }).getByRole('button', { name: 'okafor.amara' }).click();

    await expect(page.getByLabel('Your Yahel address')).toHaveValue('okafor.amara');
  });

  test('an address that turns out to be taken when the account is created sends the person back to choose another, and nothing else is lost', async ({ page }) => {
    const api = await mockApi(page);
    // Taken after the check said it was free: only creating the account finds out.
    await page.route('**/api/v1/auth/address-availability', (route) => route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ success: true, data: { available: true, alternatives: [] }, meta: { requestId } }) }));
    await signUpTo(page, 'done', { username: takenAddress.split('@')[0] });

    await expect(heading(page, 'Pick your address.')).toBeVisible();
    await expect(page.getByText('That address is taken. Try another.')).toBeVisible();
    await page.getByLabel('Your Yahel address').fill(person.username);
    await proceed(page);

    await expect(heading(page, 'Everything look right?')).toBeVisible();
    await expect(page.getByText(person.address)).toBeVisible();
    await page.getByRole('button', { name: 'Agree and create account' }).click();
    await expect(heading(page, 'You’re in, Amara.')).toBeVisible();
    expect(registrations(api).map((call) => (call.body as { email: string }).email)).toEqual([takenAddress, person.address]);
  });
});

test.describe('personal account: an email the person already has', () => {
  test('the account is created, the emailed code confirms the address, then it is signed in', async ({ page }) => {
    const api = await mockApi(page);
    await signUpTo(page, 'done', { address: 'own' });

    await expect(heading(page, 'Check your inbox.')).toBeVisible();
    await expect(page.getByText(`Enter the 6-character code we sent to ${person.ownEmail}.`)).toBeVisible();
    await code(page).fill(emailCode);

    await expect(heading(page, 'You’re in, Amara.')).toBeVisible();
    await expect(page.getByText(`${person.ownEmail} is ready.`)).toBeVisible();
    expect(registrations(api)).toHaveLength(1);
    expect(calls(api, '/v1/auth/verify-email')[0]!.body).toEqual({ email: person.ownEmail, token: emailCode });
    expect(calls(api, '/v1/auth/login')).toHaveLength(2);
  });

  test('a wrong code is refused and the right one still works; a new code can be asked for', async ({ page }) => {
    const api = await mockApi(page);
    await page.clock.install();
    await signUpTo(page, 'done', { address: 'own' });
    await heading(page, 'Check your inbox.').waitFor();

    await proceed(page, 'Verify');
    await expect(page.getByText('Enter all 6 characters.')).toBeVisible();
    await code(page).fill('zzzzzz');
    await expect(code(page)).toHaveAccessibleDescription(/That code didn’t work or has expired\./);
    await expect(code(page)).toBeFocused();

    // A code has just been sent, so another can be asked for only after the pause.
    await expect(page.getByRole('button', { name: /^Send a new code in 0:\d\d$/ })).toHaveAttribute('aria-disabled', 'true');
    await page.clock.fastForward(31_000);
    await page.getByRole('button', { name: 'Send a new code', exact: true }).click();
    await expect(page.getByText('If a new code can be sent to this address, it’s on its way.')).toBeVisible();
    expect(calls(api, '/v1/auth/verify-email/resend')[0]!.body).toEqual({ email: person.ownEmail });

    await code(page).clear();
    await code(page).fill(emailCode);
    await expect(heading(page, 'You’re in, Amara.')).toBeVisible();
  });

  test('an address that already has an account looks exactly like one that does not', async ({ page }) => {
    await mockApi(page);
    const seen: string[] = [];
    for (const email of [person.ownEmail, registeredEmail, pendingEmail]) {
      await signUpTo(page, 'own-email', { address: 'own' });
      await page.getByLabel('Your email address').fill(email);
      await proceed(page);
      await page.getByLabel('Password', { exact: true }).fill(person.password);
      await proceed(page);
      await proceed(page, 'Skip');
      await page.getByRole('button', { name: 'Agree and create account' }).click();
      await heading(page, 'Check your inbox.').waitFor();
      seen.push((await page.getByRole('main').innerText()).replaceAll(email, '<address>'));
      await expect(page.getByRole('alert')).toHaveCount(0);
    }

    expect(seen[1]).toBe(seen[0]);
    expect(seen[2]).toBe(seen[0]);
    expect(seen[0]).toContain('If this address already has a Yahel account, sign in or reset its password instead.');
  });

  test('an address the backend does not take for a personal account sends the person back to change it', async ({ page }) => {
    await mockApi(page);
    await signUpTo(page, 'own-email', { address: 'own' });
    await page.getByLabel('Your email address').fill('amara@studio.example');
    await proceed(page);
    await page.getByLabel('Password', { exact: true }).fill(person.password);
    await proceed(page);
    await proceed(page, 'Skip');
    await page.getByRole('button', { name: 'Agree and create account' }).click();

    await expect(heading(page, 'Use your current email.')).toBeVisible();
    await expect(page.getByText('Use a personal email address, such as one from Gmail or Outlook')).toBeVisible();

    await page.getByRole('button', { name: 'Get a Yahel address instead' }).click();
    await expect(heading(page, 'Pick your address.')).toBeVisible();
  });
});

test.describe('personal account: sign-in methods and ways back in', () => {
  test('once the account is ready, a passkey is created on the device and saved to the signed-in account', async ({ page }) => {
    const api = await mockApi(page);
    await signUpTo(page, 'password');
    await page.getByLabel('Password', { exact: true }).fill(person.password);
    await proceed(page);
    // The passkey is no longer asked for before the account exists.
    await expect(heading(page, 'Ways back in.')).toBeVisible();
    await proceed(page, 'Skip');
    await expect(page.getByRole('definition').filter({ hasText: /^Password$/ })).toBeVisible();
    await page.getByRole('button', { name: 'Agree and create account' }).click();
    await heading(page, 'You’re in, Amara.').waitFor();

    await page.getByRole('button', { name: 'Continue to Yahel' }).click();
    await expect(heading(page, 'Add a passkey too?')).toBeVisible();
    await page.getByRole('button', { name: 'Add a passkey' }).click();
    await expect(heading(page, 'Create your passkey.')).toBeVisible();
    await expect(page.getByText('Waiting for this device')).toBeVisible();

    await expect(page.getByText('Passkey saved', { exact: true })).toBeVisible();
    const finish = api.calls.find((call) => call.path === '/v1/auth/passkey/register/finish');
    expect(finish?.authorization).toMatch(/^Bearer /);
    expect(finish?.body).toMatchObject({ challengeToken: expect.stringMatching(/^webauthn-registration-/), response: { id: 'CQgH', rawId: 'CQgH', type: 'public-key' } });
  });

  test('a closed passkey prompt can be tried again, or left for the password and the app', async ({ page }) => {
    await mockApi(page);
    await stubApp(page);
    await signUpToPasskeyOffer(page, { passkeys: 'cancelled' });

    await page.getByRole('button', { name: 'Add a passkey' }).click();
    await expect(page.getByText('The passkey prompt was closed before it finished.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();
    await page.getByRole('button', { name: 'Use a password instead' }).click();

    await expect(page).not.toHaveURL(/\/personal\//);
  });

  test('“Not now” opens the app without a passkey', async ({ page }) => {
    const api = await mockApi(page);
    await stubApp(page);
    await signUpToPasskeyOffer(page);

    await page.getByRole('button', { name: 'Not now' }).click();

    await expect(page).not.toHaveURL(/\/personal\//);
    expect(api.calls.some((call) => call.path === '/v1/auth/passkey/register/finish')).toBe(false);
  });

  test('a new account made from the app opens the app as itself, not as the first account in the browser', async ({ page }) => {
    const signedIn = (email: string, displayName: string) => ({ email, displayName, signedIn: true });
    await mockApi(page, { remembered: [signedIn('first@yahel.example', 'First'), signedIn('second@yahel.example', 'Second'), signedIn('third@yahel.example', 'Third')] });
    await stubApp(page);
    // "Add another account" in the app sends people here with the app's own address to return to.
    await signUpToPasskeyOffer(page, { query: `?return=${encodeURIComponent(appUrl)}` });

    await page.getByRole('button', { name: 'Not now' }).click();

    await expect(page).toHaveURL(`${appUrl}u/3/`);
  });

  test('no passkey is offered in a browser that cannot make one', async ({ page }) => {
    await mockApi(page);
    await stubApp(page);
    await signUp(page, { passkeys: 'unsupported' });

    await page.getByRole('button', { name: 'Continue to Yahel' }).click();

    await expect(page).not.toHaveURL(/\/personal\//);
  });

  test('a recovery phone is confirmed with a texted code once the account exists', async ({ page }) => {
    const api = await mockApi(page);
    await page.clock.install();
    await signUpTo(page, 'done', { phone: true, recoveryEmail: false });

    await expect(heading(page, 'Enter the code.')).toBeVisible();
    await expect(page.getByText(`We sent a 6-character code to ${person.maskedPhone}.`)).toBeVisible();
    expect(registrations(api)[0]!.body).toMatchObject({ phone: person.internationalPhone });
    expect(calls(api, '/v1/auth/phone/send-otp')[0]!.body).toEqual({ phone: person.phone, countryCode: 'NG' });

    await code(page).fill('zzzzzz');
    await expect(code(page)).toHaveAccessibleDescription(/That code didn’t work or has expired\./);
    await expect(code(page)).toBeFocused();
    await page.clock.fastForward(31_000);
    await page.getByRole('button', { name: 'Send a new code', exact: true }).click();
    await expect(page.getByText('New code sent. Older codes no longer work.')).toBeVisible();
    expect(calls(api, '/v1/auth/phone/send-otp')).toHaveLength(2);

    await code(page).clear();
    await code(page).fill(phoneCode);
    await expect(heading(page, 'You’re in, Amara.')).toBeVisible();
    await expect(page.getByText('Your recovery phone isn’t confirmed yet.')).toHaveCount(0);
  });

  test('the phone code can be skipped, and the last screen says the phone is not confirmed', async ({ page }) => {
    await mockApi(page);
    await signUpTo(page, 'done', { phone: true });
    await heading(page, 'Enter the code.').waitFor();

    await page.getByRole('button', { name: 'Skip for now' }).click();

    await expect(heading(page, 'You’re in, Amara.')).toBeVisible();
    await expect(page.getByText('Your recovery phone isn’t confirmed yet. Confirm it in your account.')).toBeVisible();
  });

  test('every optional step can be skipped: no last name, no passkey, no recovery', async ({ page }) => {
    const api = await mockApi(page);
    await signUpTo(page, 'name');
    await page.getByLabel('First name').fill('Amara');
    await proceed(page);
    await page.getByLabel('Day').fill('14');
    await page.getByLabel('Month').selectOption({ label: 'March' });
    await page.getByLabel('Year').fill('1994');
    await proceed(page);
    await page.getByLabel('Your Yahel address').fill('amara.only');
    await proceed(page);
    await page.getByLabel('Password', { exact: true }).fill(person.password);
    await proceed(page);
    await proceed(page, 'Skip');
    await expect(page.getByRole('definition').filter({ hasText: 'Not added' })).toBeVisible();
    await page.getByRole('button', { name: 'Agree and create account' }).click();

    await expect(heading(page, 'You’re in, Amara.')).toBeVisible();
    expect(registrations(api)[0]!.body).toMatchObject({ firstName: 'Amara', lastName: '', displayName: 'Amara' });
    expect(registrations(api)[0]!.body).not.toHaveProperty('recoveryEmail');
    expect(registrations(api)[0]!.body).not.toHaveProperty('phone');
    expect(calls(api, '/v1/auth/phone/send-otp')).toHaveLength(0);
  });

  test('someone the person trusts can be invited from the last screen', async ({ page }) => {
    const api = await mockApi(page);
    await signUp(page);

    await page.getByRole('link', { name: /Add someone you trust/ }).click();
    await page.getByLabel('Their email address').fill(person.recoveryEmail);
    await proceed(page, 'Send invitation');
    await expect(page.getByText('Use someone else’s email.')).toBeVisible();
    await page.getByLabel('Their email address').fill('chidi.eze@personal.example');
    await proceed(page, 'Send invitation');

    await expect(page.getByText('chidi.eze@personal.example is your trusted contact. We’ve sent them an invitation.')).toBeVisible();
    expect(calls(api, '/v1/me/recovery/trusted-contact').map((call) => call.body)).toEqual([{ trustedContactEmail: 'chidi.eze@personal.example' }]);
  });
});

test.describe('personal account: what each question refuses', () => {
  test('the name', async ({ page }) => {
    await mockApi(page);
    await signUpTo(page, 'name');

    await proceed(page);

    await expect(page.getByText('Enter your first name.')).toBeVisible();
    await expect(page.getByLabel('First name')).toBeFocused();
  });

  test('the date of birth', async ({ page }) => {
    await mockApi(page);
    await signUpTo(page, 'birth');

    await proceed(page);
    await expect(page.getByText('Check the day.')).toBeVisible();
    await expect(page.getByText('Choose a month.')).toBeVisible();
    await expect(page.getByText('Enter a 4-digit year.')).toBeVisible();

    await page.getByLabel('Day').fill('31');
    await page.getByLabel('Month').selectOption({ label: 'April' });
    await page.getByLabel('Year').fill('1994');
    await proceed(page);
    await expect(page.getByText('Check the day.')).toBeVisible();

    await page.getByLabel('Day').fill('1');
    await page.getByLabel('Year').fill(String(new Date().getFullYear() - 12));
    await proceed(page);
    await expect(page.getByText('You need to be 13 or older.')).toBeVisible();
    await expect(heading(page, 'A little about you.')).toBeVisible();
  });

  test('the address', async ({ page }) => {
    await mockApi(page);
    await signUpTo(page, 'address');
    const field = page.getByLabel('Your Yahel address');

    for (const [typed, problem] of [
      ['', 'Choose an address.'],
      ['abc', 'Use at least 4 characters.'],
      ['amara_okafor', 'Use letters, numbers and full stops only.'],
      ['amara..okafor', 'Full stops can’t start, end or repeat.'],
    ] as const) {
      await field.fill(typed);
      await proceed(page);
      await expect(page.getByText(problem)).toBeVisible();
    }
  });

  test('the existing email, the password and the ways back in', async ({ page }) => {
    await mockApi(page);
    await signUpTo(page, 'own-email', { address: 'own' });
    await page.getByLabel('Your email address').fill('amara');
    await proceed(page);
    await expect(page.getByText('Enter an email address you can open now.')).toBeVisible();

    await page.getByLabel('Your email address').fill(person.ownEmail);
    await proceed(page);
    const password = page.getByLabel('Password', { exact: true });
    await expect(page.getByText('Mix capitals, lowercase, a number and a symbol. A short sentence like Rain on Ikoyi 2026! works well.')).toBeVisible();
    await expect(page.getByText('At least 8 characters, with a capital letter, a lowercase letter, a number and a symbol.')).toBeVisible();
    await proceed(page);
    await expect(page.getByText('Create a password.', { exact: true }).last()).toBeVisible();
    await expect(password).toHaveAccessibleDescription(/Create a password\./);
    await password.fill('short');
    await expect(page.getByText('Use 8 or more characters, with a capital letter, a number and a symbol.')).toBeVisible();
    await password.fill('sunrise over lekki');
    await proceed(page);
    await expect(page.getByText('Add a capital letter and a number.')).toBeVisible();
    await password.fill(person.password);
    await expect(page.getByText('Strong · 21 characters')).toBeVisible();
    await proceed(page);

    await proceed(page);
    await expect(page.getByText('Add a phone number or an email, or choose Skip.')).toBeVisible();
    await fillMobile(page, '803');
    await page.getByLabel('Recovery email').fill(person.ownEmail);
    await proceed(page);
    await expect(page.getByText('Check the number, or leave it empty.')).toBeVisible();
    await expect(page.getByText('Use an address that isn’t the one you’ll sign in with.')).toBeVisible();
  });
});

test.describe('personal account: the review', () => {
  test('private lines are hidden until asked for', async ({ page }) => {
    await mockApi(page);
    await signUpTo(page, 'review', { phone: true });

    await expect(page.getByText('14 March 1994')).toHaveCount(0);
    await page.getByRole('button', { name: 'Show private details' }).click();
    await expect(page.getByText('14 March 1994')).toBeVisible();
    await expect(page.getByText(`${person.maskedPhone} · ${person.recoveryEmail}`)).toBeVisible();
  });

  test('every line can be changed, and each change returns to the review', async ({ page }) => {
    const api = await mockApi(page);
    await signUpTo(page, 'review');

    await page.getByRole('button', { name: 'Edit name' }).click();
    await page.getByLabel('First name').fill('Amarachi');
    await proceed(page);
    await expect(heading(page, 'Everything look right?')).toBeVisible();
    await expect(page.getByText('Amarachi Okafor')).toBeVisible();

    await page.getByRole('button', { name: 'Edit address' }).click();
    await page.getByLabel('Your Yahel address').fill('amarachi.okafor');
    await proceed(page);
    await expect(page.getByText(`amarachi.okafor@yahel.example`)).toBeVisible();

    await page.getByRole('button', { name: 'Edit birthday' }).click();
    await page.getByLabel('Year').fill('1990');
    await proceed(page);
    await heading(page, 'Everything look right?').waitFor();
    await page.getByRole('button', { name: 'Show private details' }).click();
    await expect(page.getByText('14 March 1990')).toBeVisible();

    await page.getByRole('button', { name: 'Edit sign-in' }).click();
    await page.getByLabel('Password', { exact: true }).fill('Harmattan in Jos 2026!');
    await proceed(page);
    await heading(page, 'Everything look right?').waitFor();

    await page.getByRole('button', { name: 'Edit recovery' }).click();
    await page.getByLabel('Recovery email').fill('amarachi@personal.example');
    await proceed(page);
    await heading(page, 'Everything look right?').waitFor();

    await page.getByRole('button', { name: 'Agree and create account' }).click();
    await expect(heading(page, 'You’re in, Amarachi.')).toBeVisible();
    expect(registrations(api)[0]!.body).toMatchObject({ email: 'amarachi.okafor@yahel.example', firstName: 'Amarachi', dateOfBirth: '1990-03-14T00:00:00.000Z', password: 'Harmattan in Jos 2026!' });
    expect(registrations(api)[0]!.body).toMatchObject({ recoveryEmail: 'amarachi@personal.example' });
  });

  test('Back from an answer being changed returns to the review unchanged', async ({ page }) => {
    await mockApi(page);
    await signUpTo(page, 'review');

    await page.getByRole('button', { name: 'Edit name' }).click();
    await page.getByLabel('First name').fill('Someone else');
    await page.getByRole('link', { name: 'Back' }).click();

    await expect(heading(page, 'Everything look right?')).toBeVisible();
    await expect(page.getByText('Amara Okafor')).toBeVisible();
  });

  test('the two choices are off unless turned on', async ({ page }) => {
    await mockApi(page);
    await signUpTo(page, 'review');

    await expect(page.getByRole('checkbox', { name: 'Email me tips and product news' })).not.toBeChecked();
    await expect(page.getByRole('checkbox', { name: 'Keep my activity to improve suggestions in my files' })).not.toBeChecked();
    await page.getByRole('checkbox', { name: 'Email me tips and product news' }).check();
    await expect(page.getByRole('checkbox', { name: 'Email me tips and product news' })).toBeChecked();
  });
});

test.describe('personal account: creating', () => {
  test('a failed creation says so, keeps every answer and succeeds on another try', async ({ page }) => {
    const api = await mockApi(page);
    await signUpTo(page, 'review');
    api.failNext('/v1/auth/register', 500);

    await page.getByRole('button', { name: 'Agree and create account' }).click();
    await expect(heading(page, 'We couldn’t finish.')).toBeVisible();
    await expect(page.getByRole('alert')).toContainText('Something went wrong on our side');
    await expect(page.getByRole('alert')).toContainText(`Reference ${requestId}.`);
    await expect(page.getByText('Nothing you entered is lost.')).toBeVisible();

    await page.getByRole('link', { name: 'Back to review' }).click();
    await expect(page.getByText(person.address)).toBeVisible();
    await page.getByRole('button', { name: 'Agree and create account' }).click();

    await expect(heading(page, 'You’re in, Amara.')).toBeVisible();
    expect(registrations(api)).toHaveLength(2);
  });

  test('when the answer to creating is lost, another try finds the account and does not make a second', async ({ page }) => {
    const api = await mockApi(page);
    await signUpTo(page, 'review');
    api.failNext('/v1/auth/register', 'lost');

    await page.getByRole('button', { name: 'Agree and create account' }).click();
    // The answer never came while the browser was online: a banner on the creating screen, with the retry in place.
    await expect(page.getByRole('alert').filter({ hasText: 'We can’t reach Yahel right now' })).toBeVisible();
    await page.getByRole('button', { name: 'Try again' }).click();

    await expect(heading(page, 'You’re in, Amara.')).toBeVisible();
    // The second request was refused as a duplicate: one account exists, and it is the one signed in to.
    expect(registrations(api)).toHaveLength(2);
    expect(calls(api, '/v1/auth/login')).toHaveLength(1);
  });

  test('when the account is created but signing in fails, another try signs in without creating it again', async ({ page }) => {
    const api = await mockApi(page);
    await signUpTo(page, 'review');
    api.failNext('/v1/auth/login', 500);

    await page.getByRole('button', { name: 'Agree and create account' }).click();
    await expect(page.getByText('Your account was created, but we couldn’t finish setting it up. Try again.')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Back to review' })).toHaveCount(0);
    await page.getByRole('button', { name: 'Try again' }).click();

    await expect(heading(page, 'You’re in, Amara.')).toBeVisible();
    expect(registrations(api)).toHaveLength(1);
  });

  test('two quick presses create one account', async ({ page }) => {
    const api = await mockApi(page);
    await signUpTo(page, 'review');

    await page.getByRole('button', { name: 'Agree and create account' }).dblclick();

    await expect(heading(page, 'You’re in, Amara.')).toBeVisible();
    expect(registrations(api)).toHaveLength(1);
  });

  test('progress follows the requests', async ({ page }) => {
    await mockApi(page);
    let release: () => void = () => undefined;
    await page.route('**/api/v1/auth/login', async (route) => {
      await new Promise<void>((resolve) => (release = resolve));
      await route.fallback();
    });
    await signUpTo(page, 'done');

    await expect(heading(page, 'Creating your account…')).toBeVisible();
    await expect(page.getByText(`Reserving ${person.address} and setting up your storage.`)).toBeVisible();
    await expect(page.getByText('Signing you in')).toBeVisible();
    release();

    await expect(heading(page, 'You’re in, Amara.')).toBeVisible();
  });

  test('once the account exists, Back does not return to the questions', async ({ page }) => {
    await mockApi(page);
    await signUp(page);

    await page.goBack();
    await expect(heading(page, 'You’re in, Amara.')).toBeVisible();
    await expect(page).toHaveURL(at('/personal/ready'));
  });
});

test.describe('personal account: addresses, reload and history', () => {
  test('every step has its own address, and nothing personal is in it or in web storage', async ({ page }) => {
    await mockApi(page);
    await signUpTo(page, 'review', { phone: true });

    await expect(page).toHaveURL(at('/personal/review'));
    const stored = await page.evaluate(() => JSON.stringify([{ ...localStorage }, { ...sessionStorage }]));
    for (const secret of [person.password, 'Amara', 'amara.okafor', '0142', person.recoveryEmail]) expect(stored).not.toContain(secret);
  });

  test('Back and Forward move between questions and keep what was answered', async ({ page }) => {
    await mockApi(page);
    await signUpTo(page, 'address');

    await page.goBack();
    await expect(heading(page, 'A little about you.')).toBeVisible();
    await expect(page.getByLabel('Day')).toHaveValue('14');
    await expect(page.getByLabel('Month')).toHaveValue('3');
    await page.goBack();
    await expect(page.getByLabel('First name')).toHaveValue('Amara');
    await page.goForward();
    await page.goForward();
    await expect(heading(page, 'Pick your address.')).toBeVisible();
  });

  test('a reload mid-flow starts again from the first question that can be shown', async ({ page }) => {
    await mockApi(page);
    await signUpTo(page, 'password');

    await page.reload();

    await expect(page).toHaveURL(at('/personal/name'));
    await expect(page.getByLabel('First name')).toHaveValue('');
  });

  test('a later step opened directly leads to the first question', async ({ page }) => {
    await mockApi(page);
    for (const step of ['review', 'creating', 'own-code', 'code', 'ready', 'contact', 'passkey']) {
      await visit(page, `/personal/${step}`);
      await expect(page).toHaveURL(at('/personal/name'));
    }
    await visit(page, '/personal');
    await expect(page).toHaveURL(at('/personal/type'));
  });

  test('a reload after the account is signed in to lands on the signed-in screen', async ({ page }) => {
    await mockApi(page);
    await signUp(page);

    await page.reload();

    await expect(page).toHaveURL(at('/signin/done'));
    await expect(heading(page, 'Welcome back, Amara.')).toBeVisible();
  });

  test('someone signed in can create another account: it is added beside theirs, and this tab uses it', async ({ page }) => {
    const api = await mockApi(page, { remembered: [] });
    await signInWithPassword(page);
    await heading(page, 'Welcome back, Amara.').waitFor();
    await page.getByRole('button', { name: `Account: ${credentials.email}` }).click();
    await page.getByRole('dialog', { name: 'Accounts' }).getByRole('button', { name: 'Add another account' }).click();
    await page.getByRole('link', { name: 'Create an account' }).click();
    await expect(heading(page, 'Create your Yahel account.')).toBeVisible();

    await signUp(page);

    expect(api.remembered().map(({ slot, email, signedIn }) => [slot, email, signedIn])).toEqual([[0, credentials.email, true], [1, person.address, true]]);
    await page.getByRole('button', { name: `Account: ${person.address}` }).click();
    const menu = page.getByRole('dialog', { name: 'Accounts' });
    await expect(menu.getByRole('region', { name: 'Signed in as' })).toContainText(person.address);
    await expect(menu.getByRole('button', { name: new RegExp(`^Switch to.*${credentials.email}`) })).toBeVisible();
  });

  test('sign-in and sign-up lead to each other', async ({ page }) => {
    await mockApi(page);
    await visit(page, '/signin');
    await page.getByRole('link', { name: 'Create an account' }).click();
    await expect(heading(page, 'Create your Yahel account.')).toBeVisible();

    await page.getByRole('banner').getByRole('link', { name: 'Sign in', exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`^${accountsUrl}/signin/`));
  });

  test('the business choice leads to workspace sign-up, and nothing typed here goes with it', async ({ page }) => {
    await mockApi(page);
    await signUpTo(page, 'type');

    await page.getByRole('radio', { name: /For my business or team/ }).check();
    await proceed(page);

    await expect(heading(page, 'Tell us about your business.')).toBeVisible();
    await expect(page).toHaveURL(at('/business/start'));
    await expect(page.getByLabel('Business name')).toHaveValue('');
  });

  test('personal details can be blurred for a screen share, and come back in focus', async ({ page }) => {
    await mockApi(page);
    await signUpTo(page, 'birth');
    const day = page.getByLabel('Day');
    await day.fill('14');
    const blur = () => day.evaluate((field) => getComputedStyle(field).filter);

    await page.getByRole('button', { name: 'Hide my details' }).click();
    await page.getByLabel('Year').focus();
    expect(await blur()).toContain('blur');
    await day.focus();
    expect(await blur()).toBe('none');

    await page.getByRole('button', { name: 'Show my details' }).click();
    await page.getByLabel('Year').focus();
    expect(await blur()).toBe('none');
  });
});

test.describe('personal account: keyboard only', () => {
  test('an account can be created without a pointer', async ({ page }) => {
    await mockApi(page);
    await stubPasskeys(page, 'unsupported');
    await visit(page, '/personal');
    await heading(page, 'Create your Yahel account.').waitFor();
    const type = async (label: string, text: string) => {
      await expect(page.getByLabel(label, { exact: true })).toBeFocused();
      await page.keyboard.type(text);
    };

    await page.getByRole('radio', { name: /For me/ }).focus();
    await page.keyboard.press('Enter');
    await heading(page, 'What should we call you?').waitFor();
    await page.getByLabel('First name').focus();
    await type('First name', 'Amara');
    await page.keyboard.press('Tab');
    await type('Last name', 'Okafor');
    await page.keyboard.press('Enter');

    await heading(page, 'A little about you.').waitFor();
    await page.getByLabel('Day').focus();
    await type('Day', '14');
    await page.keyboard.press('Tab');
    await expect(page.getByLabel('Month')).toBeFocused();
    await page.keyboard.type('March');
    await page.keyboard.press('Tab');
    await type('Year', '1994');
    await page.keyboard.press('Enter');

    await heading(page, 'Pick your address.').waitFor();
    await page.getByLabel('Your Yahel address').focus();
    await page.keyboard.type('amara.keys');
    await page.keyboard.press('Enter');

    await heading(page, 'Create a password.').waitFor();
    await page.getByLabel('Password', { exact: true }).focus();
    await page.keyboard.type(person.password);
    await page.keyboard.press('Enter');

    await heading(page, 'Ways back in.').waitFor();
    await page.getByLabel('Recovery email').focus();
    await page.keyboard.type(person.recoveryEmail);
    await page.keyboard.press('Enter');

    await heading(page, 'Everything look right?').waitFor();
    await page.getByRole('button', { name: 'Agree and create account' }).focus();
    await page.keyboard.press('Enter');

    await expect(heading(page, 'You’re in, Amara.')).toBeVisible();
  });

  test('each question takes focus: its first field on a computer, its heading on a touch screen', async ({ page, isMobile }) => {
    await mockApi(page);
    await signUpTo(page, 'name');

    await expect(isMobile ? heading(page, 'What should we call you?') : page.getByLabel('First name')).toBeFocused();
    await page.getByLabel('First name').fill('Amara');
    await proceed(page);
    await expect(isMobile ? heading(page, 'A little about you.') : page.getByLabel('Day')).toBeFocused();
  });
});

const answerOwnEmailTo = async (page: Page, email: string) => {
  await signUpTo(page, 'own-email', { address: 'own' });
  await page.getByLabel('Your email address').fill(email);
  await proceed(page);
  await page.getByLabel('Password', { exact: true }).fill(person.password);
  await proceed(page);
  await proceed(page, 'Skip');
  await page.getByRole('button', { name: 'Agree and create account' }).click();
  await heading(page, 'Check your inbox.').waitFor();
};

test.describe('personal account: an address someone else registered first', () => {
  test('the owner’s code is never used to switch on a registration made with someone else’s password', async ({ page }) => {
    const api = await mockApi(page);
    await page.clock.install();
    // Someone registered this address with their own password and left it unconfirmed. Now its owner signs up.
    await answerOwnEmailTo(page, pendingEmail);

    // The code that registration mailed to the owner is right as far as the backend is concerned.
    await code(page).fill(emailCode);
    await expect(code(page)).toHaveAccessibleDescription(/That code didn’t work or has expired\./);
    await expect(code(page)).toBeFocused();
    await page.clock.fastForward(31_000);
    await page.getByRole('button', { name: 'Send a new code', exact: true }).click();
    await expect(page.getByText('If a new code can be sent to this address, it’s on its way.')).toBeVisible();
    await code(page).fill(emailCode);
    await expect(code(page)).toHaveAccessibleDescription(/That code didn’t work or has expired\./);
    await expect(code(page)).toBeFocused();

    expect(calls(api, '/v1/auth/verify-email')).toHaveLength(0);
    expect(calls(api, '/v1/auth/verify-email/resend')).toHaveLength(0);

    // The other person's password still opens nothing: their registration was not confirmed for them.
    await page.getByRole('link', { name: 'Sign in instead' }).click();
    await openPasswordStep(page, pendingEmail);
    await page.getByLabel('Password', { exact: true }).fill(pendingPassword);
    await page.getByRole('button', { name: 'Sign in' }).click();
    // Whoever holds that password is asked for the code from the mailbox, which only its owner can read.
    await expect(heading(page, 'Confirm your email.')).toBeVisible();
  });

  test('the owner of an unconfirmed registration of their own, whose password opens it, is sent a code and finishes', async ({ page }) => {
    const api = await mockApi(page);
    await signUpTo(page, 'own-email', { address: 'own' });
    await page.getByLabel('Your email address').fill(pendingEmail);
    await proceed(page);
    await page.getByLabel('Password', { exact: true }).fill(pendingPassword);
    await proceed(page);
    await proceed(page, 'Skip');
    await page.getByRole('button', { name: 'Agree and create account' }).click();
    await heading(page, 'Check your inbox.').waitFor();
    expect(calls(api, '/v1/auth/verify-email/resend')).toHaveLength(1);

    await code(page).fill(emailCode);

    await expect(heading(page, 'You’re in, Amara.')).toBeVisible();
  });

  test('a mistyped address can be put right from the code screen without answering everything again', async ({ page }) => {
    const api = await mockApi(page);
    await answerOwnEmailTo(page, 'amra.okafor@mail.example');

    await page.getByRole('button', { name: 'Use a different address' }).click();
    await expect(heading(page, 'Use your current email.')).toBeVisible();
    await page.getByLabel('Your email address').fill(person.ownEmail);
    await proceed(page);

    await expect(heading(page, 'Everything look right?')).toBeVisible();
    await expect(page.getByText(person.ownEmail)).toBeVisible();
    await page.getByRole('button', { name: 'Agree and create account' }).click();
    await heading(page, 'Check your inbox.').waitFor();
    await code(page).fill(emailCode);

    await expect(heading(page, 'You’re in, Amara.')).toBeVisible();
    expect(registrations(api).map((call) => (call.body as { email: string }).email)).toEqual(['amra.okafor@mail.example', person.ownEmail]);
  });

  test('creating an account for an existing email is not described as reserving it', async ({ page }) => {
    await mockApi(page);
    await page.route('**/api/v1/auth/register', () => undefined);
    await signUpTo(page, 'done', { address: 'own' });

    await expect(page.getByText(`Creating your account for ${person.ownEmail} and setting up your storage.`)).toBeVisible();
  });
});

test.describe('personal account: what is forgotten, and when', () => {
  const passwordField = (page: Page) => page.getByLabel('Password', { exact: true });

  test('a password already chosen is never put back in its field, and leaving the field empty keeps it', async ({ page }) => {
    const api = await mockApi(page);
    await signUpTo(page, 'recovery');

    await page.getByRole('link', { name: 'Back' }).click();
    await expect(heading(page, 'Create a password.')).toBeVisible();
    await expect(passwordField(page)).toHaveValue('');
    await expect(page.getByText('Your password is saved. Leave this empty to keep it, or type a new one.')).toBeVisible();
    expect(await page.content()).not.toContain(person.password);

    await proceed(page);
    await proceed(page, 'Skip');
    await page.getByRole('button', { name: 'Agree and create account' }).click();
    await expect(heading(page, 'You’re in, Amara.')).toBeVisible();
    expect(registrations(api)[0]!.body).toMatchObject({ password: person.password });
  });

  test('leaving sign-up for sign-in forgets every answer and the password', async ({ page }) => {
    await mockApi(page);
    await signUpTo(page, 'recovery');
    await page.evaluate(() => ((window as unknown as { stillHere: boolean }).stillHere = true));

    // Out through the first screen's own link, and back in through sign-in's, without the page reloading.
    for (const question of ['Create a password.', 'Pick your address.', 'A little about you.', 'What should we call you?', 'Create your Yahel account.']) {
      await page.getByRole('link', { name: 'Back' }).click();
      await heading(page, question).waitFor();
    }
    await expect(heading(page, 'Create your Yahel account.')).toBeVisible();
    await page.getByRole('banner').getByRole('link', { name: 'Sign in', exact: true }).click();
    await page.getByRole('link', { name: 'Create an account' }).click();
    await heading(page, 'Create your Yahel account.').waitFor();
    expect(await page.evaluate(() => (window as unknown as { stillHere?: boolean }).stillHere)).toBe(true);

    await proceed(page);
    await expect(page.getByLabel('First name')).toHaveValue('');
    await page.getByLabel('First name').fill('Chidi');
    await proceed(page);
    await page.getByLabel('Day').fill('2');
    await page.getByLabel('Month').selectOption({ label: 'May' });
    await page.getByLabel('Year').fill('1990');
    await proceed(page);
    await page.getByLabel('Your Yahel address').fill('chidi.eze');
    await proceed(page);
    await expect(passwordField(page)).toHaveValue('');
    await expect(page.getByText('Your password is saved.')).toHaveCount(0);
    await passwordField(page).fill('Harmattan in Jos 2026!');
    await proceed(page);
    await expect(heading(page, 'Ways back in.')).toBeVisible();
    await expect(page.getByLabel('Recovery email')).toHaveValue('');
  });

  test('the brand link starts sign-up again from nothing', async ({ page }) => {
    await mockApi(page);
    await signUpTo(page, 'password');

    await page.getByRole('link', { name: 'Yahel account creation' }).click();
    await expect(heading(page, 'Create your Yahel account.')).toBeVisible();
    await proceed(page);

    await expect(page.getByLabel('First name')).toHaveValue('');
    await visit(page, '/personal/password');
    await expect(page).toHaveURL(at('/personal/name'));
  });

  test('"Start again" after a failed creation forgets everything', async ({ page }) => {
    const api = await mockApi(page);
    await signUpTo(page, 'review');
    api.failNext('/v1/auth/register', 500);
    await page.getByRole('button', { name: 'Agree and create account' }).click();
    await heading(page, 'We couldn’t finish.').waitFor();

    await page.getByRole('button', { name: 'Start again' }).click();

    await expect(heading(page, 'Create your Yahel account.')).toBeVisible();
    await proceed(page);
    await expect(page.getByLabel('First name')).toHaveValue('');
  });

  test('a sign-up screen that fails offers "Start again", and trying again does not keep the password', async ({ page }) => {
    await mockApi(page);
    await armStepFailure(page);
    await signUpTo(page, 'password');
    await page.getByLabel('Password', { exact: true }).fill(person.password);
    await failNextStep(page);
    await proceed(page);

    await expect(heading(page, 'Something went wrong on our side.')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Start again' })).toHaveAttribute('href', '/personal');
    await expect(page.getByRole('link', { name: 'Back to sign in' })).toHaveCount(0);
    await page.getByRole('button', { name: 'Try again' }).click();

    await expect(heading(page, 'What should we call you?')).toBeVisible();
    await expect(page.getByLabel('First name')).toHaveValue('');
  });
});

test.describe('personal account: fixes from review', () => {
  test('a wrong texted code is sent once, not replayed, and the session is left alone', async ({ page }) => {
    const api = await mockApi(page);
    await signUpTo(page, 'done', { phone: true, recoveryEmail: false });
    await heading(page, 'Enter the code.').waitFor();

    await code(page).fill('zzzzzz');
    await expect(code(page)).toHaveAccessibleDescription(/That code didn’t work or has expired\./);
    await expect(code(page)).toBeFocused();

    expect(calls(api, '/v1/auth/phone/verify')).toHaveLength(1);
    expect(calls(api, '/v1/auth/refresh')).toHaveLength(0);
    await code(page).clear();
    await code(page).fill(phoneCode);
    await expect(heading(page, 'You’re in, Amara.')).toBeVisible();
  });

  test('looking at the other kind of address from the review and going back leaves the address as it was', async ({ page }) => {
    const api = await mockApi(page);
    await signUpTo(page, 'review');

    await page.getByRole('button', { name: 'Edit address' }).click();
    await page.getByRole('button', { name: 'Use an email I already have' }).click();
    await heading(page, 'Use your current email.').waitFor();
    await page.getByRole('link', { name: 'Back' }).click();

    await expect(heading(page, 'Everything look right?')).toBeVisible();
    await expect(page.getByRole('definition').filter({ hasText: person.address })).toBeVisible();
    await page.getByRole('button', { name: 'Agree and create account' }).click();
    await expect(heading(page, 'You’re in, Amara.')).toBeVisible();
    expect(registrations(api)[0]!.body).toMatchObject({ email: person.address });
  });

  test('the same holds from an existing email towards a Yahel address', async ({ page }) => {
    await mockApi(page);
    await signUpTo(page, 'review', { address: 'own' });

    await page.getByRole('button', { name: 'Edit address' }).click();
    await page.getByRole('button', { name: 'Get a Yahel address instead' }).click();
    await heading(page, 'Pick your address.').waitFor();
    await page.getByRole('link', { name: 'Back' }).click();

    await expect(heading(page, 'Everything look right?')).toBeVisible();
    await expect(page.getByRole('definition').filter({ hasText: person.ownEmail })).toBeVisible();
  });

  test('after an edit is left with Back, the Back links walk back through the questions again', async ({ page }) => {
    await mockApi(page);
    await signUpTo(page, 'review');
    await page.getByRole('button', { name: 'Edit name' }).click();
    await page.getByRole('link', { name: 'Back' }).click();
    await heading(page, 'Everything look right?').waitFor();

    await page.getByRole('link', { name: 'Back' }).click();
    await expect(heading(page, 'Ways back in.')).toBeVisible();
    await page.getByRole('link', { name: 'Back' }).click();
    await expect(heading(page, 'Create a password.')).toBeVisible();
  });

  test('the browser’s Back to the passkey prompt after a passkey was saved shows the offer, which says so', async ({ page }) => {
    await mockApi(page);
    await signUpToPasskeyOffer(page);
    await page.getByRole('button', { name: 'Add a passkey' }).click();
    await page.getByText('Passkey saved', { exact: true }).waitFor();

    await page.goBack();

    await expect(page).toHaveURL(at('/personal/add-passkey'));
    await expect(page.getByText('Passkey saved', { exact: true })).toBeVisible();
  });

  test('the terms and the privacy policy open in a new tab, so the answers are not lost by reading them', async ({ page }) => {
    await mockApi(page);
    await signUpTo(page, 'review');

    for (const name of ['Terms', 'Privacy Policy']) {
      const link = page.getByRole('main').getByRole('link', { name: new RegExp(`^${name}`) });
      await expect(link).toHaveAttribute('target', '_blank');
      await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      await expect(link).toHaveAccessibleName(new RegExp('opens in a new tab'));
    }
  });

  test('the signed-in screens say whose account it is', async ({ page }) => {
    await mockApi(page);
    await signUpTo(page, 'review', { phone: true });
    await expect(page.getByRole('button', { name: /^Account: / })).toHaveCount(0);
    await page.getByRole('button', { name: 'Agree and create account' }).click();
    const account = page.getByRole('banner').getByRole('button', { name: `Account: ${person.address}` });

    await heading(page, 'Enter the code.').waitFor();
    await expect(account).toBeAttached();
    await expect(page.getByRole('banner').getByText('AO')).toBeVisible();
    await page.getByRole('button', { name: 'Skip for now' }).click();
    await heading(page, 'You’re in, Amara.').waitFor();
    await expect(account).toBeAttached();
    await page.getByRole('link', { name: /Add someone you trust/ }).click();
    await heading(page, 'Add someone you trust.').waitFor();
    await expect(account).toBeAttached();
    await expect(page.getByRole('banner').getByText('AO')).toBeVisible();
  });

  test('the review’s action is reachable: in view at once on a computer, and never under the demo label', async ({ page, isMobile }) => {
    await mockApi(page);
    await signUpTo(page, 'review', { phone: true });
    const action = page.getByRole('button', { name: 'Agree and create account' });

    if (isMobile) await action.scrollIntoViewIfNeeded();
    await expect(action).toBeInViewport({ ratio: 1 });
    const [button, label] = await Promise.all([action.boundingBox(), page.getByRole('note').boundingBox()]);
    const overlap = button!.x < label!.x + label!.width && label!.x < button!.x + button!.width && button!.y < label!.y + label!.height && label!.y < button!.y + button!.height;
    expect(overlap).toBe(false);
  });

  test('a phone the server will not take is said to be refused, not unconfirmed', async ({ page }) => {
    const api = await mockApi(page);
    await signUpTo(page, 'review', { phone: true, recoveryEmail: false });
    api.failNext('/v1/auth/phone/send-otp', 409, 'PHONE_ALREADY_IN_USE');

    await page.getByRole('button', { name: 'Agree and create account' }).click();

    await expect(heading(page, 'You’re in, Amara.')).toBeVisible();
    await expect(page.getByText('This number can’t be used. Try another one in your account.')).toBeVisible();
    await expect(page.getByText('isn’t confirmed yet')).toHaveCount(0);
  });

  test('a taken name that was typed and left is still in the field on return, with what is known about it', async ({ page }) => {
    await mockApi(page);
    await signUpTo(page, 'address');
    await page.getByLabel('Your Yahel address').fill('amara');
    await page.getByText('That address is taken. Try one of these.').waitFor();

    await page.getByRole('link', { name: 'Back' }).click();
    await proceed(page);

    await expect(page.getByLabel('Your Yahel address')).toHaveValue('amara');
    await expect(page.getByText('That address is taken. Try one of these.')).toBeVisible();
    await page.getByLabel('Your Yahel address').fill('');
    await expect(page.getByText('That address is taken.')).toHaveCount(0);
  });
});
