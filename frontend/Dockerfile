# syntax=docker/dockerfile:1

# ---------- Etapa 1: build do Vite ----------
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Lido pelo Vite no build. "/api" = mesma origem; o nginx encaminha para o backend.
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ---------- Etapa 2: arquivos estáticos servidos pelo nginx ----------
FROM nginx:1.30-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
