import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import { createGame } from '../src/content/map';
import { nextAICommand } from '../src/game/ai/strategy';
import { applyCommand } from '../src/game/commands';
import { FACTIONS } from '../src/game/model';
import { terrainCost } from '../src/game/pathfinding';
import { armyAt, cityAt } from '../src/game/selectors';
import { exportText, importText } from '../src/persistence/snapshot';
import { importCampaign, openSaves } from './helpers/campaign';

test('reopens and continues a partial AI turn without duplicate actions', async ({ page }) => {
  let fixture = applyCommand(createGame(19), { type: 'end' });
  for (let i = 0; i < 3; i++) fixture = applyCommand(fixture, nextAICommand(fixture));
  expect(fixture.active).toBe(1);
  expect(fixture.aiSteps).toBeGreaterThan(0);
  await page.goto('/');
  const dialog = page.getByRole('dialog', { name: 'Campaigns and saves' });
  const input = dialog.getByLabel('Import a JSON save');
  await expect(input).toBeEnabled();
  await input.setInputFiles({ name: 'Interrupted.json', mimeType: 'application/json', buffer: Buffer.from(exportText(fixture)) });
  await expect(dialog.getByRole('button', { name: 'Continue Interrupted', exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'Continue Interrupted', exact: true }).click();
  await expect(page.getByText('Round 2 · Alder Pact', { exact: false })).toBeVisible();
  let expected = fixture;
  for (let step = 0; step < 200 && expected.active !== 0 && expected.winner === null; step++) expected = applyCommand(expected, nextAICommand(expected));
  expect(expected.active).toBe(0);
  const saves = await openSaves(page);
  const [download] = await Promise.all([page.waitForEvent('download'), saves.getByRole('button', { name: 'Export JSON', exact: true }).click()]);
  const path = await download.path();
  if (!path) throw new Error('Save download was not produced.');
  expect(importText(await readFile(path, 'utf8')).state).toEqual(expected);
});

test('renders a representative 100-stack realm with usable controls', async ({ page }, info) => {
  const fixture = createGame(44);
  for (let index = 0; index < fixture.map.tiles.length && fixture.armies.length < 100; index++) {
    const p = { x: index % fixture.map.width, y: Math.floor(index / fixture.map.width) };
    if (!Number.isFinite(terrainCost(fixture, p)) || armyAt(fixture, p) || cityAt(fixture, p)) continue;
    fixture.armies.push({ id: `army-${fixture.nextId++}`, ...p, owner: FACTIONS[index % 4], units: Array.from({ length: 8 }, () => 'soldier'), movement: 5, hero: null });
  }
  expect(fixture.armies).toHaveLength(100);
  await importCampaign(page, fixture, 'Stress realm');
  await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Whole map', exact: true }).click();
  await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  await page.getByRole('button', { name: 'Center selection', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Your army · (4, 4)', exact: true })).toBeVisible();
  await page.screenshot({ path: info.outputPath('realm.png'), fullPage: true });
});
