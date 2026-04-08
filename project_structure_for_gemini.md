# Структура проекта: No-Code CRUD Platform

Проект представляет собой multi-module Maven-приложение, состоящее из трёх основных модулей:
**platform-web** (backend + REST API), **generator-core** (движок генерации кода) и **platform-frontend** (React SPA).

---

## Общая структура репозитория

```
nocode-crud-platform/
├── pom.xml                          # Родительский Maven POM (multi-module)
├── docker-compose.yml               # PostgreSQL + платформа в контейнерах
├── Dockerfile                       # Образ для backend-части
│
├── platform-web/                    # ══════ МОДУЛЬ 1: Backend (Spring Boot) ══════
├── generator-core/                  # ══════ МОДУЛЬ 2: Движок генерации кода ══════
└── platform-frontend/               # ══════ МОДУЛЬ 3: Frontend (React + Vite) ══════
```

---

## Модуль 1: `platform-web` — Backend (Spring Boot)

Серверная часть платформы: REST API для управления проектами, авторизация, Liquibase-миграции, интеграция с генератором.

```
platform-web/
├── pom.xml
├── Dockerfile
└── src/main/
    ├── java/com/nocode/platform/
    │   ├── Application.java                    # Точка входа Spring Boot
    │   │
    │   ├── config/                             # ── Конфигурация ──
    │   │   ├── SecurityConfig.java             #   Spring Security (JWT, CORS, фильтры)
    │   │   ├── LiquibaseConfig.java            #   Настройка Liquibase для миграций
    │   │   └── GlobalExceptionHandler.java     #   Перехват ошибок (@ControllerAdvice)
    │   │
    │   ├── domain/                             # ── Доменные сущности платформы ──
    │   │   └── PlatformUser.java               #   Пользователь платформы (JPA Entity)
    │   │
    │   ├── dto/                                # ── Data Transfer Objects ──
    │   │   ├── LoginRequest.java               #   Запрос на авторизацию
    │   │   └── ProjectDto.java                 #   DTO проекта (для API)
    │   │
    │   ├── repository/                         # ── JPA Репозитории ──
    │   │   └── UserRepository.java             #   Доступ к данным пользователей
    │   │
    │   ├── service/                            # ── Сервисный слой ──
    │   │   └── CustomUserDetailsService.java   #   Загрузка пользователя для Spring Security
    │   │
    │   ├── project/                            # ── Модуль "Проект" (сущность, сервис, деплой) ──
    │   │   ├── ProjectEntity.java              #   JPA-сущность проекта (хранит метамодель в JSONB)
    │   │   ├── ProjectRepository.java          #   Репозиторий проектов
    │   │   ├── ProjectService.java             #   Бизнес-логика (CRUD проектов)
    │   │   ├── CreateProjectRequest.java       #   Запрос на создание проекта
    │   │   └── DeploymentService.java          #   Развертывание сгенерированного приложения
    │   │
    │   ├── controller/                         # ── REST Контроллеры ──
    │   │   ├── AuthController.java             #   /api/auth/** (регистрация, логин, JWT)
    │   │   ├── ProjectController.java          #   /api/projects/** (CRUD проектов, генерация)
    │   │   └── DeploymentController.java       #   /api/deploy/** (деплой приложений)
    │   │
    │   └── generator/                          # ── Точка входа в генератор (фасад) ──
    │       ├── GeneratorFacade.java            #   Оркестрация процесса генерации
    │       └── ProjectDownloadController.java  #   Скачивание ZIP с результатом генерации
    │
    └── resources/
        ├── application.yml                     # Конфигурация Spring Boot (порты, БД, JWT)
        └── db/changelog/
            └── db.changelog-master.yaml        # Liquibase: миграции схемы платформы
```

---

## Модуль 2: `generator-core` — Движок генерации кода

Ядро платформы. Принимает метамодель (JSON-спецификацию), валидирует её и генерирует полноценный Spring Boot + React проект.

