import { createAccountCapabilities } from '@yahel/api-client';
import { browserPasskeyEnvironment, createBrowserSession, createPasskeyClient, createPasskeyRegistrar } from '@yahel/auth';
import { config } from './config';

// This app's addresses carry no slot, so a tab remembers its own across a reload (a number, never a token).
export const session = createBrowserSession(config.apiUrl, { rememberSlot: true });

// The comparison is on the build-time value itself so that a normal build drops the import, and the
// stand-in module with it, entirely. A demo build opened at an address carrying `stand-ins=off` runs as a
// release build would, with nothing standing in, so the browser tests can walk the release path (F-79).
const loadStandIns = async () =>
  import.meta.env.VITE_STAND_INS === 'on' && new URLSearchParams(window.location.search).get('stand-ins') !== 'off' ? (await import('@yahel/api-client/standins')).createStandIns() : undefined;

export const loadCapabilities = async () => {
  const capabilities = createAccountCapabilities(session.api, await loadStandIns());
  return {
    capabilities,
    passkeys: createPasskeyClient(capabilities.passkeys, browserPasskeyEnvironment()),
    registrar: capabilities.passkeyRegistration ? createPasskeyRegistrar(capabilities.passkeyRegistration, browserPasskeyEnvironment()) : null,
  };
};
