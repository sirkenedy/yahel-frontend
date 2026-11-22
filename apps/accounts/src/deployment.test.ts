import { describe, expect, it, vi } from 'vitest';
import { assertDeployment, deploymentProblem } from './deployment';

const released = { isProductionBuild: true, hostname: 'accounts.yahel.example', apiUrl: 'https://api.yahel.example/api', appUrl: 'https://app.yahel.example/' };

describe('deploymentProblem', () => {
  it('finds nothing wrong with a build that names the backend and the app over https', () => {
    expect(deploymentProblem(released)).toBeNull();
  });

  it.each([
    ['the backend is missing', { apiUrl: undefined }, /without VITE_API_URL set/],
    ['the backend is empty', { apiUrl: '' }, /without VITE_API_URL set/],
    ['the backend is plain http', { apiUrl: 'http://api.yahel.example/api' }, /without VITE_API_URL set/],
    ['the backend is not an address', { apiUrl: 'api.yahel.example' }, /without VITE_API_URL set/],
    ['the app is missing', { appUrl: undefined }, /without VITE_APP_URL set/],
    ['the app is a development address', { appUrl: 'http://localhost:5173/' }, /without VITE_APP_URL set/],
    ['both are missing', { apiUrl: undefined, appUrl: undefined }, /without VITE_API_URL and VITE_APP_URL set/],
  ])('refuses a built bundle on a public host when %s', (_name, change, message) => {
    const problem = deploymentProblem({ ...released, ...change });

    expect(problem).toMatch(message);
    expect(problem).toContain('accounts.yahel.example');
  });

  it.each(['localhost', '127.0.0.1', '[::1]'])('lets a built bundle with development addresses run on %s', (hostname) => {
    expect(deploymentProblem({ isProductionBuild: true, hostname, apiUrl: undefined, appUrl: undefined })).toBeNull();
  });

  it.each(['localhost.yahel.example', 'notlocalhost', '127.0.0.1.example', '192.168.1.20'])('does not mistake %s for this machine', (hostname) => {
    expect(deploymentProblem({ ...released, hostname, apiUrl: undefined })).not.toBeNull();
  });

  it('leaves the development server alone wherever it is reached from', () => {
    expect(deploymentProblem({ isProductionBuild: false, hostname: 'accounts.yahel.example', apiUrl: undefined, appUrl: undefined })).toBeNull();
  });
});

describe('assertDeployment', () => {
  it('says why in the console and throws, so nothing is mounted', () => {
    const report = vi.fn();

    expect(() => assertDeployment({ ...released, apiUrl: undefined }, report)).toThrow(/will not start/);
    expect(report).toHaveBeenCalledWith(expect.stringContaining('VITE_API_URL'));
  });

  it('does nothing for a sound deployment', () => {
    const report = vi.fn();

    expect(() => assertDeployment(released, report)).not.toThrow();
    expect(report).not.toHaveBeenCalled();
  });
});
