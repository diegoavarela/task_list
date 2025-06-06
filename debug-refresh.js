const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  // Capture all errors and logs
  page.on('console', (msg) => {
    console.log(`CONSOLE ${msg.type()}: ${msg.text()}`);
  });
  
  page.on('pageerror', (error) => {
    console.log(`PAGE ERROR: ${error.message}`);
    console.log(`STACK: ${error.stack}`);
  });
  
  page.on('error', (error) => {
    console.log(`BROWSER ERROR: ${error.message}`);
  });
  
  page.on('requestfailed', (req) => {
    console.log(`FAILED REQUEST: ${req.url()} - ${req.failure().errorText}`);
  });
  
  await page.setViewport({ width: 1400, height: 900 });
  
  try {
    console.log('First load...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 10000 });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('Taking first screenshot...');
    await page.screenshot({ path: 'before-refresh.png', fullPage: true });
    
    console.log('Refreshing page...');
    await page.reload({ waitUntil: 'networkidle0', timeout: 10000 });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('Taking after refresh screenshot...');
    await page.screenshot({ path: 'after-refresh.png', fullPage: true });
    
    // Check if the page is actually white/empty
    const bodyContent = await page.evaluate(() => {
      const body = document.body;
      return {
        hasContent: body.innerText.length > 0,
        textLength: body.innerText.length,
        firstChars: body.innerText.slice(0, 100),
        backgroundColor: window.getComputedStyle(body).backgroundColor,
        children: body.children.length,
        rootElement: !!document.querySelector('#root'),
        rootContent: document.querySelector('#root')?.innerHTML?.slice(0, 200) || 'NO ROOT'
      };
    });
    
    console.log('Page analysis after refresh:', bodyContent);
    
  } catch (error) {
    console.log('Error during test:', error.message);
  }
  
  await browser.close();
})();