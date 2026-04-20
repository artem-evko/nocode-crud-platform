# =============================================================
#  No-Code CRUD Platform - Local Development Startup Script
#  Запускает PostgreSQL (Docker), Backend и Frontend
# =============================================================

$ErrorActionPreference = "Stop"

# ---- Настройки ----
$DB_CONTAINER   = "nocode-dev-db"
$DB_PORT        = 5434
$DB_USER        = "nocode"
$DB_PASSWORD    = "nocode_password"
$DB_NAME        = "nocode_platform"
$BACKEND_PORT   = 8082
$FRONTEND_PORT  = 5173
$FRONTEND_DIR   = Join-Path $PSScriptRoot "platform-frontend"

# ---- Цвета ----
function Write-Step   ($msg) { Write-Host "`n[$([char]0x25B6)] $msg" -ForegroundColor Cyan }
function Write-Ok     ($msg) { Write-Host "    [OK] $msg" -ForegroundColor Green }
function Write-Info   ($msg) { Write-Host "    $msg" -ForegroundColor DarkGray }
function Write-Err    ($msg) { Write-Host "    [!] $msg" -ForegroundColor Red }

# ---- Баннер ----
Write-Host ""
Write-Host "  =============================================" -ForegroundColor Magenta
Write-Host "   No-Code CRUD Platform  |  Dev Launcher      " -ForegroundColor Magenta
Write-Host "  =============================================" -ForegroundColor Magenta
Write-Host ""

# =============================================================
# 1. Проверка пререквизитов
# =============================================================
Write-Step "Проверка пререквизитов"

# Docker
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Err "Docker не найден. Установите Docker Desktop: https://docs.docker.com/desktop/install/windows-install/"
    exit 1
}
Write-Ok "Docker"

# Java
if (-not (Get-Command java -ErrorAction SilentlyContinue)) {
    Write-Err "Java не найдена. Установите JDK 21: https://adoptium.net/"
    exit 1
}
$javaOutput = cmd /c "java -version 2>&1"
$javaVersion = ($javaOutput | Select-String -Pattern '"(\d+[\d.]*)' | ForEach-Object { $_.Matches[0].Groups[1].Value })
Write-Ok "Java $javaVersion"

# Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Err "Node.js не найден. Установите Node.js 18+: https://nodejs.org/"
    exit 1
}
$nodeVersion = (node --version)
Write-Ok "Node.js $nodeVersion"

# npm
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Err "npm не найден."
    exit 1
}
Write-Ok "npm $(npm --version)"

# =============================================================
# 2. Запуск PostgreSQL в Docker
# =============================================================
Write-Step "Запуск PostgreSQL (Docker-контейнер: $DB_CONTAINER)"

$existingContainer = docker ps -a --filter "name=^${DB_CONTAINER}$" --format "{{.Names}}" 2>$null

if ($existingContainer -eq $DB_CONTAINER) {
    $running = docker ps --filter "name=^${DB_CONTAINER}$" --format "{{.Names}}" 2>$null
    if ($running -eq $DB_CONTAINER) {
        Write-Ok "Контейнер уже запущен"
    } else {
        docker start $DB_CONTAINER | Out-Null
        Write-Ok "Контейнер перезапущен"
    }
} else {
    docker run -d `
        --name $DB_CONTAINER `
        -e POSTGRES_USER=$DB_USER `
        -e POSTGRES_PASSWORD=$DB_PASSWORD `
        -e POSTGRES_DB=$DB_NAME `
        -p "${DB_PORT}:5432" `
        postgres:16-alpine | Out-Null
    Write-Ok "Контейнер создан и запущен"
}

# Ожидание готовности PostgreSQL
Write-Info "Ожидание готовности PostgreSQL..."
$maxAttempts = 30
for ($i = 1; $i -le $maxAttempts; $i++) {
    $result = docker exec $DB_CONTAINER pg_isready -U $DB_USER 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Ok "PostgreSQL готов (порт $DB_PORT)"
        break
    }
    if ($i -eq $maxAttempts) {
        Write-Err "PostgreSQL не запустился за $maxAttempts секунд"
        exit 1
    }
    Start-Sleep -Seconds 1
}

# =============================================================
# 3. Освобождение занятых портов
# =============================================================
Write-Step "Проверка портов"

function Free-Port($port) {
    $procId = (netstat -ano | Select-String ":$port\s" | ForEach-Object { ($_ -split '\s+')[-1] } | Select-Object -First 1)
    if ($procId -and $procId -ne "0") {
        Write-Info "Порт $port занят процессом $procId, завершаю..."
        Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
        Start-Sleep -Milliseconds 500
        Write-Ok "Порт $port освобожден"
    } else {
        Write-Ok "Порт $port свободен"
    }
}

Free-Port $BACKEND_PORT
Free-Port $FRONTEND_PORT

# =============================================================
# 4. Запуск Backend (в отдельном окне)
# =============================================================
Write-Step "Запуск Backend (Spring Boot, порт $BACKEND_PORT)"

$backendCmd = "Set-Location '$PSScriptRoot'; Write-Host 'Starting Spring Boot...' -ForegroundColor Cyan; .\mvnw.cmd spring-boot:run -pl platform-web; Read-Host 'Нажмите Enter для закрытия'"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCmd -WindowStyle Normal
Write-Ok "Backend запущен в отдельном окне"

# =============================================================
# 5. Установка зависимостей Frontend (если нужно)
# =============================================================
Write-Step "Подготовка Frontend"

if (-not (Test-Path (Join-Path $FRONTEND_DIR "node_modules"))) {
    Write-Info "Установка npm-зависимостей (первый запуск)..."
    Push-Location $FRONTEND_DIR
    npm install 2>&1 | Out-Null
    Pop-Location
    Write-Ok "Зависимости установлены"
} else {
    Write-Ok "Зависимости уже установлены"
}

# =============================================================
# 6. Запуск Frontend (в отдельном окне)
# =============================================================
Write-Step "Запуск Frontend (Vite, порт $FRONTEND_PORT)"

$frontendCmd = "Set-Location '$FRONTEND_DIR'; Write-Host 'Starting Vite dev server...' -ForegroundColor Cyan; npm run dev; Read-Host 'Нажмите Enter для закрытия'"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCmd -WindowStyle Normal
Write-Ok "Frontend запущен в отдельном окне"

# =============================================================
# 7. Итог
# =============================================================
Start-Sleep -Seconds 2

Write-Host ""
Write-Host "  =============================================" -ForegroundColor Green
Write-Host "   Платформа запущена!                          " -ForegroundColor Green
Write-Host "  =============================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Frontend:         http://localhost:$FRONTEND_PORT"      -ForegroundColor White
Write-Host "  Backend API:      http://localhost:$BACKEND_PORT"       -ForegroundColor White
Write-Host "  Swagger UI:       http://localhost:$BACKEND_PORT/swagger-ui/index.html" -ForegroundColor White
Write-Host "  PostgreSQL:       localhost:$DB_PORT"                    -ForegroundColor White
Write-Host ""
Write-Host "  Логин:  admin" -ForegroundColor Yellow
Write-Host "  Пароль: admin" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Для остановки закройте окна Backend и Frontend," -ForegroundColor DarkGray
Write-Host "  а затем выполните: docker stop $DB_CONTAINER"       -ForegroundColor DarkGray
Write-Host ""

# Открыть браузер через 8 секунд (backend нужно время на старт)
Write-Info "Браузер откроется автоматически через 8 секунд..."
Start-Sleep -Seconds 8
Start-Process "http://localhost:$FRONTEND_PORT"
