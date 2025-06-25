#!/bin/bash

# MySQL Database Initialization Script
# This script drops and recreates the database with schema and test data

set -e  # Exit on error

# Database configuration
DB_HOST="127.0.0.1"
DB_PORT="3306"
DB_NAME="rdb"
DB_USER="user"
DB_PASSWORD="password"
ROOT_PASSWORD="password"

# File paths
SCHEMA_FILE="database/schema.sql"
FIXTURES_FILE="${DB_FIXTURES_FILE:-api/fixtures/posts.sql}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔄 Starting database initialization...${NC}"

# Check if MySQL container is running
if ! docker compose ps mysql | grep -q "Up"; then
    echo -e "${YELLOW}⚠️  MySQL container is not running. Starting MySQL...${NC}"
    docker compose up -d mysql
    echo -e "${BLUE}⏳ Waiting for MySQL to be ready...${NC}"
    sleep 10
else
    echo -e "${GREEN}✅ MySQL container is already running${NC}"
fi

# Wait for MySQL to be ready
echo -e "${BLUE}🔍 Checking MySQL connection...${NC}"
max_attempts=30
attempt=1

while [ $attempt -le $max_attempts ]; do
    if mysql -h${DB_HOST} -P${DB_PORT} -u${DB_USER} -p${DB_PASSWORD} -e "SELECT 1;" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ MySQL is ready!${NC}"
        break
    fi
    echo -e "${YELLOW}⏳ Attempt ${attempt}/${max_attempts}: Waiting for MySQL...${NC}"
    sleep 2
    ((attempt++))
done

if [ $attempt -gt $max_attempts ]; then
    echo -e "${RED}❌ Failed to connect to MySQL after ${max_attempts} attempts${NC}"
    exit 1
fi

# Drop and recreate database
echo -e "${BLUE}🗑️  Dropping existing database...${NC}"
mysql -h${DB_HOST} -P${DB_PORT} -uroot -p${ROOT_PASSWORD} -e "DROP DATABASE IF EXISTS ${DB_NAME};"

echo -e "${BLUE}🆕 Creating new database...${NC}"
mysql -h${DB_HOST} -P${DB_PORT} -uroot -p${ROOT_PASSWORD} -e "CREATE DATABASE ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Apply schema
echo -e "${BLUE}📋 Applying database schema...${NC}"
if [ ! -f "$SCHEMA_FILE" ]; then
    echo -e "${RED}❌ Schema file not found: $SCHEMA_FILE${NC}"
    exit 1
fi
mysql -h${DB_HOST} -P${DB_PORT} -u${DB_USER} -p${DB_PASSWORD} ${DB_NAME} < ${SCHEMA_FILE}
echo -e "${GREEN}✅ Schema applied successfully${NC}"

# Load fixtures
echo -e "${BLUE}📊 Loading test fixtures...${NC}"
if [ ! -f "$FIXTURES_FILE" ]; then
    echo -e "${RED}❌ Fixtures file not found: $FIXTURES_FILE${NC}"
    exit 1
fi
mysql -h${DB_HOST} -P${DB_PORT} -u${DB_USER} -p${DB_PASSWORD} ${DB_NAME} < ${FIXTURES_FILE}
echo -e "${GREEN}✅ Test fixtures loaded successfully${NC}"

# Verify data
echo -e "${BLUE}🔍 Verifying data...${NC}"
count=$(mysql -h${DB_HOST} -P${DB_PORT} -u${DB_USER} -p${DB_PASSWORD} ${DB_NAME} -se "SELECT COUNT(*) FROM posts;")
echo -e "${GREEN}✅ Database initialized successfully with ${count} posts${NC}"

echo -e "${GREEN}🎉 Database initialization completed!${NC}"
echo -e "${BLUE}📝 You can now run the application or tests${NC}"