import { expect, type Page } from '@playwright/test';

export const WORLD = { name: '3D sketch world' } as const;

// The scene is drawn on a canvas (or an SVG in the vector fallback) inside the
// element with role "application". Hiding it leaves only the DOM overlays, which
// are what the visual baselines compare. Role and tag selectors survive a CSS
// rename, class selectors would not.
const HIDE_SCENE = '[role="application"] canvas, [role="application"] svg { visibility: hidden !important; }';

export function worldHost(page: Page) {
  return page.getByRole('application', WORLD);
}

export function loadingNotice(page: Page) {
  return page.getByRole('status').filter({ hasText: 'Drawing the long way home' });
}

/** Fonts come from Google, so block them: the fallback fonts are deterministic. */
export async function blockRemoteFonts(page: Page) {
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (route) => route.abort());
}

export async function openApp(page: Page, options: { hideScene?: boolean } = {}) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(worldHost(page)).toBeVisible();
  await expect(loadingNotice(page)).toBeHidden({ timeout: 20000 });
  if (options.hideScene) await page.addStyleTag({ content: HIDE_SCENE });
  await page.evaluate(() => document.fonts.ready);
}
