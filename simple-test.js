const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.setViewport({ width: 1400, height: 900 });
  
  try {
    await page.goto('http://localhost:5173');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    await page.screenshot({ 
      path: 'simple-test-screenshot.png',
      fullPage: true
    });
    
    console.log('Simple test screenshot saved as simple-test-screenshot.png');
  } catch (error) {
    console.log('Error:', error);
  }
  
  await browser.close();
})();