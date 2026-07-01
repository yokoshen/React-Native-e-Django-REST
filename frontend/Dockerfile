FROM node:20-bookworm-slim

ENV CI=1 \
    EXPO_NO_TELEMETRY=1

WORKDIR /app

# Install dependencies first for better layer caching.
COPY package.json package-lock.json ./
RUN npm ci

# Copy the rest of the app.
COPY . .

# Executa como usuário não-privilegiado (o node:20 já traz o usuário "node").
RUN chown -R node:node /app
USER node

# Expo Web dev server (Metro) + DevTools ports.
EXPOSE 8081 19000 19006

# --host lan makes Metro bind to 0.0.0.0 so it is reachable from the host.
CMD ["npx", "expo", "start", "--web", "--port", "8081", "--host", "lan"]
