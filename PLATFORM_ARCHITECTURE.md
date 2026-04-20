# NoCode CRUD Platform — Полная Архитектура и Логика Работы

> Этот документ описывает **всю** архитектуру, логику, потоки данных, API-контракты, структуру БД и процесс генерации кода платформы NoCode CRUD Platform. Предназначен для использования как контекст в ИИ-чатах.

---

## 1. Общее Описание

**NoCode CRUD Platform** — веб-платформа, позволяющая без написания кода:
1. **Спроектировать модель данных** (сущности, поля, связи) визуально на графе (ReactFlow)
2. **Собрать интерфейс** администратора (drag-and-drop UI Builder с сеткой 12 колонок)
3. **Настроить бизнес-логику** (Action Flows — визуальные потоки событий)
4. **Автоматически сгенерировать** полноценное Spring Boot + React приложение
5. **Развернуть приложение** в Docker одним кликом (с Traefik reverse-proxy)

**Стек технологий:**
- **Backend платформы**: Java 21, Spring Boot 4.0.3, Spring Security (session-based), PostgreSQL, Liquibase, Lombok
- **Frontend платформы**: React 18 + TypeScript, Vite 5, Tailwind CSS, Zustand (state), ReactFlow (графы), Recharts (графики), Sonner (тосты), Lucide React (иконки), Axios
- **Генерируемый код**: Spring Boot 3 + Java 21, PostgreSQL, Liquibase, REST API, (опционально) React + Vite + Tailwind frontend, (опционально) JWT Security
- **Деплой**: Docker, Docker Compose, Traefik v2.10

---

## 2. Структура Проекта (Maven Multi-Module)

```
nocode-crud-platform/           ← Корневой Maven POM (packaging: pom)
├── pom.xml                     ← Java 21, Spring Boot 4.0.3
├── platform-web/               ← Модуль 1: Backend API платформы (Spring Boot App)
├── generator-core/             ← Модуль 2: Движок генерации кода (библиотека JAR)
├── platform-frontend/          ← React/Vite SPA (не Maven модуль)
├── docker-compose.yml          ← Продакшн деплой всей платформы
├── Dockerfile                  ← Для platform-web
└── start-platform.ps1          ← Скрипт быстрого запуска (dev)
```

### 2.1 platform-web (Backend платформы)
```
platform-web/src/main/java/com/nocode/platform/
├── Application.java                    ← @SpringBootApplication точка входа
├── config/
│   ├── SecurityConfig.java             ← Spring Security: session-based auth, CORS, BCrypt
│   ├── LiquibaseConfig.java            ← Ручной запуск Liquibase (чтобы избежать двойного)
│   └── GlobalExceptionHandler.java     ← @ControllerAdvice для ошибок
├── controller/
│   ├── AuthController.java             ← POST /api/auth/login|register|logout, GET /api/auth/me
│   ├── ProjectController.java          ← CRUD /api/projects
│   └── DeploymentController.java       ← POST|DELETE /api/projects/{id}/deploy
├── domain/
│   └── PlatformUser.java               ← JPA Entity: platform_users (id, username, password, role)
├── dto/
│   ├── ProjectDto.java                 ← DTO для передачи проектов (Lombok @Data)
│   └── LoginRequest.java               ← DTO: { username, password }
├── repository/
│   └── UserRepository.java             ← JpaRepository<PlatformUser, UUID>
├── service/
│   └── CustomUserDetailsService.java   ← UserDetailsService для Spring Security
├── project/
│   ├── ProjectEntity.java              ← JPA Entity: projects (главная таблица)
│   ├── ProjectRepository.java          ← JpaRepository с findAllByOwnerUsername()
│   ├── ProjectService.java             ← Бизнес-логика CRUD + доступы по ownerUsername
│   ├── CreateProjectRequest.java       ← Record DTO
│   └── DeploymentService.java          ← @Async — генерация, Docker build, deploy, healthcheck
└── generator/
    ├── GeneratorFacade.java            ← @Service — оркестрация: specText → Spec → validate → generate → byte[]
    └── ProjectDownloadController.java  ← GET /api/projects/{id}/download → ZIP файл
```

### 2.2 generator-core (Движок генерации кода)
```
generator-core/src/main/java/com/nocode/platform/generator/
├── api/
│   └── GeneratedProject.java           ← Record(String fileName, byte[] content)
├── spec/
│   ├── Spec.java                       ← Главная модель данных — Java Records (Spec, Project, Entity, Field, Relation, UiSpec, Component, ActionFlow, FlowNode, FlowEdge)
│   ├── SpecParser.java                 ← JSON/YAML → Spec (Jackson ObjectMapper + YAMLFactory)
│   └── SpecValidator.java              ← Валидация: обязательные поля, дубликаты имён, Java keywords, reserved names
├── engine/
│   ├── ProjectGenerator.java           ← Главный генератор: Spec → ZIP (byte[])
│   ├── LiquibaseGenerator.java         ← Генерация db.changelog-master.yaml (DDL миграции)
│   ├── SecurityGenerator.java          ← Генерация JWT Security (если authEnabled): SecurityConfig, JwtFilter, UserEntity, AuthController...
│   ├── FrontendGenerator.java          ← Генерация React frontend (если generateFrontend): package.json, App.tsx, EntityList/Form, LoginPage...
│   └── poet/                           ← JavaPoet генераторы (программная генерация Java кода)
│       ├── EntityGenerator.java        ← JPA @Entity класс с @Id, полями, связями @ManyToOne/@OneToMany
│       ├── RepositoryGenerator.java    ← JpaRepository<Entity, Long> интерфейс
│       ├── ControllerGenerator.java    ← REST @RestController с CRUD + @PreAuthorize (RBAC)
│       ├── ServiceGenerator.java       ← ActionFlow бизнес-логика (DB_CREATE, DB_UPDATE, DELETE, NAVIGATE, SHOW_TOAST)
│       └── ActionFlowControllerGenerator.java ← REST контроллер для выполнения Action Flows
├── template/
│   └── TemplateRenderer.java           ← FreeMarker шаблонизатор
└── stub/                               ← (не используется активно)

generator-core/src/main/resources/templates/  ← FreeMarker шаблоны
├── pom.ftl                             ← Maven POM для генерируемого проекта
├── Application.java.ftl               ← Main class
├── application.yml.ftl                 ← Spring Boot config (DB, Liquibase)
└── frontend/                           ← React frontend шаблоны
    ├── package.json.ftl
    ├── vite.config.ts.ftl
    ├── index.html.ftl
    ├── tailwind.config.js.ftl
    └── src/
        ├── main.tsx.ftl
        ├── App.tsx.ftl                 ← Роутер с CRUD страницами для каждой сущности
        ├── index.css.ftl
        ├── lib/api.ts.ftl              ← Axios client для API
        ├── lib/utils.ts.ftl
        ├── store/authStore.ts.ftl
        └── pages/
            ├── LoginPage.tsx.ftl
            ├── RegisterPage.tsx.ftl
            ├── Dashboard.tsx.ftl        ← Кастомный UI из UI Builder
            ├── EntityList.tsx.ftl       ← Таблица сущности (CRUD list)
            └── EntityForm.tsx.ftl       ← Форма создания/редактирования
```

