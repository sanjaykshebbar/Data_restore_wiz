$ErrorActionPreference = "Stop"

# Configuration
$RepoUrl = "YOUR_GITHUB_REPO_URL_HERE" # User must replace this or we inject it
$AppName = "Data_restore_wiz"
$TempDir = Join-Path $env:TEMP $AppName
$LogPath = Join-Path ([Environment]::GetFolderPath("Desktop")) "DataRestoreWiz_Log.txt"

Write-Host "🚀 Starting Data Restore Wiz Ephemeral Runner..." -ForegroundColor Cyan

# 1. Cleanup previous runs if any
if (Test-Path $TempDir) {
    Write-Host "🧹 Cleaning up previous temp files..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force $TempDir
}

# 2. Clone Repository
Write-Host "📦 Cloning repository..." -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path $TempDir | Out-Null
git clone $RepoUrl $TempDir

if (-not $?) {
    Write-Host "❌ Failed to clone repository." -ForegroundColor Red
    exit 1
}

# 3. Install Dependencies
Set-Location $TempDir
Write-Host "📥 Installing dependencies (this may take a moment)..." -ForegroundColor Cyan
npm install

# 4. Run Application
Write-Host "▶️ Launching Application..." -ForegroundColor Green
Write-Host "ℹ️ Close the application window to finish and clean up." -ForegroundColor Gray
npm run dev

# 5. Cleanup
Set-Location $env:TEMP
Write-Host "🧹 Cleaning up project files..." -ForegroundColor Yellow
Remove-Item -Recurse -Force $TempDir

Write-Host "✅ Cleanup complete. Log file (if generated) should be at: $LogPath" -ForegroundColor Green
