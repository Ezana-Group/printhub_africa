FROM n8nio/n8n:latest

USER root
# Ensure the directory exists and has correct permissions
RUN mkdir -p /home/node/.n8n && chown -R node:node /home/node/.n8n

# Copy the local n8n configuration files
COPY --chown=node:node . /home/node/.n8n

# Copy and setup entrypoint script
COPY --chown=node:node docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

USER node

# Important for Railway: Fallback to 5678 if PORT is not set
ENV N8N_PORT=5678
ENV N8N_LISTEN_ADDRESS=0.0.0.0
ENV N8N_PROTOCOL=http
ENV NODE_ENV=production
ENV N8N_METRICS=true
ENV N8N_HEALTHCHECK_ENABLED=true
# Set localhost so internal healthcheck works as intended
ENV N8N_HEALTHCHECK_HOST=localhost
ENV N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS=false
# Database defaults for Neon
ENV DB_TYPE=postgresdb
ENV DB_POSTGRESDB_SSL_REJECT_UNAUTHORIZED=false

EXPOSE 5678

ENTRYPOINT ["/docker-entrypoint.sh"]
