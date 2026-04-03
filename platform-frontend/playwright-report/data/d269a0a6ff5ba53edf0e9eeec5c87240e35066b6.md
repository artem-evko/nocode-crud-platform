# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: fullstack.spec.ts >> Platform E2E - Fullstack Project with UI Builder >> should register, create project with frontend, model relations, build UI, and verify generated app
- Location: e2e\fullstack.spec.ts:8:3

# Error details

```
Test timeout of 180000ms exceeded.
```

```
Error: locator.click: Test timeout of 180000ms exceeded.
Call log:
  - waiting for getByText('Data Modeler')

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - region "Notifications alt+T"
  - generic [ref=e3]:
    - banner [ref=e4]:
      - generic [ref=e5]:
        - button "Назад к проектам" [ref=e6] [cursor=pointer]:
          - img [ref=e7]
        - heading "CRM System Моделирование БД" [level=1] [ref=e10]
      - generic [ref=e11]:
        - button "Настройки" [ref=e12] [cursor=pointer]:
          - img [ref=e13]
          - text: Настройки
        - button "UI Builder" [ref=e16] [cursor=pointer]:
          - img [ref=e17]
          - text: UI Builder
        - button "Логика (Flows)" [ref=e21] [cursor=pointer]:
          - img [ref=e22]
          - text: Логика (Flows)
        - button "Скачать код" [ref=e24] [cursor=pointer]:
          - img [ref=e25]
          - text: Скачать код
        - button "Развернуть" [ref=e28] [cursor=pointer]:
          - img [ref=e29]
          - text: Развернуть
        - button "Добавить сущность" [ref=e34] [cursor=pointer]:
          - img [ref=e35]
          - text: Добавить сущность
        - button "Сохранить модель" [ref=e37] [cursor=pointer]:
          - img [ref=e38]
          - text: Сохранить модель
    - generic [ref=e42]:
      - application [ref=e44]:
        - img
        - generic "Control Panel" [ref=e47]:
          - button "Zoom In" [ref=e48] [cursor=pointer]:
            - img [ref=e49]
          - button "Zoom Out" [ref=e51] [cursor=pointer]:
            - img [ref=e52]
          - button "Fit View" [ref=e54] [cursor=pointer]:
            - img [ref=e55]
          - button "Toggle Interactivity" [ref=e57] [cursor=pointer]:
            - img [ref=e58]
        - link "React Flow attribution" [ref=e61] [cursor=pointer]:
          - /url: https://reactflow.dev
          - text: React Flow
      - paragraph [ref=e64]: Выберите сущность на холсте для редактирования её свойств.
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | import { randomUUID } from 'crypto';
  3   | 
  4   | test.describe('Platform E2E - Fullstack Project with UI Builder', () => {
  5   | 
  6   |   const email = `fullstack_${randomUUID()}@test.com`;
  7   | 
  8   |   test('should register, create project with frontend, model relations, build UI, and verify generated app', async ({ page }) => {
  9   |     await page.goto('/');
  10  | 
  11  |     await page.getByText('Регистрация').first().click();
  12  |     await page.getByPlaceholder('developer123').fill(email);
  13  |     await page.getByPlaceholder('••••••••').first().fill('password123');
  14  |     await page.getByPlaceholder('••••••••').nth(1).fill('password123');
  15  |     await page.getByRole('button', { name: 'Sign up' }).click();
  16  | 
  17  |     // Login
  18  |     await expect(page).toHaveURL(/\/login/);
  19  |     await page.getByPlaceholder('admin').fill(email);
  20  |     await page.getByPlaceholder('••••••••').fill('password123');
  21  |     await page.getByRole('button', { name: 'Войти' }).click();
  22  | 
  23  |     await expect(page).toHaveURL(/\/projects/);
  24  |     await page.getByRole('button', { name: /Новый Проект|Создать Проект/i }).first().click();
  25  | 
  26  |     await page.getByPlaceholder('My Awesome API').fill('CRM System');
  27  |     await page.getByPlaceholder('com.example', { exact: true }).fill('com.crm');
  28  |     await page.getByPlaceholder('demo-api').fill('demo');
  29  | 
  30  |     // Turn ON Frontend
  31  |     await page.getByText('Сгенерировать Фронтенд (React + Vite)').click();
  32  |     // Turn ON Auth
  33  |     await page.getByText('Включить Авторизацию (JWT)').click();
  34  | 
  35  |     await page.getByRole('button', { name: 'Создать проект', exact: true }).click();
  36  |     await page.getByText('CRM System').click();
  37  | 
  38  |     // 1. Modeler
> 39  |     await page.getByText('Data Modeler').click();
      |                                          ^ Error: locator.click: Test timeout of 180000ms exceeded.
  40  | 
  41  |     // Create Company
  42  |     await page.getByText('Add entity').click();
  43  |     await page.getByPlaceholder('Название сущности (например, User)').fill('Company');
  44  |     await page.getByText('Add field').click();
  45  |     await page.locator('input[placeholder="Название поля (с маленькой буквы)"]').last().fill('name');
  46  | 
  47  |     // Create Employee
  48  |     await page.getByText('Add entity').click();
  49  |     // Using nth(1) because properties might be globally accessible or scoped
  50  |     // To be safe, we'll try to focus on the newly added entity
  51  |     await page.getByPlaceholder('Название сущности (например, User)').fill('Employee');
  52  |     await page.getByText('Add field').click();
  53  |     await page.locator('input[placeholder="Название поля (с маленькой буквы)"]').last().fill('firstName');
  54  | 
  55  |     // Add Relation OneToMany (Company -> Employee)
  56  |     await page.getByText('Add relation').click();
  57  |     const relationSource = page.locator('select.relation-source').last();
  58  |     if (await relationSource.count() > 0) {
  59  |       await relationSource.selectOption('Company');
  60  |       await page.locator('select.relation-target').last().selectOption('Employee');
  61  |       await page.locator('select.relation-type').last().selectOption('OneToMany');
  62  |     }
  63  | 
  64  |     await page.getByRole('button', { name: 'Save model' }).click();
  65  |     await page.waitForTimeout(1000);
  66  | 
  67  |     // 2. Deploy
  68  |     await page.getByRole('button', { name: 'Развернуть' }).click();
  69  |     await page.getByRole('button', { name: 'Развернуть' }).nth(1).click();
  70  | 
  71  |     // Wait up to 3 minutes for Docker in Docker to spin up Traefik, PostgreSQL, Backend and Frontend
  72  |     const statusRunning = page.locator('text=ЗАПУЩЕНО');
  73  |     await expect(statusRunning).toBeVisible({ timeout: 180000 });
  74  | 
  75  |     const urlParts = page.url().split('/');
  76  |     const projectId = urlParts[urlParts.indexOf('projects') + 1];
  77  |     const generatedAppUrl = `http://proj-${projectId}.localhost`;
  78  | 
  79  |     await page.waitForTimeout(5000); // Wait for Traefik to register route
  80  | 
  81  |     // 3. Verify Gen App
  82  |     const newPage = await page.context().newPage();
  83  |     let hasLoaded = false;
  84  |     // Retry mechanism because sometimes DNS/Traefik takes 10-15s
  85  |     for(let i=0; i<6; i++) {
  86  |         try {
  87  |             await newPage.goto(generatedAppUrl, { timeout: 10000 });
  88  |             hasLoaded = true;
  89  |             break;
  90  |         } catch(e) {
  91  |             await newPage.waitForTimeout(5000);
  92  |         }
  93  |     }
  94  |     expect(hasLoaded).toBe(true);
  95  | 
  96  |     // It asked for Auth, so we expect a login page
  97  |     // Since we generated Auth, we expect "Login" or "Register"
  98  |     // Usually admin/admin defaults or we register
  99  |     const regBtn = newPage.getByText('Register');
  100 |     if (await regBtn.isVisible()) {
  101 |         await regBtn.click();
  102 |         await newPage.getByPlaceholder('Username').fill('admin');
  103 |         await newPage.getByPlaceholder('Password').fill('admin');
  104 |         await newPage.getByRole('button', { name: 'Register' }).click();
  105 |     }
  106 |     
  107 |     // Check if entities rendered in sidebar
  108 |     await expect(newPage.locator('nav').getByText(/Company Data/i)).toBeVisible();
  109 |     await expect(newPage.locator('nav').getByText(/Employee Data/i)).toBeVisible();
  110 | 
  111 |     // Click Company
  112 |     await newPage.getByText(/Company Data/i).click();
  113 |     await newPage.getByText('Add New').click();
  114 | 
  115 |     await newPage.getByLabel('Name').fill('TechCorp LLC');
  116 |     await newPage.getByRole('button', { name: /Save/i }).click();
  117 | 
  118 |     // A table should render the data
  119 |     await expect(newPage.getByText('TechCorp LLC')).toBeVisible();
  120 | 
  121 |     await newPage.close();
  122 |   });
  123 | 
  124 | });
  125 | 
```