FROM n8nio/n8n:latest

USER root
# Ensure the directory exists and has correct permissions
RUN mkdir -p /home/node/.n8n && chown -R node:node /home/node/.n8n

# Copy the local n8n configuration files
COPY --chown=node:node . /home/node/.n8n

USER node

ENV N8N_PORT=5678
ENV N8N_PROTOCOL=http
ENV NODE_ENV=production
ENV N8N_METRICS=true
ENV N8N_HEALTHCHECK_ENABLED=true
ENV N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS=false

EXPOSE 5678
