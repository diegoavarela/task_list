const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.setViewport({ width: 1400, height: 900 });
  
  try {
    await page.goto('http://localhost:5173');
    await page.waitForSelector('.task-item', { timeout: 10000 });
    
    // Wait a bit for everything to load
    await page.waitForTimeout(2000);
    
    await page.screenshot({ 
      path: 'current-tasks-screenshot.png',
      fullPage: true
    });
    
    console.log('Screenshot saved as current-tasks-screenshot.png');
  } catch (error) {
    console.log('No tasks found or page not loaded, taking full page screenshot anyway');
    await page.screenshot({ 
      path: 'current-tasks-screenshot.png',
      fullPage: true
    });
  }
  
  await browser.close();
})();