```
generator-core/
├── pom.xml
└── src/main/
    ├── java/com/nocode/platform/generator/
    │   │
    │   ├── api/                                     # ── Публичный API модуля ──
    │   │   └── GeneratedProject.java                #   Результат генерации (набор файлов)
    │   │
    │   ├── spec/                                    # ── Спецификация (метамодель) ──
    │   │   ├── Spec.java                            #   Класс метамодели (сущности, атрибуты, связи)
    │   │   ├── SpecParser.java                      #   Парсинг JSON метамодели в объект Spec
    │   │   └── SpecValidator.java                   #   Валидация метамодели (проверка имён, типов)
    │   │
    │   ├── engine/                                  # ── Движок генерации ──
    │   │   ├── ProjectGenerator.java                #   Главный оркестратор (собирает все файлы)
    │   │   ├── LiquibaseGenerator.java              #   Генерация Liquibase changesets (миграции БД)
    │   │   ├── SecurityGenerator.java               #   Генерация Spring Security конфигурации
    │   │   ├── FrontendGenerator.java               #   Генерация React-компонентов (CRUD-формы)
    │   │   │
    │   │   └── poet/                                #   == JavaPoet-генераторы (Java-код) ==
    │   │       ├── EntityGenerator.java             #     Генерация JPA @Entity классов
    │   │       ├── RepositoryGenerator.java         #     Генерация Spring Data JPA репозиториев
    │   │       ├── ServiceGenerator.java            #     Генерация сервисного слоя
    │   │       ├── ControllerGenerator.java         #     Генерация REST-контроллеров
    │   │       └── ActionFlowControllerGenerator.java #   Генерация контроллеров бизнес-логики
    │   │
    │   ├── template/                                # ── Шаблонизатор ──
    │   │   └── TemplateRenderer.java                #   Рендер FreeMarker-шаблонов
    │   │
    │   └── stub/                                    # ── Генератор ZIP-архива ──
    │       └── StubZipGenerator.java                #   Сборка файлов в готовый ZIP-проект
    │
    └── resources/templates/                         # ── FreeMarker-шаблоны ──
        ├── Application.java.ftl                     #   Шаблон точки входа Spring Boot
        ├── MainView.java.ftl                        #   Шаблон главного представления
        ├── application.yml.ftl                      #   Шаблон конфигурации приложения
        ├── pom.ftl                                  #   Шаблон Maven POM
        └── frontend/                                #   == Шаблоны для React-приложения ==
            ├── index.html.ftl
            ├── package.json.ftl
            ├── vite.config.ts.ftl
            ├── tailwind.config.js.ftl
            ├── tsconfig.json.ftl
            ├── tsconfig.node.json.ftl
            ├── postcss.config.js.ftl
            └── src/                                 #     Шаблоны React-компонентов
```

---

## Модуль 3: `platform-frontend` — Frontend (React + TypeScript + Vite)

SPA-приложение платформы: визуальный редактор моделей (React Flow), управление проектами, предпросмотр, UI-конструктор.

