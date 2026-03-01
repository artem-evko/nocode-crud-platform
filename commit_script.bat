@echo off
chcp 65001 >nul

git add docker-compose.yml
git commit -m "Изменен порт PostgreSQL на 5433 (docker-compose.yml)"

git add generator-core/pom.xml
git commit -m "Добавлен JavaPoet (generator-core/pom.xml)"

git add generator-core/src/main/java/com/nocode/platform/generator/engine/ProjectGenerator.java
git commit -m "Интеграция кодогенерации JavaPoet (generator-core/.../ProjectGenerator.java)"

git add generator-core/src/main/java/com/nocode/platform/generator/spec/Spec.java
git commit -m "Расширение модели Spec (generator-core/.../Spec.java)"

git add generator-core/src/main/java/com/nocode/platform/generator/spec/SpecValidator.java
git commit -m "Обновление валидации Spec (generator-core/.../SpecValidator.java)"

git add generator-core/src/main/resources/templates/pom.ftl
git commit -m "Добавлены зависимости Spring Data JPA и Liquibase (generator-core/.../pom.ftl)"

git add platform-web/src/main/java/com/nocode/platform/generator/GeneratorFacade.java
git commit -m "Использование AST генератора (platform-web/.../GeneratorFacade.java)"

git add platform-web/src/main/java/com/nocode/platform/generator/ProjectDownloadController.java
git commit -m "Возврат реального zip-архива (platform-web/.../ProjectDownloadController.java)"

git add platform-web/src/main/java/com/nocode/platform/ui/views/ProjectView.java
git commit -m "Интеграция визуального моделера (platform-web/.../ProjectView.java)"

git add platform-web/src/main/java/com/nocode/platform/ui/views/ProjectsView.java
git commit -m "Удалена хардкод Spec (platform-web/.../ProjectsView.java)"

git add platform-web/src/main/resources/application.yml
git commit -m "Настройка подключения к БД (platform-web/.../application.yml)"

git add generator-core/src/main/java/com/nocode/platform/generator/engine/LiquibaseGenerator.java
git commit -m "Генерация миграций Liquibase (generator-core/.../LiquibaseGenerator.java)"

git add generator-core/src/main/java/com/nocode/platform/generator/engine/poet/EntityGenerator.java
git commit -m "Генерация JPA Entities (generator-core/.../EntityGenerator.java)"

git add generator-core/src/main/java/com/nocode/platform/generator/engine/poet/RepositoryGenerator.java
git commit -m "Генерация Spring Data Repositories (generator-core/.../RepositoryGenerator.java)"

git add generator-core/src/main/java/com/nocode/platform/generator/engine/poet/ControllerGenerator.java
git commit -m "Генерация REST API Controllers (generator-core/.../ControllerGenerator.java)"

git add platform-web/src/main/java/com/nocode/platform/ui/views/EntityModelerView.java
git commit -m "Добавлен Data Modeler на базе Vaadin (platform-web/.../EntityModelerView.java)"

git push -u origin feature/dynamic-models
