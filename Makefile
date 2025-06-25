PHONY: start
start:
	go run ./api/internal/cmd

PHONY: gen-oapi
gen-oapi:
	go tool oapi-codegen -generate types,gin -o ./api/internal/openapi/api.go ./api/schema/openapi.yaml

# Database management commands
PHONY: db-init
db-init:
	@echo "🔄 Initializing database with test fixtures..."
	@./scripts/init-db.sh

PHONY: db-init-sample
db-init-sample:
	@echo "🔄 Initializing database with sample data..."
	@DB_FIXTURES_FILE=api/fixtures/sample_posts.sql ./scripts/init-db.sh

PHONY: db-reset
db-reset: db-init
	@echo "✅ Database reset completed"

PHONY: db-sample
db-sample: db-init-sample
	@echo "✅ Database initialized with sample data"

PHONY: mysql-cli
mysql-cli:
	@echo "🔗 Connecting to MySQL..."
	@mysql -h127.0.0.1 -P3306 -uuser -ppassword rdb

PHONY: mysql-root
mysql-root:
	@echo "🔗 Connecting to MySQL as root..."
	@mysql -h127.0.0.1 -P3306 -uroot -ppassword

# Development workflow commands
PHONY: dev-setup
dev-setup:
	@echo "🚀 Setting up development environment..."
	@docker compose up -d mysql
	@sleep 5
	@make db-sample
	@echo "✅ Development environment ready!"

PHONY: test-setup
test-setup:
	@echo "🧪 Setting up test environment..."
	@docker compose up -d mysql
	@sleep 5
	@make db-init
	@echo "✅ Test environment ready!"