### 2.3 platform-frontend (React SPA)
```
platform-frontend/src/
├── main.tsx                            ← ReactDOM.createRoot
├── App.tsx                             ← BrowserRouter + Routes
├── index.css                           ← Tailwind base + theme transitions
├── api/
│   └── client.ts                       ← Axios instance (baseURL: /api, withCredentials: true)
├── store/
│   ├── authStore.ts                    ← Zustand: user, isAuthenticated, checkAuth()
│   ├── themeStore.ts                   ← Zustand: theme (light|dark), localStorage persistence
│   └── uiBuilderStore.ts              ← Zustand: components[], selectedComponentId, CRUD actions
├── lib/
│   ├── compiler.ts                     ← compileToSpec(): ReactFlow nodes/edges → BackendSpec JSON
│   ├── projectValidator.ts             ← validateProject(): specText → errors[] + warnings[]
│   ├── MockDataEngine.ts              ← Генерация фейковых данных для Preview
│   ├── gridLayout.ts                   ← Утилиты сетки
│   └── utils.ts                        ← cn() утилита
├── components/
│   ├── ThemeToggle.tsx                 ← Кнопка переключения темы (Sun/Moon иконки)
│   ├── ProjectModal.tsx               ← Модалка создания/редактирования проекта
│   ├── ProjectSettingsModal.tsx        ← Модалка настроек (authEnabled, generateFrontend)
│   ├── DeploymentModal.tsx            ← Модалка деплоя (статус, порт, валидация, URL)
│   ├── EntityNode.tsx                 ← ReactFlow кастомный нод: сущность с полями, RBAC
│   ├── ModelerPropertiesPanel.tsx     ← Панель свойств сущности (поля, связи, роли)
│   ├── flow/
│   │   └── LogicNode.tsx              ← ReactFlow нод для Action Flow (trigger/action/logic)
│   └── builder/
│       ├── SidebarItem.tsx            ← Элемент палитры с drag-and-drop
│       ├── CanvasArea.tsx             ← Холст UI Builder (12-колоночная сетка)
│       ├── SortableComponent.tsx      ← Отображение компонента на холсте (с drag/resize)
│       └── PropertiesPanel.tsx        ← Панель свойств UI компонента (binding, стили, layout)
├── pages/
│   ├── LandingPage.tsx                ← Маркетинговая страница
│   ├── LoginPage.tsx                  ← Вход
│   ├── RegisterPage.tsx               ← Регистрация
│   ├── ProjectsPage.tsx               ← Список проектов пользователя + CRUD кнопки
│   ├── ModelerPage.tsx                ← Визуальный редактор модели данных (ReactFlow)
│   ├── UIBuilderPage.tsx              ← Визуальный конструктор интерфейса (drag-and-drop)
│   ├── ActionFlowPage.tsx             ← Визуальный редактор бизнес-логики (ReactFlow)
│   ├── PreviewPage.tsx                ← Предпросмотр собранного UI (Recharts + mock data)
│   └── NotFoundPage.tsx               ← 404
└── types/                              ← TypeScript типы
```

---

## 3. Схема Базы Данных (PostgreSQL)

### Таблица `platform_users`
| Колонка    | Тип          | Описание                       |
|------------|--------------|--------------------------------|
| `id`       | UUID (PK)    | Автогенерируемый               |
| `username` | VARCHAR      | Уникальное имя пользователя    |
| `password` | VARCHAR      | BCrypt хеш                     |
| `role`     | VARCHAR      | Роль (по умолчанию "USER")     |

### Таблица `projects`
| Колонка              | Тип             | Описание                                                  |
|----------------------|-----------------|-----------------------------------------------------------|
| `id`                 | UUID (PK)       | Идентификатор проекта                                     |
| `owner_username`     | VARCHAR(100)    | Владелец (связь с platform_users.username)                 |
| `name`               | VARCHAR(200)    | Название проекта                                          |
| `group_id`           | VARCHAR(200)    | Maven groupId (com.example)                               |
| `artifact_id`        | VARCHAR(200)    | Maven artifactId (my-app)                                 |
| `version`            | VARCHAR(50)     | Версия (1.0.0)                                            |
| `base_package`       | VARCHAR(300)    | Java пакет (com.example.myapp)                            |
| `spec_text`          | TEXT            | **Главное поле** — JSON спецификация всего проекта        |
| `auth_enabled`       | BOOLEAN         | Включить JWT авторизацию в генерируемом коде               |
| `generate_frontend`  | BOOLEAN         | Генерировать React frontend                               |
| `deployment_status`  | VARCHAR(50)     | NONE / DEPLOYING / RUNNING / FAILED / STOPPING / PORT_OCCUPIED |
| `deployment_url`     | VARCHAR(300)    | URL развёрнутого приложения                               |
| `created_at`         | TIMESTAMPTZ     | Дата создания                                             |
| `updated_at`         | TIMESTAMPTZ     | Дата обновления                                           |
| `entity_version`     | BIGINT          | @Version для OCC (Optimistic Concurrency Control)         |

---

## 4. REST API Контракты

### 4.1 Аутентификация (`/api/auth`)

| Метод  | URL                | Вход (Body)                         | Выход                          | Описание                  |
|--------|--------------------|-------------------------------------|--------------------------------|---------------------------|
| POST   | `/api/auth/register` | `{ username, password }`          | `{ message: "..." }`          | Регистрация               |
| POST   | `/api/auth/login`    | `{ username, password }`          | `"Login successful"` + Session Cookie (JSESSIONID) | Вход          |
| POST   | `/api/auth/logout`   | —                                 | `"Logged out"`                 | Выход (инвалидация сессии)|
| GET    | `/api/auth/me`       | — (Cookie)                        | `"username"` или 401           | Проверка текущего юзера   |

**Механизм**: Session-based аутентификация через Spring Security. Cookie `JSESSIONID` передаётся автоматически через `withCredentials: true` в Axios.

### 4.2 Проекты (`/api/projects`)

| Метод  | URL                          | Вход (Body)                    | Выход                              | Описание                  |
|--------|------------------------------|--------------------------------|------------------------------------|---------------------------|
| GET    | `/api/projects`              | —                              | `ProjectDto[]`                     | Список проектов юзера     |
| GET    | `/api/projects/{id}`         | —                              | `ProjectDto`                       | Один проект по ID         |
| POST   | `/api/projects`              | `ProjectDto`                   | `ProjectDto` (созданный)           | Создать проект            |
| PUT    | `/api/projects/{id}`         | `ProjectDto`                   | `ProjectDto` (обновлённый)         | Обновить проект + specText|
| DELETE | `/api/projects/{id}`         | —                              | `204`                              | Удалить проект + stop deploy |

### 4.3 Генерация и Скачивание

| Метод | URL                              | Вход      | Выход                           | Описание                         |
|-------|----------------------------------|-----------|----------------------------------|----------------------------------|
| GET   | `/api/projects/{id}/download`    | —         | `application/zip` (byte[])      | Сгенерировать и скачать ZIP       |

### 4.4 Деплой (`/api/projects/{id}/deploy`)

| Метод  | URL                              | Параметры            | Выход     | Описание                         |
|--------|----------------------------------|----------------------|-----------|----------------------------------|
| POST   | `/api/projects/{id}/deploy`      | `?port=XXXX` (опц.) | `202`     | Запуск деплоя (async)            |
| DELETE | `/api/projects/{id}/deploy`      | —                    | `200`     | Остановить деплой (docker down)  |

---

## 5. Формат Spec (Спецификация Проекта)

`spec_text` — **центральное поле**, хранит полную конфигурацию проекта в формате JSON. Создаётся фронтендом через `compiler.ts` и сохраняется при каждом сохранении в Modeler / UI Builder / Action Flow.

