---
name: analytics-agent
description: >
  Agent performance and operational analytics. Covers performance ranking,
  signal yield by channel, entity coverage, constitution compliance, telephony
  outcomes, knowledge store utilisation, and MCP tool execution auditing.
metadata:
  author: Auron
  version: 1.0.0
  category: analytics-agent
---

Important: Please read `auron-docs` and `api` skills before running agent analytics. You need an organizationId, a valid API key, and a valid session token.

# Agent Analytics

Agent analytics measure how individual AI agents perform across sessions, channels, and entity records. Every skill in this file requires an `organizationId` to operate. An optional `agentId` narrows the analysis to a single agent; omitting it produces cross-agent comparisons. These skills answer questions like "which agent is performing best?", "how does signal yield differ across channels?", and "are agents following the latest constitution?".

All agent analytics work by querying the Explore API with the appropriate context. The Explore API internally selects the right pre-built aggregation tools for each question.

---

## Required Inputs

Every agent analytics skill requires the following inputs. **You must collect all required inputs before making any query.** Never guess or assume values.

| Input | Required | Description | How to obtain |
|-------|----------|-------------|---------------|
| `organizationId` | Yes | The organization scope for all data | Ask the user to select their organization. Use the `api` skill to list organizations if needed. |
| `agentId` | No | Filter to a specific agent (omit for cross-agent comparison) | Ask the user if they want to focus on a specific agent or compare all agents. Use the `api` skill to list agents if needed. |
| `fromDate` | No | Start of time window (ISO 8601) | Ask the user if they want to scope the analysis to a specific time range. Default: last 30 days. |
| `toDate` | No | End of time window (ISO 8601) | Same as above. Default: now. |

### Input Collection Rules

1. If the user says "my agent" or "the agent" but no `agentId` is in context, **ask them to specify which agent** or confirm they want a cross-agent comparison.
2. If the user gives a name instead of an ID, search agents by name and confirm the match before proceeding.
3. Never proceed with a query if `organizationId` is missing.
4. If the user has previously selected an organization or agent in the conversation, reuse it -- do not ask again.

### Access Control

- Admin/owner can query any agent's performance data across the organization.
- Regular users can only see analytics for agents they have directly interacted with.
- If a non-admin tries to query an agent they have not interacted with, respond: "You can only view analytics for agents you have used. Contact an admin for organization-wide agent analytics."

---

## Agent Performance Ranker

### What It Does

Ranks all agents in the organization by composite performance metrics including total sessions handled, signals extracted, average signal confidence, and signal yield per session. When a single agent is specified, shows that agent's performance trend over time instead of a ranking.

### When to Use

Trigger this skill when the user asks questions like:
- "Which agent is performing best?"
- "Rank my agents by performance"
- "How do my agents compare?"
- "Show me agent performance metrics"
- "Which agent has the highest signal yield?"
- "How is [agent name] performing?"

### Performance Dimensions

| Dimension | What It Measures | Weight |
|-----------|-----------------|--------|
| Total Sessions | Number of sessions the agent has handled in the time window | 1x |
| Signals Extracted | Total number of signals detected across all sessions | 1.5x |
| Avg Confidence | Mean confidence score across all extracted signals | 1.5x |
| Signal Yield | Signals per session ratio (signals / sessions) | 2x |

### Workflow

1. Collect `organizationId` from the user (see Required Inputs above)
2. Determine if the user wants a cross-agent comparison or single-agent trend
3. Query `agent_performance_summary` with `organizationId` and optional `agentId`
4. If cross-agent: rank agents by weighted composite score and present as a table
5. If single-agent: compute period-over-period change for each dimension and show trend direction
6. Identify the top performer and the agent with the most room for improvement
7. Present the results in the output format below

### Example Output

