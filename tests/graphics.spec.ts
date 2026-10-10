import { expect, test, type Page } from '@playwright/test';
import { createGame } from '../src/content/map';
import { createCampaign, importCampaign } from './helpers/campaign';

async function mapPixel(page: Page, worldX: number, worldY: number): Promise<number[]> {
  return page.evaluate(({ x, y }) => {
    const canvas = document.querySelector('canvas');
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) throw new Error('Map canvas is unavailable.');
    const scale = Number(canvas.dataset.mapScale);
    const offsetX = Number(canvas.dataset.mapX);
    const offsetY = Number(canvas.dataset.mapY);
    const ratio = canvas.width / canvas.getBoundingClientRect().width;
    return [...ctx.getImageData(Math.floor((offsetX + x * scale) * ratio), Math.floor((offsetY + y * scale) * ratio), 1, 1).data];
  }, { x: worldX, y: worldY });
}

test('renders original pixel art with an optional grid and unchanged hit coordinates', async ({ page }, info) => {
  await createCampaign(page, 'Graphics realm');
  const grid = page.getByRole('checkbox', { name: 'Show tile grid', exact: true });
  await expect(grid).not.toBeChecked();
  await grid.check();
  await expect(grid).toBeChecked();
  await grid.uncheck();
  await page.screenshot({ path: info.outputPath('graphics-detail.png'), fullPage: true });
  await page.getByRole('button', { name: 'Whole map', exact: true }).click();
  await page.screenshot({ path: info.outputPath('graphics-overview.png'), fullPage: true });
});

test('changes castle art and ownership pennants on capture without changing tile footprints', async ({ page }) => {
  const fixture = createGame(1);
  fixture.armies = fixture.armies.filter(a => a.id !== 'army-8');
  fixture.armies[0].x = 16;
  fixture.armies[0].y = 14;
  await importCampaign(page, fixture, 'Castle capture');
  await page.getByLabel('Column', { exact: true }).fill('18');
  await page.getByLabel('Row', { exact: true }).fill('15');
  await page.getByRole('button', { name: 'Inspect tile', exact: true }).click();
  const roofX = 17 * 28 + 14 + (22.5 - 24) * (28 / 32);
  const roofY = 14 * 28 + 28 + (18.5 - 44) * (28 / 32);
  await expect.poll(() => mapPixel(page, roofX, roofY)).toEqual([120, 103, 73, 255]);
  await expect.poll(() => mapPixel(page, 17 * 28 + 16.5, 14 * 28 - 4.5)).toEqual([218, 208, 175, 255]);
  await page.getByRole('button', { name: 'Confirm march to (18, 15)', exact: true }).click();
  await expect(page.getByText('Your gold: 160', { exact: false })).toBeVisible();
  await expect.poll(() => mapPixel(page, roofX, roofY)).toEqual([63, 101, 62, 255]);
  await expect.poll(() => mapPixel(page, 17 * 28 + 16.5, 14 * 28 - 4.5)).toEqual([125, 207, 155, 255]);
  await expect(page.getByRole('heading', { name: 'Your army · (18, 15)', exact: true })).toBeVisible();
});

test.describe('artwork failure recovery', () => {
  test.use({ serviceWorkers: 'block' });
  test('reports a missing atlas instead of silently using placeholder art', async ({ page }) => {
    await page.route('**/art/atlas.png', route => route.abort());
    await page.goto('/');
    await page.getByRole('button', { name: 'Create campaign', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('Map artwork could not load');
    await expect(page.locator('canvas')).toHaveAttribute('data-art-ready', 'false');
    await page.unroute('**/art/atlas.png');
    await page.getByRole('button', { name: 'Retry artwork', exact: true }).click();
    await expect(page.locator('canvas')).toHaveAttribute('data-art-ready', 'true');
    await expect(page.getByRole('alert')).toBeHidden();
  });
});
