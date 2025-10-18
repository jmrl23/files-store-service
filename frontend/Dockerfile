FROM node:lts-slim AS deps
WORKDIR /app
ENV VITE_IN_DOCKER=1

COPY . .

RUN yarn install --immutable
RUN yarn run build

CMD [ "yarn", "run", "preview", "--host", "0.0.0.0", "--port", "3000" ]