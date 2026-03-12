# Rhythmiq

**Personal AI Daily Planner** — 帮助用户把目标 → 任务 → 日程全链路可视化，结合生活习惯生成每日可执行计划。

## Tech Stack

- **Go 1.21+**
- **Gin** — Web framework
- **GORM + SQLite** — ORM & database (MVP), abstractly switchable to PostgreSQL/MySQL
- **Viper** — Configuration
- **Zap** — Structured logging

## Project Structure

```
Rhythmiq/
├── cmd/server/main.go          # Entry point — wires all components
├── internal/
│   ├── config/                 # Viper config loading
│   ├── domain/                 # Pure domain models (User, Goal, Task, DailyPlan)
│   ├── repository/             # Repository interfaces + SQLite implementations
│   ├── service/                # Business logic (UserService, GoalService, TaskService, PlannerService)
│   ├── handler/                # Gin HTTP handlers + router
│   ├── middleware/             # Logger, Recovery
│   └── ai/                     # AI Planner interface + Mock implementation
├── pkg/
│   ├── database/               # DB init & GORM AutoMigrate
│   └── response/               # Unified API response format
└── configs/config.yaml         # Default configuration
```

## Quick Start

```bash
# Install dependencies (requires CGO for SQLite)
go mod tidy

# Run development server
make run

# Build binary
make build
./bin/rhythmiq
```

## Configuration

Edit `configs/config.yaml` or override via environment variables (dot → underscore):

| Key | Default | Description |
|-----|---------|-------------|
| `server.port` | `8080` | HTTP port |
| `server.mode` | `debug` | Gin mode: `debug` / `release` |
| `database.driver` | `sqlite` | Database driver |
| `database.dsn` | `./data/rhythmiq.db` | SQLite file path |
| `log.level` | `info` | Log level |
| `log.format` | `json` | `json` or `console` |
| `ai.provider` | `mock` | AI provider (`mock` for development) |

## API Reference

```
GET  /health

# Users
POST   /api/v1/users
GET    /api/v1/users/:id
PUT    /api/v1/users/:id
DELETE /api/v1/users/:id

# Goals  (u = user-scoped, avoids Gin wildcard conflicts)
GET    /api/v1/u/:userID/goals
POST   /api/v1/u/:userID/goals
GET    /api/v1/goals/:id
PUT    /api/v1/goals/:id
DELETE /api/v1/goals/:id

# Tasks
GET    /api/v1/u/:userID/tasks
POST   /api/v1/u/:userID/tasks
GET    /api/v1/tasks/:id
PUT    /api/v1/tasks/:id
DELETE /api/v1/tasks/:id

# Plans
POST   /api/v1/u/:userID/plans/generate   # AI generate daily plan
GET    /api/v1/u/:userID/plans/today       # Get today's plan
PUT    /api/v1/plans/:id/confirm           # Confirm a draft plan
```

## Extending the AI Planner

The `internal/ai.Planner` interface decouples the planning logic from any specific provider:

```go
type Planner interface {
    GenerateDailyPlan(ctx context.Context, req *PlanRequest) (*PlanResult, error)
}
```

To add a real AI backend (e.g. OpenAI), create `internal/ai/openai/openai_planner.go` implementing this interface and swap it in `cmd/server/main.go`.

## Switching the Database

1. Add a new case in `pkg/database/database.go` for the target driver.
2. Update `configs/config.yaml` → `database.driver` and `database.dsn`.
3. Run `make build`. No other code changes needed.

## Development

```bash
make test        # Run all tests
make test-cover  # Generate coverage report
make tidy        # go mod tidy
make lint        # Run golangci-lint
make clean       # Remove build artifacts and local data
```
