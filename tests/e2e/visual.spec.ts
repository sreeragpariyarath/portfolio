import { expect, test, type Page } from '@playwright/test';
import { blockRemoteFonts, openApp } from './helpers';

// Visual baselines for the DOM overlays (the scene itself is hidden, see
// helpers.ts). Baselines are created on the GitHub Linux runner because text
// and SVG render differently per OS. Set VISUAL_LOCAL=1 to run them locally
// against throwaway, git-ignored baselines.
//
// One short test per screen: a long test that loads the page many times can hit
// the timeout on a slow runner, and a failure then names the exact screen.
// They only run when asked (VISUAL_TESTS=1 on Linux CI once the baselines are
// committed, or VISUAL_LOCAL=1 for a local experiment), so a missing baseline
// never turns the pipeline red by surprise.
test.skip(
  !process.env.VISUAL_TESTS && !process.env.VISUAL_LOCAL,
  'Visual baselines are opt-in until they are committed',
);

const SHOT = { animations: 'disabled', maxDiffPixelRatio: 0.002 } as const;

type Size = { label: string; width: number; height: number };
const WIDE: Size[] = [
  { label: '1600x900', width: 1600, height: 900 },
  { label: '1280x800', width: 1280, height: 800 },
  { label: '1280x700', width: 1280, height: 700 },
  { label: '360x740', width: 360, height: 740 },
];
const PANEL_SIZES = WIDE.filter((v) => v.label === '1280x800' || v.label === '360x740');
const PROJECTS = [
  { id: 'hupe', index: 0 },
  { id: 'warox', index: 1 },
  { id: 'erris', index: 2 },
  { id: 'yexora', index: 3 },
];

test.beforeEach(async ({ page }) => {
  await blockRemoteFonts(page);
});

// The mobile project already emulates a real phone (Pixel 7), so it gets one
// pass at its own size. The desktop project walks through the explicit sizes.
function sizesFor(project: string, sizes: Size[]): Array<Size | { label: string }> {
  return project === 'mobile' ? [{ label: 'pixel7' }] : sizes;
}

async function ready(page: Page, size: Size | { label: string }) {
  if ('width' in size) await page.setViewportSize({ width: size.width, height: size.height });
  await openApp(page, { hideScene: true });
}

const PANELS: Array<{ name: string; open: (page: Page) => Promise<unknown> }> = [
  { name: 'journal', open: (page) => page.getByRole('button', { name: /Project journal/ }).click() },
  { name: 'map', open: (page) => page.getByRole('button', { name: 'Open world map' }).first().click() },
  { name: 'maker', open: (page) => page.getByRole('button', { name: /Meet the maker/ }).click() },
  // Touch layouts hide the help button, the keyboard shortcut always works.
  { name: 'help', open: (page) => page.keyboard.press('?') },
];

test.describe('screens', () => {
  for (const screen of ['intro', 'exploring'] as const) {
    for (const size of [...WIDE, { label: 'pixel7' }]) {
      test(`${screen} at ${size.label}`, async ({ page }, info) => {
        const wanted = sizesFor(info.project.name, WIDE).some((s) => s.label === size.label);
        test.skip(!wanted, 'Size belongs to the other project');
        await ready(page, size);
        if (screen === 'exploring') await page.getByRole('button', { name: /Take a walk/ }).click();
        await expect(page).toHaveScreenshot(`${screen}-${size.label}.png`, SHOT);
      });
    }
  }
});

test.describe('panels', () => {
  for (const panel of PANELS) {
    for (const size of [...PANEL_SIZES, { label: 'pixel7' }]) {
      test(`${panel.name} panel at ${size.label}`, async ({ page }, info) => {
        const wanted = sizesFor(info.project.name, PANEL_SIZES).some((s) => s.label === size.label);
        test.skip(!wanted, 'Size belongs to the other project');
        await ready(page, size);
        await panel.open(page);
        await expect(page.getByRole('dialog')).toBeVisible();
        await expect(page).toHaveScreenshot(`panel-${panel.name}-${size.label}.png`, SHOT);
      });
    }
  }
});

test.describe('project panels', () => {
  for (const project of PROJECTS) {
    for (const size of [...PANEL_SIZES, { label: 'pixel7' }]) {
      test(`${project.id} at ${size.label}, top and bottom`, async ({ page }, info) => {
        const wanted = sizesFor(info.project.name, PANEL_SIZES).some((s) => s.label === size.label);
        test.skip(!wanted, 'Size belongs to the other project');
        await ready(page, size);
        await page.getByRole('button', { name: /Project journal/ }).click();
        await page.getByRole('button', { name: /Read field notes/ }).nth(project.index).click();
        const dialog = page.getByRole('dialog');
        await expect(dialog).toBeVisible();
        await expect(page).toHaveScreenshot(`project-${project.id}-top-${size.label}.png`, SHOT);
        await dialog.evaluate((element) => element.scrollTo(0, element.scrollHeight));
        await expect(page).toHaveScreenshot(`project-${project.id}-bottom-${size.label}.png`, SHOT);
      });
    }
  }
});
