# ==============================================================================
# n8n Dockerfile — FRESH INSTALL (v5.0)
# ==============================================================================
# Pin to a specific version — never use `latest` in production.
# A new n8n release can break existing workflows without warning.
# Check releases at: https://github.com/n8n-io/n8n/releases
# To upgrade: update this tag, test in staging, then promote to production.
FROM n8nio/n8n:1.89.2

USER root

# n8n base image includes Node.js, which we'll use for health checks

COPY --chown=node:node docker-entrypoint.sh /docker-entrypoint.sh
COPY --chown=node:node workflows/ /home/node/workflows/
RUN chmod +x /docker-entrypoint.sh

USER node

# Standard n8n environment variables for Railway
ENV N8N_PORT=5678
ENV N8N_LISTEN_ADDRESS=::
ENV N8N_PROTOCOL=https
ENV NODE_ENV=production
ENV N8N_METRICS=true
ENV N8N_HEALTHCHECK_ACTIVE=true

# Core persistent folder
ENV N8N_USER_FOLDER=/home/node/.n8n

ENTRYPOINT ["/docker-entrypoint.sh"]
