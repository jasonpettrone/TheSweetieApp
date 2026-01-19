# AI Agent Execution Environment
# Isolated container for safe AI agent operations

FROM node:20-alpine

# Install git for agent operations
RUN apk add --no-cache git bash

# Create non-root user for security
RUN addgroup -g 1001 -S aiagent && \
    adduser -S aiagent -u 1001 -G aiagent

# Set working directory
WORKDIR /app

# Copy package files first for caching
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy agent framework code (read-only in container)
COPY src/ ./src/

# Create directories for mounted volumes
RUN mkdir -p /app/website /app/data && \
    chown -R aiagent:aiagent /app

# Copy entrypoint
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Switch to non-root user
USER aiagent

# Environment
ENV NODE_ENV=production
ENV DOCKER_CONTAINER=true

# Entrypoint
ENTRYPOINT ["/entrypoint.sh"]
CMD ["manual-day"]
