$port = 8082

Write-Host "Checking for existing process on port $port..."
$processPID = (netstat -ano | Select-String ":$port" | ForEach-Object { ($_ -split '\s+')[-1] } | Select-Object -First 1)

if ($processPID -and $processPID -ne "0") {
    Write-Host "Found process $processPID listening on port $port. Terminating..."
    Stop-Process -Id $processPID -Force -ErrorAction SilentlyContinue
    Write-Host "Process terminated."
} else {
    Write-Host "Port $port is free."
}

Write-Host "Starting Spring Boot application..."
.\mvnw.cmd spring-boot:run