```
## Agent Performance Ranking

**Organization: Acme Inc | Period: Feb 24 – Mar 25, 2026**

| Rank | Agent | Sessions | Signals | Avg Confidence | Yield/Session | Composite |
|------|-------|----------|---------|----------------|---------------|-----------|
| 1 | Sales Discovery Bot | 142 | 487 | 0.82 | 3.43 | 🟢 92 |
| 2 | Account Review Agent | 98 | 312 | 0.79 | 3.18 | 🟢 84 |
| 3 | Onboarding Assistant | 76 | 198 | 0.74 | 2.61 | 🟡 68 |
| 4 | Support Triage Bot | 203 | 289 | 0.61 | 1.42 | 🟠 47 |

### Summary

Sales Discovery Bot leads the organization with the highest signal yield per session (3.43) and strong confidence (0.82). Support Triage Bot handles the most sessions but has the lowest signal yield and confidence -- this may indicate the agent's constitution needs tuning for signal extraction rather than triage routing.

### Recommendations

1. **Support Triage Bot (Composite: 47)**: Review the agent's constitution and signal detection
   configuration. High session volume with low yield suggests the agent is engaging in
   interactions that could produce signals but is not configured to extract them.

2. **Onboarding Assistant (Composite: 68)**: Signal yield is adequate but confidence lags behind
   the top agents. Consider refining the agent's prompt to ask more targeted questions during
   onboarding sessions.
```

---

## Signal Yield by Channel

### What It Does

Breaks down each agent's signal extraction rate by interaction channel (meeting, chat, telephony). Reveals which channels are most productive for each agent and identifies channel-specific underperformance.

### When to Use

Trigger this skill when the user asks questions like:
- "Which channel produces the most signals?"
- "How does signal yield differ between meetings and calls?"
- "Is [agent] better in meetings or on calls?"
- "Break down agent performance by channel"
- "Where are we getting the most intelligence?"

### Channel Classification

| Channel | Description |
|---------|------------|
| Meeting | Scheduled video/audio meetings with transcription |
| Chat | Asynchronous text-based conversations |
| Telephony | Inbound or outbound phone calls |

### Workflow

1. Collect `organizationId` and optional `agentId` from the user
2. Query `agent_signal_yield_by_channel` with the collected inputs
3. For each agent-channel combination, compute: total sessions, total signals, yield per session, average confidence
4. Identify the strongest and weakest channel per agent
5. If comparing across agents, highlight which agent dominates each channel
6. Present the results in the output format below

### Example Output

```
## Signal Yield by Channel

**Organization: Acme Inc | Period: Feb 24 – Mar 25, 2026**

### Sales Discovery Bot

| Channel | Sessions | Signals | Yield/Session | Avg Confidence | Status |
|---------|----------|---------|---------------|----------------|--------|
| Meeting | 68 | 289 | 4.25 | 0.85 | 🟢 Strong |
| Chat | 52 | 134 | 2.58 | 0.79 | 🟡 Adequate |
| Telephony | 22 | 64 | 2.91 | 0.78 | 🟡 Adequate |

### Account Review Agent

| Channel | Sessions | Signals | Yield/Session | Avg Confidence | Status |
|---------|----------|---------|---------------|----------------|--------|
| Meeting | 45 | 198 | 4.40 | 0.81 | 🟢 Strong |
| Chat | 38 | 76 | 2.00 | 0.75 | 🟡 Adequate |
| Telephony | 15 | 38 | 2.53 | 0.72 | 🟡 Adequate |

### Summary

Meetings consistently produce the highest signal yield across all agents, with an average of 4.3 signals per session compared to 2.3 for chat and 2.7 for telephony. Chat has the lowest yield but still maintains adequate confidence levels. Sales Discovery Bot leads across all channels.

### Recommendations

1. **Increase meeting allocation**: Meetings produce nearly 2x the signal yield of other
   channels. Where possible, prefer scheduling structured meetings over ad-hoc chat for
   high-priority accounts.

2. **Chat signal extraction**: Both agents show lower yield in chat. Review whether chat
   conversations tend to be shorter or more transactional, and consider adjusting the agent's
   conversational strategy for chat to ask more discovery-oriented questions.
```

---

## Entity Record Coverage

### What It Does

Shows how many distinct entity records each agent has interacted with, how deeply they have engaged (sessions per record), and identifies records that are only covered by a single agent (single-thread risk).

### When to Use

Trigger this skill when the user asks questions like:
- "How many accounts does each agent cover?"
- "Which agent has the broadest entity coverage?"
- "Are there accounts only one agent touches?"
- "Show me single-thread risk across agents"
- "Which accounts have the least agent diversity?"

### Coverage Dimensions

| Dimension | What It Measures |
|-----------|-----------------|
| Distinct Records | Number of unique entity records the agent has interacted with |
| Avg Sessions/Record | Mean number of sessions per covered entity record |
| Single-Thread Records | Records where this agent is the ONLY agent with sessions |
| Coverage Breadth | Distinct records / total org records (percentage) |

