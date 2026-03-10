#!/bin/bash

echo "🚀 Starting ERPNext for PrintHub..."
echo ""

# Check if already running
if docker compose -f docker-compose.erpnext.yml ps | grep -q "running"; then
  echo "✅ ERPNext is already running!"
  echo "👉 Open: http://localhost:8080"
  echo "👉 Login: administrator / admin123"
  exit 0
fi

# First time setup or restart
echo "Starting Docker containers..."
docker compose -f docker-compose.erpnext.yml up -d

echo ""
echo "⏳ Waiting for ERPNext to be ready..."
echo "   (First time setup takes 3-5 minutes)"
echo ""

# Wait for ERPNext to be ready (with timeout)
MAX_RETRIES=72
retries=0
while true; do
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 http://localhost:8080 2>/dev/null || echo "000")
  if echo "$code" | grep -q "200\|302"; then break; fi
  echo -n "."
  retries=$((retries + 1))
  if [ "$retries" -ge "$MAX_RETRIES" ]; then
    echo ""
    echo "❌ ERPNext did not become ready in time."
    exit 1
  fi
  sleep 5
done

echo ""
echo "✅ ERPNext is ready!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ERPNext URL:  http://localhost:8080"
echo "  Username:     administrator"
echo "  Password:     admin123"
echo "  Site:         printhub.localhost"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Next step: Run npm run erpnext:setup"
