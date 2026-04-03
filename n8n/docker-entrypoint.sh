#!/bin/sh

# ==============================================================================
# n8n Railway Entrypoint Script (v3.0 - Auto-Import Enabled)
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


# 2. Database Schema Initialization
# n8n automatically initializes the schema on start, but for 'import:workflow'
# to work on a fresh DB, we trigger an initialization by running a dummy export.
echo "Ensuring database schema is synchronized..."
n8n export:workflow --all --output=/home/node/init_check.json || echo "Database initialization check completed."

# 3. Automated Workflow Import
# This imports JSON files from the workflows folder in the repository
if [ -d "/home/node/n8n-config/workflows" ]; then
    echo "Found workflows directory. Starting automated import..."
    for file in /home/node/n8n-config/workflows/*.json; do
        if [ -f "$file" ]; then
            echo "Importing workflow: $file"
            n8n import:workflow --input="$file" || echo "Warning: Failed to import $file"
        fi
    done
    echo "Automated import completed."
else
    echo "No workflows folder found at /home/node/n8n-config/workflows. Skipping import."
fi

# 4. Execute n8n
echo "Starting n8n on port $N8N_PORT..."
echo "Healthcheck is active and expected at /healthz"
exec n8n start
