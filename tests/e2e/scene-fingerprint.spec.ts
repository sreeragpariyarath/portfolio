import { expect, test } from '@playwright/test';
import { loadingNotice, worldHost } from './helpers';

// The scene is deterministic only because one seeded random generator is
// consumed in a fixed order while textures and scenery are built. Reordering
// that work would silently change the pencil strokes. The generator is private,
// so this records every 2D-canvas drawing call (all textures and labels are
// drawn there with values taken from the generator) into a rolling hash.
// If the hash changes, the scene would look different. It is a test-only init
// script: nothing is added to the production bundle.
const EXPECTED = { calls: 9246, hash: 2348873738 };
const RECORD = process.env.RECORD_FINGERPRINT === '1';

test('scene texture and label drawing order is unchanged', async ({ page }, info) => {
  test.skip(info.project.name === 'mobile', 'Same scene on every viewport');
  await page.addInitScript(() => {
    const state = { calls: 0, hash: 5381 };
    const feed = (text: string) => {
      for (let i = 0; i < text.length; i++) state.hash = ((state.hash * 33) ^ text.charCodeAt(i)) >>> 0;
    };
    const proto = CanvasRenderingContext2D.prototype as unknown as Record<string, unknown>;
    for (const name of ['beginPath', 'moveTo', 'lineTo', 'stroke', 'fillRect', 'fillText']) {
      const original = proto[name] as (...args: unknown[]) => unknown;
      proto[name] = function (this: unknown, ...args: unknown[]) {
        state.calls++;
        feed(name + args.join(','));
        return original.apply(this, args);
      };
    }
    for (const name of ['fillStyle', 'strokeStyle', 'lineWidth', 'font']) {
      const descriptor = Object.getOwnPropertyDescriptor(CanvasRenderingContext2D.prototype, name)!;
      Object.defineProperty(CanvasRenderingContext2D.prototype, name, {
        ...descriptor,
        set(value) {
          state.calls++;
          feed(name + String(value));
          descriptor.set!.call(this, value);
        },
      });
    }
    (window as unknown as { __fingerprint: typeof state }).__fingerprint = state;
  });
  await page.goto('/');
  await expect(loadingNotice(page)).toBeHidden({ timeout: 20000 });
  // Labels drawn on a canvas only exist in WebGL mode (SVG labels in the fallback).
  const mode = await worldHost(page).getAttribute('data-render-mode');
  test.skip(mode !== 'webgl', 'Fingerprint is defined for the WebGL path');
  const actual = await page.evaluate(
    () => (window as unknown as { __fingerprint: { calls: number; hash: number } }).__fingerprint,
  );
  if (RECORD) console.log(`FINGERPRINT ${JSON.stringify(actual)}`);
  else expect(actual).toEqual(EXPECTED);
});
