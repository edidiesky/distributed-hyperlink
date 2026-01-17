# From project root
docker compose -f infra/docker/development/docker-compose.dev.yml down
docker compose -f infra/docker/development/docker-compose.dev.yml up -d --build