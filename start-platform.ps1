Write-Host "Stopping previous containers (if any)..."
docker compose down

Write-Host "Building and starting No-Code CRUD Platform (Docker Compose)..."
docker compose up -d --build

Write-Host "Syncing reverse proxy routes..."
Start-Sleep -Seconds 3
docker restart nocode-traefik | Out-Null

Write-Host ""
Write-Host "Platform is starting! "
Write-Host "Frontend will be available at: http://localhost"
Write-Host "Traefik Dashboard: http://localhost:8081"
Write-Host "Backend API is hidden behind Traefik at http://localhost/api"
