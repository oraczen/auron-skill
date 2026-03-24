---
name: entity-record
description: Guide for managing entity records (data rows) within entities on the Auron platform
---

Important: Please read `auron-docs`, `auron-ai-api`, and `entity` skills before working with entity records. You need an entityId and must know the entity's column schema (column IDs and data types).

# Entity Records

An entity record is a data row within an entity. Each record contains a `values` array where each value maps to an entity column by its column ID. The value's `dataType` must match the column's `dataType` exactly — the server validates this.

## Workflow

Always follow this sequence when creating or updating records:

1. **Fetch columns** — call `GET /entities/columns/list` with the entityId to get column IDs, data types, and required flags
2. **Construct values array** — build the values matching each column's type
3. **Create or update the record**

Never create or update records without first fetching the column schema.

## Value Types / Data Types

Each value in the `values` array has this structure:

```json
{
  "entityColumnId": "<column_id>",
  "value": { "dataType": "<TYPE>", "value": <typed_value> }
}
```

### TEXT, EMAIL, URL

```json
{
  "entityColumnId": "abc123",
  "value": { "dataType": "TEXT", "value": "John Doe" }
}
```

EMAIL validates email format. URL validates URL format. Use the matching `dataType` for each.

### NUMBER

```json
{
  "entityColumnId": "abc123",
  "value": { "dataType": "NUMBER", "value": 42 }
}
```

### BOOLEAN

```json
{
  "entityColumnId": "abc123",
  "value": { "dataType": "BOOLEAN", "value": true }
}
```

### SELECT

```json
{
  "entityColumnId": "abc123",
  "value": { "dataType": "SELECT", "value": "option1" }
}
```

The value must be one of the allowed values defined on the column.

### MULTI_SELECT

```json
{
  "entityColumnId": "abc123",
  "value": { "dataType": "MULTI_SELECT", "value": ["tag1", "tag2"] }
}
```

All values must be from the allowed values list defined on the column.

## API Endpoints

All endpoints are under the base path `/entities`. Refer to the OpenAPI spec for full request/response schemas.

### Record CRUD

| Method | Path                             | Description                                       |
| ------ | -------------------------------- | ------------------------------------------------- |
| POST   | `/entities/records/create`       | Create a new record with values                   |
| PUT    | `/entities/records/update`       | Update record values (send full values array)     |
| POST   | `/entities/records/list`         | List records with pagination, search, and filters |
| DELETE | `/entities/records/delete`       | Delete a record                                   |
| GET    | `/entities/records/display-info` | Get entity name and record display name           |

### Pagination

Record listing uses cursor-based pagination:

- `cursor`: ISO datetime string (the `createdAt` of the last record in the current page)
- `limit`: `10`, `25`, `50`, or `100` (default `10`)
- Response includes `nextCursor` — `null` when there are no more pages

Optional filters: `createdBy.is` and `createdBy.isNot` accept arrays of user IDs. Use the `q` parameter for text search across record values.

### CSV Bulk Import

For importing many records at once, follow this 4-step async flow:

1. **Get upload URL** — `POST /entities/records/csv/upload-url` with entityId and organizationId. Returns `{ url, key }`.
2. **Upload CSV** — PUT the CSV file content to the returned S3 `url`.
3. **Trigger import** — `POST /entities/records/csv/import` with the `key` from step 1. Returns `{ jobId }`.
4. **Poll status** — `GET /entities/records/csv/status` with the `jobId`. Status transitions: `enqueued` → `processing` → `completed` or `failed`.

CSV column headers should match entity column names. Always explain this multi-step flow to the user and confirm before each step.

### Labels

| Method | Path                              | Description                  |
| ------ | --------------------------------- | ---------------------------- |
| POST   | `/entities/records/labels/attach` | Attach a label to a record   |
| POST   | `/entities/records/labels/detach` | Detach a label from a record |

### User Access Control

| Method | Path                               | Description                                                          |
| ------ | ---------------------------------- | -------------------------------------------------------------------- |
| POST   | `/entities/records/viewers/add`    | Grant viewer access to records (batch: array of record IDs + userId) |
| POST   | `/entities/records/viewers/remove` | Remove viewer access from records                                    |
| GET    | `/entities/records/access/users`   | List users with access to a record                                   |
| GET    | `/entities/records/for-user`       | Get all records for a specific user within an entity                 |

### Team Access Control

| Method | Path                             | Description                                                                   |
| ------ | -------------------------------- | ----------------------------------------------------------------------------- |
| POST   | `/entities/records/teams/add`    | Grant team access to records (batch: array of record IDs + array of team IDs) |
| POST   | `/entities/records/teams/remove` | Remove team access from records                                               |
| GET    | `/entities/records/access/teams` | List teams with access to a record                                            |
| GET    | `/entities/records/for-team`     | Get all records for a specific team within an entity                          |

## Rules

Always fetch columns before creating or updating records. You need column IDs and data types to construct valid payloads.

The `dataType` in each value object must exactly match the column's `dataType`. Mismatches will be rejected by the server.

Required columns must have values when creating records. Check the `isRequired` flag on each column.

When updating a record, send the complete `values` array — not a partial update. Omitted values will be cleared.

Always get user approval before executing any mutation (create, update, delete).

Before adding records, list existing records to understand the data structure and avoid duplicates.

For SELECT and MULTI_SELECT columns, the provided values must exist in the column's allowed `values` list. Fetch columns first to see what options are available.

For CSV import, always walk the user through the multi-step process and confirm at each stage. Explain that import is asynchronous and may take time for large files.

Always fetch the OpenAPI spec for full request/response schema details when constructing API calls.
