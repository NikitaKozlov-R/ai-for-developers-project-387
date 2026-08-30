# syntax=docker/dockerfile:1

FROM node:22-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Бэкенду не нужны зависимости в рантайме: Node исполняет .ts напрямую, package.json без "dependencies".
FROM node:22-alpine
WORKDIR /app
COPY backend/src ./src
COPY --from=frontend-build /app/frontend/dist ./public
USER node

EXPOSE 3000
CMD ["node", "src/server.ts"]
