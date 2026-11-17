import { expect, test } from '@playwright/test';

test('home page presents real local tools and recovery limits', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: /find what matters/i })).toBeVisible();
  await expect(page.getByText(/cannot undelete data from a phone, pc, or drive/i)).toBeVisible();
  await expect(page.getByRole('link', { name: /explore free tools/i })).toHaveAttribute('href', '/file-tools/');

  await page.getByRole('link', { name: /explore free tools/i }).click();
  await expect(page).toHaveURL(/\/file-tools\/$/);
  await expect(page.getByRole('heading', { name: /a clear view of the files you can access/i })).toBeVisible();
});

test('duplicate finder compares selected files in the browser', async ({ page }) => {
  await page.goto('/duplicates/');
  await page.getByLabel('Choose files to compare').setInputFiles([
    { name: 'first.txt', mimeType: 'text/plain', buffer: Buffer.from('same content') },
    { name: 'copy.txt', mimeType: 'text/plain', buffer: Buffer.from('same content') }
  ]);

  await page.getByRole('button', { name: 'Compare selected files' }).click();

  await expect(page.getByRole('status')).toHaveText(/Found 1 exact duplicate group/);
  await expect(page.getByText(/2 identical files/)).toBeVisible();
});

test('narrow layouts do not introduce horizontal page scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 780 });
  await page.goto('/');

  const widths = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    document: document.documentElement.scrollWidth
  }));
  expect(widths.document).toBeLessThanOrEqual(widths.viewport);
});
