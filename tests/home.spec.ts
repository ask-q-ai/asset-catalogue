import { expect, test } from '@playwright/test';
import { expectScreenQuality } from './quality';

test('the home page names the app and shows its purpose', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('main p').first()).not.toBeEmpty();
});

test('the home page meets screen quality standards across widths', async ({
  page,
}, testInfo) => {
  await page.goto('/');
  await expectScreenQuality(page, testInfo, { screenshotName: 'home' });

  // When the whole plan is opened, it must still meet all quality standards.
  await page.getByText('Read the whole plan').click();
  await expectScreenQuality(page, testInfo, {
    screenshotName: 'home-plan-open',
  });
});
