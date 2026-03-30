import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Route logging
  page.on('console', msg => console.log('LOG:', msg.text()));
  page.on('pageerror', err => console.log('ERROR:', err.message));
  page.on('requestfailed', request => console.log('FAILED REQ:', request.url(), request.failure().errorText));

  // Handle dialog automatically
  page.on('dialog', async dialog => {
    console.log(`Dialog message: ${dialog.message()}`);
    await dialog.accept();
  });

  try {
    await page.goto('http://localhost');
    
    // Login
    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'admin');
    await page.click('button:has-text("Войти")');
    await page.waitForTimeout(2000);

    // Verify we are on projects page
    const projectUrl = page.url();
    console.log('Current URL:', projectUrl);
    
    // Wait for project cards
    await page.waitForSelector('h3.text-xl', { timeout: 5000 });
    const titleElements = await page.$$('h3.text-xl');
    if (titleElements.length === 0) {
        console.log("No projects found to delete.");
        process.exit(0);
    }
    const name = await titleElements[0].innerText();
    console.log(`Trying to delete project: ${name}`);

    // Click the first delete button we find
    await page.evaluate(() => {
        const deleteBtn = document.querySelector('button[title="Удалить проект"]');
        if (deleteBtn) {
            deleteBtn.click();
        } else {
            console.log("Delete button not found in DOM");
        }
    });

    console.log('Waiting for API to process...');
    await page.waitForTimeout(3000);

    // Verify deletion
    const newTitleElements = await page.$$('h3.text-xl');
    console.log(`Remaining projects count: ${newTitleElements.length}`);
  } catch (err) {
    console.error('Test failed:', err);
  } finally {
    await browser.close();
  }
})();
