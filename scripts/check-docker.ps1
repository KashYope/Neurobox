# Check if Docker is running before attempting docker compose operations
Write-Host "Checking Docker status..." -ForegroundColor Cyan

try {
    $dockerVersion = docker version 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "`n❌ Docker is not running!" -ForegroundColor Red
        Write-Host "`nPlease start Docker Desktop and wait for it to fully initialize." -ForegroundColor Yellow
        Write-Host "Then run your docker compose command again.`n" -ForegroundColor Yellow
        exit 1
    }
    
    Write-Host "✅ Docker is running" -ForegroundColor Green
    Write-Host "`nDocker version info:" -ForegroundColor Cyan
    docker version --format 'Client: {{.Client.Version}} | Server: {{.Server.Version}}'
    exit 0
} catch {
    Write-Host "`n❌ Error checking Docker: $_" -ForegroundColor Red
    Write-Host "`nPlease ensure Docker Desktop is installed and running.`n" -ForegroundColor Yellow
    exit 1
}

