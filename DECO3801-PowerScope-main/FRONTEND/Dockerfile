FROM node:20-alpine AS build
WORKDIR /src
COPY FRONTEND/package.json ./
COPY FRONTEND/package-lock.json ./
RUN npm ci

COPY FRONTEND/ ./
RUN npm run build


FROM alpine:3.19
WORKDIR /tmp
COPY --from=build /src/dist /tmp/app_build

