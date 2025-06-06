const puppeteer = require('puppeteer');

async function createSampleDataWithNewFeatures() {
  console.log('🚀 Creating sample data with new features...');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });

  const page = await browser.newPage();

  try {
    console.log('📖 Navigating to application...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
    
    // Wait for the page to load
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Create sample tasks with different priorities and statuses
    console.log('✨ Creating sample tasks with new features...');
    
    // Inject sample data directly into localStorage
    await page.evaluate(() => {
      const sampleTasks = [
        {
          id: 'task-1',
          name: 'High Priority Marketing Campaign',
          notes: 'Launch Q1 marketing campaign with social media strategy',
          completed: false,
          priority: 'high',
          status: 'in_progress',
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
          dueTime: '14:00',
          createdAt: new Date().toISOString(),
          tagIds: [],
          estimatedHours: 8,
          actualHours: 5
        },
        {
          id: 'task-2',
          name: 'Review quarterly reports',
          notes: 'Analyze Q4 performance metrics and prepare presentation',
          completed: false,
          priority: 'medium',
          status: 'todo',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
          createdAt: new Date().toISOString(),
          tagIds: [],
          estimatedHours: 4,
          actualHours: 0
        },
        {
          id: 'task-3',
          name: 'Team standup meeting',
          notes: 'Daily sync with development team',
          completed: true,
          priority: 'low',
          status: 'completed',
          dueDate: new Date().toISOString(), // today
          dueTime: '09:00',
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // yesterday
          completedAt: new Date().toISOString(),
          tagIds: [],
          estimatedHours: 0.5,
          actualHours: 0.5
        },
        {
          id: 'task-4',
          name: 'Update website content',
          notes: 'Refresh product descriptions and pricing information',
          completed: false,
          priority: 'medium',
          status: 'todo',
          dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days from now
          createdAt: new Date().toISOString(),
          tagIds: [],
          estimatedHours: 6,
          actualHours: 0
        },
        {
          id: 'task-5',
          name: 'Prepare client presentation',
          notes: 'Create slide deck for next week\'s client meeting',
          completed: false,
          priority: 'high',
          status: 'todo',
          dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
          createdAt: new Date().toISOString(),
          tagIds: [],
          estimatedHours: 3,
          actualHours: 0
        }
      ];

      const sampleCompanies = [
        {
          id: 'company-1',
          name: 'TechCorp',
          color: 'blue',
          createdAt: new Date().toISOString()
        },
        {
          id: 'company-2',
          name: 'StartupXYZ',
          color: 'green',
          createdAt: new Date().toISOString()
        }
      ];

      const sampleTags = [
        {
          id: 'tag-1',
          name: 'urgent',
          color: 'red',
          createdAt: new Date().toISOString()
        },
        {
          id: 'tag-2',
          name: 'marketing',
          color: 'purple',
          createdAt: new Date().toISOString()
        }
      ];

      localStorage.setItem('tasks', JSON.stringify(sampleTasks));
      localStorage.setItem('companies', JSON.stringify(sampleCompanies));
      localStorage.setItem('tags', JSON.stringify(sampleTags));
      
      console.log('✅ Sample data injected into localStorage');
    });

    // Refresh the page to load the new data
    console.log('🔄 Refreshing page to load sample data...');
    await page.reload({ waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test the new navigation tabs
    console.log('📋 Testing Tasks tab...');
    await page.screenshot({ path: 'enhanced-tasks-view.png', fullPage: true });

    // Test Calendar tab
    console.log('📅 Testing Calendar tab...');
    const calendarButtons = await page.$$('button');
    for (let button of calendarButtons) {
      const text = await button.evaluate(el => el.textContent);
      if (text && text.toLowerCase().includes('calendar')) {
        await button.click();
        await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for calendar to load
        await page.screenshot({ path: 'enhanced-calendar-view.png', fullPage: true });
        console.log('   ✅ Calendar view screenshot taken');
        break;
      }
    }

    // Test Analytics tab
    console.log('📊 Testing Analytics tab...');
    const analyticsButtons = await page.$$('button');
    for (let button of analyticsButtons) {
      const text = await button.evaluate(el => el.textContent);
      if (text && text.toLowerCase().includes('analytics')) {
        await button.click();
        await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for charts to load
        await page.screenshot({ path: 'enhanced-analytics-view.png', fullPage: true });
        console.log('   ✅ Analytics view screenshot taken');
        break;
      }
    }

    // Go back to Tasks and test filtering
    console.log('🔍 Testing enhanced filtering...');
    const taskButtons = await page.$$('button');
    for (let button of taskButtons) {
      const text = await button.evaluate(el => el.textContent);
      if (text && text.toLowerCase().includes('tasks')) {
        await button.click();
        await new Promise(resolve => setTimeout(resolve, 2000));
        break;
      }
    }

    // Test the filter button
    const filterButtons = await page.$$('button');
    for (let button of filterButtons) {
      const text = await button.evaluate(el => el.textContent);
      if (text && (text.toLowerCase().includes('filter') || text.includes('🔍'))) {
        await button.click();
        await new Promise(resolve => setTimeout(resolve, 1000));
        await page.screenshot({ path: 'enhanced-filtering-view.png', fullPage: true });
        console.log('   ✅ Enhanced filtering screenshot taken');
        break;
      }
    }

    console.log('🎉 Sample data created and screenshots taken successfully!');
    console.log('');
    console.log('📸 Screenshots saved:');
    console.log('   - enhanced-tasks-view.png (Tasks with priority/status badges)');
    console.log('   - enhanced-calendar-view.png (Calendar view with task events)');
    console.log('   - enhanced-analytics-view.png (Analytics dashboard)');
    console.log('   - enhanced-filtering-view.png (Enhanced filtering interface)');

  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: 'enhanced-features-error.png' });
  } finally {
    await browser.close();
  }
}

createSampleDataWithNewFeatures().catch(console.error);