### Workflow

1. Collect `organizationId` and optional `agentId` from the user
2. Query `agent_entity_record_coverage` with the collected inputs
3. For each agent, compute distinct records, average sessions per record, and single-thread count
4. Flag entity records where only one agent has ever had a session
5. If single-agent view, list the specific records with highest and lowest engagement depth
6. Present the results in the output format below

### Example Output

```
## Entity Record Coverage

**Organization: Acme Inc | Period: Feb 24 – Mar 25, 2026**

| Agent | Distinct Records | Avg Sessions/Record | Single-Thread Records | Coverage Breadth |
|-------|-----------------|--------------------|-----------------------|-----------------|
| Sales Discovery Bot | 38 | 3.7 | 12 | 🟢 63% |
| Account Review Agent | 29 | 3.4 | 8 | 🟡 48% |
| Onboarding Assistant | 22 | 3.5 | 15 | 🟠 37% |
| Support Triage Bot | 45 | 4.5 | 6 | 🟢 75% |

### Single-Thread Risk Records (Top 5)

| Entity Record | Only Agent | Sessions | Last Session |
|--------------|-----------|----------|-------------|
| GlobalTech Solutions | Onboarding Assistant | 2 | 14 days ago |
| Vertex Industries | Onboarding Assistant | 1 | 28 days ago |
| NovaBridge Corp | Sales Discovery Bot | 3 | 7 days ago |
| Pinnacle Group | Sales Discovery Bot | 1 | 35 days ago |
| Summit Analytics | Onboarding Assistant | 1 | 42 days ago |

### Summary

Support Triage Bot has the broadest entity coverage (75% of records) but this is expected given its triage role. Onboarding Assistant has the highest single-thread risk with 15 records only it covers, including two records with stale last sessions (28+ days ago). Sales Discovery Bot covers the most records among non-triage agents.

### Recommendations

1. **Onboarding Assistant single-thread records**: 15 records are only covered by this agent.
   Assign Account Review Agent or Sales Discovery Bot to upcoming sessions for Vertex
   Industries and Summit Analytics, which have the oldest last sessions.

2. **Pinnacle Group (35 days stale)**: This single-thread record has not been contacted in over
   a month. Schedule a proactive check-in with a second agent to build coverage redundancy.
```

---

## Constitution Version Compliance

### What It Does

Tracks signal confidence trends across different versions of an agent's AI constitution. Shows whether constitution updates are improving or degrading signal extraction quality, with before/after comparisons per version change.

### When to Use

Trigger this skill when the user asks questions like:
- "Did the latest constitution update improve signal quality?"
- "How does signal confidence compare across constitution versions?"
- "Show me before and after the constitution change"
- "Is the new constitution better or worse?"
- "Track constitution compliance over time"

### Compliance Dimensions

| Dimension | What It Measures |
|-----------|-----------------|
| Version | Constitution version identifier |
| Sessions Under Version | Number of sessions conducted with this constitution version active |
| Avg Signal Confidence | Mean confidence of signals extracted under this version |
| Signal Yield | Signals per session under this version |
| Confidence Delta | Change in avg confidence compared to the previous version |

### Workflow

1. Collect `organizationId` and `agentId` from the user (agent is required for this skill)
2. Query `agent_confidence_by_constitution` with the collected inputs
3. For each constitution version, compute sessions, avg confidence, yield, and delta from prior version
4. Classify each version transition as Improved / Stable / Degraded
5. If the latest version shows degradation, flag it prominently
6. Present the results in the output format below

### Example Output

