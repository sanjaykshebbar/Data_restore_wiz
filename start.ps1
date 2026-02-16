$ErrorActionPreference = "Stop"

# Configuration
$RepoUrl = "https://github.com/sanjaykshebbar/Data_restore_wiz.git"
$AppName = "Data_restore_wiz"
$TempDir = Join-Path $env:TEMP $AppName
$LogPath = Join-Path ([Environment]::GetFolderPath("Desktop")) "DataRestoreWiz_Log.txt"

Clear-Host
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   🧙‍♂️ Data Restore Wiz - Zero Trace Launcher" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Permission Explanation
Write-Host "⚠️  PERMISSIONS REQUIRED" -ForegroundColor RegExp
Write-Host "To function correctly, this tool needs the following permissions:" -ForegroundColor White
Write-Host ""
Write-Host "1. 🌐 Network Access (Firewall)" -ForegroundColor Green
Write-Host "   - Reason: To discover other computers on this Local Network (mDNS) and transfer files."
Write-Host "   - Action: If Windows Firewall prompts you, please check 'Private networks' and click 'Allow access'."
Write-Host ""
Write-Host "2. 📂 File Access" -ForegroundColor Green
Write-Host "   - Reason: To read files from your User folders (Documents, Desktop, etc.) for backup."
Write-Host "   - Action: The script runs with your current user privileges. No extra action needed."
Write-Host ""

Write-Host "Press [Enter] to accept these permissions and start the tool..." -ForegroundColor Yellow
$null = Read-Host

# 1. Cleanup previous runs
if (Test-Path $TempDir) {
    Write-Host "🧹 Cleaning up previous temp files..." -ForegroundColor Gray
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
Write-Host "📥 Installing dependencies (Node.js required)..." -ForegroundColor Cyan
npm install

if (-not $?) {
    Write-Host "❌ Failed to install dependencies. Is Node.js installed?" -ForegroundColor Red
    exit 1
}

# 4. Run Application
Write-Host "▶️  Launching Application..." -ForegroundColor Green
Write-Host "ℹ️  Close the application window to finish and clean up." -ForegroundColor Gray
npm run dev

# 5. Cleanup
Set-Location $env:TEMP
Write-Host "🧹 Cleaning up project files (Zero Trace)..." -ForegroundColor Yellow
Remove-Item -Recurse -Force $TempDir

Write-Host "✅ Cleanup complete. Log file (if generated) should be at: $LogPath" -ForegroundColor Green