### 5.1 Полная структура JSON

```json
{
  "specVersion": 1,
  "project": {
    "groupId": "com.example",
    "artifactId": "shop-api",
    "name": "Shop API",
    "basePackage": "com.example.shopapi",
    "version": "1.0.0",
    "authEnabled": true,
    "generateFrontend": true
  },
  "entities": [
    {
      "name": "Product",
      "table": "products",
      "fields": [
        { "name": "title", "type": "STRING", "required": true },
        { "name": "price", "type": "DECIMAL", "required": true },
        { "name": "active", "type": "BOOLEAN", "required": false }
      ],
      "relations": [
        {
          "name": "orders",
          "targetEntity": "Order",
          "type": "ONE_TO_MANY",
          "mappedBy": "product"
        }
      ],
      "readRoles": "ROLE_USER, ROLE_ADMIN",
      "createRoles": "ROLE_ADMIN",
      "updateRoles": "ROLE_ADMIN",
      "deleteRoles": "ROLE_ADMIN"
    }
  ],
  "uiSpec": {
    "components": [
      {
        "id": "abc123",
        "type": "DataTable",
        "props": {
          "entityName": "Product",
          "text": "Список товаров"
        },
        "children": []
      },
      {
        "id": "def456",
        "type": "Button",
        "props": {
          "text": "Добавить товар",
          "actionFlowId": "flow1"
        },
        "children": []
      }
    ]
  },
  "actionFlows": [
    {
      "id": "flow1",
      "name": "Create Product",
      "nodes": [
        { "id": "n1", "type": "trigger", "action": "UI_CLICK", "config": {} },
        { "id": "n2", "type": "action", "action": "DB_CREATE_RECORD", "config": { "entityName": "Product" } },
        { "id": "n3", "type": "action", "action": "UI_SHOW_TOAST", "config": { "message": "Создано!" } }
      ],
      "edges": [
        { "id": "e1", "source": "n1", "target": "n2" },
        { "id": "e2", "source": "n2", "target": "n3" }
      ]
    }
  ]
}
```

### 5.2 Допустимые типы полей
| Frontend (EntityNode) | Backend (Spec.FieldType) | Java тип       | SQL (Liquibase)    |
|-----------------------|--------------------------|----------------|--------------------|
| `String`              | `STRING`                 | `String`       | `varchar(255)`     |
| `Integer`             | `INTEGER`                | `Integer`      | `int`              |
| `Long`                | `INTEGER`                | `Long`         | `bigint`           |
| `Boolean`             | `BOOLEAN`                | `Boolean`      | `boolean`          |
| `LocalDate`           | `DATE`                   | `LocalDate`    | `date`             |
| `OffsetDateTime`      | `DATE`                   | `OffsetDateTime`| `timestamptz`     |
| `Double`              | `DECIMAL`                | `Double`       | `double`           |
| `BigDecimal`          | `DECIMAL`                | `BigDecimal`   | `decimal(19,2)`    |
| `UUID`                | `STRING`                 | `UUID`         | `varchar(255)`     |

### 5.3 Типы связей
| Тип             | Описание                                     |
|-----------------|----------------------------------------------|
| `ONE_TO_MANY`   | Один-ко-многим (FK добавляется в target)      |
| `MANY_TO_ONE`   | Многие-к-одному (FK добавляется в source)     |
| `MANY_TO_MANY`  | Многие-ко-многим (через join table)           |

### 5.4 Типы UI компонентов
| Тип          | Описание                           | Обязательные props                   |
|--------------|-------------------------------------|--------------------------------------|
| `Heading`    | Заголовок                          | `text`                               |
| `Text`       | Текстовый блок                     | `text`                               |
| `Button`     | Кнопка                            | `text`, `actionFlowId` (опц.)        |
| `DataTable`  | Таблица данных (CRUD)              | `entityName` (обязательно!)          |
| `FormModule` | Форма создания/редактирования      | `entityName` (обязательно!)          |
| `BarChart`   | Столбчатая диаграмма               | `entityName`, `xAxisKey`, `yAxisKey` |
| `LineChart`  | Линейная диаграмма                 | `entityName`, `xAxisKey`, `yAxisKey` |
| `Image`      | Изображение                        | `url`                                |
| `Divider`    | Разделитель                        | —                                    |
| `Card`       | Карточка                           | `text`                               |
| `Badge`      | Бейдж                              | `text`                               |
| `Container`  | Layout-контейнер                   | —                                    |

### 5.5 Типы Action Flow нодов
| action              | type     | config                              | Описание                        |
|---------------------|----------|-------------------------------------|---------------------------------|
| `UI_CLICK`          | trigger  | —                                   | Старт по клику кнопки           |
| `DB_CREATE_RECORD`  | action   | `{ entityName: string }`            | Создание записи в БД            |
| `DB_UPDATE_RECORD`  | action   | `{ entityName: string }`            | Обновление записи в БД          |
| `DB_DELETE_RECORD`  | action   | `{ entityName: string }`            | Удаление записи из БД           |
| `UI_SHOW_TOAST`     | action   | `{ message: string }`               | Показать уведомление            |
| `NAVIGATE`          | action   | `{ url: string }`                   | Перенаправление                 |

---

## 6. Формат хранения specText в БД (с ReactFlow-данными)

Фронтенд сохраняет дополнительные мета-данные ReactFlow прямо в `specText`:

```json
{
  "specVersion": 1,
  "project": { ... },
  "entities": [ ... ],
  "uiSpec": { "components": [ ... ] },
  "actionFlows": [ ... ],
  "_flow": {
    "nodes": [
      {
        "id": "node-1",
        "type": "entity",
        "position": { "x": 100, "y": 200 },
        "data": {
          "name": "Product",
          "fields": [ { "id": "f1", "name": "title", "type": "String", "required": true } ],
          "readRoles": "",
          "createRoles": "",
          "updateRoles": "",
          "deleteRoles": ""
        }
      }
    ],
    "edges": [
      { "id": "edge-1", "source": "node-1", "target": "node-2" }
    ]
  }
}
```

**`_flow`** — содержит позиции нодов и их визуальное состояние (для восстановления ReactFlow графа при открытии Modeler). Бэкенд парсит `specText` через `@JsonIgnoreProperties(ignoreUnknown = true)`, поэтому `_flow` и другие неизвестные поля просто игнорируются.

---

## 7. Потоки Данных (Data Flows)

### 7.1 Регистрация и Аутентификация
```
[Frontend LoginPage] 
  → POST /api/auth/login { username, password }
  → [AuthController] → AuthenticationManager.authenticate()
  → Spring Security creates HttpSession
  → Set-Cookie: JSESSIONID → [Browser]
  
Все последующие запросы:
  → Cookie: JSESSIONID → Spring Security → SecurityContext.getAuthentication()
```

### 7.2 Создание и Редактирование Проекта
```
[Frontend ProjectsPage] 
  → POST /api/projects { name, groupId, artifactId, version, basePackage, specText: "{}" }
  → [ProjectController.createProject()] → ProjectRepository.save()
  → Возвращает ProjectDto с UUID

[Frontend ModelerPage] — Визуальное моделирование
  → Пользователь добавляет Entity ноды, поля, связи на ReactFlow холсте
  → При "Сохранить":
    1. compiler.ts: compileToSpec(project, nodes, edges) → specJSON
    2. Добавляет _flow (ReactFlow state) и uiSpec (UI Builder state) в specJSON
    3. PUT /api/projects/{id} { ...project, specText: specJSON }
    → [ProjectController.updateProject()] → ProjectRepository.save()

[Frontend UIBuilderPage] — Конструктор UI
  → Пользователь перетаскивает компоненты (DataTable, Charts, Forms...) на сетку
  → Привязывает компоненты к сущностям (entityName)
  → При "Сохранить":
    1. Читает текущий specText из проекта
    2. Обновляет поле uiSpec.components
    3. PUT /api/projects/{id}

[Frontend ActionFlowPage] — Визуальная логика
  → Пользователь создаёт потоки: Trigger → Action → Action
  → При "Сохранить":
    1. Обновляет поле actionFlows в specText
    2. PUT /api/projects/{id}
```

