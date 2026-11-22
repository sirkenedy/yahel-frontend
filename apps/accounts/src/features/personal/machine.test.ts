import { describe, expect, it } from 'vitest';
import { addressOf, backOf, directionOf, initialPersonalState, nextOf, personalSteps, progressOf, reduce, resumeStep, stepOfPath, stepPath } from './machine';
import type { PersonalEvent, PersonalFacts, PersonalState, PersonalStep } from './machine';

const facts: PersonalFacts = { passkeysOffered: true, contactOffered: true };
const attestation = { credentialId: 'id', clientDataJSON: 'c', attestationObject: 'a', transports: [] };
const after = (...events: PersonalEvent[]) => events.reduce(reduce, initialPersonalState);

const named: PersonalEvent = { type: 'name-entered', firstName: 'Amara', lastName: 'Okafor' };
const born: PersonalEvent = { type: 'birth-entered', birth: { day: 14, month: 3, year: 1994 }, gender: 'woman' };
const addressed: PersonalEvent = { type: 'address-chosen', username: 'amara.okafor' };
const secured: PersonalEvent = { type: 'password-chosen', password: 'Sunrise over Lekki 94' };
const recoverable: PersonalEvent = { type: 'recovery-entered', country: 'NG', phone: '803 555 0142', email: 'amara.o@personal.example' };
const answered = [named, born, addressed, secured, recoverable];
const started = [...answered, { type: 'creation-started' } as const];

describe('reduce', () => {
  it('collects the answers step by step', () => {
    expect(after(...answered)).toMatchObject({
      firstName: 'Amara',
      lastName: 'Okafor',
      birth: { day: 14, month: 3, year: 1994 },
      gender: 'woman',
      addressKind: 'yahel',
      username: 'amara.okafor',
      password: 'Sunrise over Lekki 94',
      recovery: { country: 'NG', phone: '803 555 0142', email: 'amara.o@personal.example' },
      recoveryAnswered: true,
    });
  });

  it('switches between a Yahel address and an existing email without losing either', () => {
    const state = after(addressed, { type: 'own-email-chosen', email: 'amara@mail.example' });
    expect(state).toMatchObject({ addressKind: 'own', ownEmail: 'amara@mail.example', username: 'amara.okafor' });
    expect(reduce(state, { type: 'address-kind-chosen', kind: 'yahel' }).addressKind).toBe('yahel');
  });

  it('skipping recovery clears what was typed there and still lets the review show', () => {
    expect(after(recoverable, { type: 'recovery-skipped' })).toMatchObject({ recovery: { phone: '', email: '' }, recoveryAnswered: true });
  });

  it('keeps the passkey’s public half and the two choices', () => {
    const state = after({ type: 'passkey-started' }, { type: 'passkey-created', attestation }, { type: 'preferences-changed', preferences: { productNews: true, activityHistory: false } });
    expect(state).toMatchObject({ passkeyStarted: true, passkey: attestation, preferences: { productNews: true, activityHistory: false } });
  });

  it('drops the password the moment the new account is signed in to', () => {
    const state = after(...started, { type: 'account-created' }, { type: 'signed-in' });
    expect(state.password).toBeNull();
    expect(state.creation).toMatchObject({ created: true, signedIn: true });
  });

  it('treats a sign-in after a conflict as proof the account is this person’s', () => {
    const state = after(...started, { type: 'account-conflicted' }, { type: 'signed-in' });
    expect(state.creation).toMatchObject({ created: true, conflicted: false, signedIn: true });
  });

  it('records each part of setting up as settled, and which could not be saved', () => {
    const state = after(...started, { type: 'setup-settled', part: 'recoveryEmail', saved: true }, { type: 'phone-code-sent' }, { type: 'setup-settled', part: 'phone', saved: false });
    expect(state.creation).toMatchObject({ settled: ['recoveryEmail', 'phone'], unsaved: ['phone'], phoneCodeAwaited: false });
  });

  it('tracks the stage, the email code and the finish', () => {
    const state = after(...started, { type: 'creation-stage', stage: 'signing-in' }, { type: 'email-code-needed' });
    expect(state.creation).toMatchObject({ stage: 'signing-in', emailCode: 'awaited' });
    expect(reduce(state, { type: 'email-confirmed' }).creation.emailCode).toBe('confirmed');
    expect(reduce(state, { type: 'creation-finished' }).creation.finished).toBe(true);
  });

  it('ends the attempt when an answer is refused, keeps every answer, and sends the person back to change that one', () => {
    const state = after(...started, { type: 'account-conflicted' }, { type: 'answer-rejected', rejection: { step: 'address', reason: 'taken' } });
    expect(state).toMatchObject({ rejection: { step: 'address', reason: 'taken' }, editing: true, username: 'amara.okafor', password: 'Sunrise over Lekki 94' });
    expect(state.creation).toEqual(initialPersonalState.creation);
  });

  it('forgets a refusal once that answer is given again, and only then', () => {
    const refused = after(...answered, { type: 'answer-rejected', rejection: { step: 'address', reason: 'taken' } });
    expect(reduce(refused, born).rejection).not.toBeNull();
    expect(reduce(refused, { type: 'address-chosen', username: 'okafor.amara' }).rejection).toBeNull();
    const young = after({ type: 'answer-rejected', rejection: { step: 'birth', reason: 'underage' } });
    expect(reduce(young, born).rejection).toBeNull();
    const notPersonal = after({ type: 'answer-rejected', rejection: { step: 'own-email', reason: 'not-personal' } });
    expect(reduce(notPersonal, { type: 'own-email-chosen', email: 'amara@mail.example' }).rejection).toBeNull();
  });

  it('marks an edit from the review, and its end', () => {
    expect(after({ type: 'edit-started' }).editing).toBe(true);
    expect(after({ type: 'edit-started' }, { type: 'edit-finished' }).editing).toBe(false);
  });

  it('remembers who was invited as a trusted contact', () => {
    expect(after({ type: 'contact-invited', email: 'chidi@personal.example' }).contactInvited).toBe('chidi@personal.example');
  });
});

