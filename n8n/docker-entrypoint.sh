#!/bin/sh

# ==============================================================================
# n8n Railway Entrypoint Script (v2.0)
# ==============================================================================

# Priority 1: Handle dynamic Railway PORT
if [ -n "$PORT" ]; then
    export N8N_PORT="$PORT"
    echo "Binding n8n to dynamic Railway PORT: $N8N_PORT"
else
    export N8N_PORT="${N8N_PORT:-5678}"
    echo "Using default N8N_PORT: $N8N_PORT"
fi

# Ensure n8n listens on all interfaces
export N8N_LISTEN_ADDRESS="0.0.0.0"

# Execute n8n
exec n8n start