### 7.3 Генерация Кода (Download)
```
[Frontend ProjectsPage] → Кнопка "Скачать"
  → GET /api/projects/{id}/download
  → [ProjectDownloadController]
    → [GeneratorFacade.generateReal(projectEntity)]
      1. Jackson ObjectMapper.readValue(specText, Spec.class)
      2. Override project metadata from ProjectEntity fields (groupId, artifactId etc.)
      3. SpecValidator.validate(spec) — проверка имён, типов, дубликатов
      4. ProjectGenerator.generate(spec) → byte[] (ZIP):
         a. FreeMarker: pom.xml, Application.java, application.yml
         b. LiquibaseGenerator: db.changelog-master.yaml (CREATE TABLE для каждой Entity)
         c. JavaPoet EntityGenerator: @Entity классы
         d. JavaPoet RepositoryGenerator: JpaRepository интерфейсы
         e. JavaPoet ControllerGenerator: @RestController с CRUD + @PreAuthorize
         f. (если authEnabled) SecurityGenerator: SecurityConfig, JwtFilter, UserEntity, AuthController
         g. (если actionFlows) ServiceGenerator + ActionFlowControllerGenerator
         h. (если generateFrontend) FrontendGenerator: Vite, React, Tailwind, EntityList/Form pages
  → Response: application/zip
  → Браузер скачивает ZIP-архив
```

### 7.4 Деплой Проекта
```
[Frontend DeploymentModal] → Кнопка "Развернуть"
  → POST /api/projects/{id}/deploy?port=XXXX
  → [DeploymentController] → [DeploymentService.deployProject()] @Async:
    1. updateStatus(project, "DEPLOYING")
    2. GeneratorFacade.generateReal(project) → byte[] ZIP
    3. Unzip в /tmp/deploy-{projectId}/
    4. generateDockerFiles():
       - Создаёт backend/Dockerfile (Maven multi-stage build → JRE Alpine)
       - Создаёт frontend/Dockerfile (Node build → nginx static)
    5. generateDockerCompose():
       - Правит application.yml (localhost → docker network 'db')
       - Генерирует docker-compose.yml:
         • db: postgres:15-alpine (with healthcheck)
         • backend: Spring Boot (depends_on: db.healthy)
         • frontend: nginx (с proxy_pass /api/ → backend:8080)
       - Traefik labels для автоматического reverse-proxy
    6. docker compose -p proj-{id} build (с ретраями)
    7. docker compose -p proj-{id} up -d
    8. Healthcheck loop (20 попыток × 3 сек):
       - docker inspect --format {{.State.Status}}
       - Проверка RestartCount == 0
    9. updateStatus(project, "RUNNING", "http://proj-{id}.localhost")

Остановка:
  → DELETE /api/projects/{id}/deploy
  → docker compose -p proj-{id} down -v
  → updateStatus(project, "NONE")
```

### 7.5 Frontend Routing
```
/                            → LandingPage (маркетинговая)
/login                       → LoginPage
/register                    → RegisterPage
/projects                    → ProjectsPage (список проектов, CRUD)
/projects/:projectId/modeler → ModelerPage (ReactFlow — модель данных)
/projects/:projectId/builder → UIBuilderPage (drag-and-drop UI)
/projects/:projectId/flows   → ActionFlowPage (ReactFlow — бизнес-логика)
/projects/:projectId/preview → PreviewPage (предпросмотр UI с mock-данными)
*                            → NotFoundPage (404)
```

---

## 8. Структура Генерируемого Кода (Выход ZIP)

### Только Backend (`generateFrontend = false`):
```
{artifactId}/
├── spec.yaml
├── backend/
│   ├── pom.xml
│   ├── README.md
│   └── src/main/
│       ├── java/{basePackage}/
│       │   ├── Application.java
│       │   ├── domain/
│       │   │   └── {EntityName}.java          ← JPA @Entity
│       │   ├── repository/
│       │   │   └── {EntityName}Repository.java ← JpaRepository
│       │   ├── controller/
│       │   │   ├── {EntityName}Controller.java  ← REST CRUD
│       │   │   └── ActionFlowController.java   ← (если есть flows)
│       │   ├── service/
│       │   │   └── ActionFlowService.java      ← (если есть flows)
│       │   └── security/                       ← (если authEnabled)
│       │       ├── SecurityConfig.java
│       │       ├── JwtAuthenticationFilter.java
│       │       ├── JwtTokenProvider.java
│       │       ├── UserEntity.java
│       │       ├── UserRepository.java
│       │       └── AuthController.java
│       └── resources/
│           ├── application.yml
│           └── db/changelog/db.changelog-master.yaml
```

### С Frontend (`generateFrontend = true`):
```
{artifactId}/
├── backend/     ← (та же структура)
└── frontend/
    ├── package.json
    ├── vite.config.ts
    ├── index.html
    ├── tailwind.config.js
    ├── tsconfig.json
    └── src/
        ├── main.tsx
        ├── App.tsx                    ← React Router с маршрутами
        ├── index.css
        ├── lib/
        │   ├── api.ts                ← Axios с baseURL: /api
        │   └── utils.ts
        ├── store/
        │   └── authStore.ts          ← (если authEnabled)
        └── pages/
            ├── LoginPage.tsx          ← (если authEnabled)
            ├── RegisterPage.tsx       ← (если authEnabled)
            ├── Dashboard.tsx          ← (если есть uiSpec.components)
            ├── {Entity}List.tsx       ← Для каждой сущности
            └── {Entity}Form.tsx       ← Для каждой сущности
```

---

## 9. Генерируемые API эндпоинты

Для каждой сущности (например `Product`) генерируется REST контроллер:

| Метод  | URL                        | Описание             | RBAC (если authEnabled)    |
|--------|----------------------------|----------------------|----------------------------|
| GET    | `/api/products`            | Список всех          | `readRoles` из Spec        |
| GET    | `/api/products/{id}`       | Получить по ID       | `readRoles` из Spec        |
| POST   | `/api/products`            | Создать              | `createRoles` из Spec      |
| PUT    | `/api/products/{id}`       | Обновить             | `updateRoles` из Spec      |
| DELETE | `/api/products/{id}`       | Удалить              | `deleteRoles` из Spec      |

Если есть Action Flows:
| Метод | URL                         | Описание              |
|-------|-----------------------------|-----------------------|
| POST  | `/api/flows/{flowId}/execute` | Выполнить Action Flow |

---

## 10. Инфраструктура Деплоя

### Docker Compose (Platform)
```yaml
services:
  database:     # PostgreSQL 16 Alpine — порт 5434:5432
  backend:      # platform-web Spring Boot — порт 8080
  traefik:      # Reverse Proxy — порт 80 (HTTP), 8081 (Dashboard)
  frontend:     # platform-frontend React — через Traefik
networks:
  nocode-network: bridge    # Общая сеть для всех + generated проектов
```

