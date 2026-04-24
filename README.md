# No-Code App Platform

**No-Code App Platform** — платформа визуального программирования для генерации полноценных Full-Stack приложений (Web + API + База Данных) без написания кода. Платформа компилирует визуальный дизайн в реальный исходный код на Java (Spring Boot) и TypeScript (React), который можно мгновенно развернуть через Docker одним кликом.

---

## Ключевые возможности

- **Визуальный дизайнер схем данных (Data Modeler)** — создание сущностей, настройка типов полей, связей и ограничений в визуальном графе на базе React Flow.
- **Конструктор интерфейсов (UI Builder)** — 2D Drag-and-Drop редактор экранов, таблиц, форм и графиков с поддержкой вложенности и привязки UI-элементов к сущностям БД.
- **Бизнес-логика (Action Flows)** — визуальный редактор обработчиков: запись в базу, обновление данных, навигация, всплывающие окна и ветвление, транслируемые в слой `@Service` на бэкенде.
- **Мгновенный деплой (One-Click Docker Deployment)** — встроенная поддержка Docker-in-Docker для сборки и развертывания сгенерированного приложения прямо из интерфейса конструктора.
- **Генерация чистого кода** — на выходе ZIP-архив с чистым, поддерживаемым и компилируемым Spring Boot 3 + React проектом без vendor lock-in.

---

## Технологический стек

### Платформа (Конструктор)

| Слой            | Технологии                                                                  |
|-----------------|-----------------------------------------------------------------------------|
| Backend         | Java 21, Spring Boot 3 (4.0.3), Spring Data JPA, JavaPoet, FreeMarker, JWT |
| Frontend        | React 18, TypeScript, Vite, React Flow, Zustand, TailwindCSS, Shadcn/ui    |
| Инфраструктура  | PostgreSQL 16, Docker, Docker Compose, Traefik                              |

### Генерируемый код (Результат)

| Слой      | Технологии                                            |
|-----------|-------------------------------------------------------|
| Backend   | Spring Boot 3, REST API, Liquibase (миграции), Hibernate |
| Frontend  | React, React Router, TailwindCSS, Axios               |
| Упаковка  | Docker Compose, Dockerfile (Nginx + JDK 21)           |

---

## Запуск платформы

### Вариант 1. Docker Compose (рекомендуется)

Самый быстрый способ запустить всю платформу целиком. Требуется только **Docker** и **Docker Compose**.

**Пререквизиты:**
- Docker Engine 20.10+
- Docker Compose v2

**Шаги:**

1. Клонируйте репозиторий:
   ```bash
   git clone https://github.com/artem-evko/nocode-crud-platform.git
   cd nocode-crud-platform
   ```

2. Соберите и запустите все сервисы:
   ```bash
   docker compose up -d --build
   ```

3. Дождитесь запуска всех контейнеров (обычно 1-2 минуты) и откройте платформу:

| Сервис             | Адрес                                         |
|--------------------|-----------------------------------------------|
| Интерфейс платформы | `http://localhost`                            |
| REST API (Backend) | `http://localhost:8080`                        |
| Swagger UI         | `http://localhost:8080/swagger-ui/index.html`  |
| Traefik Dashboard  | `http://localhost:8081`                        |

4. Авторизуйтесь с учетными данными по умолчанию:
   - **Логин:** `admin`
   - **Пароль:** `admin`

**Остановка платформы:**
```bash
docker compose down
```

Для полного удаления данных (включая базу):
```bash
docker compose down -v
```

---

### Вариант 2. Локальная разработка

Используйте этот вариант для разработки и отладки.

**Пререквизиты:**
- Java 21 (JDK)
- Node.js 18+ и npm
- Docker Engine (для PostgreSQL и функции деплоя)

**Быстрый запуск одной командой** — скрипт автоматически поднимет PostgreSQL в Docker, запустит Backend и Frontend в отдельных окнах:

```powershell
powershell -ExecutionPolicy Bypass -File .\start-dev.ps1
```

Либо запустите каждый компонент вручную:

**Шаг 1. Настройка базы данных**

Создайте базу данных и пользователя в PostgreSQL:
```sql
CREATE USER nocode WITH PASSWORD 'nocode_password';
CREATE DATABASE nocode_platform OWNER nocode;
```

**Шаг 2. Запуск Backend**

В корне проекта выполните запуск через Maven Wrapper:
```bash
./mvnw spring-boot:run -pl platform-web
```

Backend будет доступен по адресу `http://localhost:8082`.

**Шаг 3. Запуск Frontend**

Откройте отдельный терминал:
```bash
cd platform-frontend
npm install
npm run dev
```

Frontend будет доступен по адресу `http://localhost:5173`.

**Шаг 4. Проверка**

1. Откройте `http://localhost:5173/login` в браузере.
2. Войдите с логином `admin` и паролем `admin`.
3. Вы должны попасть на страницу проектов.

---

## Архитектура решения

Платформа состоит из трех основных модулей:

1. **platform-frontend** — SPA-приложение конструктора (UI Builder, Entity Modeler, Action Flows).
2. **platform-web** — основной бэкенд платформы. Управляет проектами, пользователями, сохраняет JSON-спецификации моделей, логики и UI. Запускает Docker-контейнеры для деплоя сгенерированных приложений.
3. **generator-core** — ядро кодогенерации. Принимает JSON-спецификацию от `platform-web` и с помощью JavaPoet строит AST-деревья Java-классов (`Controller`, `Service`, `Entity`, `Repository`), а с помощью FreeMarker генерирует React-компоненты. Возвращает готовый ZIP-архив проекта.
