# Liquidity

Multi-tenant report generation system with event-driven architecture.

## Tech Stack

- **API**: NestJS, GraphQL (Apollo), TypeORM
- **Database**: PostgreSQL (1 catalog + 3 tenant databases)
- **CDC**: Debezium Server
- **Messaging**: Google Cloud Pub/Sub (emulator for local)
- **Workflows**: Temporal

## Prerequisites

- [nvm](https://github.com/nvm-sh/nvm) (recommended)
- pnpm
- Docker & Docker Compose

## Getting Started

### 1. Set Up Node.js

```bash
nvm install
nvm use
```

### 2. Start Infrastructure

```bash
docker compose up -d
```

This starts:
- PostgreSQL (port 5432)
- Pub/Sub emulator (port 8085)
- Debezium instances (3x, one per tenant)
- Temporal server (port 7233)
- Temporal UI (port 8088)

### 3. Install Dependencies

```bash
pnpm install
```

### 4. Set Up Environment

```bash
cp .env.example packages/api/.env
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

### 7. Start the API

```bash
pnpm --filter api dev
```

## Services

| Service | URL |
|---------|-----|
| GraphQL Playground | http://localhost:3000/graphql |
| Temporal UI | http://localhost:8088 |

## GraphQL Examples

### Register User

```graphql
mutation {
  register(input: {
    tenantId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
    username: "testuser"
    password: "password123"
    taxId: "123-45-6789"
  }) {
    user { id username }
  }
}
```

### Login

```graphql
mutation {
  login(input: {
    username: "testuser"
    password: "password123"
  }) {
    user { id username }
  }
}
```

### Start Report

```graphql
mutation {
  startReport {
    id
    status
  }
}
```

### Check Report Status

```graphql
query {
  reportStatus(id: "report-uuid") {
    status
  }
}
```

## Architecture

See [PLAN.md](./PLAN.md) for detailed architecture and data flow diagrams.
