#!/bin/sh

# ==============================================================================
# n8n Railway Entrypoint Script
# Maps Railway standard Postgres variables to n8n specific ones.
# ==============================================================================

# 1. Detect Railway standard variables if they exist
# Priority given to PG* standard variables injected by Railway linking
if [ -n "$PGHOST" ]; then
    export DB_POSTGRESDB_HOST="$PGHOST"
    export DB_POSTGRESDB_PORT="${PGPORT:-5432}"
    export DB_POSTGRESDB_DATABASE="${PGDATABASE:-railway}"
    export DB_POSTGRESDB_USER="$PGUSER"
    export DB_POSTGRESDB_PASSWORD="$PGPASSWORD"
    echo "Confirmed: Using project-linked Railway Postgres database (PGHOST variant)."
elif [ -n "$POSTGRES_HOST" ]; then
    export DB_POSTGRESDB_HOST="$POSTGRES_HOST"
    export DB_POSTGRESDB_PORT="${POSTGRES_PORT:-5432}"
    export DB_POSTGRESDB_DATABASE="${POSTGRES_DB:-railway}"
    export DB_POSTGRESDB_USER="$POSTGRES_USER"
    export DB_POSTGRESDB_PASSWORD="$POSTGRES_PASSWORD"
    echo "Confirmed: Using project-linked Railway Postgres database (POSTGRES variant)."
fi

# 2. Fallback to DATABASE_URL if host wasn't set but URL is
if [ -z "$DB_POSTGRESDB_HOST" ] && [ -n "$DATABASE_URL" ]; then
    echo "Extracting database details from DATABASE_URL..."
    
    # Simple regex extraction for Postgres URL: postgresql://user:pass@host:port/db?options
    # We use sed to handle potential query parameters that can break simple 'cut'
    export DB_POSTGRESDB_USER=$(echo "$DATABASE_URL" | sed -n 's|.*://\([^:]*\):.*|\1|p')
    export DB_POSTGRESDB_PASSWORD=$(echo "$DATABASE_URL" | sed -n 's|.*://[^:]*:\([^@]*\)@.*|\1|p')
    export DB_POSTGRESDB_HOST=$(echo "$DATABASE_URL" | sed -n 's|.*@\([^:/]*\)[:/].*|\1|p')
    export DB_POSTGRESDB_PORT=$(echo "$DATABASE_URL" | sed -n 's|.*:\([0-9]*\)/.*|\1|p')
    [ -z "$DB_POSTGRESDB_PORT" ] && export DB_POSTGRESDB_PORT=5432
    export DB_POSTGRESDB_DATABASE=$(echo "$DATABASE_URL" | sed -n 's|.*/\([^?]*\).*|\1|p')

    echo "Extracted Host: $DB_POSTGRESDB_HOST"
    echo "Extracted Port: $DB_POSTGRESDB_PORT"
    echo "Extracted DB: $DB_POSTGRESDB_DATABASE"
fi

# 3. Handle Port Mapping
# Railway provides $PORT, n8n expects $N8N_PORT
if [ -n "$PORT" ]; then
    export N8N_PORT="$PORT"
    echo "Binding n8n to dynamic Railway PORT: $N8N_PORT"
else
    export N8N_PORT="${N8N_PORT:-5678}"
    echo "Using default N8N_PORT: $N8N_PORT"
fi

# 4. Handle SSL for external databases (Neon/RDS)
# Default DB_POSTGRESDB_SSL_REJECT_UNAUTHORIZED to false if not set
if [ -z "$DB_POSTGRESDB_SSL_REJECT_UNAUTHORIZED" ]; then
    export DB_POSTGRESDB_SSL_REJECT_UNAUTHORIZED="false"
    echo "SSL: Set DB_POSTGRESDB_SSL_REJECT_UNAUTHORIZED=false for compatibility."
fi

# Ensure SSL Mode is 'require' for Neon
if [ -z "$DB_POSTGRESDB_SSL_MODE" ]; then
    export DB_POSTGRESDB_SSL_MODE="require"
    echo "SSL: Set DB_POSTGRESDB_SSL_MODE=require for Neon connectivity."
fi

# 5. Final check: show exact connection details for debugging
if [ -z "$DB_POSTGRESDB_HOST" ]; then
    echo "Warning: No database host detected. n8n might fail to start or use SQLite."
else
    echo "n8n connecting to: $DB_POSTGRESDB_USER@$DB_POSTGRESDB_HOST:$DB_POSTGRESDB_PORT/$DB_POSTGRESDB_DATABASE (SSL: $DB_POSTGRESDB_SSL_MODE)"
fi

# Execute n8n
exec n8n start
