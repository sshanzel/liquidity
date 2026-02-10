# Requirements

- GraphQL endpoint containing:
  - User login (JWT issuance).
  - Start report generation.
  - Poll report status.
  - Retrieve report result once ready.
- Authentication and tenancy.
  - Use JWT for auth. Payload must include the `tenantId` for other purposes.
  - A user model must include `taxId` property.
- Tenancy: there will be 3 tenants.
  - Each will have its own physical DB: lqdty_t1, lqdty_t2, and lqdty_t3.
  - Switching of DB must be possible on runtime based on tenantId.
  - DB connections must be reused.
  - Config can be at: a single env variable containing a JSON tenant registry (e.g., TENANTS_CONFIG).
- Report generation:
  - When initialized, it should create a report id.
    - Must have userId, tenantId, startedAt, and finishedAt.
  - Then send out three separate requests to different servers.
    - Each will return an id and status (in_progress or completed).
    - Every 10 seconds, we will ask for the status.
    - Once all 3 is completed, then the report is ready.

# Packages/tech/library to use

- Validation: class-validator.
- Background events: pubsub.
- Data migration (CDC): Debezium.
- Worker/poller: Temporal (delayed runner).
- Database: PostgreSQL.

# High-level overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT                                         │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         GRAPHQL API (NestJS)                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Auth      │  │   Report    │  │   User      │  │   Tenant            │ │
│  │   Module    │  │   Module    │  │   Module    │  │   Module            │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
            ┌───────────┐   ┌───────────┐   ┌───────────┐
            │ Catalog   │   │ Tenant 1  │   │ Tenant 2  │   ... (N tenants)
            │ Database  │   │ Database  │   │ Database  │
            │           │   │           │   │           │
            │ - Tenant  │   │ - Report  │   │ - Report  │
            │ - User    │   │ - Content │   │ - Content │
            └───────────┘   └─────┬─────┘   └───────────┘
                                  │
                                  │ CDC (Debezium)
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            DEBEZIUM SERVER                                  │
│         Monitors: report_contents table (INSERT/UPDATE)                     │
└─────────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         GOOGLE CLOUD PUB/SUB                                │
│                         Topic: tenant-cdc                                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          CDC WORKER (NestJS)                                │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ ReportContentCdcHandler                                             │    │
│  │  - onInsert: Start Temporal workflow                                │    │
│  │  - onUpdate: Check if all sources completed → mark report finished  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              TEMPORAL                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ fetchReportContentWorkflow                                          │    │
│  │  1. Poll external source API                                        │    │
│  │  2. If in_progress → sleep 10s → retry                              │    │
│  │  3. If completed → update report_content status                     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
                        ┌─────────────────┐
                        │ External Source │
                        │ APIs (3 sources)│
                        └─────────────────┘
