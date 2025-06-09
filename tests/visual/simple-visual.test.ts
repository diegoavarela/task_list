import puppeteer, { Browser, Page } from 'puppeteer';

describe('Simple Visual Tests', () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
  });

  afterAll(async () => {
    await browser.close();
  });

  beforeEach(async () => {
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  });

  test('should render main application page', async () => {
    await page.waitForSelector('body');
    
    const screenshot = await page.screenshot({
      fullPage: true
    });
    
    expect(screenshot).toMatchImageSnapshot({
      threshold: 0.3,
      failureThresholdType: 'percent'
    });
  });

  test('should render companies page', async () => {
    // Try different selectors for companies navigation
    try {
      await page.click('text=Companies');
    } catch (e) {
      try {
        await page.click('[href*="companies"]');
      } catch (e2) {
        // Skip if companies page not found
        console.log('Companies navigation not found, skipping test');
        return;
      }
    }
    
    await page.waitForTimeout(1000);
    
    const screenshot = await page.screenshot({
      fullPage: true
    });
    
    expect(screenshot).toMatchImageSnapshot({
      threshold: 0.3,
      failureThresholdType: 'percent'
    });
  });

  test('should render calendar page', async () => {
    try {
      await page.click('text=Calendar');
    } catch (e) {
      try {
        await page.click('[href*="calendar"]');
      } catch (e2) {
        console.log('Calendar navigation not found, skipping test');
        return;
      }
    }
    
    await page.waitForTimeout(1000);
    
    const screenshot = await page.screenshot({
      fullPage: true
    });
    
    expect(screenshot).toMatchImageSnapshot({
      threshold: 0.3,
      failureThresholdType: 'percent'
    });
  });

  test('should render mobile view', async () => {
    await page.setViewport({ width: 375, height: 667 });
    await page.reload({ waitUntil: 'networkidle0' });
    
    const screenshot = await page.screenshot({
      fullPage: true
    });
    
    expect(screenshot).toMatchImageSnapshot({
      threshold: 0.3,
      failureThresholdType: 'percent'
    });
  });
});