### Docker Compose (Generated Project)
```yaml
services:
  db:                        # postgres:15-alpine (internal network only)
  backend-{artifactId}:      # Spring Boot (internal + nocode-network)
  frontend:                  # nginx + React (nocode-network, если generateFrontend)
networks:
  internal: bridge           # Изоляция DB ↔ Backend
  nocode-network: external   # Traefik-маршрутизация
```

**Traefik routing**: `Host(\`proj-{projectId}.localhost\`)` → container port 80 (frontend) или 8080 (backend-only)

---

## 11. Zustand Stores (Frontend State)

### authStore
```ts
{ user: string | null, isAuthenticated: boolean }
// Actions: setUser(), checkAuth() → GET /api/auth/me
```

### themeStore
```ts
{ theme: 'light' | 'dark' }
// Persistence: localStorage key 'nocode-theme'
// Actions: toggleTheme(), initTheme()
// Side-effect: toggles 'dark' class on <html> element
```

### uiBuilderStore
```ts
{ components: UIComponent[], selectedComponentId: string | null }
// UIComponent: { id, type, props, layout: { x, y, w, h } }
// Actions: addComponent(), removeComponent(), updateComponentProps(), updateComponentLayout(), selectComponent(), moveComponent()
```

---

## 12. Валидация

### Backend (SpecValidator.java)
- `specVersion > 0`
- `project.*` — обязательные поля
- Entity names: только `[a-zA-Z][a-zA-Z0-9]*`, без дубликатов
- Entity names ≠ зарезервированные (Application, Controller, Service, Repository, Config, Entity, Model, Filter, Interceptor, Handler, Advice)
- Field names: `[a-zA-Z][a-zA-Z0-9]*`, ≠ Java keywords
- Relations: targetEntity должен существовать в списке entities

### Frontend (projectValidator.ts)
- Entity names: `[a-zA-Z][a-zA-Z0-9_]*`, уникальность
- Entities не должны быть без полей
- Field names: `[a-zA-Z][a-zA-Z0-9_]*`
- DataTable/FormModule/Charts: обязательно привязаны к entityName
- Buttons: предупреждение если нет actionFlowId
- Action Flows: предупреждение если поток пуст

### Backend (ProjectController)
- Project name: обязательно
- groupId: `^[a-z][a-z0-9]*(\\.[a-z][a-z0-9]*)*$`
- artifactId: `^[a-z][a-z0-9-]*$`
- basePackage: `^[a-z][a-z0-9]*(\\.[a-z][a-z0-9]*)*$`

---

## 13. Запуск Платформы

### Разработка (локально)
```bash
# 1. База данных (PostgreSQL на порту 5434)
docker compose up database -d

# 2. Backend (Spring Boot на порту 8082)
./mvnw.cmd spring-boot:run        # или .\start-platform.ps1

# 3. Frontend (Vite dev server на порту 5173)
cd platform-frontend
npm install
npm run dev
```

### Продакшн (Docker)
```bash
docker compose up --build -d
# Доступ: http://localhost (через Traefik)
# API:    http://localhost:8080/api
```

### Учётные данные по умолчанию
- **Username**: `admin`
- **Password**: `password`
- Создаются через Liquibase миграцию при первом запуске

---

## 14. Ключевые Файлы для Изменений

| Что изменить                    | Где искать                                                              |
|---------------------------------|-------------------------------------------------------------------------|
| API эндпоинты                   | `platform-web/.../controller/*.java`                                    |
| Схема БД платформы              | `platform-web/.../resources/db/changelog/db.changelog-master.yaml`      |
| Модель данных                   | `platform-web/.../project/ProjectEntity.java`, `.../domain/PlatformUser.java` |
| Генерация Java кода             | `generator-core/.../engine/poet/*.java`                                 |
| Генерация SQL миграций          | `generator-core/.../engine/LiquibaseGenerator.java`                     |
| Генерация JWT Security          | `generator-core/.../engine/SecurityGenerator.java`                      |
| Генерация Frontend              | `generator-core/.../engine/FrontendGenerator.java` + `templates/frontend/` |
| FreeMarker шаблоны              | `generator-core/src/main/resources/templates/`                          |
| Деплой логика                   | `platform-web/.../project/DeploymentService.java`                       |
| Spec формат и парсинг           | `generator-core/.../spec/Spec.java`, `SpecParser.java`                  |
| Валидация спецификации          | `generator-core/.../spec/SpecValidator.java`                            |
| Frontend компиляция spec        | `platform-frontend/src/lib/compiler.ts`                                 |
| Frontend валидация              | `platform-frontend/src/lib/projectValidator.ts`                         |
| UI компоненты                   | `platform-frontend/src/components/builder/*`                            |
| ReactFlow узлы                  | `platform-frontend/src/components/EntityNode.tsx`, `flow/LogicNode.tsx` |
| Маршруты React                  | `platform-frontend/src/App.tsx`                                         |
| Zustand стейт                   | `platform-frontend/src/store/*`                                         |
| Конфигурация Spring             | `platform-web/.../config/SecurityConfig.java`, `application.yml`        |
| Docker / Traefik                | `docker-compose.yml`, `Dockerfile`, `DeploymentService.java`            |

---

## 15. Работа с Платформой с Точки Зрения Пользователя

Данный раздел подробно описывает весь путь пользователя от первого входа до получения работающего приложения. Для каждого экрана указано: что пользователь видит, что вводит, какие действия доступны и что получает на выходе.

---

### 15.1 Главная Страница (Landing Page)

**URL**: `/`

**Что видит пользователь:**
- Маркетинговая страница с описанием платформы
- Заголовок: «Создавайте Enterprise приложения Без Написания Кода»
- Описание: платформа генерирует Spring Boot + React код, упаковывает в Docker
- Кнопки: **«Начать разработку →»** и **«Узнать больше»**
- В навигации: логотип **NoCodePlatform**, кнопка переключения темы (☀/🌙), ссылки **Войти** и **Регистрация**

**Действия пользователя:**
- Нажать **«Начать разработку»** → перенаправление на `/projects` (если авторизован) или `/login`
- Нажать **«Войти»** → переход на `/login`
- Нажать **«Регистрация»** → переход на `/register`
- Нажать ☀/🌙 → переключение между светлой и тёмной темой (сохраняется в localStorage)

---

### 15.2 Регистрация (Register Page)

**URL**: `/register`

**Что видит пользователь:**
- Форма с 3 полями и кнопкой

**Что вводит:**
| Поле                 | Тип    | Обязательное | Описание                                   |
|----------------------|--------|--------------|---------------------------------------------|
| Имя пользователя     | текст  | ✅           | Уникальное имя (латиница). Пример: `ivan`   |
| Пароль               | пароль | ✅           | Любой пароль                                |
| Подтверждение пароля  | пароль | ✅           | Должен совпадать с паролем                  |

**Кнопка**: «Зарегистрироваться»

**Что происходит при нажатии:**
1. Фронтенд отправляет `POST /api/auth/register { username, password }`
2. Бэкенд проверяет, что имя не занято
3. Пароль хешируется через BCrypt и сохраняется в БД
4. При успехе — перенаправление на `/login` с уведомлением «Аккаунт создан»
5. При ошибке — красное уведомление (например, «Имя пользователя занято»)

**Выход**: Новая запись в таблице `platform_users` (role = "USER")

---

### 15.3 Авторизация (Login Page)

**URL**: `/login`

