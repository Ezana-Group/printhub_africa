FROM n8nio/n8n:2.14.2

USER root

# Note: Base n8n 2.x images are 'hardened' and do not include a package manager (apk/apt-get).
# System dependencies like ffmpeg are handled by the separate printhub-ffmpeg-service.
# The internal n8n healthcheck is enabled via environment variables.

# Create the data directory and set permissions
RUN mkdir -p /home/node/.n8n && chown -R node:node /home/node/.n8n

# Copy the workflows and other local files into a temporary folder
# We'll use this if we need to pre-load or reference them.
COPY --chown=node:node . /home/node/n8n-config/

# Copy and setup entrypoint script
COPY --chown=node:node docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

USER node

# n8n environment variables
# IMPORTANT: Railway terminates TLS at the edge — the container must listen on HTTP.
# Setting N8N_PROTOCOL=https here would cause n8n to try to serve its own HTTPS
# without certs, resulting in connection refused / 502 errors.
ENV N8N_LISTEN_ADDRESS=0.0.0.0
ENV N8N_PROTOCOL=http
ENV NODE_ENV=production
ENV N8N_METRICS=true
ENV N8N_HEALTHCHECK_ACTIVE=true
ENV N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS=false

# Expose default port (Railway overrides this via $PORT env var at runtime)
EXPOSE 5678

# Use project-level storage
ENV N8N_USER_FOLDER=/home/node/.n8n

# Log level
ENV N8N_LOG_LEVEL=info

ENTRYPOINT ["/docker-entrypoint.sh"]
