---
name: agents
description: Documentation and guide to understanding Agent in an organization on Auron platform 
---

Important: Please read `auron-docs` and `auron-ai-api` skills before working with Agents. You need an organizationId and a valid auth token.

# Agents

An Agent is an Intelligent context aware AI agent or AI assistant with whom you can converse in chat or meeting . This is one of the most important features in the platform most of the feature revolves around agent only . You can create the context of meeting or conversation(chat) or for a particular Entity Record which is assigned to the meeting . 

Agent acts on the configuration done , its actions and behaviour is decided by the configurations. 

What Agents does:- 
- Converse with users in an organization via chat or meeting. 
- listens to meeting and understands discussion in real time . 
- Maintains context accross interactions.
- Triggers Actions such as calling MCP tools , finding signals or Retrieve info from knowledge stores.
- Uses the behaviour , knowledge or skill given in Skills and Knowledge stores.
- Keep the context of the entity involved in the conversation or meeting. 

## Core Capabilities of Agents

Agents have the following core capabilities:

- **Context Awareness**: Agents stores multiple layer of contexts , for example - meeting and conversation have their context and entity record involved in the meet has its own context .
- **Detect Signals**: Detects phrases , actions or intent , for ex:- "It should be handled by upper authorities" can trigger a particular signal
- **Agent Skills**: Predefined capabilities the agent can execute , for example - "Interview Javascript" skill 
- **MCP** - Gives agent the power to call and execute external tools 
- **Knowledge Store**- Stores context or knowledge in form of document , text and can be retrieved whenever needed.
- **Entities & Entity Records**: Agent uses to personalize the experience and response and to take contextual actions.

## Agent Configuration
 
Things you can configure for an Agent are:

- **name** (required): a friendly name for the agent, e.g. "Sales Agent" or "Support Agent"
- **description** (optional) - what the agent does
- **config** - a JSON object with additional configuration details which configures the provider , llm model , type of agent , voice . You can use the secret which you configured in Organization Variables to configure LLM as well. 
- **doc content** (optional) - the agent's documentation content in Markdown format.
- **entities** (optional) - a list of entity IDs that the agent is associated with from which chat or meeting can be created of the entity record from the entities associated to the agent.
- **icon** (optional) - a URL to an icon image for the agent.
- **knowledge stores** (optional) - a list of knowledge store IDs that the agent is associated with context of which can be used by the agent.
- **wake words** (optional) - a list of wake words that the agent can recognize to start a conversation.
- **agent skills** (optional) - a list of skill IDs that the agent is associated with .
- **mcps** (optional) - a list of MCP IDs that the agent is associated with .
- **signals** (optional) - a list of signal IDs that the agent is associated with .

When the Agent is created it is by default draft , and can be published afterwards . 

This is the base of the platform and should be configured carefully .

# Rules 

Always get user approval before executing any mutation (create, update etc).

Always list the agents and check for duplicates. Warn the user if an agent with the same name already exists.

Always fetch the agent before configuring anything see if that configuration is already there 

Before configuring anything fetch and list that to check whether it is available or not 

Always fetch the OpenAPI spec for full request/response schema details when constructing API calls.
