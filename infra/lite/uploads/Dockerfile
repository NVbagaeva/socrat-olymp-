# Сервис загрузки фото решений части 2 (infra/lite/uploads).
# Образ собирает кнопка «Развернуть» на сервере: docker compose build.
FROM node:22-alpine
WORKDIR /srv
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force
COPY lib ./lib
COPY vendor ./vendor
COPY server.mjs retention.mjs ./
USER node
EXPOSE 8080
HEALTHCHECK --interval=10s --timeout=5s --retries=10 CMD wget -q -O /dev/null http://localhost:8080/health || exit 1
CMD ["node", "server.mjs"]
