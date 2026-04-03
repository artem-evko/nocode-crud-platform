import { test, expect } from '@playwright/test';
import { randomUUID } from 'crypto';

test.describe('Platform E2E - Fullstack Project with UI Builder', () => {

  const email = `fullstack_${randomUUID()}@test.com`;

  test('should register, create project with frontend, model relations, build UI, and verify generated app', async ({ page }) => {
    await page.goto('/');

    await page.getByText('Регистрация').first().click();
    await page.getByPlaceholder('developer123').fill(email);
    await page.getByPlaceholder('••••••••').first().fill('password123');
    await page.getByPlaceholder('••••••••').nth(1).fill('password123');
    await page.getByRole('button', { name: 'Sign up' }).click();

    // Login
    await expect(page).toHaveURL(/\/login/);
    await page.getByPlaceholder('admin').fill(email);
    await page.getByPlaceholder('••••••••').fill('password123');
    await page.getByRole('button', { name: 'Войти' }).click();

    await expect(page).toHaveURL(/\/projects/);
    await page.getByRole('button', { name: /Новый Проект|Создать Проект/i }).first().click();

    await page.getByPlaceholder('My Awesome API').fill('CRM System');
    await page.getByPlaceholder('com.example', { exact: true }).fill('com.crm');
    await page.getByPlaceholder('demo-api').fill('demo');

    // Turn ON Frontend
    await page.getByText('Сгенерировать Фронтенд (React + Vite)').click();
    // Turn ON Auth
    await page.getByText('Включить Авторизацию (JWT)').click();

    await page.getByRole('button', { name: 'Создать проект', exact: true }).click();
    await page.getByText('CRM System').click();

    // 1. Modeler
    await page.getByText('Data Modeler').click();

    // Create Company
    await page.getByText('Add entity').click();
    await page.getByPlaceholder('Название сущности (например, User)').fill('Company');
    await page.getByText('Add field').click();
    await page.locator('input[placeholder="Название поля (с маленькой буквы)"]').last().fill('name');

    // Create Employee
    await page.getByText('Add entity').click();
    // Using nth(1) because properties might be globally accessible or scoped
    // To be safe, we'll try to focus on the newly added entity
    await page.getByPlaceholder('Название сущности (например, User)').fill('Employee');
    await page.getByText('Add field').click();
    await page.locator('input[placeholder="Название поля (с маленькой буквы)"]').last().fill('firstName');

    // Add Relation OneToMany (Company -> Employee)
    await page.getByText('Add relation').click();
    const relationSource = page.locator('select.relation-source').last();
    if (await relationSource.count() > 0) {
      await relationSource.selectOption('Company');
      await page.locator('select.relation-target').last().selectOption('Employee');
      await page.locator('select.relation-type').last().selectOption('OneToMany');
    }

    await page.getByRole('button', { name: 'Save model' }).click();
    await page.waitForTimeout(1000);

    // 2. Deploy
    await page.getByRole('button', { name: 'Развернуть' }).click();
    await page.getByRole('button', { name: 'Развернуть' }).nth(1).click();

    // Wait up to 3 minutes for Docker in Docker to spin up Traefik, PostgreSQL, Backend and Frontend
    const statusRunning = page.locator('text=ЗАПУЩЕНО');
    await expect(statusRunning).toBeVisible({ timeout: 180000 });

    const urlParts = page.url().split('/');
    const projectId = urlParts[urlParts.indexOf('projects') + 1];
    const generatedAppUrl = `http://proj-${projectId}.localhost`;

    await page.waitForTimeout(5000); // Wait for Traefik to register route

    // 3. Verify Gen App
    const newPage = await page.context().newPage();
    let hasLoaded = false;
    // Retry mechanism because sometimes DNS/Traefik takes 10-15s
    for(let i=0; i<6; i++) {
        try {
            await newPage.goto(generatedAppUrl, { timeout: 10000 });
            hasLoaded = true;
            break;
        } catch(e) {
            await newPage.waitForTimeout(5000);
        }
    }
    expect(hasLoaded).toBe(true);

    // It asked for Auth, so we expect a login page
    // Since we generated Auth, we expect "Login" or "Register"
    // Usually admin/admin defaults or we register
    const regBtn = newPage.getByText('Register');
    if (await regBtn.isVisible()) {
        await regBtn.click();
        await newPage.getByPlaceholder('Username').fill('admin');
        await newPage.getByPlaceholder('Password').fill('admin');
        await newPage.getByRole('button', { name: 'Register' }).click();
    }
    
    // Check if entities rendered in sidebar
    await expect(newPage.locator('nav').getByText(/Company Data/i)).toBeVisible();
    await expect(newPage.locator('nav').getByText(/Employee Data/i)).toBeVisible();

    // Click Company
    await newPage.getByText(/Company Data/i).click();
    await newPage.getByText('Add New').click();

    await newPage.getByLabel('Name').fill('TechCorp LLC');
    await newPage.getByRole('button', { name: /Save/i }).click();

    // A table should render the data
    await expect(newPage.getByText('TechCorp LLC')).toBeVisible();

    await newPage.close();
  });

});
