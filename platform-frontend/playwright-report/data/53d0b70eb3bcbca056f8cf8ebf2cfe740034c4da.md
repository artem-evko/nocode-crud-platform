# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: backend-only.spec.ts >> Platform E2E - Backend Only Project >> should register, create backend-only project, model it, deploy and interact with generated API
- Location: e2e\backend-only.spec.ts:8:3

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
        - heading "Inventory System API Моделирование БД" [level=1] [ref=e10]
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
  4   | test.describe('Platform E2E - Backend Only Project', () => {
  5   | 
  6   |   const email = `backend_${randomUUID()}@test.com`;
  7   | 
  8   |   test('should register, create backend-only project, model it, deploy and interact with generated API', async ({ page, request }) => {
  9   |     // 1. Go to platform
  10  |     await page.goto('/');
  11  | 
  12  |     // 2. Register
  13  |     await page.getByText('Регистрация').first().click();
  14  |     await page.getByPlaceholder('developer123').fill(email);
  15  |     await page.getByPlaceholder('••••••••').first().fill('password123');
  16  |     await page.getByPlaceholder('••••••••').nth(1).fill('password123');
  17  |     await page.getByRole('button', { name: 'Sign up' }).click();
  18  | 
  19  |     // 3. Login
  20  |     await expect(page).toHaveURL(/\/login/);
  21  |     await page.getByPlaceholder('admin').fill(email);
  22  |     await page.getByPlaceholder('••••••••').fill('password123');
  23  |     await page.getByRole('button', { name: 'Войти' }).click();
  24  | 
  25  |     // 4. Ensure we are logged in by seeing /projects
  26  |     await expect(page).toHaveURL(/\/projects/);
  27  | 
  28  |     // 5. Create Project
  29  |     await page.getByRole('button', { name: /Новый Проект|Создать Проект/i }).first().click();
  30  |     await page.getByPlaceholder('My Awesome API').fill('Inventory System API');
  31  |     await page.getByPlaceholder('com.example', { exact: true }).fill('com.inventory');
  32  |     await page.getByPlaceholder('demo-api').fill('api');
  33  |     
  34  |     // Ensure Frontend is NOt checked. Actually we don't click it, so it's off by default.
  35  |     // Auth is off by default.
  36  |     await page.getByRole('button', { name: 'Создать проект', exact: true }).click();
  37  | 
  38  |     // 5. Navigate inside the project
  39  |     await page.getByText('Inventory System API').click();
  40  | 
  41  |     // 6. Go to Modeler
> 42  |     await page.getByText('Data Modeler').click();
      |                                          ^ Error: locator.click: Test timeout of 180000ms exceeded.
  43  | 
  44  |     // Add Entity 'Item'
  45  |     await page.getByText('Add entity').click();
  46  |     
  47  |     // In the properties panel (assuming it opens or is visible, usually selecting the new entity does it)
  48  |     await page.getByPlaceholder('Название сущности (например, User)').fill('Item');
  49  |     
  50  |     // Add Field
  51  |     await page.getByText('Add field').click();
  52  |     // Fill first field name -> "sku"
  53  |     await page.locator('input[placeholder="Название поля (с маленькой буквы)"]').last().fill('sku');
  54  |     
  55  |     await page.getByText('Add field').click();
  56  |     // Fill second field name -> "price"
  57  |     await page.locator('input[placeholder="Название поля (с маленькой буквы)"]').last().fill('price');
  58  |     // Change type to Integer
  59  |     await page.locator('select').last().selectOption('Integer');
  60  | 
  61  |     // Save Model
  62  |     await page.getByRole('button', { name: 'Save model' }).click();
  63  |     
  64  |     // Deploy
  65  |     await page.getByRole('button', { name: 'Развернуть' }).click();
  66  |     await page.getByRole('button', { name: 'Развернуть' }).nth(1).click(); // Modal confirm
  67  | 
  68  |     // Wait for deployment strictly. Might take up to 2 minutes
  69  |     await expect(page.locator('text=ЗАПУЩЕНО')).toBeVisible({ timeout: 120000 });
  70  | 
  71  |     // Deployment domain extraction
  72  |     // Traefik exposes the API. We know the URL from UI or we can deduce it from project ID.
  73  |     // Let's get the Project ID from the URL: /projects/xxxxx/modeler
  74  |     const urlParts = page.url().split('/');
  75  |     const projectId = urlParts[urlParts.indexOf('projects') + 1];
  76  | 
  77  |     const generatedApiUrl = `http://proj-${projectId}.localhost/api/items`;
  78  | 
  79  |     // Wait 5 seconds for traefik dynamically routing...
  80  |     await page.waitForTimeout(5000);
  81  | 
  82  |     // Act: Send API request using playwright's internal request context
  83  |     const createResp = await request.post(generatedApiUrl, {
  84  |       data: {
  85  |         sku: 'TEST-SKU-100',
  86  |         price: 999
  87  |       }
  88  |     });
  89  | 
  90  |     expect(createResp.status()).toBe(200);
  91  |     const createdItem = await createResp.json();
  92  |     expect(createdItem.id).toBeDefined();
  93  |     expect(createdItem.sku).toBe('TEST-SKU-100');
  94  |     expect(createdItem.price).toBe(999);
  95  | 
  96  |     // Act: GET request
  97  |     const getResp = await request.get(generatedApiUrl);
  98  |     expect(getResp.status()).toBe(200);
  99  |     const list = await getResp.json();
  100 |     expect(Array.isArray(list)).toBe(true);
  101 |     expect(list.length).toBeGreaterThanOrEqual(1);
  102 |     expect(list[0].sku).toBe('TEST-SKU-100');
  103 |   });
  104 | });
  105 | 
```