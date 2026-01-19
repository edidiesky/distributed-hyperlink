# From project root
docker compose -f infrastructure/docker/development/docker-compose.dev.yml down
docker compose -f infrastructure/docker/development/docker-compose.dev.yml up -d --build