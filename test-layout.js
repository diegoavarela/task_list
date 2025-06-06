const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.setViewport({ width: 1400, height: 900 });
  
  try {
    await page.goto('http://localhost:5173');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Add sample companies and tasks through localStorage
    await page.evaluate(() => {
      // Add companies
      const companies = [{
        id: '1',
        name: 'Test Company',
        color: '#3b82f6',
        createdAt: new Date().toISOString()
      }];
      localStorage.setItem('companies', JSON.stringify(companies));
      
      // Add tasks
      const tasks = [{
        id: '1',
        name: 'Sample Task with Visible Buttons',
        companyId: '1',
        completed: false,
        subtasks: [],
        tagIds: [],
        createdAt: new Date().toISOString()
      }];
      localStorage.setItem('tasks', JSON.stringify(tasks));
    });
    
    await page.reload();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await page.screenshot({ 
      path: 'layout-test-screenshot.png',
      fullPage: true
    });
    
    console.log('Layout test screenshot saved as layout-test-screenshot.png');
  } catch (error) {
    console.log('Error:', error);
  }
  
  await browser.close();
})();