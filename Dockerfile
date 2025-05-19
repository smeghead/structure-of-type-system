FROM denoland/deno:2.3.1

WORKDIR /app

RUN apt update && apt install bash less vim -y

RUN deno upgrade

COPY deps.ts .
RUN deno install --entrypoint deps.ts

