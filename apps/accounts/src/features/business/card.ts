// What can be known about a payment card from what is typed, without asking anyone. Format only: whether
// the card exists or has money is the bank's to say. Nothing here keeps what it is given.

const notDigits = /\D/g;
const expiryShape = /^(\d{2})\/(\d{2})$/;
const securityCodeShape = /^\d{3,4}$/;

export const cardDigits = (typed: string) => typed.replace(notDigits, '');

/** The number as it is shown while typed: at most nineteen digits, in fours. */
export const formatCardNumber = (typed: string) => cardDigits(typed).slice(0, 19).replace(/(\d{4})(?=\d)/g, '$1 ');

/** The expiry as it is shown while typed: MM/YY. */
export const formatExpiry = (typed: string) => {
  const digits = cardDigits(typed).slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
};

export const formatSecurityCode = (typed: string) => cardDigits(typed).slice(0, 4);

/** The Luhn check every card number passes: it catches a mistyped or transposed digit. */
export function passesLuhn(digits: string) {
  let sum = 0;
  for (let index = 0; index < digits.length; index += 1) {
    const digit = Number(digits[digits.length - 1 - index]);
    const doubled = index % 2 === 1 ? digit * 2 : digit;
    sum += doubled > 9 ? doubled - 9 : doubled;
  }
  return digits.length > 0 && sum % 10 === 0;
}

export const isCardNumber = (typed: string) => {
  const digits = cardDigits(typed);
  return digits.length >= 13 && digits.length <= 19 && passesLuhn(digits);
};

export type CardBrand = 'Visa' | 'Mastercard' | 'Verve';

/** The card's network, from how its number begins; `null` until that is clear. */
export function brandOf(typed: string): CardBrand | null {
  const digits = cardDigits(typed);
  if (/^4/.test(digits)) return 'Visa';
  if (/^(506|507|650)/.test(digits)) return 'Verve';
  return /^(5[1-5]|2[2-7])/.test(digits) ? 'Mastercard' : null;
}

/** `shape`: not MM/YY with a real month. `expired`: its last month is over. */
export function expiryProblem(typed: string, today = new Date()): 'shape' | 'expired' | null {
  const match = expiryShape.exec(typed.trim());
  if (!match) return 'shape';
  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);
  if (month < 1 || month > 12) return 'shape';
  // A card is good to the end of the month printed on it.
  return year < today.getFullYear() || (year === today.getFullYear() && month < today.getMonth() + 1) ? 'expired' : null;
}

export const isSecurityCode = (typed: string) => securityCodeShape.test(typed);
