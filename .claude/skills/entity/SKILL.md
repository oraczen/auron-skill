---
name: entity
description: Guide for managing entities and their column schemas on the Auron platform
---

Important: Please read `auron-docs` and `auron-ai-api` skills before working with entities. You need an organizationId and a valid auth token.

# Entities

Entities are structured data containers scoped to an organization. Think of an entity as a database table — it has a name, a schema defined by columns, and rows of data called entity records.

Entities can represent anything: customer leads, support tickets, deal pipelines, inventory items, or any structured dataset relevant to the organization. Agents can be linked to entities so they have context about what a meeting or conversation is about.

## Entity Lifecycle

Follow this sequence when setting up a new entity:

1. **Create entity** — provide a name and optional description
2. **Fetch columns** — 3 default columns are auto-created: `ID` (TEXT, required), `Name` (TEXT, required), `Description` (TEXT, optional). You must fetch columns after creation to get their IDs.
3. **Add custom columns** — define additional columns with specific data types
4. **Add records** — see the `entity-record` skill for managing records

## Column Types

Each column has a `columnType` object with a `dataType` field and optional type-specific configuration.

### TEXT, EMAIL, URL

```json
{ "dataType": "TEXT", "maxLength": 500 }
```

`maxLength` is optional. EMAIL validates email format. URL validates URL format.

### NUMBER

```json
{ "dataType": "NUMBER", "min": 0, "max": 1000, "precision": 2 }
```

All fields except `dataType` are optional. `precision` controls decimal places.

### BOOLEAN

```json
{ "dataType": "BOOLEAN" }
```

No additional configuration.

### SELECT

```json
{
  "dataType": "SELECT",
  "values": ["option1", "option2", "option3"],
  "defaultValue": "option1"
}
```

`values` is required — defines the allowed options. `defaultValue` is optional.

### MULTI_SELECT

```json
{
  "dataType": "MULTI_SELECT",
  "values": ["tag1", "tag2", "tag3"],
  "defaultValue": ["tag1"]
}
```

`values` is required. `defaultValue` is an optional array.

## API Endpoints

All endpoints are under the base path `/entities`. Refer to the OpenAPI spec for full request/response schemas.

### Entity CRUD

| Method | Path                  | Description                                                                                         |
| ------ | --------------------- | --------------------------------------------------------------------------------------------------- |
| POST   | `/entities/create`    | Create a new entity                                                                                 |
| POST   | `/entities/list`      | List entities in an organization (supports filters: createdBy, createdAt, labels, customProperties) |
| GET    | `/entities/get-by-id` | Get entity by ID                                                                                    |
| PUT    | `/entities/update`    | Update entity name, description, labels, or customProperties                                        |
| DELETE | `/entities/delete`    | Delete entity (cascades to columns and records)                                                     |

### Column Management

| Method | Path                       | Description                                                |
| ------ | -------------------------- | ---------------------------------------------------------- |
| POST   | `/entities/columns/create` | Add a column to an entity                                  |
| GET    | `/entities/columns/list`   | List all columns for an entity                             |
| PUT    | `/entities/columns/update` | Update column name, description, columnType, or isRequired |
| DELETE | `/entities/columns/delete` | Delete a column                                            |

### Team Access

| Method | Path                     | Description                             |
| ------ | ------------------------ | --------------------------------------- |
| POST   | `/entities/teams/attach` | Grant a team viewer access to an entity |
| GET    | `/entities/teams/list`   | List teams attached to an entity        |
| POST   | `/entities/teams/detach` | Remove team access from an entity       |

### Viewer Access

| Method | Path                       | Description                             |
| ------ | -------------------------- | --------------------------------------- |
| POST   | `/entities/viewers/add`    | Grant a user viewer access to an entity |
| POST   | `/entities/viewers/remove` | Remove viewer access from an entity     |
| GET    | `/entities/access/users`   | List all users with access to an entity |

## Rules

Always get user approval before executing any mutation (create, update, delete).

Before creating an entity, list existing entities and check for duplicates. Warn the user if a similarly named entity already exists.

Do not attempt to create columns named `ID`, `Name`, or `Description` — these 3 columns are auto-created when an entity is created.

After creating an entity, always fetch columns using `GET /entities/columns/list` to retrieve the auto-created column IDs. You will need these IDs when creating records.

Column names must be unique within an entity. The server will reject duplicate column names.

When deleting an entity, warn the user that all columns and records within the entity will also be deleted. Always ask for explicit confirmation.

Only the entity owner can update or delete an entity. Viewers have read-only access.

Always fetch the OpenAPI spec for full request/response schema details when constructing API calls.
