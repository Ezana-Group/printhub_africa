#!/bin/bash
echo "⚠️  This will DELETE all ERPNext data and start fresh."
read -p "Are you sure? (yes/no): " confirm
if [ "$confirm" = "yes" ]; then
  docker compose -f docker-compose.erpnext.yml down -v
  echo "✅ ERPNext reset. Run npm run erpnext:start to set up again."
else
  echo "Cancelled."
fi
