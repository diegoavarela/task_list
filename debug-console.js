const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Capture console logs and errors
  page.on('console', (msg) => {
    console.log(`CONSOLE ${msg.type()}: ${msg.text()}`);
  });
  
  page.on('pageerror', (error) => {
    console.log(`PAGE ERROR: ${error.message}`);
  });
  
  page.on('requestfailed', (req) => {
    console.log(`FAILED REQUEST: ${req.url()} - ${req.failure().errorText}`);
  });
  
  await page.setViewport({ width: 1400, height: 900 });
  
  try {
    console.log('Navigating to http://localhost:5173...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 30000 });
    
    console.log('Waiting for page to load...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check if React app loaded
    const hasReact = await page.evaluate(() => {
      return !!document.querySelector('#root');
    });
    
    console.log('React root element found:', hasReact);
    
    // Check for any visible content
    const pageContent = await page.evaluate(() => {
      return document.body.innerText.slice(0, 200);
    });
    
    console.log('Page content preview:', pageContent);
    
    await page.screenshot({ 
      path: 'debug-screenshot.png',
      fullPage: true
    });
    
    console.log('Debug screenshot saved');
  } catch (error) {
    console.log('Navigation error:', error.message);
  }
  
  await browser.close();
})();