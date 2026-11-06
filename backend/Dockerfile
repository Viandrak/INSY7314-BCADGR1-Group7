# HustleHub+ API: small Node.js Alpine image that runs as a non-root user
FROM node:22-alpine

ENV NODE_ENV=production
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --chown=node:node . .

# Never run the API as root
USER node

EXPOSE 5000
CMD ["node", "server.js"]