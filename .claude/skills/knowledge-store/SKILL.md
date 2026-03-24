---
name: knowledge-store
description: Documentation and Guide to understand Knowledge Store and Knowledge Store Data
---

Important: Please read `auron-docs` and `auron-ai-api` skills before working with Knowledge Stores. You need an organizationId and a valid auth token.

# Knowledge Store

Knowledge Store is a feature that allows you to store and retrieve data from a knowledge base that is scoped to an organization. It helps you to give Agent context about the data you want to share with them.

Each Knowledge Store contains a collection of Knowledge Store Data which is basically a file or text document having that extra context that you want to share with Agent.

Agent will get the context of all the Knowledge Store Data of a particular Knowledge Store , So basically we are creating a knowledge base for our agents. 

## API Endpoints

All endpoints are under the base path `/knowledge-stores`. Refer to the OpenAPI spec for full request/response schemas.

### Knowledge Store Crud 


| Method | Path                  | Description                                                                                         |
| ------ | --------------------- | --------------------------------------------------------------------------------------------------- |
| POST   | `/knowledge-stores/create`    | Create a new knowledge store                                                                                 |
| POST   | `/knowledge-stores/list`      | List knowledge stores in an organization (supports filters: createdBy, createdAt, labels, customProperties) |
| GET    | `/knowledge-stores/get-by-id` | Get knowledge store by ID                                                                                    |
| PUT    | `/knowledge-stores/update`    | Update knowledge store name, description, metadata, tags, labels, or customProperties                                        |
| DELETE | `/knowledge-stores/delete`    | Delete knowledge store (cascades to knowledge store data)                                                     |


### Knowledge Store Data Crud

| Method | Path                  | Description                                                                                         |
| ------ | --------------------- | --------------------------------------------------------------------------------------------------- |
| POST   | `/knowledge-stores/data/upload-url`    | get an upload url to upload data to a knowledge store                                                                                 |
| POST   | `/knowledge-stores/data/mark-uploaded`      | mark a knowledge store data as uploaded and trigger processing |
| POST   | `/knowledge-stores/data/upload-text`    | Upload text content directly to a knowledge store                                                                                 |
| POST   | `/knowledge-stores/data/list`      | List all data items in a knowledge store |
| POST   | `/knowledge-stores/data/view-url`    | Get a pre-signed URL to view a knowledge store data file                                                                                 |
| POST    | `/knowledge-stores/data/get-by-ids` | Retrieve multiple knowledge store data items by their IDs                                                                                   |
| DELETE | `/knowledge-stores/data/delete`    |Delete a specific data item from a knowledge store                                                     |

* Important Note: `/knowledge-stores/data/upload-url` and `/knowledge-stores/data/mark-uploaded` should always be used together and never individually with `/knowledge-stores/data/upload-url` being called first and if response is successfull then `/knowledge-stores/data/mark-uploaded`. 

### Team Access

| Method | Path                     | Description                             |
| ------ | ------------------------ | --------------------------------------- |
| POST   | `/knowledge-stores/teams/attach` | Grant a team viewer access to a knowledge store |
| GET    | `/knowledge-stores/teams/list`   | List teams attached to a knowledge store        |
| POST   | `/knowledge-stores/teams/detach` | Remove team access from a knowledge store       |

## Rules

Always get user approval before executing any mutation (create, update, delete).

Before creating a knowledge store, list existing knowledge stores and check for duplicates. Warn the user if a similarly named knowledge store already exists.

Before creating a knowledge store data, list existing knowledge stores data and check for duplicates. Warn the user if a similarly named knowledge store data already exists.

Creating Knowledge Store data includes either `/knowledge-stores/data/upload-text` or `/knowledge-stores/data/upload-url` followed by `/knowledge-stores/data/mark-uploaded`.

When deleting an knowledge store, warn the user that all knowledge store data within the knowledge store will also be deleted. Always ask for explicit confirmation.

Always fetch the OpenAPI spec for full request/response schema details when constructing API calls.
