#!/bin/sh

# ==============================================================================
# n8n Railway Entrypoint Script (v3.2 - Forced Migration & CSP Support)
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

# 2. Database Connectivity & Migration
# We MUST ensure the database is ready and migrations have run BEFORE starting the server.
echo "Checking database connectivity..."
MAX_RETRIES=10
RETRY_COUNT=0
until n8n db:migrate || [ $RETRY_COUNT -eq $MAX_RETRIES ]; do
    echo "Database migration failed or database not reachable. Retrying in 5s ($((RETRY_COUNT + 1))/$MAX_RETRIES)..."
    sleep 5
    RETRY_COUNT=$((RETRY_COUNT + 1))
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo "CRITICAL: Database migration failed after $MAX_RETRIES attempts. Exiting."
    exit 1
fi
echo "Database migration successful."

# 3. Start n8n automated import in the background
# We run this in the background after the main process has initialized or is starting.
(
    echo "Background process: Waiting 20s for n8n server to stabilize..."
    sleep 20 
    
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

