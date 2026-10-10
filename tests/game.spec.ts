import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import { importText } from '../src/persistence/snapshot';
import { createCampaign, openSaves } from './helpers/campaign';

test('plays, resumes, checkpoints and transfers a complete snapshot', async ({ page }) => {
  await createCampaign(page);
  await page.getByRole('button', { name: 'Recruit hero' }).click();
  await expect(page.getByText('Your gold: 30', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Recruit guards' }).click();
  await page.getByRole('button', { name: 'End turn', exact: true }).click();
  await expect(page.getByText('Round 2 · Alder Pact', { exact: false })).toBeVisible();
  let saves = await openSaves(page);
  await saves.getByRole('button', { name: 'Save checkpoint', exact: true }).click();
  await expect(saves.getByText('Manual checkpoint saved.', { exact: true })).toBeVisible();
  await saves.getByRole('button', { name: 'Close', exact: true }).click();
  await page.getByLabel('Column', { exact: true }).fill('5');
  await page.getByLabel('Row', { exact: true }).fill('4');
  await page.getByRole('button', { name: 'Inspect tile', exact: true }).click();
  await page.getByRole('button', { name: 'Confirm march to (5, 4)', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Your army · (5, 4)', exact: true })).toBeVisible();
  saves = await openSaves(page);
  const [download] = await Promise.all([page.waitForEvent('download'), saves.getByRole('button', { name: 'Export JSON', exact: true }).click()]);
  const path = await download.path();
  if (!path) throw new Error('Save download was not written.');
  const text = await readFile(path, 'utf8');
  const exported = importText(text);
  expect(exported.state.armies.find(a => a.id === 'army-0')?.hero?.name).toBe('Rowan');
  expect(exported.state.armies.find(a => a.id === 'army-0')?.x).toBe(4);
  page.once('dialog', dialog => dialog.accept());
  await saves.getByRole('button', { name: 'Restore checkpoint', exact: true }).click();
  await expect(saves.getByText('Manual checkpoint restored.', { exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'Continue Test realm', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Your army · (4, 4)', exact: true })).toBeVisible();
  saves = await openSaves(page);
  await saves.getByLabel('Import a JSON save').setInputFiles({ name: 'Transferred.json', mimeType: 'application/json', buffer: Buffer.from(text) });
  await expect(saves.getByRole('button', { name: 'Continue Transferred', exact: true })).toBeVisible();
  await expect(saves.getByRole('button', { name: 'Continue Test realm', exact: true })).toBeVisible();
  await saves.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Your army · (5, 4)', exact: true })).toBeVisible();
  saves = await openSaves(page);
  await saves.getByLabel('Import a JSON save').setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from('{}') });
  await expect(saves.getByRole('alert')).toContainText('Invalid or incompatible');
  await expect(saves.getByRole('button', { name: 'Continue Transferred', exact: true })).toBeVisible();
});

test('reopens cached saves with the network disabled', async ({ page, context }) => {
  await createCampaign(page, 'Offline realm');
  await expect(page.getByText('Available offline', { exact: true })).toBeVisible({ timeout: 20_000 });
  await page.getByRole('button', { name: 'Recruit hero' }).click();
  await expect(page.getByText('Your gold: 30', { exact: false })).toBeVisible();
  await context.setOffline(true);
  await page.reload();
  await page.getByRole('button', { name: 'Continue Offline realm', exact: true }).click();
  await expect(page.getByText('Your gold: 30', { exact: false })).toBeVisible();
  await expect(page.getByText('Rowan', { exact: true })).toBeVisible();
  await expect(page.locator('canvas')).toHaveAttribute('data-art-ready', 'true');
  await page.getByLabel('Realm map. Arrow keys select tiles.', { exact: false }).focus();
  await page.keyboard.press('ArrowRight');
  await page.getByRole('button', { name: 'Confirm march to (5, 4)', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Your army · (5, 4)', exact: true })).toBeVisible();
});

test('supports map taps, previews, panning and mobile orientation without overflow', async ({ page }, info) => {
  await createCampaign(page);
  const canvas = page.locator('canvas');
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Map has no visible bounds.');
  const camera = await canvas.evaluate(element => ({
    x: Number(element.getAttribute('data-map-x')),
    y: Number(element.getAttribute('data-map-y')),
    scale: Number(element.getAttribute('data-map-scale')),
  }));
  const x = box.x + camera.x + 4.5 * 28 * camera.scale;
  const y = box.y + camera.y + 3.5 * 28 * camera.scale;
  if (info.project.name.startsWith('mobile')) expect(28 * camera.scale).toBeGreaterThanOrEqual(44);
  if (info.project.name.startsWith('mobile')) await page.touchscreen.tap(x, y);
  else await page.mouse.click(x, y);
  await expect(page.getByRole('button', { name: 'Confirm march to (5, 4)', exact: true })).toBeEnabled();
  await page.mouse.move(box.x + 200, box.y + 140);
  await page.mouse.down();
  await page.mouse.move(box.x + 100, box.y + 100, { steps: 8 });
  await page.mouse.up();
  await expect(page.getByRole('button', { name: 'Confirm march to (5, 4)', exact: true })).toBeEnabled();
  await expect(page.getByRole('heading', { name: 'Your army · (4, 4)', exact: true })).toBeVisible();
  for (const viewport of [{ width: 360, height: 740 }, { width: 740, height: 360 }]) {
    await page.setViewportSize(viewport);
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
  const sizes = await page.locator('.map-toolbar button').evaluateAll(buttons => buttons.map(b => b.getBoundingClientRect().height));
  expect(sizes.every(height => height >= 44)).toBe(true);
});