```
## Constitution Version Compliance: Sales Discovery Bot

**Organization: Acme Inc**

| Version | Active Period | Sessions | Avg Confidence | Yield/Session | Delta | Trend |
|---------|-------------|----------|----------------|---------------|-------|-------|
| v1.0 | Jan 1 – Jan 31 | 34 | 0.68 | 2.41 | -- | -- |
| v1.1 | Feb 1 – Feb 28 | 42 | 0.76 | 2.95 | +0.08 | 🟢 Improved |
| v2.0 | Mar 1 – Mar 25 | 38 | 0.83 | 3.42 | +0.07 | 🟢 Improved |

### Before/After: v1.1 to v2.0

| Metric | v1.1 | v2.0 | Change |
|--------|------|------|--------|
| Avg Confidence | 0.76 | 0.83 | 🟢 +9.2% |
| Yield/Session | 2.95 | 3.42 | 🟢 +15.9% |
| Sessions | 42 | 38 | -- (fewer days in period) |

### Summary

Sales Discovery Bot shows consistent improvement across all three constitution versions. The v2.0 update delivered the largest gains in both confidence (+9.2%) and yield (+15.9%). The upward trajectory suggests the constitution refinements are effectively improving signal extraction quality.

### Recommendations

1. **Continue iterating on v2.0 patterns**: The improvements in v2.0 are significant. Document
   what changed between v1.1 and v2.0 and apply similar patterns to other agents' constitutions.

2. **Monitor for plateau**: Three consecutive improvements is a strong signal, but watch for
   diminishing returns in future versions. If the next update shows less than 3% confidence
   improvement, the agent may be approaching its ceiling for this entity type.
```

---

## Telephony Call Outcome Analyzer

### What It Does

Analyzes call outcomes for each agent's telephony sessions, including call disposition (connected, voicemail, no answer), call duration, and signal attribution per call. Ties signal yield directly to call outcomes to reveal which types of calls are most productive for intelligence gathering.

### When to Use

Trigger this skill when the user asks questions like:
- "How are our phone calls going?"
- "Which agent is best on calls?"
- "What's the signal yield from telephony?"
- "Break down call outcomes by agent"
- "Are connected calls producing good signals?"
- "Show me call duration vs signal yield"

### Outcome Classification

| Outcome | Definition |
|---------|-----------|
| Connected | Call was answered and a conversation occurred |
| Voicemail | Call went to voicemail; agent may have left a message |
| No Answer | Call was not answered and no voicemail was left |
| Failed | Call could not be placed (technical failure) |

### Workflow

1. Collect `organizationId` and optional `agentId` from the user
2. Query `agent_telephony_call_outcomes` with the collected inputs
3. For each agent, compute: total calls by outcome, avg duration for connected calls, signals per connected call, avg confidence for telephony signals
4. Calculate the connection rate (connected / total calls) and productive call rate (connected calls with 1+ signal / connected calls)
5. Present the results in the output format below

### Example Output

```
## Telephony Call Outcome Analysis

**Organization: Acme Inc | Period: Feb 24 – Mar 25, 2026**

### Sales Discovery Bot

| Outcome | Calls | Avg Duration | Signals | Yield/Call | Confidence |
|---------|-------|-------------|---------|-----------|------------|
| Connected | 16 | 12m 34s | 48 | 3.00 | 🟢 0.79 |
| Voicemail | 4 | 0m 42s | 0 | 0.00 | -- |
| No Answer | 2 | -- | 0 | 0.00 | -- |

**Connection Rate**: 73% | **Productive Call Rate**: 88% (14 of 16 connected calls yielded signals)

### Account Review Agent

| Outcome | Calls | Avg Duration | Signals | Yield/Call | Confidence |
|---------|-------|-------------|---------|-----------|------------|
| Connected | 11 | 18m 12s | 34 | 3.09 | 🟢 0.74 |
| Voicemail | 3 | 0m 38s | 0 | 0.00 | -- |
| No Answer | 1 | -- | 0 | 0.00 | -- |

**Connection Rate**: 73% | **Productive Call Rate**: 82% (9 of 11 connected calls yielded signals)

### Summary

Both agents show a 73% telephony connection rate, which is above the typical benchmark. Account Review Agent achieves higher yield per connected call (3.09) with longer average call duration (18m vs 12m), suggesting that longer calls correlate with more signal extraction. Both agents have high productive call rates (82%+).

### Recommendations

1. **Optimize call timing**: 27% of calls are not connecting. Analyze call time-of-day patterns
   to identify when connection rates are highest and schedule calls accordingly.

2. **Leverage longer call correlation**: Account Review Agent's longer calls yield slightly more
   signals. Consider adjusting Sales Discovery Bot's call scripts to extend productive
   conversations when the contact is engaged.
```

---

## Knowledge Store Utilisation

### What It Does

Measures how frequently each agent draws from the organization's knowledge store during sessions. Shows which knowledge store entries are most and least used, and identifies agents that underutilise available knowledge resources.

### When to Use

