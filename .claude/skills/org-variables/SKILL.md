---
name: organization-variables
description: Documentation and guide to understanding variables, secrets and custom LLM Configuration in an organization
---

Important: Please read `auron-docs` and `auron-ai-api` skills before working with Organization Variables. You need an organizationId and a valid auth token.

# Organization Variables

Organization Variables is a feature that lets you create a variable that can be used across the platform by using the variable name only, this are scoped to Organization 

Organization Variables have 3 types that you can configure: 
- Variable - This is a normal variable that you make which has a value that can be used across the platform, and can be seen in the platform . 
- Secret - This is an encrypted variable that is kept and used but can not be seen by anyone and is a secret . 
- LLM Configuration - This is also an encrypted variable used to store personal API keys of different providers which then can be used to configure Agents 

Type should not be altered after creation , you will not be able to see secret and llm configuration's api key but you can update them and delete them .

## API Endpoints

All endpoints are under the base path `/organizations/variables`. Refer to the OpenAPI spec for full request/response schemas.

## Rules

Always get user approval before executing any mutation (create, update, delete).

Before creating a Organization Variable, list existing Organization Variables and check for duplicates. Warn the user if a similarly named organization variable already exists as every variable has a unique name.

Type of variable is set while creating only and can not be updated after creation.

Always fetch the OpenAPI spec for full request/response schema details when constructing API calls.