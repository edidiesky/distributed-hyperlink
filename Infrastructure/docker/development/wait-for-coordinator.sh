#!/bin/bash
set -euo pipefail

echo "Waiting for coordinator to accept connections..."

until pg_isready -h coordinator -p 5432 -U postgres -d citus_dev -t 3; do
  echo "Coordinator not ready yet → sleeping 3 seconds..."
  sleep 3
done

echo "Coordinator is ready!"