BINARY   := rhythmiq
CMD      := ./cmd/server
BUILD_DIR := ./bin

.PHONY: all build run test clean tidy lint fe-dev fe-build fe-install

all: build

build:
	@mkdir -p $(BUILD_DIR)
	CGO_ENABLED=1 go build -ldflags="-s -w" -o $(BUILD_DIR)/$(BINARY) $(CMD)
	@echo "Built $(BUILD_DIR)/$(BINARY)"

run:
	CGO_ENABLED=1 go run $(CMD)

test:
	go test ./... -v -count=1

test-cover:
	go test ./... -coverprofile=coverage.out
	go tool cover -html=coverage.out -o coverage.html

tidy:
	go mod tidy

lint:
	@command -v golangci-lint >/dev/null 2>&1 || { echo "golangci-lint not installed. Run: go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest"; exit 1; }
	golangci-lint run ./...

fe-install:
	cd web && npm install

fe-dev:
	cd web && npm run dev

fe-build:
	cd web && npm run build

clean:
	rm -rf $(BUILD_DIR) data/ coverage.out coverage.html web/dist
