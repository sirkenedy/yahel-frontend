import { createAccountCapabilities } from '@yahel/api-client';
import { browserPasskeyEnvironment, createBrowserSession, createPasskeyClient, createPasskeyRegistrar } from '@yahel/auth';
import { config } from './config';

export const session = createBrowserSession(config.apiUrl);

// The comparison is on the build-time value itself so that a normal build drops the import, and the
// stand-in module with it, entirely.
const loadStandIns = async () => (import.meta.env.VITE_STAND_INS === 'on' ? (await import('@yahel/api-client/standins')).createStandIns() : undefined);

export const loadCapabilities = async () => {
  const capabilities = createAccountCapabilities(session.api, await loadStandIns());
  return {
    capabilities,
    passkeys: capabilities.passkeys ? createPasskeyClient(capabilities.passkeys, browserPasskeyEnvironment()) : null,
    registrar: capabilities.passkeyRegistration ? createPasskeyRegistrar(capabilities.passkeyRegistration, browserPasskeyEnvironment()) : null,
  };
};
