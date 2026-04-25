FROM node:20-alpine

ARG APP_DIR

ENV NODE_ENV=development
WORKDIR /repo

COPY package.json package-lock.json ./
COPY apps ./apps
COPY packages ./packages

RUN npm ci --omit=dev --ignore-scripts --no-audit --no-fund

WORKDIR /repo/${APP_DIR}

EXPOSE 3000
CMD ["npm", "start"]