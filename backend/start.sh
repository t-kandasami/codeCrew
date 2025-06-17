#!/bin/bash

# Wait for database to be ready
echo "Waiting for database to be ready..."
while ! pg_isready -h db -p 5432 -U postgres -d codecrew; do
  echo "Database not ready, waiting..."
  sleep 2
done

echo "Database is ready! Starting application..."

# Start the application
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 