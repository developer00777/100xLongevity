# 100X Longevity — web build of the app + Ask API, running on the Cloudflare Workers runtime (workerd).
# The same Worker and dist/ are what `wrangler deploy` ships to Cloudflare.

# 1. Export the Expo app for web -> /app/dist
FROM node:24-bookworm-slim AS web
ENV EXPO_NO_TELEMETRY=1 CI=1
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY app.json tsconfig.json ./
COPY assets ./assets
COPY src ./src
RUN npx expo export -p web

# 2. Serve dist/ and /api/* with wrangler dev (local Workers runtime + local D1)
FROM node:24-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*
ENV WRANGLER_SEND_METRICS=false \
    CLOUDFLARE_INCLUDE_PROCESS_ENV=true \
    CI=1
WORKDIR /app/server/ask-worker
COPY server/ask-worker/package.json server/ask-worker/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY server/ask-worker/wrangler.toml ./
COPY server/ask-worker/src ./src
COPY server/ask-worker/migrations ./migrations
COPY --from=web /app/dist /app/dist
# .wrangler/ holds the local D1 database; docker-compose mounts a volume here so accounts survive restarts.
RUN mkdir -p .wrangler && chown -R node:node /app
USER node
EXPOSE 8787
CMD ["sh", "-c", "npx wrangler d1 migrations apply longevity100x --local && exec npx wrangler dev --ip 0.0.0.0 --port 8787 --show-interactive-dev-session=false"]