Trigger this skill when the user asks questions like:
- "Are agents using the knowledge store?"
- "Which knowledge entries are most referenced?"
- "Is the knowledge store being utilized effectively?"
- "Which agent uses knowledge store the most?"
- "Are there knowledge store entries nobody is using?"
- "How often does [agent] reference knowledge?"

### Utilisation Dimensions

| Dimension | What It Measures |
|-----------|-----------------|
| Retrieval Rate | % of sessions where the agent retrieved from the knowledge store |
| Avg Retrievals/Session | Mean number of knowledge store lookups per session |
| Distinct Entries Used | Number of unique knowledge store entries referenced |
| Entry Coverage | Distinct entries used / total available entries (percentage) |

### Workflow

1. Collect `organizationId` and optional `agentId` from the user
2. Query `agent_knowledge_store_utilisation` with the collected inputs
3. For each agent, compute retrieval rate, average retrievals per session, distinct entries, and entry coverage
4. Identify the most-used and least-used knowledge store entries across all agents
5. Flag agents with low retrieval rates as potentially underutilising available knowledge
6. Present the results in the output format below

### Example Output

```
## Knowledge Store Utilisation

**Organization: Acme Inc | Period: Feb 24 – Mar 25, 2026**
**Total Knowledge Store Entries: 48**

| Agent | Sessions | Retrieval Rate | Avg Retrievals/Session | Distinct Entries | Coverage |
|-------|----------|---------------|----------------------|-----------------|----------|
| Sales Discovery Bot | 142 | 78% | 2.3 | 31 | 🟢 65% |
| Account Review Agent | 98 | 85% | 3.1 | 28 | 🟢 58% |
| Onboarding Assistant | 76 | 42% | 1.1 | 12 | 🟠 25% |
| Support Triage Bot | 203 | 31% | 0.8 | 9 | 🔴 19% |

### Most Used Entries (Top 5)

| Entry | Retrievals | Agents Using |
|-------|-----------|-------------|
| Pricing & Packaging Guide | 187 | 4 of 4 |
| Competitive Comparison Matrix | 134 | 3 of 4 |
| Product Feature Roadmap | 98 | 3 of 4 |
| Objection Handling Playbook | 76 | 2 of 4 |
| Industry Benchmark Data | 63 | 2 of 4 |

### Unused Entries (Samples)

| Entry | Last Retrieved | Created |
|-------|--------------|---------|
| Legacy Migration FAQ | Never | 45 days ago |
| Partner Integration Specs | Never | 30 days ago |
| Q3 2025 Case Studies | 62 days ago | 90 days ago |

### Summary

Account Review Agent has the highest retrieval rate (85%) and deepest per-session usage (3.1 retrievals). Onboarding Assistant and Support Triage Bot significantly underutilise the knowledge store, with retrieval rates below 50%. Three knowledge store entries have never been retrieved or are severely stale, suggesting they may need updating or removal.

### Recommendations

1. **Support Triage Bot (19% coverage)**: This agent handles the most sessions but barely uses
   the knowledge store. Review whether its constitution references knowledge store retrieval
   and ensure relevant entries are indexed for its typical query patterns.

2. **Unused entries**: Legacy Migration FAQ and Partner Integration Specs have never been
   retrieved. Review whether they are correctly tagged and discoverable, or consider archiving
   them to reduce clutter.

3. **Onboarding Assistant (25% coverage)**: With only 12 distinct entries used, this agent may
   benefit from explicit knowledge store prompts during onboarding flows where product
   information is frequently needed.
```

---

## MCP Tool Execution Auditor

### What It Does

Audits MCP (Model Context Protocol) tool call frequency and patterns per agent. Shows which external tools each agent invokes, how often, success/failure rates, and latency. Identifies agents that are over-relying on specific tools or experiencing high failure rates.

### When to Use

Trigger this skill when the user asks questions like:
- "What tools are agents calling?"
- "How often do agents use MCP tools?"
- "Are there tool call failures I should know about?"
- "Which agent makes the most tool calls?"
- "Show me MCP tool usage patterns"
- "Are agents over-using any tools?"

### Audit Dimensions

| Dimension | What It Measures |
|-----------|-----------------|
| Total Calls | Number of MCP tool invocations in the time window |
| Distinct Tools | Number of unique MCP tools the agent has called |
| Success Rate | Percentage of tool calls that returned successfully |
| Avg Latency | Mean response time for tool calls |
| Calls/Session | Average number of tool calls per session |

