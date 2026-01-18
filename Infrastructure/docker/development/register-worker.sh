set -euo pipefail

WORKER_HOSTNAME=$(hostname)

echo "Waiting for local PostgreSQL to start on ${WORKER_HOSTNAME}..."

# Wait for PostgreSQL to start on THIS worker
until pg_isready -h localhost -p 5432 -U postgres -t 3; do
  echo "PostgreSQL not ready on ${WORKER_HOSTNAME} → sleeping 2 seconds..."
  sleep 2
done

echo "PostgreSQL is ready on ${WORKER_HOSTNAME}!"

echo "Registering worker: ${WORKER_HOSTNAME} with coordinator..."

# Check if worker is already registered
WORKER_EXISTS=$(psql -h coordinator -U postgres -d citus_dev -t -c "
  SELECT COUNT(*) FROM pg_dist_node 
  WHERE nodename = '${WORKER_HOSTNAME}' AND nodeport = 5432;
" | xargs)

if [ "$WORKER_EXISTS" -eq "0" ]; then
  # Worker not registered, add it
  psql -h coordinator -U postgres -d citus_dev -v ON_ERROR_STOP=1 -c "
    SELECT master_add_node('${WORKER_HOSTNAME}', 5432);
  "
  echo "Worker ${WORKER_HOSTNAME} successfully registered!"
else
  echo "Worker ${WORKER_HOSTNAME} already registered, skipping..."
fi