```

## Data Flow Summary

1. **Client** calls `startReport` mutation
2. **API** creates `report` + 3 `report_content` rows (one per source)
3. **Debezium** captures INSERT on `report_contents` → publishes to Pub/Sub
4. **CDC Worker** receives message → starts Temporal workflow for each source
5. **Temporal** polls external API until status is `completed`
6. **Temporal** updates `report_content.status` to `COMPLETED`
7. **Debezium** captures UPDATE → publishes to Pub/Sub
8. **CDC Worker** checks if all 3 sources completed → marks `report.finishedAt`
9. **Client** polls `reportStatus` query until complete

# Catalog (master) Database Structure

The primary database that will manage the authentication would called `cataglog`.

This DB will contain the following tables:

- Tenant
- User

## Tenant table

| Property    | Type | Remarks        |
| ----------- | ---- | -------------- |
| id          | uuid | auto-generated |
| name        | text | NOT NULL       |
| description | text | NULL           |

## User table

| Property | Type | Remarks        |
| -------- | ---- | -------------- |
| id       | uuid | auto-generated |
| tenantId | uuid | FK (tenant.id) |
| username | text | NOT NULL       |
| password | text | salted value   |
| taxId    | text | NOT NULL       |

# Tenant Database Structure

In this project, we will be running 3 separate DB instances. They will have the same structure either way.

# Report table

We will use this table to store persistent data whenever the user requests for a report.

| Property   | Type      | Remarks        |
| ---------- | --------- | -------------- |
| id         | uuid      | auto-generated |
| tenantId   | uuid      | NOT NULL       |
| userId     | uuid      | NOT NULL       |
| startedAt  | timestamp | Default: now() |
| finishedAt | timestamp | NULL           |

# Report Content table

A single report can contain multiple sources, we are going to store each source and whether the data is ready.

| Property  | Type      | Remarks                |
| --------- | --------- | ---------------------- |
| id        | uuid      | auto-generated         |
| reportId  | uuid      | FK (report.id)         |
| source    | text      | NOT NULL               |
| status    | enum      | in_progress, completed |
| data      | text      | NULL                   |
| createdAt | timestamp | Default: now()         |
| lastRunAt | timestamp | Default: now()         |

# GraphQL

We will introduce the following **mutations**:

- User registration
- User login
- Start report generation

Queries for retrieving data:

- Poll report status
- Retrieve report result

## Mutation User registration

Should require the following parameters:

- Tenant id
- Username
- Password
- Tax id

This will return an object containing the follow properties:

- User (user entity)
- Token

### Token

The generated token will be of JWT type, and the payload should include the tenant id, tax id, user id, and the username.

## Mutation Login

Should require the following parameters:

- Username
- Password

This will return an object containing the follow properties:

- User (user entity)
- Token (same kind of token from registration)

## Mutation Start Report Generation

When this is triggered, it should do the following:

- Create a report id and store it in the reports table.
  - The persistent data must include the user id and tenant id from the JWT payload.
  - Create rows in the `report_content` table depending on the number of sources we will need to generate the report itself.
    - For now, we will have a static array containing three elements: `['source_1', 'source_2', 'source_3']`
    - We will use these references to understand where to pull the data.
- Return the report id.

Note: more details about the whole flow after the queries.

## Query Report Status

This should require an id parameter so we can then check whether the report is still in progress or completed. The response will simply be an object with a single property called `status` with values `completed` or `in_progress`.

We must validate the requestor to have the same user id.

## Query Report

Should receive an id parameter, and return the full content if the user was the one that requested it.

# Full data flow

Create report → run 3 parallel tasks → once all 3 is completed → return the result through the query above.

## Start generating the report (CDC)

Once the report and its child rows are created, this will automatically trigger our CDC pipeline. We will monitor changes on the `report_content` table only (for now).

This way, our CDC config is lean, and does not unnecessarily fire background workers for all tables. When a row in the `report_content` is created, we will fire a Temporal workflow (more details below).

This means, if we have 3 data sources, this will trigger 3 temporal workflows that will then run in parallel, manages its own retries, catches any error without breaking all other runs.

## Fetch data from sources (Temporal)

We will introduce Temporal to run tasks. This is to fetch from our data source in parallel without waiting or any other similar requests of the same report id.

Once the fetch from the data source succeeds, we will update the relevant `report_content.id` with regards to `lastRunAt` and its status (whether it has changed or not).

This worker should receive an object `reportContent` which is basically a whole entity of the report content table.

## Completed fetching from data source (CDC)

We already have the CDC for `report_content` in place, but that was for insertions. This time, when a record gets updated, we will check if the status went from `in_progress` to `completed` - if so, we will pull the relevant `report_content` entities under the same report id then we will update the `report` entity’s `finishedAt` to `now()` value.

## Note on the CDC

Our CDC will run Debezium. Whenever a change is triggered, we will send a pubsub message, for then we will have a subscription that will run the checks we mentioned above. The CDC pipeline stays dumb and just fires a pubsub message. All the processing and triggering of the temporal workflow will happen on the subscription worker.