**Что видит пользователь:**
- Форма с 2 полями и кнопкой

**Что вводит:**
| Поле              | Тип    | Обязательное | Описание                          |
|-------------------|--------|--------------|-----------------------------------|
| Имя пользователя  | текст  | ✅           | Зарегистрированное имя            |
| Пароль            | пароль | ✅           | Пароль от аккаунта                |

**Кнопка**: «Войти»

**Что происходит при нажатии:**
1. Фронтенд отправляет `POST /api/auth/login { username, password }`
2. Spring Security проверяет credentials через `AuthenticationManager`
3. При успехе — создаётся серверная сессия, браузер получает cookie `JSESSIONID`
4. Перенаправление на `/projects`
5. При неверных данных — сообщение «Неверное имя пользователя или пароль»

**Выход**: Сессионный cookie `JSESSIONID` в браузере (автоматически передаётся во всех последующих запросах)

**Данные по умолчанию для первого входа**: `admin` / `password`

---

### 15.4 Список Проектов (Projects Page)

**URL**: `/projects`

**Что видит пользователь:**
- Заголовок: «Мои проекты»
- Карточки проектов (каждая содержит: название, дата создания, статус деплоя)
- Кнопка **«+ Новый проект»**
- На каждой карточке: кнопки **Modeler**, **UI Builder**, **Логика**, **Preview**, **⚙ Настройки**, **🚀 Деплой**, **📥 Скачать**, **🗑 Удалить**
- В хедере: имя пользователя, кнопка **Выйти**, переключатель темы

**Доступные действия:**

#### A. Создание нового проекта (кнопка «+ Новый проект»)

Открывается модальное окно **ProjectModal**:

| Поле           | Тип    | Обязательное | Пример            | Описание                                      |
|----------------|--------|--------------|-------------------|------------------------------------------------|
| Имя проекта    | текст  | ✅           | `Интернет-магазин` | Человекочитаемое название                      |
| Group ID       | текст  | ❌           | `com.mycompany`   | Maven groupId (латиница, точки). По умолч: `com.example` |
| Artifact ID    | текст  | ❌           | `shop-api`        | Maven artifactId (латиница, дефисы). По умолч: `demo`    |
| Версия         | текст  | ❌           | `1.0.0`           | Семантическая версия. По умолч: `1.0.0`        |
| Base Package   | текст  | ❌           | `com.mycompany.shop` | Java пакет для генерируемого кода           |

**Кнопка**: «Создать проект»

**Что происходит:** `POST /api/projects` → создаётся запись в БД с пустым `specText: "{}"`

**Выход**: Новая карточка проекта в списке

#### B. Открытие настроек проекта (кнопка ⚙)

Открывается модальное окно **ProjectSettingsModal**:

| Переключатель               | Тип      | По умолч. | Описание                                                           |
|-----------------------------|----------|-----------|--------------------------------------------------------------------|
| Включить авторизацию (JWT)  | toggle   | ❌ выкл   | При включении — генерируется Security модуль (JWT фильтр, login, register) |
| Генерировать Frontend       | toggle   | ❌ выкл   | При включении — генерируется React SPA с CRUD страницами           |

Также можно изменить: Group ID, Artifact ID, Version, Base Package.

**Кнопка**: «Сохранить» → `PUT /api/projects/{id}`

#### C. Удаление проекта (кнопка 🗑)

Подтверждение → `DELETE /api/projects/{id}`. Если проект был развёрнут — контейнеры автоматически останавливаются.

---

### 15.5 Модель Данных — Modeler (Data Modeler Page)

**URL**: `/projects/:projectId/modeler`

**Что видит пользователь:**
- **Слева**: панель навигации (Модель данных / UI / Логика / Preview / Назад)
- **Центр**: ReactFlow холст — бесконечное рабочее пространство с сеткой. На нём расположены «карточки» сущностей (Entity Nodes). Можно масштабировать (scroll), перемещать (drag).
- **Справа**: панель свойств выбранной сущности (**ModelerPropertiesPanel**)
- **Вверху**: кнопки **«+ Добавить сущность»** и **«💾 Сохранить»**

#### Что пользователь делает:

**Шаг 1 — Добавить сущность (кнопка «+ Добавить сущность»)**:
- На холсте появляется новая карточка с именем `NewEntityN`
- Пользователь может изменить имя сущности (кликнув на заголовок карточки)

**Шаг 2 — Добавить поля (внутри карточки сущности)**:
Каждое поле — строка внутри карточки:

| Ввод            | Тип         | Описание                                                          |
|-----------------|-------------|-------------------------------------------------------------------|
| Имя поля        | текст       | Например: `title`, `price`, `email`. Только латиница, без пробелов |
| Тип             | выпадашка   | `String`, `Integer`, `Long`, `Boolean`, `LocalDate`, `OffsetDateTime`, `Double`, `BigDecimal`, `UUID` |
| Обязательное    | чекбокс (✓) | Если включено — поле NOT NULL в БД и required в валидации           |

Кнопка **«+ Поле»** — добавляет новое поле. Кнопка **«×»** — удаляет поле.

**Шаг 3 — Настроить RBAC (если включена авторизация)**:
В правой панели свойств / в карточке:

| Поле            | Тип    | Описание                                                            |
|-----------------|--------|---------------------------------------------------------------------|
| Read Roles      | текст  | Кто может читать. Пример: `ROLE_USER, ROLE_ADMIN`. Пусто = все.     |
| Create Roles    | текст  | Кто может создавать записи                                           |
| Update Roles    | текст  | Кто может обновлять записи                                           |
| Delete Roles    | текст  | Кто может удалять записи                                             |

Роли превращаются в `@PreAuthorize("hasAnyRole(...)")` в генерируемых контроллерах.

**Шаг 4 — Создать связи между сущностями**:
- Пользователь тянет линию от одного нода к другому (edge в ReactFlow)
- Это создаёт связь `ONE_TO_MANY` (от source к target)
- Визуально: стрелка между карточками

**Шаг 5 — Сохранить (кнопка «💾 Сохранить»)**:
1. Фронтенд вызывает `compileToSpec()` — транслирует визуальный граф в JSON спецификацию
2. Сохраняет ReactFlow-позиции нодов в поле `_flow` (чтобы при следующем открытии восстановить граф)
3. `PUT /api/projects/{id}` с обновлённым `specText`
4. Зелёный тост «Проект сохранён»

**Пример визуального результата:**
```
┌────────────────┐       ┌────────────────┐
│   Product      │       │   Category     │
│ ─────────────  │──────→│ ─────────────  │
│ title: String ✓│       │ name: String ✓ │
│ price: Double ✓│       │                │
│ active: Bool   │       │                │
└────────────────┘       └────────────────┘
```

**Выход**: Обновлённый `specText` в БД, содержащий `entities[]` с полями и связями.

---

### 15.6 Конструктор Интерфейса — UI Builder

**URL**: `/projects/:projectId/builder`

**Что видит пользователь:**
- **Слева**: палитра компонентов (12 штук)
- **Центр**: холст с сеткой 12 колонок — сюда перетаскиваются компоненты
- **Справа**: панель свойств выбранного компонента

#### Палитра компонентов (слева):

