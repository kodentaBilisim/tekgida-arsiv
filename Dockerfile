# Multi-stage Dockerfile for monorepo deployment
# Build argument APP_TYPE determines which app to deploy (backend or frontend)

ARG APP_TYPE=backend

# ============================================
# BACKEND BUILD
# ============================================
FROM node:18-alpine AS backend-build

WORKDIR /app

# Copy backend files
COPY backend/package*.json ./
RUN npm install --production

COPY backend/ ./

# Copy shared files
COPY import-all.js ./
COPY subjects-with-folders.json ./
COPY init-db/ ./init-db/

# ============================================
# FRONTEND BUILD
# ============================================
FROM nginx:alpine AS frontend-build

# Copy frontend files
COPY frontend/ /usr/share/nginx/html/

# Copy nginx config
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# ============================================
# FINAL STAGE - Select based on APP_TYPE
# ============================================
FROM backend-build AS backend-final

WORKDIR /app

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
    CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "src/app.js"]

# ============================================
FROM frontend-build AS frontend-final

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

# ============================================
# Select final stage based on APP_TYPE
# ============================================
FROM ${APP_TYPE}-final AS final
