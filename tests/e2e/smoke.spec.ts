import { expect, test } from '@playwright/test';
import { loadingNotice, worldHost } from './helpers';

test('loads the world with no script or CSP errors', async ({ page }) => {
  const problems: string[] = [];
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error') problems.push(`console: ${m.text()}`);
  });
  const response = await page.goto('/');
  // Without the header the CSP check below would prove nothing.
  expect(response?.headers()['content-security-policy']).toContain("default-src 'self'");
  await expect(worldHost(page)).toBeVisible();
  await expect(loadingNotice(page)).toBeHidden({ timeout: 20000 });
  await expect(page.getByRole('heading', { name: 'The world needs a fresh page.' })).toHaveCount(0);
  await expect(worldHost(page).locator('canvas, svg').first()).toBeAttached();
  expect(problems).toEqual([]);
});

test('project journal lists every project and closes with Escape', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Project journal/ }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('article')).toHaveCount(4);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
});

test('maker panel links to GitHub and LinkedIn', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Meet the maker/ }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('link', { name: /GitHub/ })).toHaveAttribute(
    'href',
    /github\.com\/sreeragpariyarath/,
  );
  await expect(dialog.getByRole('link', { name: /LinkedIn/ })).toHaveAttribute(
    'href',
    /linkedin\.com\/in\//,
  );
});

test('the J key opens the journal', async ({ page }, info) => {
  test.skip(info.project.name === 'mobile', 'Keyboard shortcut');
  await page.goto('/');
  await worldHost(page).focus();
  await page.keyboard.press('j');
  await expect(page.getByRole('dialog')).toBeVisible();
});
