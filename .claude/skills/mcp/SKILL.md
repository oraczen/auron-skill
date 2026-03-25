---
name: mcp
description: Guide for managing MCP (Model Context Protocol) server integrations on the Auron platform
---

Important: Please read `auron-docs` and `auron-ai-api` skills before working with MCPs. You need an organizationId and a valid auth token.

# MCP (Model Context Protocol)

MCP lets you connect external tool servers to your agents. An MCP server exposes tools, functions that agents can call during meetings and conversations. For example, a CRM tool server could let your agent look up customer info or create support tickets mid-call. A project management server could let the agent create tasks or update statuses based on what was discussed.

## How MCP Works with Agents

The flow is simple:

1. **Register an MCP server** on the platform with its URL and auth details
2. **Attach the MCP to an agent** so the agent knows about the server
3. **Agent gets access to the server's tools** during live conversations and meetings

When a meeting or conversation starts, the platform connects to each registered MCP server, discovers what tools are available, and makes them callable by the agent in real time.

## MCP Server Configuration

When registering an MCP server, you provide the following:

- **title** (required): a friendly name for the server, e.g. "Salesforce CRM" or "Jira Integration"
- **description** (optional) - what the server does
- **type** - always `"streamable-http"`. This is the only supported transport type.
- **serverUrl** (required) - the HTTP endpoint of the MCP server
- **headers** (optional) - custom headers sent with every request to the server. Use this for authentication. Each header is a `{ key, value }` pair. Common examples: `Authorization: Bearer <token>`, `x-api-key: <key>`.
- **allowedTools** (optional) - restrict which tools from the server the agent can use. Each entry is `{ name, description? }`. If omitted, all tools are available.
- **approval** (optional) - controls whether tool calls need user approval at runtime:
  - `"required_always"` - every tool call requires user confirmation
  - `"allow_always"` - tool calls execute without asking

## Tool Discovery

Before registering an MCP server, you can probe it to see what tools it exposes. Provide the serverUrl and any required auth headers, and the platform connects to the server and returns a list of available tools with their names and descriptions.

This is useful for:

- Verifying the server is reachable and working
- Seeing what tools are available before committing to a registration
- Deciding which tools to include in the `allowedTools` list

Always display discovered tools in a structured table for the user so they can review before proceeding.

## Allowed Tools

By default, an agent can use all tools exposed by an MCP server. If you want to restrict access, specify an `allowedTools` list when creating or updating the MCP - only the tool names in that list will be available to the agent.

This is useful for security and scoping. For example, if a server exposes both read and write tools, you might only allow the read tools for a particular agent.

## API Endpoints

All MCP endpoints are under the base path `/mcps`. Refer to the OpenAPI spec for full request/response schemas. Available operations include: proxy tool discovery, create, list, get by ID, and update.

## Rules

Always get user approval before creating or updating an MCP server.

Before creating an MCP, list existing MCPs and check for duplicates by serverUrl or title. Warn the user if a matching MCP already exists.

When probing a server for tools, display the discovered tools in a clear markdown table showing tool name and description.

Headers may contain sensitive values like API keys or secrets. Never log or display header values back to the user.

Always fetch the OpenAPI spec for full request/response schema details when constructing API calls.
