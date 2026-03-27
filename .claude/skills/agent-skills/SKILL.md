---
name: agent-skills
description: Use this skill any time agent skills are being created, read. updated, or deleted, or when skills are being attached/detached to agents or teams. This is the main skill for managing agent skills and their associations.
---


# Agent Skills

A skill is a reusable piece of knowledge you give to an agent — it tells the agent what it knows or how it should behave in a specific domain.

Think of it like a job description supplement: you hire an agent (the base model), then hand it a set of skills — "you know our refund policy", "you speak in formal English", "you follow this escalation process" — and the agent uses those when responding.

A skill has a name, optional instructions (rules/steps), and docContent (reference material in markdown)
Skills are created at the organization level and can be shared across agents
Access is controlled via teams — you attach a skill to a team, and agents in that team can use it
An agent can have multiple skills attached to it

So the flow is: org creates skill → skill gets attached to team → agents in that team use the skill.



### Skill Lifecycle

Create skill (org level)
Attach skill to teams
Add to agent
Agent uses skill at runtime (instructions + docContent injected into context)
Update skill   
Delete skill (soft)


### Read First (common mistakes)

Always read the OpenAPI spec for full request/response schema details before constructing API calls. This will help you avoid common mistakes like:
- Missing required fields in the request body
- Incorrect data types (e.g. string vs array)
- Not handling optional fields properly
- Not understanding the response structure, leading to errors when parsing results

## Rules
Always get user approval before executing any mutation (create, update, delete).
Before creating a skill, list existing skills and check for duplicates. Warn the user if a similarly named skill already exists as every skill has a unique name.
Type of variable is set while creating only and can not be updated after creation.
When attaching a skill to a team, ensure the team exists and is valid before making the API call.
When detaching a skill from a team, ensure the skill is currently attached to that team before making the API call.
Always fetch the OpenAPI spec for full request/response schema details when constructing API calls.