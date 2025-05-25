PHONY: start
start:
	go run ./api/internal/cmd

PHONY: gen-oapi
gen-oapi:
	go tool oapi-codegen -generate gin -o ./api/openapi/api.go ./api/schema/openapi.yaml
