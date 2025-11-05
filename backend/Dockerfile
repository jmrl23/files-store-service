FROM node:lts-slim AS builder
WORKDIR /app

COPY ./package.json ./tsconfig.json drizzle.config.ts ./yarn.lock ./
COPY ./src ./src
COPY ./drizzle ./drizzle

RUN yarn install
RUN npx tsc --build

FROM node:lts-slim
WORKDIR /app

COPY --from=builder /app/build ./build
COPY ./public ./public
COPY ./local_uploads ./local_uploads
COPY ./package.json ./yarn.lock drizzle.config.ts ./
COPY ./www ./www

RUN yarn install --production --frozen-lockfile
RUN chmod +x ./www

ENTRYPOINT [ "./www" ]

CMD [ "." ]