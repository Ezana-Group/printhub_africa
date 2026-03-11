#!/bin/bash
echo "Stopping ERPNext..."
docker compose -f docker-compose.erpnext.yml down
echo "✅ ERPNext stopped. Data is preserved."