| Компонент    | Иконка | Описание                                    |
|-------------|--------|---------------------------------------------|
| Heading     | H      | Заголовок (H1/H2/H3)                        |
| Text        | T      | Текстовый блок                              |
| Button      | ⬜     | Кнопка с привязкой к Action Flow             |
| DataTable   | 📊     | Таблица данных — автоматически показывает записи из привязанной сущности |
| FormModule  | 📝     | Форма создания/редактирования записи         |
| BarChart    | 📊     | Столбчатая диаграмма (Recharts)              |
| LineChart   | 📈     | Линейная диаграмма                           |
| Image       | 🖼      | Изображение по URL                          |
| Divider     | ─      | Горизонтальная линия-разделитель             |
| Card        | ▢      | Карточка с контентом                         |
| Badge       | ⬤      | Бейдж/метка                                 |
| Container   | ☐      | Контейнер для группировки                    |

**Как добавить компонент**: Drag-and-drop из палитры на холст. Компонент появляется в списке.

#### Панель свойств (справа) — зависит от типа компонента:

**Для DataTable / FormModule / Charts:**

| Поле                   | Тип          | Обязательное | Описание                                                |
|------------------------|--------------|--------------|---------------------------------------------------------|
| Привязать к сущности   | выпадашка    | ✅           | Выбор из сущностей, созданных в Modeler. Например: `Product` |

**Для Charts (дополнительно):**

| Поле            | Тип        | Описание                                 |
|-----------------|------------|------------------------------------------|
| Поле для Оси X  | выпадашка | Поле сущности для оси X (dimension)       |
| Поле для Оси Y  | выпадашка | Поле сущности для оси Y (metric)          |

**Для Button:**

| Поле                     | Тип        | Описание                                               |
|--------------------------|------------|--------------------------------------------------------|
| Текст                    | текст      | Надпись на кнопке                                       |
| Выполнить логику (Action Flow) | выпадашка | Выбор созданного Action Flow                      |

**Для всех компонентов — Визуальные стили:**

| Свойство         | Описание                                 | Варианты                                  |
|-----------------|------------------------------------------|-------------------------------------------|
| Цвет фона       | Background color палетка                 | transparent, zinc, red, blue, emerald, indigo, purple, yellow |
| Скругление углов | Border radius                            | 0px, 4px, 8px, 16px                       |
| Отступы (Padding)| Внутренние отступы                       | 0, 2, 4, 8                                |
| Цвет текста      | Text color палетка                       | white, gray, black, emerald, indigo, rose  |
| Выравнивание     | Text align                               | Left, Center, Right                        |
| Тень             | Box shadow                               | None, SM, MD, LG                           |
| Размер шрифта    | Font size                                | SM, Base, LG, XL                           |
| Толщина шрифта   | Font weight                              | Normal, Medium, Bold                       |
| Tailwind Classes | Ручной ввод произвольных CSS-классов     | Например: `opacity-50 shadow-xl`           |

**Размещение и Размер (Layout):**

| Свойство     | Тип    | Описание                     | Диапазон |
|-------------|--------|------------------------------|----------|
| Ширина (W)  | число  | Ширина в колонках сетки       | 1–12     |
| Высота (H)  | число  | Высота в строках              | 1+       |
| Позиция X   | число  | Горизонтальная позиция        | 0–11     |
| Позиция Y   | число  | Вертикальная позиция (строки) | 0+       |

**Кнопка «💾 Сохранить»**: Обновляет `uiSpec.components` в `specText` → `PUT /api/projects/{id}`

**Выход**: Массив UI-компонентов с их свойствами, привязками к данным и стилями, сохранённый в `specText.uiSpec`.

---

### 15.7 Бизнес-Логика — Action Flows

**URL**: `/projects/:projectId/flows`

**Что видит пользователь:**
- **Слева**: список созданных потоков (Action Flows) + кнопка **«+ Новый поток»**
- **Центр**: ReactFlow холст с нодами и стрелками — последовательность действий
- Вверху: кнопки добавления нодов разных типов

#### Создание нового потока:
1. Нажать **«+ Новый поток»**
2. Ввести имя (например: `Создание товара`)
3. На холсте появляется стартовый нод **Trigger**

#### Добавление действий (Action Nodes):
Пользователь нажимает кнопки на панели инструментов для добавления нодов:

| Нод                | Цвет    | Что вводит пользователь           | Что делает                          |
|--------------------|---------|------------------------------------|-------------------------------------|
| **Trigger** (Старт)| Зелёный | — (автоматически)                  | Точка входа — реагирует на клик кнопки UI |
| **DB Create**      | Синий   | Выбор сущности из списка           | Создаёт новую запись в БД            |
| **DB Update**      | Синий   | Выбор сущности                     | Обновляет запись в БД                |
| **DB Delete**      | Красный | Выбор сущности                     | Удаляет запись из БД                 |
| **Show Toast**     | Жёлтый  | Текст уведомления                  | Показывает текстовое уведомление     |
| **Navigate**       | Серый   | URL для перехода                   | Перенаправляет пользователя          |

#### Соединение нодов:
- Пользователь тянет стрелку от одного нода к другому (drag от выхода к входу)
- Стрелки определяют **порядок выполнения**: Trigger → Action1 → Action2 → ...

**Пример визуального потока:**
```
[UI Click] ──→ [DB Create: Product] ──→ [Show Toast: "Товар создан!"]
```

**Кнопка «💾 Сохранить»**: Обновляет `actionFlows[]` в `specText`

**Выход**: Массив Action Flows (nodes + edges), сохранённый в `specText.actionFlows`. Каждый flow при генерации превратится в метод Java, вызываемый через REST API `POST /api/flows/{flowId}/execute`.

---

### 15.8 Предпросмотр — Preview

**URL**: `/projects/:projectId/preview`

**Что видит пользователь:**
- Отрендеренный UI, собранный в UI Builder, с **фейковыми данными**
- DataTable показывает таблицу с mock-строками (автосгенерированными)
- Charts отображают случайные данные в виде графиков
- FormModule показывает форму с полями сущности
- Все стили (фон, скругления, тени) — как настроил пользователь

**Для чего нужен:**
- Пользователь может **визуально оценить** собранный интерфейс до генерации реального кода
- Проверить, что компоненты правильно расположены на сетке
- Mock-данные генерируются автоматически через `MockDataEngine.ts`

**Пользователь НЕ вводит ничего** — это readonly-страница для проверки результата.

---

### 15.9 Скачивание Сгенерированного Кода

**Где**: Кнопка **📥 Скачать** на карточке проекта в `/projects`

**Что происходит при нажатии:**
1. Перед скачиванием запускается **валидация** проекта (projectValidator.ts):
   - Все сущности должны иметь поля
   - Имена сущностей и полей — только латиница
   - DataTable/FormModule/Charts должны быть привязаны к сущности
   - Если есть ошибки — красное модальное окно с перечнем, скачивание блокируется
   - Если есть предупреждения (пустые Action Flows, кнопки без действий) — жёлтое предупреждение, но скачивание разрешено
2. `GET /api/projects/{id}/download` → бэкенд генерирует полный проект
3. Браузер скачивает файл `{artifactId}-{version}.zip`

**Что содержит ZIP (выход):**

Для проекта с `name="Shop"`, `artifactId="shop"`, сущностями `Product` и `Category`:

