# syntax=docker/dockerfile:1
FROM node:20-alpine AS builder
WORKDIR /app/backend
RUN apk add --no-cache python3 make g++ linux-headers
COPY backend/package*.json ./
RUN npm ci --omit=dev
COPY backend/ ./

FROM node:20-alpine AS runtime
WORKDIR /app
RUN apk add --no-cache ffmpeg tini
COPY --from=builder /app/backend ./backend
COPY web ./web
RUN addgroup -S cmep && adduser -S cmep -G cmep \
  && mkdir -p /app/runtime /app/recordings \
  && chown -R cmep:cmep /app
USER cmep
ENV NODE_ENV=production
ENV SIGNALING_HOST=0.0.0.0
ENV SIGNALING_PORT=8504
EXPOSE 8504
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:8504/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
ENTRYPOINT ["/sbin/tini","--"]
CMD ["node","backend/src/index.js"]
