// What counts as a usable address or mail domain. One definition, used when the app is built
// (`build-guards.ts`), when it starts (`deployment.ts`) and when it reads its settings (`config.ts`).

export const isSecureAddress = (value: string | undefined) => {
  try {
    return new URL(value ?? '').protocol === 'https:';
  } catch {
    return false;
  }
};

const hostName = /^(?=.{1,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;

/** A domain as it appears after the @ of an address: labels of letters, digits and hyphens, and a top-level name. */
export const isMailDomain = (value: string | undefined) => hostName.test((value ?? '').trim().toLowerCase());