describe('addressOf', () => {
  it('is the chosen name on the mail domain, or the person’s own email', () => {
    expect(addressOf(after(addressed), 'yahel.example')).toBe('amara.okafor@yahel.example');
    expect(addressOf(after({ type: 'own-email-chosen', email: 'amara@mail.example' }), 'yahel.example')).toBe('amara@mail.example');
  });
});

describe('resumeStep', () => {
  const resume = (step: PersonalStep, state: PersonalState, given = facts) => resumeStep(step, state, given);

  it('starts a fresh visit at the first question it can, whatever address was asked for', () => {
    for (const step of personalSteps) expect(['type', 'name']).toContain(resume(step, initialPersonalState));
    expect(resume('type', initialPersonalState)).toBe('type');
    expect(resume('review', initialPersonalState)).toBe('name');
  });

  it.each([
    ['birth', [named], 'birth'],
    ['address', [named], 'birth'],
    ['address', [named, born], 'address'],
    ['own-email', [named, born], 'own-email'],
    ['password', [named, born], 'address'],
    ['password', [named, born, addressed], 'password'],
    ['add-passkey', [named, born, addressed], 'password'],
    ['add-passkey', [named, born, addressed, secured], 'add-passkey'],
    ['passkey', [named, born, addressed, secured], 'add-passkey'],
    ['passkey', [named, born, addressed, secured, { type: 'passkey-started' }], 'passkey'],
    ['recovery', [named, born, addressed, secured], 'recovery'],
    ['review', [named, born, addressed, secured], 'recovery'],
    ['review', answered, 'review'],
    ['creating', answered, 'review'],
    ['creating', started, 'creating'],
    ['ready', started, 'creating'],
    ['own-code', answered, 'review'],
    ['contact', answered, 'review'],
  ] as const)('asked for %s after %j, shows %s', (step, events, shown) => {
    expect(resume(step, after(...events))).toBe(shown);
  });

  it('asks for the kind of address that was chosen when the password step has none', () => {
    expect(resume('password', after(named, born, { type: 'address-kind-chosen', kind: 'own' }))).toBe('own-email');
  });

  it('skips the passkey steps in a browser that cannot make one', () => {
    const none = { ...facts, passkeysOffered: false };
    expect(resume('add-passkey', after(named, born, addressed, secured), none)).toBe('recovery');
    expect(resume('passkey', after(named, born, addressed, secured, { type: 'passkey-started' }), none)).toBe('recovery');
  });

  it('shows only what comes after once the account exists: the answers are final', () => {
    const created = after(...started, { type: 'account-created' });
    for (const step of ['name', 'birth', 'address', 'password', 'review', 'ready'] as const) expect(resume(step, created)).toBe('creating');

    const signedIn = reduce(created, { type: 'signed-in' });
    expect(resume('review', signedIn)).toBe('creating');

    const awaitingPhone = reduce(signedIn, { type: 'phone-code-sent' });
    expect(resume('ready', awaitingPhone)).toBe('code');
    expect(resume('name', awaitingPhone)).toBe('code');

    const finished = reduce(signedIn, { type: 'creation-finished' });
    for (const step of ['type', 'review', 'creating', 'code', 'ready'] as const) expect(resume(step, finished)).toBe('ready');
    expect(resume('contact', finished)).toBe('contact');
    expect(resume('contact', finished, { ...facts, contactOffered: false })).toBe('ready');
  });

  it('holds the person at the email code while one is awaited, even before the account is known to be theirs', () => {
    const awaiting = after(...started, { type: 'account-conflicted' }, { type: 'email-code-needed' });
    for (const step of ['name', 'review', 'creating', 'ready'] as const) expect(resume(step, awaiting)).toBe('own-code');
    expect(resume('own-code', reduce(awaiting, { type: 'email-confirmed' }))).toBe('creating');
  });
});

