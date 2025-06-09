const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  
  try {
    // Navigate to the application
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Take initial screenshot
    await page.screenshot({ path: 'notifications-implementation-screenshot.png', fullPage: true });
    
    console.log('Screenshot taken successfully at notifications-implementation-screenshot.png');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
})();