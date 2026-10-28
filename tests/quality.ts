import { expect, type Page, type TestInfo } from '@playwright/test';

export const WIDTHS = [1440, 1024, 700, 390, 320] as const;
const MIN_TEXT_PX = 16;
const MIN_LINE_HEIGHT = 1.5;
const MIN_CONTROL_PX = 44;

export interface QualityOptions {
  screenshotName?: string;
  checkControls?: boolean;
}

/** Elements with visible text of their own, and their computed sizes. */
async function textSizes(page: Page) {
  return page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('body *')]
      .filter((element) => {
        const ownText = [...element.childNodes].some(
          (node) =>
            node.nodeType === Node.TEXT_NODE && node.textContent?.trim(),
        );
        return ownText && element.checkVisibility();
      })
      .map((element) => {
        const style = getComputedStyle(element);
        const fontSize = Number.parseFloat(style.fontSize);
        return {
          text: element.textContent
            ? element.textContent.trim().slice(0, 40)
            : '',
          fontSize,
          lineHeight: Number.parseFloat(style.lineHeight) / fontSize,
        };
      }),
  );
}

/** Every visible button, link and form control, and its size. */
async function controlSizes(page: Page) {
  return page.evaluate(() =>
    [
      ...document.querySelectorAll<HTMLElement>(
        'a[href], button, summary, input, select, textarea, [role="button"]',
      ),
    ]
      .filter((element) => element.checkVisibility())
      .map((element) => {
        const box = element.getBoundingClientRect();
        return {
          name: element.textContent
            ? element.textContent.trim().slice(0, 40)
            : element.tagName,
          width: box.width,
          height: box.height,
        };
      }),
  );
}

/**
 * How far the page reaches past the layout width. clientWidth, not
 * innerWidth: phone browsers zoom out to fit wide content, which grows
 * innerWidth and would hide the overflow.
 */
export async function sidewaysScroll(page: Page) {
  return page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  );
}

/** Verifies accessible landmarks, single h1, and control labels. */
async function expectAccessibleSemantics(page: Page) {
  // Page must have a <main> landmark
  await expect(page.locator('main')).toBeVisible();

  // Page must have exactly one visible h1
  const h1s = page.locator('h1:visible');
  await expect(h1s).toHaveCount(1);

  // Every visible input/select/textarea must have an accessible name
  const unlabeledControls = await page.evaluate(() => {
    const inputs = [
      ...document.querySelectorAll<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >('input:not([type="hidden"]), select, textarea'),
    ].filter((el) => el.checkVisibility());

    return inputs
      .filter((input) => {
        const ariaLabel = input.getAttribute('aria-label');
        const ariaLabelledBy = input.getAttribute('aria-labelledby');
        const hasIdLabel =
          input.id && document.querySelector(`label[for="${input.id}"]`);
        const hasParentLabel = input.closest('label');
        return !ariaLabel && !ariaLabelledBy && !hasIdLabel && !hasParentLabel;
      })
      .map((el) => el.outerHTML.slice(0, 60));
  });

  expect(
    unlabeledControls,
    'Every form control must have an accessible label (<label for="...">, aria-label, or wrapping <label>).',
  ).toEqual([]);
}

/**
 * Enforces Dave HQ Golden Rules on the active screen across 5 viewport widths:
 * 1. Zero console errors and zero uncaught page errors.
 * 2. Zero horizontal overflow / sideways scroll.
 * 3. Text size >= 16px and line-height >= 1.5.
 * 4. Interactive touch targets >= 44x44 px.
 * 5. Accessible landmarks (<main>, exactly one <h1>, labelled controls).
 * 6. Captures desktop and mobile full-page screenshots to test-results/.
 */
export async function expectScreenQuality(
  page: Page,
  testInfo?: TestInfo,
  options: QualityOptions = {},
) {
  // 1. Accessibility semantics
  await expectAccessibleSemantics(page);

  // 2. Responsive & readability check across all widths
  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: 900 });
    expect(await sidewaysScroll(page), `sideways scroll at ${width}px`).toBe(0);

    for (const item of await textSizes(page)) {
      expect(
        item.fontSize,
        `text size of "${item.text}" at ${width}px`,
      ).toBeGreaterThanOrEqual(MIN_TEXT_PX);
      expect(
        item.lineHeight,
        `line height of "${item.text}" at ${width}px`,
      ).toBeGreaterThanOrEqual(MIN_LINE_HEIGHT - 0.01);
    }

    if (options.checkControls !== false) {
      const controls = await controlSizes(page);
      for (const control of controls) {
        expect(
          control.height,
          `height of "${control.name}" at ${width}px (must be >= 44px)`,
        ).toBeGreaterThanOrEqual(MIN_CONTROL_PX);
        expect(
          control.width,
          `width of "${control.name}" at ${width}px (must be >= 44px)`,
        ).toBeGreaterThanOrEqual(MIN_CONTROL_PX);
      }
    }
  }

  // 3. Save full-page screenshot if testInfo provided
  if (testInfo) {
    const baseName = options.screenshotName ?? 'screen';
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.screenshot({
      path: testInfo.outputPath(`${baseName}-desktop.png`),
      fullPage: true,
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({
      path: testInfo.outputPath(`${baseName}-phone.png`),
      fullPage: true,
    });
  }
}
