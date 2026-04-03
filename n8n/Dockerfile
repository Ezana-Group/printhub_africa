FROM n8nio/n8n:latest

USER root

# Minimal setup for the fresh install
# Data storage is managed at /home/node/.n8n by default in n8n images
RUN mkdir -p /home/node/.n8n && chown -R node:node /home/node/.n8n

# Copy workflows (preserved) and entrypoint
COPY --chown=node:node . /home/node/n8n-config/
COPY --chown=node:node docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

USER node

# Standard n8n environment variables for Railway
ENV N8N_PORT=5678
ENV N8N_LISTEN_ADDRESS=::
ENV N8N_PROTOCOL=http
ENV NODE_ENV=production
ENV N8N_METRICS=true
ENV N8N_HEALTHCHECK_ACTIVE=true

# Entrypoint handles initial DB check
ENTRYPOINT ["/docker-entrypoint.sh"]
