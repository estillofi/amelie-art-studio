FROM node:24-bookworm-slim
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3000 DATA_DIR=/data
WORKDIR /app
COPY --chown=node:node package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts --no-audit --no-fund && mkdir -p /data && chown node:node /data
COPY --chown=node:node server.js ./
COPY --chown=node:node server ./server
COPY --chown=node:node scripts ./scripts
COPY --chown=node:node data ./data
COPY --chown=node:node js ./js
COPY --chown=node:node css ./css
COPY --chown=node:node icons ./icons
COPY --chown=node:node assets ./assets
COPY --chown=node:node index.html manifest.webmanifest ./
EXPOSE 3000
CMD ["node", "server.js"]
