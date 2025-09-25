# Files Store Service

File management system API built with [fastify](https://fastify.dev/)

## Prerequisites

- [redis](https://redis.io/)
- [postgres](https://www.postgresql.org/)

## Installation

```sh
yarn # or npm install
```

## Getting started

1. Update environment variables `(DATABASE_URL, REDIS_URL, STORE_SERVICE)` based on your setup
1. Run `npx prisma db push`
1. Run start script

## Note

- Default `STORE_SERVICE` is `local`
- For local store, you can specify a different uploads folder by supplying `LOCAL_DIR_PATH` an absolute path
- You may add your custom store by implementing a file at [store folder](./src/modules/fileStore/stores/) and registering it at [fileStoreFactory](./src/modules/fileStore/fileStoreFactory.ts)

## Scripts

| Script     | Description                                 |
| ---------- | ------------------------------------------- |
| build      | build project                               |
| test       | run test files                              |
| start      | start (must build first)                    |
| start:dev  | start on development mode (nodemon + swc)   |
| start:prod | start on production mode (must build first) |
| format     | format codes (prettier)                     |
| lint       | lint codes (eslint)                         |

## Frontend/ Client

- Located at [client folder](../frontend/)
- Client is totally optional
- It is just a vite react application, you just have to build it and the server will statically serve its dist

## Extras

- [fastify template](https://github.com/jmrl23/fastify-template)
