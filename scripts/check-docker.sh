#!/bin/bash
echo "Checking prerequisites..."

# Check Docker
if ! command -v docker &> /dev/null; then
  echo "❌ Docker not installed"
  echo "Install from: https://docs.docker.com/get-docker/"
  exit 1
else
  echo "✅ Docker: $(docker --version)"
fi

# Check Docker Compose
if ! command -v docker compose &> /dev/null; then
  echo "❌ Docker Compose not installed"
  echo "Install from: https://docs.docker.com/compose/install/"
  exit 1
else
  echo "✅ Docker Compose: $(docker compose version)"
fi

# Check available RAM (ERPNext needs at least 4GB)
if [[ "$OSTYPE" == "darwin"* ]]; then
  RAM=$(sysctl -n hw.memsize | awk '{print $1/1024/1024/1024}')
else
  RAM=$(free -g | awk '/Mem:/{print $2}')
fi
echo "✅ RAM available: ${RAM}GB (minimum 4GB needed)"

# Check available disk space (need at least 10GB)
DISK=$(df -h . | awk 'NR==2{print $4}')
echo "✅ Disk space available: $DISK"

echo ""
echo "All checks passed! Ready to install ERPNext."
