#!/bin/sh

# ==============================================================================
# n8n Railway Entrypoint Script (v5.0 - FRESH START)
# ==============================================================================

# 1. Handle dynamic Railway PORT
if [ -n "$PORT" ]; then
    export N8N_PORT="$PORT"
    echo "Binding n8n to dynamic Railway PORT: $N8N_PORT"
else
    export N8N_PORT="${N8N_PORT:-5678}"
    echo "Using default N8N_PORT: $N8N_PORT"
fi

# Ensure n8n listens on all interfaces
export N8N_LISTEN_ADDRESS="::"

# 2. Database Connectivity Check
echo "Checking database connectivity to $DB_POSTGRESDB_HOST:$DB_POSTGRESDB_PORT..."
MAX_RETRIES=15
RETRY_COUNT=0
# Using node-based check since n8nio/n8n image has node
until node -e "const net = require('net'); const client = net.createConnection({host: '$DB_POSTGRESDB_HOST', port: parseInt('$DB_POSTGRESDB_PORT') || 5432}, () => { client.end(); process.exit(0); }); client.on('error', () => process.exit(1)); setTimeout(() => process.exit(1), 2000);" || [ $RETRY_COUNT -eq $MAX_RETRIES ]; do
    echo "Database not reachable yet. Retrying in 5s ($((RETRY_COUNT + 1))/$MAX_RETRIES)..."
    sleep 5
    RETRY_COUNT=$((RETRY_COUNT + 1))
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo "WARNING: Database not reachable after $MAX_RETRIES attempts. Let n8n handle internal retry..."
else
    echo "Database is reachable. Starting n8n..."
fi

# 3. Execute n8n
# Standard n8n start command. We no longer perform manual background imports.
# This ensures a clean schema migration by n8n itself.
echo "Starting n8n on port $N8N_PORT..."
exec n8n start
