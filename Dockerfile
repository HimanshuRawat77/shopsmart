FROM node:18-slim AS deps

WORKDIR /usr/src/app

COPY app/package*.json ./
RUN npm install --omit=dev


FROM node:18-slim AS runner

WORKDIR /usr/src/app

RUN useradd --create-home --shell /usr/sbin/nologin appuser

COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY app/ .

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:3000', (res) => process.exit(res.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

USER appuser

CMD ["npm", "start"]
