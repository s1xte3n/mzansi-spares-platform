FROM node:20-alpine

ARG APP_DIR
ENV NODE_ENV=development

WORKDIR /app

COPY ${APP_DIR}/package.json ./package.json
RUN npm install --omit=dev

COPY ${APP_DIR}/src ./src

EXPOSE 3000
CMD ["npm", "start"]
