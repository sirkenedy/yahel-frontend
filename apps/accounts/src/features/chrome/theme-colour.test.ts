import { afterEach, describe, expect, it, vi } from 'vitest';
import { followSystemThemeColour, syncThemeColour } from './theme-colour';

const meta = () => document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
const setCanvas = (colour: string) => document.documentElement.style.setProperty('--ws-color-daylight-canvas', colour);

afterEach(() => {
  meta()?.remove();
  document.documentElement.style.removeProperty('--ws-color-daylight-canvas');
  vi.unstubAllGlobals();
});

describe('theme colour', () => {
  it('takes the browser chrome colour from the canvas token, creating the tag once', () => {
    setCanvas(' #F6F5F1 ');
    syncThemeColour();
    expect(meta()).toHaveAttribute('content', '#F6F5F1');

    setCanvas('#0B0D1F');
    syncThemeColour();
    expect(document.querySelectorAll('meta[name="theme-color"]')).toHaveLength(1);
    expect(meta()).toHaveAttribute('content', '#0B0D1F');
  });

  it('adds nothing when the styles have not loaded', () => {
    syncThemeColour();

    expect(meta()).toBeNull();
  });

  it('follows the system when it switches between light and dark', () => {
    let systemChanged = () => {};
    vi.stubGlobal('matchMedia', () => ({ addEventListener: (_event: string, listener: () => void) => (systemChanged = listener) }));
    setCanvas('#F6F5F1');
    followSystemThemeColour();
    expect(meta()).toHaveAttribute('content', '#F6F5F1');

    setCanvas('#0B0D1F');
    systemChanged();
    expect(meta()).toHaveAttribute('content', '#0B0D1F');
  });
});
