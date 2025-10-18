FROM node:lts-slim AS deps
WORKDIR /app

COPY ./package.json ./tsconfig.json ./yarn.lock ./

RUN yarn install --production --immutable

FROM node:lts-slim AS builder
WORKDIR /app

COPY --from=deps /app/package.json /app/tsconfig.json /app/yarn.lock ./

COPY ./src ./src
COPY ./prisma ./prisma

RUN yarn install
RUN npx prisma generate --schema=./prisma/schema.prisma
RUN yarn run build

FROM node:lts-slim
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl

COPY --from=deps /app/node_modules ./node_modules

COPY --from=builder /app/build ./build

COPY ./local_uploads/.gitkeep ./local_uploads/.gitkeep
COPY ./prisma ./prisma
COPY ./public ./public
COPY ./package.json /app/package.json

RUN npx prisma generate --schema=./prisma/schema.prisma

CMD ["sh", "-c", "npx prisma migrate deploy && node -r ./build/init.js build/main.js"]

