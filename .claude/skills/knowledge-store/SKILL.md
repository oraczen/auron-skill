---
name: knowledge-store
description: Documentation and Guide to understand Knowledge Store and Knowledge Store Data
---

Important: Please read `auron-docs` and `auron-ai-api` skills before working with Knowledge Stores. You need an organizationId and a valid auth token.

# Knowledge Store

Knowledge Store is a feature that allows you to store and retrieve data from a knowledge base that is scoped to an organization. It helps you to give Agent context about the data you want to share with them.

Each Knowledge Store contains a collection of Knowledge Store Data which is basically a file or text document having that extra context that you want to share with Agent.

Agent will get the context of all the Knowledge Store Data of a particular Knowledge Store , So basically we are creating a knowledge base for our agents. 

Knowledge Store data can be a file of any mimeType or simple text both of them being stored in different way , For files you need to upload the file to upload url and then mark uploaded to trigger the processing , and for simple text you can simply give the text in content , You should not mix both together.

## API Endpoints

All endpoints are under the base path `/knowledge-stores`. Refer to the OpenAPI spec for full request/response schemas.

## Rules

Always get user approval before executing any mutation (create, update, delete).

Before creating a knowledge store, list existing knowledge stores and check for duplicates. Warn the user if a similarly named knowledge store already exists.

Before creating a knowledge store data, list existing knowledge stores data and check for duplicates. Warn the user if a similarly named knowledge store data already exists.

When deleting an knowledge store, warn the user that all knowledge store data within the knowledge store will also be deleted. Always ask for explicit confirmation.

Always fetch the OpenAPI spec for full request/response schema details when constructing API calls.
