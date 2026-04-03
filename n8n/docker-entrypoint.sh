#!/bin/sh

# ==============================================================================
# n8n Railway Entrypoint Script (v3.3 - DB Ready Check & Debug Mode)
# ==============================================================================

# 1. Handle dynamic Railway PORT
if [ -n "$PORT" ]; then
    export N8N_PORT="$PORT"
    echo "Binding n8n to dynamic Railway PORT: $N8N_PORT"
else
    export N8N_PORT="${N8N_PORT:-5678}"
    echo "Using default N8N_PORT: $N8N_PORT"
fi

# Ensure n8n listens on all interfaces (IPv6 capable)
export N8N_LISTEN_ADDRESS="::"

# 2. Database Connectivity Check
# Since the image is hardened (no nc), we use node to check the database connection.
echo "Checking database connectivity to $DB_POSTGRESDB_HOST:$DB_POSTGRESDB_PORT..."
MAX_RETRIES=10
RETRY_COUNT=0
until node -e "const net = require('net'); const client = net.createConnection({host: '$DB_POSTGRESDB_HOST', port: parseInt('$DB_POSTGRESDB_PORT') || 5432}, () => { client.end(); process.exit(0); }); client.on('error', () => process.exit(1)); setTimeout(() => process.exit(1), 2000);" || [ $RETRY_COUNT -eq $MAX_RETRIES ]; do
    echo "Database not reachable yet. Retrying in 5s ($((RETRY_COUNT + 1))/$MAX_RETRIES)..."
    sleep 5
    RETRY_COUNT=$((RETRY_COUNT + 1))
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo "CRITICAL: Database not reachable after $MAX_RETRIES attempts. Starting n8n anyway to catch internal errors..."
else
    echo "Database is reachable."
    
    # --- New: Forced Migration Step (v3.4) ---
    echo "Forcing database migrations before startup..."
    if n8n db:migrate; then
        echo "Database migrations completed successfully."
    else
        echo "CRITICAL: Database migrations failed! Attempting to start n8n anyway for diagnostic logs..."
    fi
fi

# 3. Start n8n automated import in the background
(
    echo "Background process: Waiting 30s for n8n server to stabilize..."
    sleep 30 
    
    if [ -d "/home/node/n8n-config/workflows" ]; then
        echo "Background process: Starting automated workflow import..."
        for file in /home/node/n8n-config/workflows/*.json; do
            if [ -f "$file" ]; then
                # Retry each import until database is ready (max 5 attempts)
                for i in 1 2 3 4 5; do
                    echo "Importing workflow: $file (Attempt $i)"
                    if n8n import:workflow --input="$file"; then
                        echo "Successfully imported $file"
                        break
                    fi
                    echo "Import failed for $file, retrying in 5s..."
                    sleep 5
                done
            fi
        done
        echo "Background process: Automated import completed."
    else
        echo "Background process: No workflows folder found. Skipping import."
    fi
) &

# 4. Execute n8n (This is the main blocking process)
echo "Starting n8n on port $N8N_PORT..."
echo "Healthcheck is active and expected at /healthz"
exec n8n start

