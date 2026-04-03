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

# 3. Automated Workflow Import (One by One)
if [ -d "/home/node/workflows" ]; then
    (
        echo "=============================================================================="
        echo "Background Import: MONITOR STARTING (PID $$)"
        echo "Background Import: Checking for files in /home/node/workflows/..."
        NUM_FILES=$(ls /home/node/workflows/*.json 2>/dev/null | wc -l)
        echo "Background Import: Found $NUM_FILES JSON file(s)."
        
        echo "Background Import: Checking n8n health at http://localhost:$N8N_PORT/healthz..."
        MAX_HEALTH_WAIT=60
        HEALTH_COUNT=0
        until node -e "const http = require('http'); const req = http.get('http://localhost:' + process.env.N8N_PORT + '/healthz', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); }); req.on('error', () => process.exit(1));" || [ $HEALTH_COUNT -eq $MAX_HEALTH_WAIT ]; do
            echo "Background Import: n8n not healthy yet (Attempt $((HEALTH_COUNT + 1))/$MAX_HEALTH_WAIT)..."
            sleep 5
            HEALTH_COUNT=$((HEALTH_COUNT + 1))
        done

        if [ $HEALTH_COUNT -eq $MAX_HEALTH_WAIT ]; then
            echo "Background Import FATAL ERROR: n8n failed healthcheck after 5 minutes."
            exit 1
        fi

        echo "Background Import: n8n is HEALTHY. Detecting Owner User ID..."
        
        # We wait until at least ONE user exists in the DB
        USER_ID=""
        MAX_USER_WAIT=600 # 10 minutes total for first-time setup
        USER_COUNT=0
        
        while [ -z "$USER_ID" ] && [ $USER_COUNT -lt $MAX_USER_WAIT ]; do
            # Try to get the ID of the first user (Owner)
            USER_ID=$(n8n user:get --id 1 2>/dev/null | grep -o 'id: [0-9]*' | cut -d' ' -f2)
            
            if [ -z "$USER_ID" ]; then
                # Fallback: check if ANY user exists (if ID isn't 1)
                USER_ID=$(n8n user:list 2>/dev/null | grep -E "^\| [0-9]+" | head -1 | cut -d'|' -f2 | xoc -d ' ')
            fi

            if [ -z "$USER_ID" ]; then
                echo "Background Import: WAITING for first user to be created in the UI (Moses)..."
                sleep 15
                USER_COUNT=$((USER_COUNT + 15))
            fi
        done

        if [ -z "$USER_ID" ]; then
            echo "Background Import TIMEOUT: No user created after 10 minutes. Skipping auto-import."
            exit 0
        fi

        echo "Background Import: SUCCESS! Detected User ID: $USER_ID"
        echo "Background Import: Starting sequential import..."
        
        for f in /home/node/workflows/*.json; do
            if [ -f "$f" ]; then
                FILENAME=$(basename "$f")
                echo "Background Import: Importing $FILENAME using User $USER_ID..."
                
                # Use --userId flag for v1+ compatibility
                if n8n import:workflow --userId "$USER_ID" --file "$f" > /tmp/import_log 2>&1; then
                    echo "Background Import: SUCCESS for $FILENAME"
                else
                    echo "Background Import: FAILED for $FILENAME"
                    cat /tmp/import_log
                fi
            fi
        done
        
        echo "Background Import: COMPLETED. All blueprints processed."
        echo "=============================================================================="
    ) &
fi

# 4. Execute n8n
echo "Starting n8n on port $N8N_PORT..."
exec n8n start
