FROM node:20-alpine
RUN apk add --no-cache ffmpeg curl
WORKDIR /app
COPY package.json .
RUN npm install
COPY server.js .
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1
CMD ["node", "server.js"]
