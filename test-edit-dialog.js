const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.setViewport({ width: 1400, height: 900 });
  
  try {
    await page.goto('http://localhost:5173');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Add sample data with a task that has subtasks
    await page.evaluate(() => {
      const companies = [{
        id: '1',
        name: 'Test Company',
        color: '#3b82f6',
        createdAt: new Date().toISOString()
      }];
      localStorage.setItem('companies', JSON.stringify(companies));
      
      const tags = [{
        id: '1',
        name: 'Important',
        color: '#ef4444',
        createdAt: new Date().toISOString()
      }];
      localStorage.setItem('tags', JSON.stringify(tags));
      
      const tasks = [{
        id: '1',
        name: 'Main Task with Subtasks',
        companyId: '1',
        completed: false,
        subtasks: [{
          id: '2',
          name: 'Subtask with Due Date',
          companyId: '1',
          completed: false,
          subtasks: [],
          parentTaskId: '1',
          tagIds: ['1'],
          dueDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
          createdAt: new Date().toISOString()
        }],
        tagIds: [],
        createdAt: new Date().toISOString()
      }];
      localStorage.setItem('tasks', JSON.stringify(tasks));
    });
    
    await page.reload();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await page.screenshot({ 
      path: 'edit-dialog-test.png',
      fullPage: true
    });
    
    console.log('Edit dialog test screenshot saved');
  } catch (error) {
    console.log('Error:', error);
  }
  
  await browser.close();
})();