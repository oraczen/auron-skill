---
name: entity-record
description: Guide for managing entity records (data rows) within entities on the Auron platform
---

Important: Please read `auron-docs`, `auron-ai-api`, and `entity` skills before working with entity records. You need an entityId and must know the entity's column schema (column IDs and data types).

# Entity Records

An entity record is a data row within an entity. Each record contains a `values` array where each value maps to an entity column by its column ID. The value's `dataType` must match the column's `dataType` exactly - the server validates this.

## Workflow

Always follow this sequence when creating or updating records:

1. **Fetch columns**: call list entities endpoint with the entityId to get column IDs, data types, and required flags
2. **Construct values array**: build the values matching each column's type
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

## Rules

Always fetch columns before creating or updating records. You need column IDs and data types to construct valid payloads.

The `dataType` in each value object must exactly match the column's `dataType`. Mismatches will be rejected by the server.

Required columns must have values when creating records. Check the `isRequired` flag on each column.

When updating a record, send the complete `values` array - not a partial update. Omitted values will be cleared.

Always get user approval before executing any mutation (create, update, delete).

Before adding records, list existing records to understand the data structure and avoid duplicates.

For `SELECT` and `MULTI_SELECT` columns, the provided values must exist in the column's allowed `values` list. Fetch columns first to see what options are available.

For CSV import, always walk the user through the multi-step process and confirm at each stage. Explain that import is asynchronous and may take time for large files.

Always fetch the OpenAPI spec for full request/response schema details when constructing API calls.
