# Liquidity

Multi-tenant report generation system with event-driven architecture.

## Tech Stack

- **API**: NestJS, GraphQL (Apollo), TypeORM
- **Database**: PostgreSQL (1 catalog + 3 tenant databases)
- **CDC**: Debezium Server
- **Messaging**: Google Cloud Pub/Sub (emulator for local)
- **Workflows**: Temporal

## Prerequisites

- [nvm](https://github.com/nvm-sh/nvm#installing-and-updating) - Node version manager
- [pnpm](https://pnpm.io/installation) - Package manager
- [Docker](https://docs.docker.com/get-docker/) - Container runtime

## Getting Started

### 1. Set Up Node.js

```bash
nvm install
nvm use
```

### 2. Start Core Infrastructure

```bash
docker compose up -d postgres pubsub temporal temporal-ui
```

### 3. Install Dependencies

```bash
pnpm install
```

### 4. Set Up Environment

```bash
cp packages/api/.env.example packages/api/.env
```

### 5. Run Migrations

```bash
pnpm --filter api migration:catalog:run
pnpm --filter api migration:tenant:run:all
```

### 6. Seed Data

```bash
pnpm --filter api seed:tenants
```

### 7. Start Debezium (CDC)

```bash
docker compose up -d debezium-t1 debezium-t2 debezium-t3
```

### 8. Start the API

```bash
pnpm --filter api dev
```

## Services

| Service            | URL                           | Port |
| ------------------ | ----------------------------- | ---- |
| GraphQL Playground | http://localhost:4000/graphql | 4000 |
| Temporal UI        | http://localhost:8088         | 8088 |
| PostgreSQL         | -                             | 5432 |
| Pub/Sub Emulator   | -                             | 8085 |
| Temporal Server    | -                             | 7233 |

## GraphQL Examples

### Seeded Test Data

**Tenants:**

| Tenant ID                              | Database |
| -------------------------------------- | -------- |
| `a1b2c3d4-e5f6-7890-abcd-ef1234567890` | lqdty_t1 |
| `b2c3d4e5-f6a7-8901-bcde-f12345678901` | lqdty_t2 |
| `c3d4e5f6-a7b8-9012-cdef-123456789012` | lqdty_t3 |

**Users:**

| Username | Password      | Tenant   |
| -------- | ------------- | -------- |
| `user1`  | `password123` | lqdty_t1 |
| `user2`  | `password123` | lqdty_t2 |
| `user3`  | `password123` | lqdty_t3 |

### Register User

```graphql
mutation {
  register(
    input: {
      tenantId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
      username: "testuser"
      password: "password123"
      taxId: "123-45-6789"
    }
  ) {
    id
    username
    taxId
  }
}
```

### Login

```graphql
mutation {
  login(input: {username: "user1", password: "password123"}) {
    id
    username
    taxId
  }
}
```

### Start Report

```graphql
mutation {
  startReport {
    id
    startedAt
    contents {
      id
      source
      status
    }
  }
}
```

### Check Report Status

```graphql
query {
  reportStatus(id: "report-uuid") {
    id
    status
  }
}
```

### Get Report Result

```graphql
query {
  report(id: "report-uuid") {
    id
    startedAt
    finishedAt
    contents {
      id
      source
      status
      data
    }
  }
}
```

## Architecture

See [PLAN.md](./PLAN.md) for detailed architecture and data flow diagrams.

### Multi-Tenant Database Switching

Each tenant has its own physical PostgreSQL database (lqdty_t1, lqdty_t2, lqdty_t3). The system switches databases at runtime based on the `tenantId` from the JWT token.

**How it works:**

1. User authenticates → JWT issued with `tenantId` in payload
2. On each request, `@CurrentUser()` decorator extracts `tenantId` from JWT
3. `TenantConnectionManager` maintains a connection pool (`Map<tenantId, DataSource>`)
4. When a service needs DB access, it calls `getConnection(tenantId)`:
   - If connection exists and is initialized → reuse it
   - Otherwise → create new connection from `TENANCY_CONFIG` and cache it
5. All queries execute against the tenant-specific database

**Configuration:**

Tenant databases are configured via the `TENANCY_CONFIG` environment variable (JSON):

```json
{
  "tenant": {
    "tenant-uuid-1": {"host": "localhost", "port": 5432, "database": "lqdty_t1", ...},
    "tenant-uuid-2": {"host": "localhost", "port": 5432, "database": "lqdty_t2", ...}
  }
}
```

### Long-Running Report Orchestration

Report generation involves calling 3 slow external APIs. To avoid holding HTTP connections open for minutes, we use an event-driven architecture:

**Flow:**

1. **Client** calls `startReport` mutation → returns immediately with `reportId`
2. **API** creates `report` + 3 `report_content` rows (one per source)
3. **Debezium** (CDC) captures INSERT on `report_contents` → publishes to Pub/Sub
4. **CDC Worker** receives message → starts a Temporal workflow for each source
5. **Temporal Workflow** polls external API every 10 seconds until `completed`
6. **Temporal** updates `report_content.status` to COMPLETED
7. **Debezium** captures UPDATE → publishes to Pub/Sub
8. **CDC Worker** checks if all 3 sources completed → sets `report.finishedAt`
9. **Client** polls `reportStatus` query until status is COMPLETED

**Benefits:**

- No long-held HTTP connections
- Parallel execution of 3 provider calls
- Automatic retries via Temporal
- Full visibility in Temporal UI (localhost:8088)
