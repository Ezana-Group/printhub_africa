#!/bin/sh

# ==============================================================================
# n8n Railway Entrypoint Script
# Maps Railway standard Postgres variables to n8n specific ones.
# ==============================================================================

# 1. Map Railway standard variables if they exist
if [ -n "$PGHOST" ]; then
    export DB_POSTGRESDB_HOST="$PGHOST"
    export DB_POSTGRESDB_PORT="${PGPORT:-5432}"
    export DB_POSTGRESDB_DATABASE="${PGDATABASE:-railway}"
    export DB_POSTGRESDB_USER="$PGUSER"
    export DB_POSTGRESDB_PASSWORD="$PGPASSWORD"
    echo "Using project-linked Railway Postgres database."
fi

# 2. Fallback to DATABASE_URL if host wasn't set but URL is
if [ -z "$DB_POSTGRESDB_HOST" ] && [ -n "$DATABASE_URL" ]; then
    echo "Extracting database details from DATABASE_URL..."
    
    # Simple regex extraction for Postgres URL: postgresql://user:pass@host:port/db
    PROTO="$(echo $DATABASE_URL | grep :// | sed -e's,^\(.*://\).*,\1,g')"
    URL="$(echo ${DATABASE_URL/$PROTO/})"
    USER_PASS="$(echo $URL | grep @ | cut -d@ -f1)"
    export DB_POSTGRESDB_USER="$(echo $USER_PASS | cut -d: -f1)"
    export DB_POSTGRESDB_PASSWORD="$(echo $USER_PASS | cut -d: -f2)"
    
    HOST_PORT_DB="$(echo $URL | grep @ | cut -d@ -f2)"
    HOST_PORT="$(echo $HOST_PORT_DB | cut -d/ -f1)"
    export DB_POSTGRESDB_HOST="$(echo $HOST_PORT | cut -d: -f1)"
    export DB_POSTGRESDB_PORT="$(echo $HOST_PORT | cut -s -d: -f2)"
    [ -z "$DB_POSTGRESDB_PORT" ] && export DB_POSTGRESDB_PORT=5432
    
    export DB_POSTGRESDB_DATABASE="$(echo $HOST_PORT_DB | cut -d/ -f2 | cut -d? -f1)"
    echo "Extracted Host: $DB_POSTGRESDB_HOST"
fi

# 3. Final check: if still empty, warn the user (n8n will likely default to SQLite or fail)
if [ -z "$DB_POSTGRESDB_HOST" ]; then
    echo "Warning: No database host detected. n8n might fail to start or use SQLite."
fi

# Execute n8n
exec n8n start
