FROM python:3.11-slim
WORKDIR /app

# Install postgresql-client for pg_isready
RUN apt-get update && apt-get install -y postgresql-client && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .

# Make the startup script executable
RUN chmod +x start.sh

CMD ["./start.sh"]