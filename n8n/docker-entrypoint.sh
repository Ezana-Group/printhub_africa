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
        echo "Background Import: Starting monitor (PID $$)..."
        echo "Background Import: Checking for JSON files in /home/node/workflows/..."
        ls -la /home/node/workflows/*.json || echo "No JSON files found!"

        echo "Background Import: Waiting for n8n to be healthy at http://localhost:$N8N_PORT..."
        # Wait up to 5 minutes for n8n to start
        MAX_WAIT=60
        COUNT=0
        until node -e "const http = require('http'); const req = http.get('http://localhost:' + process.env.N8N_PORT + '/healthz', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); }); req.on('error', () => process.exit(1));" || [ $COUNT -eq $MAX_WAIT ]; do
            sleep 5
            COUNT=$((COUNT + 1))
        done

        if [ $COUNT -eq $MAX_WAIT ]; then
            echo "Background Import ERROR: n8n did not become healthy in time."
        else
            echo "Background Import: n8n is ready. Waiting for first user to be created..."
            # Wait for Moses (User 1) to be created in the UI
            USER_READY=1
            while [ $USER_READY -ne 0 ]; do
                # Check if user with ID 1 exists
                n8n user:get --id 1 > /dev/null 2>&1
                USER_READY=$?
                if [ $USER_READY -ne 0 ]; then
                    echo "Background Import: Waiting for user ID 1 (Moses) to be created via UI..."
                    sleep 10
                fi
            done

            echo "Background Import: User 1 found. Starting sequential import..."
            for f in /home/node/workflows/*.json; do
                if [ -f "$f" ]; then
                    echo "Background Import: Processing $f..."
                    # In n8n v1+, we MUST specify --userId if user management is active
                    n8n import:workflow --userId 1 --file "$f" && echo "Background Import: Success for $(basename "$f")" || echo "Background Import: FAILED for $(basename "$f")"
                fi
            done
            echo "Background Import: All workflows processed."
        fi
    ) &
fi

# 4. Execute n8n
echo "Starting n8n on port $N8N_PORT..."
exec n8n start
