import { expect, test } from '@playwright/test';
import { loadingNotice } from './helpers';

const KEY = 'sreerag-sketchbook-discoveries-v1';
const PROJECTS = ['LearnWithHupe', 'Warox', 'Erris', 'YEXORA'];

const stamp = (page: import('@playwright/test').Page, title: string) =>
  page.getByRole('button', { name: new RegExp(`(Walk to|Read) ${title}`) });

async function boot(page: import('@playwright/test').Page, stored?: string) {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  if (stored !== undefined) {
    await page.addInitScript(([key, value]) => localStorage.setItem(key, value), [KEY, stored]);
  }
  await page.goto('/');
  await expect(loadingNotice(page)).toBeHidden({ timeout: 20000 });
  return errors;
}

test('a first visit starts with nothing discovered', async ({ page }) => {
  const errors = await boot(page);
  for (const title of PROJECTS) await expect(page.getByRole('button', { name: `Walk to ${title}` })).toBeVisible();
  expect(errors).toEqual([]);
});

test('corrupt saved data is ignored without errors', async ({ page }) => {
  const errors = await boot(page, '{this is not json');
  for (const title of PROJECTS) await expect(page.getByRole('button', { name: `Walk to ${title}` })).toBeVisible();
  expect(errors).toEqual([]);
});

test('saved data of the wrong shape is ignored', async ({ page }) => {
  const errors = await boot(page, JSON.stringify({ hupe: true }));
  for (const title of PROJECTS) await expect(page.getByRole('button', { name: `Walk to ${title}` })).toBeVisible();
  expect(errors).toEqual([]);
});

test('unknown and non-string ids are dropped, known ids are kept', async ({ page }) => {
  const errors = await boot(page, JSON.stringify(['hupe', 'no-such-project', 7, null]));
  await expect(stamp(page, 'LearnWithHupe')).toHaveAccessibleName('Read LearnWithHupe');
  for (const title of PROJECTS.slice(1)) await expect(page.getByRole('button', { name: `Walk to ${title}` })).toBeVisible();
  expect(errors).toEqual([]);
});

test('the page still works when storage is blocked', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(() => {
    const deny = () => {
      throw new DOMException('denied', 'SecurityError');
    };
    Storage.prototype.getItem = deny;
    Storage.prototype.setItem = deny;
  });
  await page.goto('/');
  await expect(loadingNotice(page)).toBeHidden({ timeout: 20000 });
  await page.getByRole('button', { name: /Project journal/ }).click();
  await expect(page.getByRole('dialog').getByRole('article')).toHaveCount(4);
  expect(errors).toEqual([]);
});

test('walking to a project discovers it and the discovery survives a reload', async ({ page }) => {
  test.setTimeout(60000);
  await boot(page);
  await page.getByRole('button', { name: 'Walk to LearnWithHupe' }).click();
  await expect(page.getByText('Discovered The learning house')).toBeVisible({ timeout: 30000 });
  await expect.poll(() => page.evaluate((key) => localStorage.getItem(key), KEY)).toContain('hupe');
  await page.reload();
  await expect(loadingNotice(page)).toBeHidden({ timeout: 20000 });
  await expect(stamp(page, 'LearnWithHupe')).toHaveAccessibleName('Read LearnWithHupe');
});