### Workflow

1. Collect `organizationId` and optional `agentId` from the user
2. Query `agent_mcp_tool_execution` with the collected inputs
3. For each agent, compute total calls, distinct tools, success rate, avg latency, and calls per session
4. Break down by individual tool to show the most and least called tools
5. Flag tools with success rates below 90% or latency above acceptable thresholds
6. Present the results in the output format below

### Example Output

```
## MCP Tool Execution Audit

**Organization: Acme Inc | Period: Feb 24 – Mar 25, 2026**

### Agent Summary

| Agent | Total Calls | Distinct Tools | Success Rate | Avg Latency | Calls/Session |
|-------|------------|---------------|-------------|-------------|--------------|
| Sales Discovery Bot | 423 | 8 | 🟢 97.2% | 340ms | 2.98 |
| Account Review Agent | 312 | 6 | 🟢 95.8% | 420ms | 3.18 |
| Support Triage Bot | 687 | 4 | 🟡 91.3% | 510ms | 3.38 |
| Onboarding Assistant | 198 | 5 | 🟢 98.5% | 290ms | 2.61 |

### Tool Breakdown: Support Triage Bot (Lowest Success Rate)

| Tool | Calls | Success Rate | Avg Latency | Status |
|------|-------|-------------|-------------|--------|
| crm_lookup | 312 | 🟢 96.2% | 380ms | Healthy |
| ticket_create | 198 | 🟡 88.4% | 620ms | 🟠 Watch |
| escalation_router | 134 | 🟡 86.6% | 710ms | 🟠 Watch |
| knowledge_search | 43 | 🟢 100% | 210ms | Healthy |

### Summary

Support Triage Bot has the highest call volume (687) but the lowest success rate (91.3%), driven by failures in `ticket_create` (88.4%) and `escalation_router` (86.6%). These two tools also have the highest latency, suggesting potential issues with the downstream services they connect to. Onboarding Assistant has the cleanest execution profile with 98.5% success and lowest latency.

### Recommendations

1. **ticket_create failures (88.4%)**: Investigate the 23 failed calls. Common causes include
   malformed payloads, authentication timeouts, or downstream service outages. Review error
   logs for the failed invocations to identify the root cause.

2. **escalation_router latency (710ms)**: This tool's latency is 2x the organization average.
   If the downstream routing service is slow, consider implementing caching or optimizing
   the routing logic to reduce response times.

3. **Support Triage Bot call volume**: At 3.38 calls per session, this agent may be making
   redundant tool calls. Audit whether some calls can be batched or eliminated by caching
   results within a session.
```

---

## Shared Rules

These rules apply to **all agent analytics skills** in this file.

### Data Integrity

1. **Never fabricate data.** If a tool returns empty or insufficient results, say so clearly. Do not invent scores, percentages, or agent names.
2. **Always present evidence.** Every claim in the output must trace back to a specific tool result. Do not make qualitative judgements without data backing.
3. **Distinguish between "no data" and "zero performance."** An agent with zero sessions in the time window is not "poor performing" -- it simply was not active. State this clearly.

### Comparison Rules

4. **When comparing agents, always present as a ranked table.** Sort by the primary metric relevant to the skill (composite score for ranker, yield for channel analysis, etc.).
5. **For single-agent queries, show trend over time.** Include period-over-period change with direction indicators (improving/stable/declining).
6. **Constitution compliance should always show before/after comparison.** Never show just the current version without historical context.
7. **For telephony outcomes, tie outcomes to signal yield.** Raw call counts without signal attribution are incomplete -- always connect outcomes to intelligence value.

### Access Control

8. **Admin/owner sees all agents.** No restrictions on which agents they can query.
9. **Regular users see only agents they have interacted with.** If a user requests data for an agent they have not used, explain the restriction and suggest contacting an admin.

### Output Formatting

10. **Use structured tables** for rankings, breakdowns, and comparisons.
11. **Use status indicators** consistently: 🟢 strong/good, 🟡 watch/adequate, 🟠 weak/declining, 🔴 critical/missing.
12. **Always include a Summary section** at the end -- 2-5 sentences, lead with the most important finding.
13. **Always include Recommendations** -- at least one actionable suggestion per weak area. Recommendations should be specific enough to act on ("review the agent's constitution for signal extraction prompts") not generic ("improve performance").
