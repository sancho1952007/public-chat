FROM oven/bun:1-alpine@sha256:4cf82f5686b196504fe119db3fcd9185b191f82ece82c40680e597228ec6070a

WORKDIR /app
COPY bunfig.toml ./
COPY package.json bun.lock ./
RUN bun i --frozen-lockfile --production

COPY src/ ./src

USER bun
CMD ["bun", "start"]
