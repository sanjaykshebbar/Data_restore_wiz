#!/bin/bash
set -e

# Configuration
REPO_URL="https://github.com/sanjaykshebbar/Data_restore_wiz.git"
APP_NAME="Data_restore_wiz"
TEMP_DIR="/tmp/$APP_NAME"
LOG_PATH="$HOME/Desktop/DataRestoreWiz_Log.txt"

echo "🚀 Starting Data Restore Wiz Ephemeral Runner..."

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
echo "📥 Installing dependencies..."
npm install

# 4. Run Application
echo "▶️ Launching Application..."
echo "ℹ️ Close the application window to finish and clean up."
npm run dev

# 5. Cleanup
cd /tmp
echo "🧹 Cleaning up project files..."
rm -rf "$TEMP_DIR"

echo "✅ Cleanup complete. Log file should be at: $LOG_PATH"
