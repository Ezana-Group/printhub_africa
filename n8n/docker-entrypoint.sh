#!/bin/sh

# ==============================================================================
# n8n Railway Entrypoint Script (v5.1 - FIXED)
# Fixes applied:
#   - BUG: `xoc` command does not exist → replaced with `awk`
#   - BUG: glob `workflows/*.json` only matched root-level files; all 50+
#          workflows live in subdirectories → replaced with `find` recursive
#   - BUG: `n8n user:get --id 1` is not a valid n8n CLI command → replaced
#          with n8n API health + owner check via CLI `user:list`
#   - IMPROVEMENT: Import the global error handler FIRST so its ID can be
#          substituted into all other workflow `errorWorkflow` settings
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
until node -e "const net = require('net'); const client = net.createConnection({host: '$DB_POSTGRESDB_HOST', port: parseInt('$DB_POSTGRESDB_PORT') || 5432}, () => { client.end(); process.exit(0); }); client.on('error', () => process.exit(1)); setTimeout(() => process.exit(1), 2000);" 2>/dev/null || [ $RETRY_COUNT -eq $MAX_RETRIES ]; do
    echo "Database not reachable yet. Retrying in 5s ($((RETRY_COUNT + 1))/$MAX_RETRIES)..."
    sleep 5
    RETRY_COUNT=$((RETRY_COUNT + 1))
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo "WARNING: Database not reachable after $MAX_RETRIES attempts. Letting n8n handle retry..."
else
    echo "Database is reachable. Starting n8n..."
fi