```
shop/
├── backend/
│   ├── pom.xml                                    ← Maven проект (Spring Boot 3, PostgreSQL, Liquibase)
│   ├── src/main/resources/
│   │   ├── application.yml                        ← Конфиг БД, порт
│   │   └── db/changelog/db.changelog-master.yaml  ← SQL миграции (CREATE TABLE products, categories)
│   └── src/main/java/com/example/shop/
│       ├── Application.java                       ← Main class
│       ├── domain/
│       │   ├── Product.java                       ← @Entity с полями title, price, active + @ManyToOne/@OneToMany
│       │   └── Category.java                      ← @Entity с полем name
│       ├── repository/
│       │   ├── ProductRepository.java             ← JpaRepository<Product, Long>
│       │   └── CategoryRepository.java
│       └── controller/
│           ├── ProductController.java             ← GET/POST/PUT/DELETE /api/products
│           └── CategoryController.java
├── frontend/                                      ← (только если generateFrontend = true)
│   ├── package.json, vite.config.ts, index.html
│   └── src/
│       ├── App.tsx                                ← Роуты: /products, /products/new, /categories...
│       └── pages/
│           ├── ProductList.tsx                    ← Таблица товаров с пагинацией
│           ├── ProductForm.tsx                    ← Форма создания/редактирования товара
│           ├── CategoryList.tsx
│           └── CategoryForm.tsx
└── docker-compose.yml                             ← (создаётся при деплое, не в download)
```

**Как использовать скачанный проект (вручную):**
```bash
cd shop/backend
mvn spring-boot:run
# API доступен на http://localhost:8080/api/products

cd shop/frontend
npm install && npm run dev
# UI доступен на http://localhost:5173
```

---

### 15.10 Деплой (Развёртывание) Проекта

**Где**: Кнопка **🚀 Деплой** на карточке проекта → открывается **DeploymentModal**

#### Модальное окно деплоя:

**Что видит пользователь:**
1. **Статус проекта** — текущее состояние:
   - `NONE` — не развёрнут
   - `DEPLOYING` — идёт сборка и запуск (показывается спиннер)
   - `RUNNING` — работает (зелёный статус + ссылка)
   - `FAILED` — ошибка (красный статус)
   - `PORT_OCCUPIED` — порт занят

2. **Валидация перед деплоем** — список ошибок/предупреждений (те же, что при скачивании)

3. **Поле ввода порта** (опционально):

| Поле | Тип   | Обязательное | Описание                                          |
|------|-------|--------------|---------------------------------------------------|
| Порт | число | ❌           | Кастомный порт для Frontend. Если пусто — автоматически |

**Кнопки:**
- **«Развернуть»** — запускает деплой
- **«Остановить»** — останавливает работающий проект (docker compose down)

**Что происходит при нажатии «Развернуть»:**
1. `POST /api/projects/{id}/deploy` → ответ `202 Accepted` (асинхронная задача)
2. Статус проекта меняется на `DEPLOYING`
3. Бэкенд в фоне:
   - Генерирует код (как при скачивании)
   - Распаковывает в `/tmp/deploy-{id}/`
   - Создаёт Dockerfiles (backend, frontend)
   - Создаёт docker-compose.yml (PostgreSQL + Backend + Frontend + Traefik labels)
   - Запускает `docker compose build` (собирает Docker-образы)
   - Запускает `docker compose up -d` (запускает контейнеры)
   - Ждёт ~60 сек пока backend-контейнер станет healthy
4. При успехе — статус `RUNNING`, появляется ссылка: `http://proj-{id}.localhost`
5. При ошибке — статус `FAILED`

**Пользователь видит в реальном времени**: Модалка автоматически опрашивает статус (polling `GET /api/projects/{id}` каждые 3–5 секунд) и обновляет индикатор.

**Выход при успешном деплое:**
- Работающее приложение по адресу `http://proj-{projectId}.localhost`
- С API на `/api/*`, базой данных PostgreSQL, (опционально) React UI
- Всё за Traefik reverse-proxy (доступно через порт 80 на хост-машине)

**Остановка:** Кнопка «Остановить» → `DELETE /api/projects/{id}/deploy` → `docker compose down -v` → контейнеры и тома удаляются → статус `NONE`.

---

### 15.11 Сводка: Полный Путь Пользователя

```
Регистрация → Вход → Создание проекта → Modeler → UI Builder → Action Flows → Preview → Скачать / Деплой
     │           │           │               │            │              │           │           │
  username    login      name,          Сущности     Компоненты     Потоки      Проверка    ZIP или
  password    cookie     groupId,       Поля         DataTable      Trigger     mock-UI     Docker
                         artifactId     Связи        FormModule     DB_CREATE               контейнеры
                                        RBAC         Charts         SHOW_TOAST
                                                     Стили          NAVIGATE
```

**Сквозной пример — Создание сервиса «Магазин товаров»:**

| Шаг | Действие пользователя | Что вводит | Что получает |
|-----|----------------------|------------|-------------|
| 1   | Регистрация          | `ivan` / `mypass123` | Аккаунт на платформе |
| 2   | Вход                 | `ivan` / `mypass123` | Сессия, перенаправление на `/projects` |
| 3   | Создание проекта     | Имя: `Магазин`, Group: `com.shop`, Artifact: `shop-api` | Пустой проект в списке |
| 4   | Настройки проекта    | Включить «JWT авторизация» ✅, «Генерировать Frontend» ✅ | Флаги authEnabled=true, generateFrontend=true |
| 5   | Modeler              | Добавить сущность `Product` с полями `title` (String, ✓), `price` (Double, ✓), `inStock` (Boolean) | JSON spec с entities[] |
| 6   | Modeler              | Добавить сущность `Category` с полем `name` (String, ✓). Связь Product → Category | Связь ONE_TO_MANY в spec |
| 7   | Modeler              | Для Product: readRoles = пусто, createRoles = `ROLE_ADMIN` | RBAC правила в spec |
| 8   | Сохранить Modeler    | Кнопка «💾 Сохранить» | specText обновлён в БД |
| 9   | UI Builder           | Перетащить `DataTable`, привязать к `Product` | uiSpec.components обновлён |
| 10  | UI Builder           | Перетащить `BarChart`, привязать к `Product`, X=`title`, Y=`price` | График настроен |
| 11  | Сохранить Builder    | Кнопка «💾 Сохранить» | specText обновлён |
| 12  | Action Flows         | Создать поток «Добавить товар»: Trigger → DB_CREATE(Product) → Toast(«Создано!») | actionFlows[] в spec |
| 13  | Preview              | — (просмотр) | Визуальный прототип UI с mock-данными |
| 14a | Скачать              | Кнопка «📥 Скачать» | Файл `shop-api-1.0.0.zip` (~50 файлов, готовый Spring Boot + React проект) |
| 14b | Деплой               | Кнопка «🚀 Развернуть» | Рабочее приложение на `http://proj-{id}.localhost` |

---

### 15.12 Что Получает Пользователь на Выходе

#### При скачивании ZIP:
- **Полностью рабочий Spring Boot проект** (Java 21, Maven)
- **REST API** для каждой сущности (5 CRUD эндпоинтов на сущность)
- **PostgreSQL миграции** (Liquibase) — автоматическое создание таблиц
- **(Опционально) JWT авторизация** — регистрация, логин, защита эндпоинтов по ролям
- **(Опционально) React SPA** — CRUD страницы для каждой сущности
- **(Опционально) Action Flow Service** — бизнес-логика, привязанная к кнопкам UI
- Весь код **чистый, читаемый, расширяемый** — можно открыть в IntelliJ IDEA и дорабатывать

#### При деплое:
- **Работающее веб-приложение** в Docker-контейнерах
- Доступно по URL: `http://proj-{id}.localhost` (через Traefik)
- PostgreSQL база данных с уже созданными таблицами
- Можно сразу открыть в браузере и начать работать (создавать записи, просматривать данные)
