import { test, expect } from '@playwright/test';

async function cellPoint(page, x, y, size = 50) {
  await page.locator('#grid').scrollIntoViewIfNeeded();
  const box = await page.locator('#grid').boundingBox();
  return { x: box.x + (x + 0.5) * box.width / size, y: box.y + (y + 0.5) * box.height / size };
}
async function clickCell(page, x, y, size = 50) {
  const point = await cellPoint(page, x, y, size);
  await page.mouse.click(point.x, point.y);
}
test.beforeEach(async ({ page }) => {
  await page.goto('./');
  await expect(page.locator('.pattern-button')).toHaveCount(5);
});

test('initial board is empty and page has no runtime or console errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.reload();
  await expect(page.locator('#population')).toHaveText('0');
  await expect(page.locator('#generation')).toHaveText('0');
  await expect(page.locator('#status')).toHaveText('Paused');
  await expect(page.locator('#empty-hint')).toBeVisible();
  await expect(page.locator('#pause')).toBeDisabled();
  expect(errors).toEqual([]);
});

test('mouse drawing and erasing keep drag mode and accurate statistics', async ({ page }) => {
  await clickCell(page, 12, 10); // An existing cell inside the next drawing path.
  const start = await cellPoint(page, 10, 10);
  const end = await cellPoint(page, 15, 10);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(end.x, end.y, { steps: 12 });
  await page.mouse.up();
  await expect(page.locator('#population')).toHaveText('6');
  await expect(page.locator('#generation')).toHaveText('0');
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(end.x, end.y, { steps: 12 });
  await page.mouse.up();
  await expect(page.locator('#population')).toHaveText('0');
});

test('step, play, pause, resume, speed, and reset behave correctly', async ({ page }) => {
  await page.locator('[data-pattern=blinker]').click();
  await clickCell(page, 20, 20);
  await expect(page.locator('#population')).toHaveText('3');
  await page.locator('#step').click();
  await expect(page.locator('#generation')).toHaveText('1');
  await expect(page.locator('#population')).toHaveText('3');
  await expect(page.locator('#status')).toHaveText('Paused');
  await page.locator('#speed').fill('20');
  await expect(page.locator('#speed-stat')).toHaveText('20');
  await page.locator('#play').click();
  await expect(page.locator('#step')).toBeDisabled();
  await expect(page.locator('#status')).toHaveText('Running');
  await expect.poll(async () => Number(await page.locator('#generation').textContent())).toBeGreaterThan(2);
  await page.locator('#pause').click();
  const generation = await page.locator('#generation').textContent();
  await page.waitForTimeout(180);
  await expect(page.locator('#generation')).toHaveText(generation);
  await page.locator('#play').click();
  await expect.poll(async () => Number(await page.locator('#generation').textContent())).toBeGreaterThan(Number(generation));
  await page.locator('#speed').fill('1');
  await expect(page.locator('#speed-stat')).toHaveText('1');
  await page.locator('#reset').click();
  await expect(page.locator('#generation')).toHaveText('0');
  await expect(page.locator('#population')).toHaveText('0');
  await expect(page.locator('#status')).toHaveText('Paused');
});

test('all patterns place without clearing other cells, reject edges, and exit to draw', async ({ page }) => {
  const counts = { glider: 5, blinker: 3, toad: 6, pulsar: 48, lwss: 9 };
  for (const [id, population] of Object.entries(counts)) {
    await page.locator('#reset').click();
    await page.locator('#draw-mode').click();
    await clickCell(page, 0, 0);
    await page.locator(`[data-pattern=${id}]`).click();
    await expect(page.locator('#population')).toHaveText('1');
    await clickCell(page, 20, 20);
    await expect(page.locator('#population')).toHaveText(String(population + 1));
    await clickCell(page, 49, 49);
    await expect(page.locator('#feedback')).toContainText('will not fit');
    await expect(page.locator('#population')).toHaveText(String(population + 1));
  }
  await page.keyboard.press('Escape');
  await expect(page.locator('#draw-mode')).toHaveAttribute('aria-pressed', 'true');
  await clickCell(page, 1, 1);
  await expect(page.locator('#population')).toHaveText('11');
});

test('randomize, save/load, resize, and invalid stored data are handled', async ({ page }) => {
  await page.locator('#randomize').click();
  const population = Number(await page.locator('#population').textContent());
  expect(population).toBeGreaterThan(300);
  expect(population).toBeLessThan(1000);
  await page.locator('#save').click();
  await page.locator('#grid-size').selectOption('30');
  await expect(page.locator('#population')).toHaveText('0');
  await page.locator('#load').click();
  await expect(page.locator('#population')).toHaveText(String(population));
  await expect(page.locator('#grid-size')).toHaveValue('50');
  await page.evaluate(() => localStorage.setItem('life-lab-board', '{"size":10000000}'));
  await page.locator('#load').click();
  await expect(page.locator('#feedback')).toContainText('Could not load');
  await expect(page.locator('#population')).toHaveText(String(population));
});

test('keyboard editing and shortcuts work without intercepting form controls', async ({ page }) => {
  await page.locator('#grid').focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  await expect(page.locator('#population')).toHaveText('2');
  await page.keyboard.press('n');
  await expect(page.locator('#generation')).toHaveText('1');
  await page.keyboard.press('r');
  await expect(page.locator('#generation')).toHaveText('0');
  await page.keyboard.press('Space');
  await expect(page.locator('#status')).toHaveText('Running');
  await page.keyboard.press('Space');
  await expect(page.locator('#status')).toHaveText('Paused');
  await page.locator('#speed').focus();
  await page.keyboard.press('g');
  await expect(page.locator('#population')).toHaveText('0');
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#speed-stat')).toHaveText('9');
});

test('touch taps and continuous touch drags draw and erase', async ({ browser }) => {
  const context = await browser.newContext({ hasTouch: true, viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 });
  const page = await context.newPage();
  await page.goto(test.info().project.use.baseURL || 'http://127.0.0.1:4173');
  await expect(page.locator('.pattern-button')).toHaveCount(5);
  const point = await cellPoint(page, 10, 10);
  await page.touchscreen.tap(point.x, point.y);
  await expect(page.locator('#population')).toHaveText('1');
  await page.touchscreen.tap(point.x, point.y);
  await expect(page.locator('#population')).toHaveText('0');
  const session = await context.newCDPSession(page);
  const end = await cellPoint(page, 15, 10);
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: point.x, y: point.y }] });
  for (let i = 1; i <= 10; i++) await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: point.x + (end.x - point.x) * i / 10, y: point.y }] });
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect(page.locator('#population')).toHaveText('6');
  await expect(page.locator('#generation')).toHaveText('0');
  await context.close();
});

for (const width of [320, 390, 768, 1024, 1440]) {
  test(`responsive layout at ${width}px keeps a square canvas without overflow`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await expect(page.locator('#play')).toBeVisible();
    const bounds = await page.locator('#grid').boundingBox();
    expect(Math.abs(bounds.width - bounds.height)).toBeLessThan(1);
    expect(bounds.width).toBeGreaterThan(200);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    if (width === 1440 || width === 390) {
      await page.locator('[data-pattern=pulsar]').click();
      await clickCell(page, 18, 18);
      await page.locator('#draw-mode').click();
      await page.screenshot({ path: `test-results/life-lab-${width}.png`, fullPage: true });
    }
  });
}
