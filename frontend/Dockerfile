# frontend/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (vite/tailwind/postcss are devDependencies needed to build)
RUN npm ci

# Copy source code
COPY . .

# Vite inlines VITE_* values at build time, so pass them as build args
# (ARG_* values come from the Cognito stack outputs; see docker build in the deploy notes)
ARG VITE_API_BASE_URL=/api/v1
ARG VITE_AWS_REGION=us-east-2
ARG VITE_AWS_COGNITO_USER_POOL_ID
ARG VITE_AWS_COGNITO_CLIENT_ID
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_AWS_REGION=$VITE_AWS_REGION \
    VITE_AWS_COGNITO_USER_POOL_ID=$VITE_AWS_COGNITO_USER_POOL_ID \
    VITE_AWS_COGNITO_CLIENT_ID=$VITE_AWS_COGNITO_CLIENT_ID

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# nginx template: the official image renders /etc/nginx/templates/*.template
# into /etc/nginx/conf.d/ at start-up using the environment variables below
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
ENV API_UPSTREAM=http://backend:8080 \
    NGINX_RESOLVER=127.0.0.11

# Copy built app from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Change ownership
RUN chown -R nextjs:nodejs /usr/share/nginx/html
RUN chown -R nextjs:nodejs /var/cache/nginx
RUN chown -R nextjs:nodejs /var/log/nginx
RUN chown -R nextjs:nodejs /etc/nginx/conf.d
RUN touch /var/run/nginx.pid
RUN chown -R nextjs:nodejs /var/run/nginx.pid

USER nextjs

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