# 3. Automated Workflow Import — runs in background after n8n is healthy
if [ -d "/home/node/workflows" ]; then
    (
        echo "=============================================================================="
        echo "Background Import: MONITOR STARTING"
        echo "Background Import: Checking n8n health at http://localhost:$N8N_PORT/healthz..."

        MAX_HEALTH_WAIT=60
        HEALTH_COUNT=0
        until node -e "const http = require('http'); const req = http.get('http://localhost:' + process.env.N8N_PORT + '/healthz', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); }); req.on('error', () => process.exit(1));" 2>/dev/null || [ $HEALTH_COUNT -eq $MAX_HEALTH_WAIT ]; do
            echo "Background Import: n8n not healthy yet (Attempt $((HEALTH_COUNT + 1))/$MAX_HEALTH_WAIT)..."
            sleep 5
            HEALTH_COUNT=$((HEALTH_COUNT + 1))
        done

        if [ $HEALTH_COUNT -eq $MAX_HEALTH_WAIT ]; then
            echo "Background Import FATAL: n8n failed healthcheck after 5 minutes. Aborting import."
            exit 1
        fi

        echo "Background Import: n8n is HEALTHY."

        # Wait until the owner user exists (first-time setup requires UI completion)
        echo "Background Import: Waiting for first user to be created (complete n8n setup in the UI)..."
        USER_EMAIL=""
        MAX_USER_WAIT=600
        USER_COUNT=0

        while [ -z "$USER_EMAIL" ] && [ $USER_COUNT -lt $MAX_USER_WAIT ]; do
            # FIX: `n8n user:get --id 1` does not exist. Use `n8n user:list` and
            # parse the first valid email. Also fixed `xoc` → `awk` (xoc is not a command).
            USER_EMAIL=$(n8n user:list 2>/dev/null | grep -E "@" | head -1 | awk '{print $1}')

            if [ -z "$USER_EMAIL" ]; then
                echo "Background Import: No users yet ($USER_COUNT/${MAX_USER_WAIT}s). Waiting 15s..."
                sleep 15
                USER_COUNT=$((USER_COUNT + 15))
            fi
        done

        if [ -z "$USER_EMAIL" ]; then
            echo "Background Import TIMEOUT: No user after ${MAX_USER_WAIT}s. Skipping auto-import."
            exit 0
        fi

        echo "Background Import: Owner detected: $USER_EMAIL"

        # --- STEP A: Import Global Error Handler FIRST ---
        # We must import it first so n8n assigns it an ID, then we can query
        # that ID and patch it into all other workflows before importing them.
        ERROR_HANDLER_FILE=""
        for f in $(find /home/node/workflows -name "*.json" 2>/dev/null | sort); do
            fname=$(basename "$f")
            if echo "$fname" | grep -qi "global-error-handler"; then
                ERROR_HANDLER_FILE="$f"
                break
            fi
        done

        ERROR_WORKFLOW_ID=""
        if [ -n "$ERROR_HANDLER_FILE" ]; then
            echo "Background Import: Importing Global Error Handler first: $(basename $ERROR_HANDLER_FILE)"
            if n8n import:workflow --input="$ERROR_HANDLER_FILE" > /tmp/import_log 2>&1; then
                echo "Background Import: Global Error Handler imported successfully."
                # Query the workflow ID via n8n CLI or API
                # Try to get the workflow ID from the n8n REST API (available after startup)
                ERROR_WORKFLOW_ID=$(node -e "
                  const http = require('http');
                  const opts = {
                    hostname: 'localhost',
                    port: process.env.N8N_PORT,
                    path: '/api/v1/workflows?limit=100',
                    headers: { 'Accept': 'application/json' }
                  };
                  http.get(opts, res => {
                    let data = '';
                    res.on('data', d => data += d);
                    res.on('end', () => {
                      try {
                        const json = JSON.parse(data);
                        const wf = (json.data || []).find(w => w.name && w.name.toLowerCase().includes('error handler'));
                        if (wf) process.stdout.write(String(wf.id));
                      } catch(e) {}
                    });
                  }).on('error', () => {});
                " 2>/dev/null || true)
            else
                echo "Background Import: WARNING — Global Error Handler import failed:"
                cat /tmp/import_log
            fi
        fi

        if [ -n "$ERROR_WORKFLOW_ID" ]; then
            echo "Background Import: Global Error Handler ID = $ERROR_WORKFLOW_ID"
        else
            echo "Background Import: WARNING — Could not resolve Global Error Handler ID."
            echo "Background Import: errorWorkflow placeholders will remain as literal strings."
            echo "Background Import: After setup, manually set errorWorkflow in n8n Settings → Workflows."
        fi

        # --- STEP B: Import all remaining workflows ---
        # FIX: Use `find` recursively — the original `for f in /home/node/workflows/*.json`
        # only matched ROOT-level files. All 50+ workflows are in subdirectories
        # (auth-security/, catalog-inventory/, etc.) and were NEVER imported.
        echo "Background Import: Scanning for workflow files recursively..."
        TOTAL=0
        SUCCESS=0
        FAILED=0

        for f in $(find /home/node/workflows -name "*.json" 2>/dev/null | sort); do
            FILENAME=$(basename "$f")

            # Skip the global error handler (already imported in step A)
            if echo "$FILENAME" | grep -qi "global-error-handler"; then
                continue
            fi

            TOTAL=$((TOTAL + 1))

            # If we have the error handler ID, substitute the placeholder before importing
            IMPORT_FILE="$f"
            if [ -n "$ERROR_WORKFLOW_ID" ]; then
                TMP_IMPORT_FILE="/tmp/import_$(echo $FILENAME | tr ' ' '_')"
                sed "s/{{GLOBAL_ERROR_HANDLER_ID}}/$ERROR_WORKFLOW_ID/g" "$f" > "$TMP_IMPORT_FILE"
                IMPORT_FILE="$TMP_IMPORT_FILE"
            fi

            echo "Background Import: [$TOTAL] Importing $FILENAME..."
            if n8n import:workflow --input="$IMPORT_FILE" > /tmp/import_log 2>&1; then
                echo "Background Import:   ✓ SUCCESS: $FILENAME"
                SUCCESS=$((SUCCESS + 1))
            else
                echo "Background Import:   ✗ FAILED: $FILENAME"
                cat /tmp/import_log
                FAILED=$((FAILED + 1))
            fi

            # Clean up temp file if created
            [ -n "$ERROR_WORKFLOW_ID" ] && rm -f "$IMPORT_FILE" 2>/dev/null || true
        done

        echo "=============================================================================="
        echo "Background Import: COMPLETE — $SUCCESS succeeded, $FAILED failed (of $TOTAL total)"
        if [ -z "$ERROR_WORKFLOW_ID" ]; then
            echo "Background Import: ACTION REQUIRED — Set the Global Error Handler workflow ID"
            echo "Background Import: in each workflow's settings → 'Error Workflow' field."
        fi
        echo "=============================================================================="
    ) &
fi

# 4. Execute n8n
echo "Starting n8n on port $N8N_PORT..."
exec n8n start
