---
name: auron-docs
description: Documentation and Guide to understand Auron platform
---

# Auron Platform

Auron is a platform for turning real conversations into durable, queryable intelligence—without relying on ad hoc note-taking, inconsistent summaries, or subjective capture. The platform centers on the idea that voice interactions contain the richest context: intent, constraints, implicit requirements, risks, and commitments. Auron captures that context and translates it into structured outputs that can be governed, audited, and integrated with downstream systems.

## Problem Statement that Auron Platform Solves

In most enterprises, critical context emerges in conversations, but capture is inconsistent and follow-through is fragmented across people and systems. Important decisions get lost in email threads. Requirements discussed in meetings never make it to project management tools. Customer commitments are remembered differently by different team members. This fragmentation creates rework, misunderstandings, and missed opportunities.

Auron introduces a repeatable, governed pipeline where conversations become evidence records, intelligence is extracted as structured outputs, durable context is updated over time, and follow-through is initiated through configurable automation.

## Key Concepts

### Organizations

Everything in Auron platform is scoped to an organization. Admins and users can create an organization on platform using a friendly name and a unique slug which acts as a logical namespace for your data, users and conversations.

Organization also acts as a billable unit and useage metric, as everything you do in an organization is tracked and charged and limited to the useage limit policies.

Use the `auron-api` skills and fetch all the organizations of the user and ask it to select one organization which you can remember in context for all further executions and operations. Organizations are like namespace and always store it as prefrence.

### Agents

Agents are the core part of the platform. Admins of organization and create and configure agents inside an organization which are trained and prompted to perform specific tasks.

To create an agent, users must provide a friendly name to the agent and instructions as markdown. The markdown acts as rules, intructions for the agent. Users need to define an elaborate markdown document explaining what agents can do, with examples and how to do.

User can interact with agents on multiple channels such as chat text to text, voice calls, invite to a microsoft teams meeting and have a voice conversation.

Agents can listen and respond back to the user based on instuctions given to it while configuring agent.

### Entities

Entities are like database tables for your agents. Each entity represents a type of thing you want to track — customer leads, support tickets, deal pipelines, inventory items, or anything else.

When you create an entity, it starts with three default columns: ID, Name, and Description. You can then add more columns to define the shape of your data. Each column has a type — text, number, email, URL, boolean, single select, or multi select — so the data stays clean and structured.

Entities can be linked to meetings and conversations to give agents context about what the discussion is about. For example, if you have a "Leads" entity, you can attach a specific lead to a meeting so the agent knows who you are talking about and can update the record after the conversation.

Teams and individual users can be given access to entities. The person who creates an entity owns it and can update or delete it. Others can be added as viewers.

Use the `entity` skill for full API details on creating and managing entities and their columns.

### Knowledge Stores

### Signals
