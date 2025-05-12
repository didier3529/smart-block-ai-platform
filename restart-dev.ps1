# Function to kill processes on a specific port
function Kill-ProcessOnPort {
    param(
        [int]$Port
    )
    
    $processInfo = netstat -ano | findstr ":$Port"
    if ($processInfo) {
        $processId = ($processInfo -split '\s+')[-1]
        Write-Host "🔪 Killing process on port $Port (PID: $processId)"
        taskkill /F /PID $processId 2>$null
    }
}

Write-Host "🧹 Cleaning up development environment..."

# Kill processes on development ports
Write-Host "🔍 Checking for running development servers..."
3000, 3001, 3002, 3005 | ForEach-Object { Kill-ProcessOnPort $_ }

# Clean Next.js cache
Write-Host "🗑️ Removing Next.js cache..."
if (Test-Path ".next") {
    Remove-Item -Recurse -Force .next
}
if (Test-Path "node_modules/.cache") {
    Remove-Item -Recurse -Force node_modules/.cache
}

# Clear npm cache (optional)
Write-Host "🧼 Clearing npm cache..."
npm cache clean --force

# Install dependencies (in case of updates)
Write-Host "📦 Installing dependencies..."
npm install

# Start development server
Write-Host "🚀 Starting development server..."
npm run dev 