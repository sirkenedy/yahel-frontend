import { isEmailShaped, newPasswordProblem } from '../../flow/credentials';
import { cardDigits, expiryProblem, isCardNumber, isSecurityCode } from './card';
import { NIGERIA } from './countries';
import { businessMessages as m } from './messages';

const MAX_BUSINESS_NAME = 100;
const MAX_NAME = 50;
// One or more labels and a top-level name of letters, which is also what the backend accepts.
const domainShape = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}$/;
const usernameShape = /^[a-z0-9]+(\.[a-z0-9]+)*$/;
const MIN_USERNAME = 2;
const MAX_SLUG = 50;
export const CARD_CODE_LENGTH = 6;

export const businessNameProblem = (name: string) => (name.trim() === '' ? m.businessNameRequired : name.trim().length > MAX_BUSINESS_NAME ? m.businessNameTooLong : null);
export const firstNameProblem = (name: string) => (name.trim() === '' ? m.firstNameRequired : name.trim().length > MAX_NAME ? m.nameTooLong : null);
export const lastNameProblem = (name: string) => (name.trim().length > MAX_NAME ? m.nameTooLong : null);
export const contactEmailProblem = (email: string) => (isEmailShaped(email) ? null : m.contactEmailInvalid);

/** A domain as it is kept: without the spaces, capitals or leading @ people type around it. */
export const normaliseDomain = (typed: string) => typed.trim().toLowerCase().replace(/^@/, '');

export const domainProblem = (typed: string) => (normaliseDomain(typed) === '' ? m.domainRequired : domainShape.test(normaliseDomain(typed)) ? null : m.domainInvalid);

export const normaliseUsername = (typed: string) => typed.trim().toLowerCase();
export const usernameProblem = (typed: string) => (normaliseUsername(typed).length >= MIN_USERNAME && usernameShape.test(normaliseUsername(typed)) ? null : m.usernameInvalid);
/** A first guess at the administrator's username, from their first name. */
export const usernameFromName = (firstName: string) => firstName.toLowerCase().replace(/[^a-z0-9]+/g, '') || 'admin';

export const passwordProblem = (password: string) => newPasswordProblem(password, m);
export const confirmProblem = (again: string, password: string) => (again === '' ? m.confirmRequired : again === password ? null : m.confirmMismatch);

export const streetProblem = (street: string) => (street.trim() === '' ? m.streetRequired : null);
export const cityProblem = (city: string) => (city.trim() === '' ? m.cityRequired : null);
export const stateProblem = (state: string, country: string) => (state.trim() === '' ? (country === NIGERIA ? m.stateRequired : m.regionRequired) : null);
export const phoneProblem = (phone: string) => (phone.replace(/\D/g, '').length < 7 ? m.phoneInvalid : null);

/** A team larger than the chips go: a whole number above the largest chip. */
export const largeTeamProblem = (typed: string, largestChip: number) => (/^\d+$/.test(typed.trim()) && Number(typed) > largestChip ? null : m.seatsMoreInvalid(largestChip + 1));

export const cardNumberProblem = (typed: string) => (cardDigits(typed) === '' ? m.cardNumberRequired : isCardNumber(typed) ? null : m.cardNumberInvalid);
export const expiryProblemOf = (typed: string, today = new Date()) => ({ shape: m.expiryInvalid, expired: m.expired, none: null })[expiryProblem(typed, today) ?? 'none'];
export const securityCodeProblem = (typed: string) => (isSecurityCode(typed) ? null : m.securityCodeInvalid);
export const nameOnCardProblem = (name: string) => (name.trim() === '' ? m.nameOnCardRequired : null);
export const cardCodeProblem = (code: string) => (code.length === CARD_CODE_LENGTH ? null : m.cardCodeIncomplete);

const asSlug = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_SLUG)
    .replace(/-+$/, '');

/**
 * The workspace's short name in addresses, which the backend requires and the design never asks for: made
 * from the business name, or from the domain when the name has too few letters the backend accepts.
 */
export const slugOf = (businessName: string, domain: string) => (asSlug(businessName).length >= 2 ? asSlug(businessName) : slugOfDomain(domain));

/** A second candidate, used when the first is refused as a duplicate: domains are unique among workspaces, names are not. */
export const slugOfDomain = (domain: string) => asSlug(domain);