```
platform-frontend/
├── package.json                     # Зависимости (React, ReactFlow, Zustand, Tailwind)
├── vite.config.ts                   # Конфигурация Vite (dev-сервер, прокси)
├── tailwind.config.js               # Конфигурация Tailwind CSS
├── Dockerfile                       # Nginx-образ для production
├── nginx.conf                       # Конфиг Nginx (SPA fallback, API proxy)
├── playwright.config.ts             # Конфигурация E2E-тестов
│
└── src/
    ├── main.tsx                     # Точка входа React
    ├── App.tsx                      # Роутинг (React Router)
    ├── App.css / index.css          # Базовые стили
    │
    ├── api/                         # ── HTTP-клиент ──
    │   └── client.ts                #   Axios-инстанс (baseURL, JWT interceptor)
    │
    ├── store/                       # ── Zustand (глобальное состояние) ──
    │   ├── authStore.ts             #   Состояние авторизации (токен, пользователь)
    │   └── uiBuilderStore.ts        #   Состояние UI-конструктора (компоненты, макет)
    │
    ├── types/                       # ── TypeScript-типы ──
    │   └── react-grid-layout.d.ts   #   Типы для grid-вёрстки
    │
    ├── pages/                       # ══ Страницы приложения ══
    │   ├── LandingPage.tsx          #   Главная / лендинг
    │   ├── LoginPage.tsx            #   Авторизация
    │   ├── RegisterPage.tsx         #   Регистрация
    │   ├── ProjectsPage.tsx         #   Список проектов пользователя
    │   ├── ModelerPage.tsx          #   ⭐ Визуальный редактор моделей (React Flow)
    │   ├── PreviewPage.tsx          #   Предпросмотр сгенерированного приложения
    │   ├── UIBuilderPage.tsx        #   Визуальный конструктор интерфейсов
    │   └── ActionFlowPage.tsx       #   Редактор бизнес-логики (потоки действий)
    │
    └── components/                  # ══ React-компоненты ══
        ├── EntityNode.tsx           #   ⭐ Узел сущности в визуальном редакторе
        ├── ModelerPropertiesPanel.tsx #  Панель свойств выбранной сущности
        ├── ProjectModal.tsx         #   Модальное окно создания/редактирования проекта
        ├── ProjectSettingsModal.tsx  #   Модальное окно настроек проекта
        ├── DeploymentModal.tsx      #   Модальное окно развертывания
        │
        ├── builder/                 #   == UI-конструктор ==
        │   ├── CanvasArea.tsx       #     Область визуальной вёрстки компонентов
        │   ├── PropertiesPanel.tsx  #     Панель свойств UI-компонентов
        │   ├── SidebarItem.tsx      #     Элемент боковой панели (drag source)
        │   └── SortableComponent.tsx #    Сортируемый компонент в конструкторе
        │
        └── flow/                    #   == Компоненты редактора потоков ==
            └── LogicNode.tsx        #     Узел логики в ActionFlow-редакторе
```

---

## Конвейер генерации (как модули связаны)

```
┌─────────────────────┐     JSON метамодель      ┌───────────────────────┐
│  platform-frontend   │ ──────────────────────▶  │     platform-web      │
│  (React Flow)        │     POST /api/projects   │  (Spring Boot API)    │
│                      │     /generate            │                       │
│  ModelerPage.tsx     │                          │  ProjectController    │
│  EntityNode.tsx      │                          │  GeneratorFacade      │
└─────────────────────┘                          └───────────┬───────────┘
                                                             │
                                                             │ вызывает
                                                             ▼
                                                 ┌───────────────────────┐
                                                 │    generator-core     │
                                                 │                       │
                                                 │  SpecParser           │
                                                 │  SpecValidator        │
                                                 │       │               │
                                                 │       ▼               │
                                                 │  ProjectGenerator     │
                                                 │   ├─ EntityGen        │
                                                 │   ├─ RepositoryGen    │
                                                 │   ├─ ServiceGen       │
                                                 │   ├─ ControllerGen    │
                                                 │   ├─ LiquibaseGen     │
                                                 │   ├─ SecurityGen      │
                                                 │   └─ FrontendGen      │
                                                 │       │               │
                                                 │       ▼               │
                                                 │  StubZipGenerator     │
                                                 │  (ZIP-архив)          │
                                                 └───────────────────────┘
                                                             │
                                                             ▼
                                                  Готовый Spring Boot +
                                                  React CRUD-проект
                                                  (скачивание / деплой)
```

---

## Ключевые технологии по модулям

| Модуль             | Технологии                                                            |
|--------------------|-----------------------------------------------------------------------|
| `platform-web`     | Java 17, Spring Boot, Spring Security (JWT), Spring Data JPA, PostgreSQL, Liquibase, Hibernate |
| `generator-core`   | Java 17, JavaPoet (генерация Java-кода), FreeMarker (шаблоны), Jackson (парсинг JSON) |
| `platform-frontend`| React 18, TypeScript, Vite, React Flow, Zustand, Tailwind CSS, Axios, React Router |
| Инфраструктура     | Docker, Docker Compose, Nginx, Playwright (E2E тесты)                 |
