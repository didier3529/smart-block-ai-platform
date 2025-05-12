# This script ensures clean app restart by killing all hanging Node processes
# and starting the app with the current stable configuration

Write-Host "=== ChainOracle Stable Restart Script ===" -ForegroundColor Green
Write-Host "1. Killing all Node.js processes..." -ForegroundColor Yellow
taskkill /F /IM node.exe 2>$null
Start-Sleep -Seconds 1

Write-Host "2. Checking if ports are clear..." -ForegroundColor Yellow
try {
    npx kill-port 3000 3005 3006 2>$null
} catch {
    Write-Host "  No processes found on those ports." -ForegroundColor Gray
}
Start-Sleep -Seconds 1

Write-Host "3. Starting application in development mode..." -ForegroundColor Yellow
npm run dev 