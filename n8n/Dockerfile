# ==============================================================================
# n8n Dockerfile — FRESH INSTALL (v5.0)
# ==============================================================================
FROM n8nio/n8n:latest

USER root

# Install curl for healthcheck waiting
RUN apk add --no-cache curl

COPY --chown=node:node docker-entrypoint.sh /docker-entrypoint.sh
COPY --chown=node:node workflows/ /home/node/workflows/
RUN chmod +x /docker-entrypoint.sh

USER node

# Standard n8n environment variables for Railway
ENV N8N_PORT=5678
ENV N8N_LISTEN_ADDRESS=::
ENV N8N_PROTOCOL=http
ENV NODE_ENV=production
ENV N8N_METRICS=true
ENV N8N_HEALTHCHECK_ACTIVE=true

# Core persistent folder
ENV N8N_USER_FOLDER=/home/node/.n8n

ENTRYPOINT ["/docker-entrypoint.sh"]
