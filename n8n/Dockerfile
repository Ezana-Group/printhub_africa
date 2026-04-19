# ==============================================================================
# n8n Dockerfile — FRESH INSTALL (v5.0)
# ==============================================================================
# Using latest because the Neon DB schema was initialized by the latest n8n image
# and has 160 migrations (up to April 2026). Pinning to 1.89.2 caused a version
# mismatch (500 on login). Once stable, check the running version from Railway logs
# (n8n prints "n8n ready on port X (version Y)") and pin to that specific tag.
# Check releases at: https://github.com/n8n-io/n8n/releases
FROM n8nio/n8n:latest

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
