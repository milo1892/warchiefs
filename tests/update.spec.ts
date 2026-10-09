import { expect, test } from '@playwright/test';
import { createCampaign } from './helpers/campaign';
import { startUpdateServer } from './helpers/updateServer';

test('prompts for a service-worker update and preserves saves across reload', async ({ page, context }) => {
  const site = await startUpdateServer();
  try {
    await createCampaign(page, 'Update realm', site.origin);
    await expect(page.getByText('Available offline', { exact: true })).toBeVisible({ timeout: 20_000 });
    await page.getByRole('button', { name: 'Recruit hero' }).click();
    await expect(page.getByText('Your gold: 30', { exact: false })).toBeVisible();
    site.deploy();
    await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) throw new Error('No active service worker.');
      await registration.update();
    });
    await page.getByRole('button', { name: 'Apply available update', exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'Campaigns and saves' })).toBeVisible();
    await page.getByRole('button', { name: 'Continue Update realm', exact: true }).click();
    await expect(page.getByText('Your gold: 30', { exact: false })).toBeVisible();
    await expect(page.getByText('Rowan', { exact: true })).toBeVisible();
    await expect(page.getByText('Available offline', { exact: true })).toBeVisible();
    await context.setOffline(true);
    await page.reload();
    await page.getByRole('button', { name: 'Continue Update realm', exact: true }).click();
    await expect(page.getByText('Your gold: 30', { exact: false })).toBeVisible();
  } finally { await site.close(); }
});
