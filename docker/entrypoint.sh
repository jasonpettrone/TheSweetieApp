#!/bin/bash
set -e

echo "🐳 AI Software Team Container Starting..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Configure git for the container
git config --global user.email "ai-agent@sweetieapp.local"
git config --global user.name "AI Software Team"
git config --global --add safe.directory /app/website

# Verify we're in isolated environment
echo "✓ Container isolated: $DOCKER_CONTAINER"
echo "✓ Working directory: $(pwd)"
echo "✓ User: $(whoami)"

# Check mounted volumes
echo ""
echo "📁 Mounted Volumes:"
if [ -d "/app/website" ]; then
    echo "  ✓ /app/website (read-write)"
else
    echo "  ✗ /app/website NOT MOUNTED"
    exit 1
fi

if [ -d "/app/data" ]; then
    echo "  ✓ /app/data (read-write)"
else
    echo "  ✗ /app/data NOT MOUNTED"
    exit 1
fi

if [ -f "/app/ceo-tasks.md" ]; then
    echo "  ✓ /app/ceo-tasks.md (read-only)"
else
    echo "  ✓ /app/ceo-tasks.md (not present - OK)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Handle different commands
case "$1" in
    "manual-day")
        echo "🚀 Starting Daily Workflow..."
        node src/cli/index.js manual-day
        ;;
    "status")
        echo "📊 Agent Status..."
        node src/cli/index.js status
        ;;
    "start")
        echo "⏰ Starting Scheduler..."
        node src/cli/index.js start
        ;;
    *)
        echo "Running custom command: $@"
        exec "$@"
        ;;
esac

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🐳 Container execution complete"
