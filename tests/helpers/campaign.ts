import { expect, type Page } from '@playwright/test';
import type { GameState } from '../../src/game/model';
import { exportText } from '../../src/persistence/snapshot';

export async function createCampaign(page: Page, name = 'Test realm', url = '/') {
  await page.goto(url);
  await page.getByLabel('Campaign name').fill(name);
  await page.getByLabel('Battle seed').fill('42');
  await page.getByRole('button', { name: 'Create campaign', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Campaigns and saves' })).toBeHidden();
  await expect(page.getByText('2 soldiers, 1 guard, 1 rider.', { exact: false })).toBeVisible();
  await expect(page.locator('canvas')).toHaveAttribute('data-art-ready', 'true');
}

export async function openSaves(page: Page) {
  await page.getByRole('button', { name: 'Campaigns and saves', exact: true }).click();
  return page.getByRole('dialog', { name: 'Campaigns and saves' });
}

export async function importCampaign(page: Page, state: GameState, name: string) {
  await page.goto('/');
  const saves = page.getByRole('dialog', { name: 'Campaigns and saves' });
  const input = saves.getByLabel('Import a JSON save');
  await expect(input).toBeEnabled();
  await input.setInputFiles({ name: `${name}.json`, mimeType: 'application/json', buffer: Buffer.from(exportText(state)) });
  await expect(saves.getByRole('button', { name: `Continue ${name}`, exact: true })).toBeVisible();
  await saves.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(page.locator('canvas')).toHaveAttribute('data-art-ready', 'true');
}