describe('backOf', () => {
  const back = (step: PersonalStep, state = initialPersonalState, given = facts) => backOf(step, state, given);

  it('leads one question back, and nowhere from the first or from anything after the account exists', () => {
    expect(personalSteps.map((step) => [step, back(step)])).toEqual([
      ['type', null],
      ['name', 'type'],
      ['birth', 'name'],
      ['address', 'birth'],
      ['own-email', 'address'],
      ['password', 'address'],
      ['add-passkey', 'password'],
      ['passkey', 'add-passkey'],
      ['recovery', 'add-passkey'],
      ['review', 'recovery'],
      ['creating', null],
      ['own-code', null],
      ['code', null],
      ['ready', null],
      ['contact', 'ready'],
    ]);
  });

  it('follows the kind of address and what the browser offers', () => {
    expect(back('password', after({ type: 'address-kind-chosen', kind: 'own' }))).toBe('own-email');
    expect(back('recovery', initialPersonalState, { ...facts, passkeysOffered: false })).toBe('password');
  });

  it('returns to the review from an answer that is being changed', () => {
    const editing = after(...answered, { type: 'edit-started' });
    for (const step of ['name', 'birth', 'address', 'own-email', 'password', 'recovery'] as const) expect(back(step, editing)).toBe('review');
    expect(back('add-passkey', editing)).toBe('password');
  });
});

describe('nextOf', () => {
  it('walks the questions in the designed order', () => {
    const state = after(...answered);
    expect((['type', 'name', 'birth', 'address', 'own-email', 'password', 'add-passkey', 'passkey', 'recovery'] as const).map((step) => nextOf(step, state, facts))).toEqual(['name', 'birth', 'address', 'password', 'password', 'add-passkey', 'recovery', 'recovery', 'review']);
  });

  it('does not offer a passkey where none can be made, or a second one', () => {
    expect(nextOf('password', after(...answered), { ...facts, passkeysOffered: false })).toBe('recovery');
    expect(nextOf('password', after(...answered, { type: 'passkey-created', attestation }), facts)).toBe('recovery');
  });

  it('returns to the review after an answer changed from there, the passkey offer included', () => {
    const editing = after(...answered, { type: 'edit-started' });
    expect((['name', 'birth', 'address', 'own-email', 'add-passkey', 'passkey', 'recovery'] as const).map((step) => nextOf(step, editing, facts))).toEqual(Array(7).fill('review'));
    expect(nextOf('password', editing, facts)).toBe('add-passkey');
    expect(nextOf('password', editing, { ...facts, passkeysOffered: false })).toBe('review');
  });
});

describe('progressOf', () => {
  it('counts the six questions and leaves the rest uncounted', () => {
    expect(personalSteps.map((step) => progressOf(step)?.current ?? null)).toEqual([null, 1, 2, 3, 3, 4, 4, 4, 5, 6, null, null, null, null, null]);
    expect(progressOf('passkey')?.part).toBe('sign-in');
    expect(progressOf('add-passkey')?.part).toBe('password');
  });
});

describe('step addresses', () => {
  it('gives every step its own address and reads it back', () => {
    for (const step of personalSteps) expect(stepOfPath(stepPath(step))).toBe(step);
    expect(stepOfPath('/personal/name/')).toBe('name');
    expect(stepOfPath('/personal')).toBeNull();
    expect(stepOfPath('/signin/password')).toBeNull();
  });

  it('knows which way a move goes', () => {
    expect(directionOf('name', 'birth')).toBe('forward');
    expect(directionOf('review', 'name')).toBe('back');
  });
});
