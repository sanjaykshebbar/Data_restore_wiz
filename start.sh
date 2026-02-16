#!/bin/bash
set -e

# Configuration
REPO_URL="https://github.com/sanjaykshebbar/Data_restore_wiz.git"
APP_NAME="Data_restore_wiz"
TEMP_DIR="/tmp/$APP_NAME"
LOG_PATH="$HOME/Desktop/DataRestoreWiz_Log.txt"

clear
echo "=========================================="
echo "   🧙‍♂️ Data Restore Wiz - Zero Trace Launcher"
echo "=========================================="
echo ""

# Permission Explanation
echo "⚠️  PERMISSIONS REQUIRED"
echo "To function correctly, this tool needs the following permissions:"
echo ""
echo "1. 💿 Full Disk Access (macOS)"
echo "   - Reason: To scan your Applications and User Data (Documents, Desktop, etc.) for backup."
echo "   - Action: If scanning fails, go to System Settings > Privacy & Security > Full Disk Access and add 'Terminal' (or your current shell)."
echo ""
echo "2. 🌐 Local Network Access"
echo "   - Reason: To find other computers on this LAN."
echo "   - Action: Click 'Allow' if macOS asks permission to find devices on local network."
echo ""

read -p "Press [Enter] to accept these permissions and start the tool..."

# 1. Cleanup previous runs
if [ -d "$TEMP_DIR" ]; then
    echo "🧹 Cleaning up previous temp files..."
    rm -rf "$TEMP_DIR"
fi

# 2. Clone Repository
echo "📦 Cloning repository..."
mkdir -p "$TEMP_DIR"
git clone "$REPO_URL" "$TEMP_DIR"

# 3. Install Dependencies
cd "$TEMP_DIR"
echo "📥 Installing dependencies (Node.js required)..."
npm install

# 4. Run Application
echo "▶️  Launching Application..."
echo "ℹ️  Close the application window to finish and clean up."
npm run dev

# 5. Cleanup
cd /tmp
echo "🧹 Cleaning up project files (Zero Trace)..."
rm -rf "$TEMP_DIR"

echo "✅ Cleanup complete. Log file should be at: $LOG_PATH"
