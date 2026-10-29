FROM oven/bun:1-alpine

WORKDIR /app
COPY package.json bun.lock ./
RUN bun i --frozen-lockfile --production

COPY src/ ./src
CMD ["bun", "start"]