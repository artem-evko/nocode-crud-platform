import { test, expect } from '@playwright/test';
import { randomUUID } from 'crypto';

test.describe('Platform E2E - Backend Only Project', () => {

  const email = `backend_${randomUUID()}@test.com`;

  test('should register, create backend-only project, model it, deploy and interact with generated API', async ({ page, request }) => {
    // 1. Go to platform
    await page.goto('/');

    // 2. Register
    await page.getByText('Регистрация').first().click();
    await page.getByPlaceholder('developer123').fill(email);
    await page.getByPlaceholder('••••••••').first().fill('password123');
    await page.getByPlaceholder('••••••••').nth(1).fill('password123');
    await page.getByRole('button', { name: 'Sign up' }).click();

    // 3. Login
    await expect(page).toHaveURL(/\/login/);
    await page.getByPlaceholder('admin').fill(email);
    await page.getByPlaceholder('••••••••').fill('password123');
    await page.getByRole('button', { name: 'Войти' }).click();

    // 4. Ensure we are logged in by seeing /projects
    await expect(page).toHaveURL(/\/projects/);

    // 5. Create Project
    await page.getByRole('button', { name: /Новый Проект|Создать Проект/i }).first().click();
    await page.getByPlaceholder('My Awesome API').fill('Inventory System API');
    await page.getByPlaceholder('com.example', { exact: true }).fill('com.inventory');
    await page.getByPlaceholder('demo-api').fill('api');
    
    // Ensure Frontend is NOt checked. Actually we don't click it, so it's off by default.
    // Auth is off by default.
    await page.getByRole('button', { name: 'Создать проект', exact: true }).click();

    // 5. Navigate inside the project
    await page.getByText('Inventory System API').click();

    // 6. Go to Modeler
    await page.getByText('Data Modeler').click();

    // Add Entity 'Item'
    await page.getByText('Add entity').click();
    
    // In the properties panel (assuming it opens or is visible, usually selecting the new entity does it)
    await page.getByPlaceholder('Название сущности (например, User)').fill('Item');
    
    // Add Field
    await page.getByText('Add field').click();
    // Fill first field name -> "sku"
    await page.locator('input[placeholder="Название поля (с маленькой буквы)"]').last().fill('sku');
    
    await page.getByText('Add field').click();
    // Fill second field name -> "price"
    await page.locator('input[placeholder="Название поля (с маленькой буквы)"]').last().fill('price');
    // Change type to Integer
    await page.locator('select').last().selectOption('Integer');

    // Save Model
    await page.getByRole('button', { name: 'Save model' }).click();
    
    // Deploy
    await page.getByRole('button', { name: 'Развернуть' }).click();
    await page.getByRole('button', { name: 'Развернуть' }).nth(1).click(); // Modal confirm

    // Wait for deployment strictly. Might take up to 2 minutes
    await expect(page.locator('text=ЗАПУЩЕНО')).toBeVisible({ timeout: 120000 });

    // Deployment domain extraction
    // Traefik exposes the API. We know the URL from UI or we can deduce it from project ID.
    // Let's get the Project ID from the URL: /projects/xxxxx/modeler
    const urlParts = page.url().split('/');
    const projectId = urlParts[urlParts.indexOf('projects') + 1];

    const generatedApiUrl = `http://proj-${projectId}.localhost/api/items`;

    // Wait 5 seconds for traefik dynamically routing...
    await page.waitForTimeout(5000);

    // Act: Send API request using playwright's internal request context
    const createResp = await request.post(generatedApiUrl, {
      data: {
        sku: 'TEST-SKU-100',
        price: 999
      }
    });

    expect(createResp.status()).toBe(200);
    const createdItem = await createResp.json();
    expect(createdItem.id).toBeDefined();
    expect(createdItem.sku).toBe('TEST-SKU-100');
    expect(createdItem.price).toBe(999);

    // Act: GET request
    const getResp = await request.get(generatedApiUrl);
    expect(getResp.status()).toBe(200);
    const list = await getResp.json();
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThanOrEqual(1);
    expect(list[0].sku).toBe('TEST-SKU-100');
  });
});
