[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
git add platform-web/src/main/java/com/nocode/platform/config/SecurityConfig.java
git commit -m "конфигурация Spring Security | platform-web/src/main/java/com/nocode/platform/config/SecurityConfig.java"

git add platform-web/src/main/java/com/nocode/platform/ui/MainLayout.java
git commit -m "добавлен контроль сессии и кнопка выход | platform-web/src/main/java/com/nocode/platform/ui/MainLayout.java"

git add platform-web/src/main/java/com/nocode/platform/ui/views/LandingView.java
git commit -m "премиум дизайн главной страницы | platform-web/src/main/java/com/nocode/platform/ui/views/LandingView.java"

git add platform-web/src/main/java/com/nocode/platform/ui/views/LoginView.java
git commit -m "экран авторизации | platform-web/src/main/java/com/nocode/platform/ui/views/LoginView.java"

git add platform-web/src/main/java/com/nocode/platform/ui/views/ProjectsView.java
git commit -m "обновлен роут и защита @PermitAll | platform-web/src/main/java/com/nocode/platform/ui/views/ProjectsView.java"

git add platform-web/src/main/java/com/nocode/platform/ui/views/ProjectView.java
git commit -m "защита @PermitAll | platform-web/src/main/java/com/nocode/platform/ui/views/ProjectView.java"

git add platform-web/src/main/resources/application.yml
git commit -m "изменён порт на 8082 | platform-web/src/main/resources/application.yml"

git add platform-web/src/main/resources/META-INF/resources/frontend/landing.css
git commit -m "css стили для эффекта glassmorphism | platform-web/src/main/resources/META-INF/resources/frontend/landing.css"

git add platform-web/package.json platform-web/tsconfig.json platform-web/types.d.ts platform-web/.vaadin-node-tasks.lock
git commit -m "автосгенерированные конфигурации vaadin | frontend"
