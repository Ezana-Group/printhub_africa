FROM n8nio/n8n:2.14.2

USER root

# Install necessary system dependencies (curl for healthchecks, ffmpeg for media tasks)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

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
ENV N8N_LISTEN_ADDRESS=0.0.0.0
ENV N8N_PROTOCOL=https
ENV NODE_ENV=production
ENV N8N_METRICS=true
ENV N8N_HEALTHCHECK_ACTIVE=true
ENV N8N_HEALTHCHECK_HOST=localhost
ENV N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS=false

# Use project-level storage
ENV N8N_USER_FOLDER=/home/node/.n8n

# Log level
ENV N8N_LOG_LEVEL=info

ENTRYPOINT ["/docker-entrypoint.sh"]
