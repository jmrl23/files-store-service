FROM node:lts-slim AS builder
WORKDIR /app

COPY ./package.json ./tsconfig.json ./yarn.lock ./
COPY ./src ./src
COPY ./prisma ./prisma

RUN yarn install
RUN apt-get update -y && apt-get install -y openssl
RUN npx prisma generate
RUN npx tsc --build

FROM node:lts-slim
WORKDIR /app

COPY --from=builder /app/build ./build
COPY ./public ./public
COPY ./prisma ./prisma
COPY ./local_uploads ./local_uploads
COPY ./package.json ./yarn.lock ./
COPY ./www ./www

RUN yarn install --production --frozen-lockfile
RUN chmod +x ./www

ENTRYPOINT [ "./www" ]

CMD [ "." ]