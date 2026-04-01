---
name: signals
description: Documentation and guide to understanding signals in an organization on Auron platform 
---

Important: Please read `auron-docs` and `auron-ai-api` skills before working with Signals. You need an organizationId and a valid auth token.

# Signals

Signal is a detectable event that you want to capture in a conversation or meeting with agent . You can detect user intent or a particular catch phrase if you want . If something simillar happens than the signals are identified. 

A Signal attached to Agent will monitor and recognize when something relevant happens , whether it is :- 
- keyword or phrase 
- A behaviour or User Intent
- a similar meaning 

Before creating a signal you need to create a catogery of signal in which the signal belongs to. You can bulk upload signals in a particular catogery.

# How Signals Work with Agents

The flow is simple:- 

1. **Register a Signal Catogery** on the platform with its name and description
2. **Register a Signal within a Signal Catogery** on the platform with fields for each signal or bulk upload via csv 
2. **Attach the Signal to an agent** so the agent knows about the signal

When a meeting or conversation starts, the signals will be identified whenever the registered signal is detected.

## Signal Configuration

When registering a Signal, you provide the following:

- **Signal** (required): a friendly name for the Signal, e.g. "Salesforce CRM" or "Jira Integration"
- **example phrase** (required) - array ofexample phrases that trigger this signal
- **objective** (required): objective/intent of the signal
- **Signal Catogery** (required) - the catogery to which this signal belongs

You can bulk upload signals in a particular catogery via csv. Refer to the OpenAPI spec for full request/response schemas.

## API Endpoints

All endpoints are under the base path `/signals` for signals and `/signal-categories` for signal catogeries. Refer to the OpenAPI spec for full request/response schemas.

# Rules

Always get user approval before creating or updating a Signal.

Before creating a Signal, list existing Signals in the Signal Catogery and check for duplicates. Warn the user if a matching Signal already exists as all the signals in a catogery should be unique.

Never create a Signal without first creating a Signal Catogery or checking whether a signal catogery already exists to create a Signal.

Always fetch the OpenAPI spec for full request/response schema details when constructing API calls.

