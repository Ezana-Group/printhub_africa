#!/bin/sh

# ==============================================================================
# n8n Railway Entrypoint Script (v3.1 - Background Auto-Import Enabled)
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

# 2. Start n8n automated import in the background
# We run this in the background so 'n8n start' can initialize the database schema first.
(
    echo "Background process: Waiting 30s for n8n to initialize database schema..."
    sleep 30 
    
    if [ -d "/home/node/n8n-config/workflows" ]; then
        echo "Background process: Starting automated workflow import..."
        for file in /home/node/n8n-config/workflows/*.json; do
            if [ -f "$file" ]; then
                # Retry each import until database is ready (max 5 attempts)
                for i in 1 2 3 4 5; do
                    echo "Importing workflow: $file (Attempt $i)"
                    # Note: We use the n8n binary. The server process is already running.
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
        echo "Background process: No workflows folder found at /home/node/n8n-config/workflows. Skipping import."
    fi
) &

# 3. Execute n8n (This is the main blocking process)
echo "Starting n8n on port $N8N_PORT..."
echo "Healthcheck is active and expected at /healthz"
exec n8n start
