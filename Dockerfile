# syntax=docker/dockerfile:1

FROM node:24-slim AS build
RUN corepack enable
WORKDIR /app
ENV PNPM_HOME=/pnpm
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# Cache mount: the registry can be slow, and a rebuild should not re-download 700 packages.
RUN --mount=type=cache,target=/pnpm/store pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM node:24-slim AS runtime
ARG TARGETARCH
# yt-dlp as the standalone binary: no python3 in the image, and one file to swap
# when YouTube changes and you need a newer build.
RUN apt-get update \
 && apt-get install -y --no-install-recommends ffmpeg ca-certificates curl \
 && case "$TARGETARCH" in \
      amd64) YTDLP=yt-dlp_linux ;; \
      arm64) YTDLP=yt-dlp_linux_aarch64 ;; \
      *) echo "unsupported arch: $TARGETARCH" >&2; exit 1 ;; \
    esac \
 && curl -fsSL "https://github.com/yt-dlp/yt-dlp/releases/latest/download/$YTDLP" \
      -o /usr/local/bin/yt-dlp \
 && chmod +x /usr/local/bin/yt-dlp \
 && apt-get purge -y curl && apt-get autoremove -y && rm -rf /var/lib/apt/lists/*

RUN corepack enable
WORKDIR /app
ENV NODE_ENV=production
# ponytail: full node_modules, not `next build --standalone`. basicPitch.ts locates
# the model at <cwd>/node_modules/@spotify/basic-pitch/model; standalone output
# prunes that. Costs image size, saves a code path that can silently break.
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/package.json /app/next.config.ts ./
EXPOSE 3000
CMD ["pnpm", "start"]
