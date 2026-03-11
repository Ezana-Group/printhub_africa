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

# Check Docker Compose (v2 plugin or legacy binary)
if docker compose version &> /dev/null; then
  echo "✅ Docker Compose: $(docker compose version)"
elif command -v docker-compose &> /dev/null && docker-compose --version &> /dev/null; then
  echo "✅ Docker Compose: $(docker-compose --version)"
else
  echo "❌ Docker Compose not installed"
  echo "Install from: https://docs.docker.com/compose/install/"
  exit 1
fi

# Check available RAM (ERPNext needs at least 4GB)
if [[ "$OSTYPE" == "darwin"* ]]; then
  RAM_GB=$(sysctl -n hw.memsize | awk '{print int($1/1024/1024/1024)}')
else
  RAM_GB=$(free -g | awk '/Mem:/{print int($2)}')
fi
if [[ "$RAM_GB" -lt 4 ]]; then
  echo "❌ Insufficient RAM: ${RAM_GB}GB available (minimum 4GB needed)"
  exit 1
fi
echo "✅ RAM available: ${RAM_GB}GB (minimum 4GB needed)"

# Check available disk space (need at least 10GB)
MIN_BYTES=10737418240
DISK_BYTES=$(df -k . | awk 'NR==2{print $4*1024}')
if [[ "$DISK_BYTES" -lt "$MIN_BYTES" ]]; then
  echo "❌ Insufficient disk space (minimum 10GB required)"
  exit 1
fi
DISK_HUMAN=$(numfmt --to=iec-i --suffix=B "$DISK_BYTES" 2>/dev/null || echo "$((DISK_BYTES / 1024 / 1024 / 1024))GB")
echo "✅ Disk space available: $DISK_HUMAN"

echo ""
echo "All checks passed! Ready to install ERPNext."
