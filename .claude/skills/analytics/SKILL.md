---
name: analytics
description: >
  Master analytics router for the Auron intelligence platform. Covers all analytical
  workflows across entity records, signals, organisation portfolio, agents, users, and
  sessions. Use when a user asks any question about account health, signal quality,
  engagement patterns, coverage gaps, agent performance, team activity, session
  narratives, portfolio risks, or any intelligence query against Auron data.
  Trigger phrases include: "show me", "what's the status of", "how is", "give me a
  report on", "analyse", "which accounts", "how many signals", "who is", "what changed",
  "where are the gaps", "how is the team performing", "what happened in this session",
  "run a health check", "find records with", "compare", "rank", "audit", "detect",
  "surface", "flag", "summarise", "what do we know about", "how confident", "trend".
metadata:
  author: Auron
  version: 1.0.0
  category: analytics-router
---

# Auron Analytics — Master Skill Router

This skill is the entry point for all analytical workflows on the Auron platform.
When a user asks an intelligence question, use this file to identify the correct
sub-skill and invoke it.

Skills are organised across six categories. Each entry lists:
- **What it does** — the analytical output
- **Business benefit** — why it matters
- **Trigger questions** — example phrases that should activate this skill

---

## How to Route

1. Read the user's question
2. Match intent to the closest skill below
3. Invoke the named sub-skill (load its SKILL.md from the corresponding folder)
4. If no single skill fits, combine two skills from the same category

If the question is genuinely ambiguous across categories, ask one clarifying
question: *"Are you asking about a specific account, a signal type, the
organisation overall, an agent, a user, or a particular session?"*

---

## How to Execute Analytics Queries

All analytics queries are executed through the **Explore API**. This is a two-step process: create a session, then send queries against it. You must complete both steps before you can retrieve any analytics data.

### Step 1: Create an Explore Session

Before any analytics query, you need a session token. Use the `api` skill to read stored configuration (environment, API key, organizationId).

```
POST {{BASE_URL}}/api/v1/explore/token
Headers:
  Authorization: Bearer <API_KEY>
Body:
  { "organizationId": "<organizationId>" }
```

Response:
```json
{
  "sessionToken": "explore_abc123...",
  "expiresAt": "2026-03-25T14:00:00Z"
}
```

Store the `sessionToken` — you will use it for all subsequent queries in this conversation. Sessions expire, so if a query returns `session_expired`, create a new session.

### Step 2: Send an Explore Query

Once you have a session token, send your analytics question as a natural language query with optional context parameters.

```
POST {{BASE_URL}}/api/v1/explore/query
Headers:
  X-Explore-Token: <sessionToken>
Body:
  {
    "question": "<natural language question based on the sub-skill>",
    "context": {
      "entityRecordId": "<optional — for entity-scoped queries>",
      "entityId": "<optional — for entity-type filtering>",
      "signalId": "<optional — for signal-specific queries>",
      "userId": "<optional — for user-specific queries>",
      "agentId": "<optional — for agent-specific queries>",
      "fromDate": "<optional — ISO 8601 start date>",
      "toDate": "<optional — ISO 8601 end date>"
    }
  }
```

Response:
```json
{
  "answer": "<natural language answer from the explore agent>",
  "data": null,
  "sources": ["entity_signal_profile", "entity_context_coverage"],
  "tokenUsage": { "promptTokens": 1200, "completionTokens": 450 }
}
```

### Key Rules for Query Execution

1. **Always create a session first.** Never send a query without a valid session token.
2. **Reuse session tokens.** Create one session per conversation and reuse it for all queries. Only create a new one if the previous session expires.
3. **Pass context parameters.** The more context you provide (entityRecordId, agentId, etc.), the more precise the answer. Omit parameters that are not relevant.
4. **Craft specific questions.** The explore agent internally selects from 60+ pre-built aggregation tools. A specific question ("What is the signal coverage percentage for this entity record, broken down by category?") will produce better results than a vague one ("Tell me about signals").
5. **Handle errors gracefully:**
   - `401 missing_api_key` → API key not provided, ask user to configure it via `api` skill
   - `401 invalid_api_key` → API key expired or invalid, ask user to generate a new one
   - `401 session_expired` → Session expired, create a new one (Step 1) and retry
   - `403 access_denied` → User does not have `explore_query` permission for this organization
   - `500 internal_error` → Retry once, then report the error to the user

---

## Initial Validation Checks and Rules

- User should be asked to select an organization on which they want to explore data
- Use the auron-api to see and validate that user has access to that organization
- For some specific analytics requests, we would need the user to select a specific entity.
- Use the auron-api to ensure that user has access to that entity.
- In some requests there is a request for a time windown within which the queries should run.
- If no time window is specific always assume last 30 days.
- Other parameters like signal, signal category, confidence, stale threshold days have defaults which can be used unless user overrides them specifically.
- When visualizing aggregate output, match the data shape to an appropriate chart type: timelines for trends, bar charts for comparisons, tables for ranked lists, gauges for scores/percentages.
- For user and agent specific queries there are a couple of additional rules to follow
    * If api key provided belongs to a user who is the admin/owner of the org they can query information on any user or agent
    * If not, they can only query their own information.
- If user gives the name of a org, agent, signal, signal category etc - always use the auron-api to get the associated id.
- If that fetch fails say user does not have access and stop. Dont try to do any workarounds.

## 🏢 Category 1 — Entity
> Scoped to a single entity record. Requires `entityRecordId` in context.

---

### Account Health Pulse
**What it does:** Composite health score assembled from signal coverage, velocity,
staleness, cadence, agent rotation, and session quality. Returns a health tier
(Strong / Watch / At Risk / Dark) plus plain-language recommendations.

**Business benefit:** Gives account owners an instant, evidence-based read on
whether an account needs intervention — without manually digging through signals.

**Trigger questions:**
- "How healthy is this account?"
- "Is this account at risk?"
- "Give me a health check on [entity]"
- "What's the status of this record?"
- "Run an account overview for me"
- "Should I be worried about this account?"

---

### Signal Coverage Check
**What it does:** Shows what percentage of expected signal categories have been
detected for this entity record, broken down by category.

**Business benefit:** Reveals structural intelligence gaps — signal categories
your agents are not capturing that they should be.

**Trigger questions:**
- "What signals are we missing for this account?"
- "How complete is our intelligence on this entity?"
- "What percentage of signal categories are covered?"
- "Where are the gaps in what we know?"
- "Which signal types haven't fired for this record?"

---

### Interaction Timeline
**What it does:** Chronological feed of all meetings, conversations, and calls
for an entity record with session metadata.

**Business benefit:** Provides a full interaction history in one view — essential
for account handovers, prep before calls, and understanding relationship history.

**Trigger questions:**
- "Show me the interaction history for this account"
- "When did we last speak to this entity?"
- "Give me a timeline of all sessions for this record"
- "What meetings have we had with this account?"
- "Walk me through the full history of this entity"

---

### Engagement Velocity Tracker
**What it does:** Current vs. prior period engagement velocity with a trend label
(Accelerating / Stable / Declining / Stalled).

**Business benefit:** Surfaces momentum changes before they become visible in CRM
data — a declining velocity is often the first signal of account risk.

**Trigger questions:**
- "Is engagement picking up or slowing down on this account?"
- "What's the velocity trend for this entity?"
- "Has activity increased compared to last month?"
- "Is this account trending in the right direction?"
- "Show me engagement momentum for this record"

---

### Cadence & Gap Analysis
**What it does:** Gap analysis between consecutive interactions — identifies
irregular cadence patterns and silence periods with severity rating.

**Business benefit:** Prevents accounts from going dark unnoticed. Long gaps
between interactions are a leading indicator of churn or deal stall.

**Trigger questions:**
- "How consistent is our engagement cadence with this account?"
- "Are there any dangerous gaps in our interaction history?"
- "When was the last meaningful touchpoint?"
- "How regular are our interactions with this entity?"
- "Flag any silence periods in this account's history"

---

### Channel Touchpoint Summary
**What it does:** Per-channel first and last touch dates, session counts, and
signal totals for meetings, conversations, and telephony.

**Business benefit:** Shows which channels are producing intelligence and which
are underutilised — informs where to invest interaction effort.

**Trigger questions:**
- "Which channels have we used to engage this account?"
- "What's the breakdown of meetings vs calls vs conversations?"
- "When did we first and last engage via each channel?"
- "How many sessions per channel for this entity?"
- "Show me channel coverage for this record"

---

### Agent Rotation Map
**What it does:** All agents that have handled this entity with session counts,
signal attribution per agent, and single-thread risk flag.

**Business benefit:** Identifies single-agent dependency risk — accounts covered
by only one agent are vulnerable to knowledge loss if that agent changes.

**Trigger questions:**
- "Which agents have worked with this account?"
- "Is this account dependent on a single agent?"
- "How is agent coverage distributed across this entity?"
- "Who has contributed signals to this record?"
- "Show me agent rotation for this account"

---

### Signal Co-occurrence View
**What it does:** Signal pairs that fired within the same session for this entity —
reveals which signals tend to appear together.

**Business benefit:** Uncovers compound intelligence patterns. When two signals
consistently co-occur, it often implies a deeper underlying dynamic worth naming.

**Trigger questions:**
- "Which signals tend to appear together for this account?"
- "Are there any signal pairs that keep firing together?"
- "Show me co-occurring signals for this entity"
- "What patterns emerge when I look at signals together?"

---

### Top Insights Extractor
**What it does:** Top verbatim insights per signal category, sorted by confidence,
for a single entity record.

**Business benefit:** Surfaces the highest-quality extracted intelligence from all
sessions in one place — the fastest way to brief someone on an account.

**Trigger questions:**
- "What are the most important things we know about this account?"
- "Give me the top insights from all sessions for this entity"
- "What has been captured about this record?"
- "Summarise the highest confidence intelligence on this account"
- "What do we actually know about this entity?"

---

### Session Quality Summary
**What it does:** Session quality metrics for an entity: feedback scores, starred
messages, message volume, and engagement depth across sessions.

**Business benefit:** Distinguishes high-quality intelligence-generating sessions
from low-signal interactions — helps identify which session types drive the most value.

**Trigger questions:**
- "How good are the sessions we're having with this account?"
- "Which sessions with this entity were most productive?"
- "What's the engagement quality like for this record?"
- "Are we having meaningful conversations with this account?"

---

### User Access Monitor
**What it does:** Internal users accessing this entity record with frequency,
recency, and single-thread risk detection.

**Business benefit:** Flags accounts that only one person has visibility into —
a key governance and continuity risk in enterprise accounts.

**Trigger questions:**
- "Who internally is looking at this account?"
- "Is this entity a single-person silo?"
- "Which team members have accessed this record?"
- "Show me internal access patterns for this entity"

---

### Stale Signal Audit
**What it does:** Signals not refreshed in 21+ days ranked by staleness severity
and last detection date for a specific entity record.

**Business benefit:** Prevents teams from acting on outdated intelligence.
Stale signals are silent risks — they look like knowledge but may no longer reflect reality.

**Trigger questions:**
- "Which signals for this account haven't been seen recently?"
- "Is the intelligence on this entity up to date?"
- "Are there stale signals I should be aware of?"
- "What hasn't been refreshed in the last month for this record?"
- "Flag any signals that might be out of date"

---

## 📡 Category 2 — Signal
> Scoped to signal behaviour, quality, and trends. Works at entity or org level.

---

### Signal Detection Frequency
**What it does:** Ranks all signals by detection count and average confidence
across the organisation.

**Business benefit:** Shows which signals are being captured reliably and which
are rare or inconsistent — informs constitution tuning priorities.

**Trigger questions:**
- "Which signals are we detecting most often?"
- "What are the most common signals across the organisation?"
- "Rank our signals by detection frequency"
- "Which signal types fire the most?"

---

### Confidence Distribution View
**What it does:** Histogram of signal confidence buckets (0.3–1.0) across
the organisation.

**Business benefit:** A skewed confidence distribution is a diagnostic signal —
too many low-confidence detections suggests extraction quality issues; too few
suggests overly conservative thresholds.

**Trigger questions:**
- "How confident are our signals overall?"
- "What does our signal confidence distribution look like?"
- "Are we detecting signals with high or low confidence?"
- "Show me a breakdown of confidence levels across all signals"

---

### Coverage by Entity Schema
**What it does:** Signal coverage breakdown by entity schema type — shows which
schemas have strong vs weak signal coverage.

**Business benefit:** Identifies schema-level blind spots. If one entity type
consistently has lower signal coverage, the constitution may need tuning for
that context.

**Trigger questions:**
- "How does signal coverage differ across entity types?"
- "Which entity schemas have the best signal detection?"
- "Are some record types getting less intelligence than others?"
- "Compare signal coverage across our entity schemas"

---

### Source Type Breakdown
**What it does:** Signal detection count split by source type — meetings vs
conversations vs telephony calls.

**Business benefit:** Shows where intelligence is actually being generated.
If one source type produces disproportionately few signals, it may indicate
a gap in the constitution or agent deployment.

**Trigger questions:**
- "Are we getting more signals from meetings or conversations?"
- "Which source type produces the most intelligence?"
- "Break down signal detection by meeting type"
- "How do meetings compare to calls for signal extraction?"

---

### Signal Co-occurrence (Org-wide)
**What it does:** Signal pair co-occurrence patterns across the entire organisation
— which signals consistently appear together.

**Business benefit:** Enables compound signal detection at scale — the foundation
for building composite intelligence rules and playbook triggers.

**Trigger questions:**
- "Which signals tend to appear together across all accounts?"
- "Are there any signal combinations we should be watching for?"
- "Show me org-wide signal co-occurrence patterns"
- "What signal pairs fire together most often?"

---

### First Detection by Agent
**What it does:** The first session in which each signal was detected, attributed
to the agent that extracted it.

**Business benefit:** Identifies which agents are breaking new intelligence ground
vs reinforcing existing knowledge — useful for agent performance benchmarking.

**Trigger questions:**
- "Which agent first detected each signal type?"
- "Who discovered our most important signals first?"
- "Show me signal first detection attribution by agent"

---

### Staleness Across Portfolio
**What it does:** Signal staleness analysis across all entity records — surfaces
portfolio-wide patterns in signal freshness.

**Business benefit:** Provides a macro view of intelligence decay risk. If many
entity records have the same signals going stale, it may indicate a systematic
engagement gap.

**Trigger questions:**
- "Which signals are going stale across our portfolio?"
- "Give me a staleness overview across all accounts"
- "Are there signals that haven't been refreshed anywhere recently?"
- "What's the freshness state of our intelligence portfolio?"

---

### Weekly Category Trend
**What it does:** Detection count and average confidence per signal category over
a rolling 12-week window.

**Business benefit:** Shows whether specific signal categories are improving,
degrading, or flat over time — the key metric for constitution performance
management.

**Trigger questions:**
- "How has signal detection trended over the last quarter?"
- "Are we getting better at detecting certain signal types?"
- "Show me weekly signal category trends"
- "Which signal categories are improving or declining?"

---

### Signal Conflict Resolver
**What it does:** Detects contradictory insights in the same signal category
across different sessions for an entity.

**Business benefit:** Surfaces intelligence that cannot both be true — prompts
the team to validate which version reflects current reality before acting on it.

**Trigger questions:**
- "Are there any conflicting signals for this account?"
- "Do any signals contradict each other?"
- "Is there conflicting intelligence on this entity?"
- "Show me where signals disagree for this record"
- "Flag any signal conflicts I should investigate"

---

### Corroboration Finder
**What it does:** Identifies signal categories independently confirmed across two
or more sessions for an entity.

**Business benefit:** Elevates signal reliability. Intelligence corroborated across
multiple sessions is more actionable than single-session detections.

**Trigger questions:**
- "Which signals have been confirmed across multiple sessions?"
- "What intelligence is corroborated for this account?"
- "Show me signals that have fired more than once"
- "Which signals are the most reliable for this entity?"

---

### Low Confidence Cluster Detector
**What it does:** Finds clusters of individually low-confidence signals that
collectively suggest a real pattern.

**Business benefit:** Recovers intelligence that would otherwise be discarded.
Three weak signals pointing the same direction are often more meaningful than
one high-confidence detection.

**Trigger questions:**
- "Are there weak signals that together suggest something important?"
- "Show me low confidence signal clusters"
- "Are we missing anything by discarding low confidence signals?"
- "Detect any emerging patterns from uncertain signals"

---

### Recency Drift Detector
**What it does:** Identifies signal categories that have gone quiet or weakened
in confidence over recent sessions.

**Business benefit:** Early warning system for changing account dynamics.
A signal that was strong and is now fading often indicates a real shift in
the entity's situation.

**Trigger questions:**
- "Which signals are getting weaker over time for this account?"
- "Are any signal categories going quiet?"
- "Detect recency drift in our signal profile"
- "Show me signals that were strong before but aren't anymore"

---

### Insight Volatility Scanner
**What it does:** Finds signal categories whose extracted insights keep changing
across sessions — unstable intelligence.

**Business benefit:** Flags intelligence you cannot rely on for decision-making.
Volatile insights indicate either a genuinely changing situation or inconsistent
extraction.

**Trigger questions:**
- "Which signals keep changing their meaning across sessions?"
- "Show me signals with volatile or inconsistent insights"
- "Is the intelligence on this account stable?"
- "Flag any signals where the insights keep shifting"

---

### Source Concentration Risk
**What it does:** Identifies sessions or speakers that are responsible for a
disproportionate share of the entity's signal profile.

**Business benefit:** Signals over-reliance on a single session or contact.
If one conversation is driving 80% of the intelligence, the profile is fragile.

**Trigger questions:**
- "Is our signal profile for this account over-reliant on one session?"
- "Are we getting signals from a diverse range of interactions?"
- "Detect source concentration risk for this entity"
- "Which session or speaker dominates our signal profile?"

---

### Orphaned High Confidence Finder
**What it does:** Finds high-confidence signals with no corroboration across other
sessions — strong but isolated detections.

**Business benefit:** Separates signals that deserve follow-up investigation from
those that are simply well-corroborated. A lone high-confidence signal is a
hypothesis, not a fact.

**Trigger questions:**
- "Are there any high confidence signals that haven't been confirmed elsewhere?"
- "Show me orphaned signals for this account"
- "Which strong signals are one-off detections?"
- "Find high confidence signals that appear only once"

---

## 🌐 Category 3 — Org
> Scoped to the whole organisation. No entity context required.

---

### Portfolio Health Overview
**What it does:** Entity portfolio health scores across all records with tier
breakdown (Strong / Watch / At Risk / Dark) and count per tier.

**Business benefit:** Gives leadership a macro view of portfolio intelligence
health — how many accounts are well-covered vs at risk.

**Trigger questions:**
- "How healthy is our account portfolio overall?"
- "How many accounts are at risk?"
- "Give me a portfolio health overview"
- "What percentage of our entities are well-covered?"
- "Show me the health tier breakdown across all records"

---

### Monthly Interaction Volume
**What it does:** Month-by-month interaction volume across meetings, conversations,
and calls org-wide.

**Business benefit:** Tracks overall engagement activity trends — rising or falling
volume is a leading indicator of pipeline health.

**Trigger questions:**
- "How has our interaction volume trended?"
- "Are we having more or fewer conversations month over month?"
- "Show me monthly activity across the organisation"
- "Is engagement volume up or down?"

---

### Credit Consumption Breakdown
**What it does:** Platform credit consumption split by source type with period
comparison.

**Business benefit:** Informs budgeting and identifies where platform usage is
concentrated — useful for cost allocation and anomaly detection.

**Trigger questions:**
- "Where are our platform credits being consumed?"
- "Show me credit usage by source type"
- "Which parts of the platform are using the most credits?"
- "Are there any credit consumption anomalies?"

---

### Team Interaction Coverage
**What it does:** Team-level interaction coverage across entity records — which
teams are engaging with which accounts.

**Business benefit:** Reveals coverage gaps and overlaps across teams — essential
for territory planning and account assignment reviews.

**Trigger questions:**
- "Which teams are covering which accounts?"
- "Are there accounts no team is actively engaging?"
- "Show me team coverage across our entity portfolio"
- "How is account coverage distributed across teams?"

---

### Signal Category Adoption
**What it does:** Detection rates for each signal category across the organisation
— which categories are performing vs underperforming.

**Business benefit:** The core metric for constitution effectiveness. If a signal
category has near-zero adoption, something is wrong with the extraction rules or
the question design.

**Trigger questions:**
- "Which signal categories are being detected across the org?"
- "Are there any signal types that never fire?"
- "Show me signal category adoption rates"
- "Which parts of our constitution aren't working?"
- "What signal categories have low adoption?"

---

### Label Usage Distribution
**What it does:** Label usage across conversations, entities, and signals —
frequency and distribution.

**Business benefit:** Surfaces whether tagging and labelling practices are
consistent or fragmented across the organisation.

**Trigger questions:**
- "How are labels being used across the platform?"
- "Which labels are used most frequently?"
- "Show me label distribution across entities and signals"
- "Is labelling consistent across the team?"

---

### Member Engagement Ranking
**What it does:** Organisation member engagement ranking by session count,
messages, and signal contribution.

**Business benefit:** Identifies the most and least active platform users —
informs adoption tracking and training prioritisation.

**Trigger questions:**
- "Who is most active on the platform?"
- "Show me team engagement rankings"
- "Which members are contributing the most signals?"
- "Who are the top and bottom platform users?"
- "Rank team members by their platform engagement"

---

### Cross-Entity Shared Signals
**What it does:** Signals detected across multiple entity records — pattern
detection at portfolio scale.

**Business benefit:** Surfaces market-level themes. If the same signal fires
across ten accounts, it may reflect a sector-wide dynamic worth addressing.

**Trigger questions:**
- "Are the same signals appearing across multiple accounts?"
- "Show me signals that span multiple entities"
- "Are there portfolio-wide signal patterns?"
- "Which signals are we seeing across accounts?"

---

### Zero Signal Record Finder
**What it does:** Entity records that have never had a signal detected —
intelligence blind spots.

**Business benefit:** Identifies accounts that have been engaged but never
yielded any structured intelligence. These are the highest-priority gaps.

**Trigger questions:**
- "Which accounts have no signals at all?"
- "Show me entity records with zero signal extraction"
- "Find our intelligence blind spots"
- "Which records have we never extracted anything from?"

---

### Context Desert Scanner
**What it does:** Entity records with no context data attached — no signals,
no interaction history, no coverage of any kind.

**Business benefit:** The most severe coverage gap — accounts that exist in the
system but are completely dark. Prioritise for immediate engagement.

**Trigger questions:**
- "Which accounts have no data at all?"
- "Find records with no context attached"
- "Show me completely empty entity records"
- "Which entities are total blind spots?"

---

### High Velocity / No Signal Alert
**What it does:** Entity records showing high engagement velocity but no recent
signal extraction — fast-moving accounts with no intelligence.

**Business benefit:** The highest-risk combination. These accounts are active but
producing no captured intelligence — a signal extraction failure on your most
engaged accounts.

**Trigger questions:**
- "Which active accounts aren't generating signals?"
- "Show me high velocity accounts with no recent signal activity"
- "Are there accounts we're talking to but not capturing intelligence from?"
- "Flag accounts where engagement is high but signals are absent"

---

### Schema Signal Coverage Comparison
**What it does:** Side-by-side signal coverage comparison across entity schema
types.

**Business benefit:** Identifies whether certain entity types are structurally
under-served by the current constitution — a prerequisite for schema-level tuning.

**Trigger questions:**
- "How does signal coverage compare across entity types?"
- "Are some schemas getting better coverage than others?"
- "Compare signal extraction across our entity schemas"
- "Which entity type has the worst signal coverage?"

---

### Multi-Team Account Monitor
**What it does:** Entity records being accessed or engaged by more than one team
— coordination and overlap detection.

**Business benefit:** Prevents conflicting engagement from multiple teams on the
same account — a common problem in enterprise sales and success motions.

**Trigger questions:**
- "Which accounts are multiple teams touching?"
- "Are there coordination risks across our portfolio?"
- "Show me accounts with multi-team access"
- "Flag accounts where more than one team is engaged"

---

### Top Accounts by Intelligence Score
**What it does:** Ranks entity records by composite intelligence score across
signal volume, confidence, coverage, and freshness.

**Business benefit:** Quickly surfaces the accounts with the richest, most
reliable intelligence — useful for case study selection, reference accounts,
and expansion targeting.

**Trigger questions:**
- "Which accounts have the best intelligence coverage?"
- "Rank our accounts by intelligence quality"
- "Show me our best-covered entity records"
- "Which accounts have the highest intelligence scores?"

---

## 🤖 Category 4 — Agent
> Scoped to agent performance and operational behaviour.

---

### Agent Performance Ranker
**What it does:** Ranks agents by sessions handled, total signals extracted,
average confidence, and signal yield per session.

**Business benefit:** The primary agent benchmarking view. Identifies top
performers and surfaces agents whose yield is below expectations.

**Trigger questions:**
- "Which agents are performing best?"
- "Rank our agents by signal extraction quality"
- "Show me agent performance across the platform"
- "Which agent has the highest signal yield?"
- "How do our agents compare to each other?"

---

### Signal Yield by Channel
**What it does:** Per-agent signal extraction rate broken down by channel type —
meetings, conversations, and telephony.

**Business benefit:** Reveals whether agents perform consistently across channels
or have specific channel strengths and weaknesses.

**Trigger questions:**
- "Which channel produces the most signals per agent?"
- "Are agents better at meetings or conversations?"
- "Break down signal yield by channel for each agent"
- "Show me per-channel performance across agents"

---

### Entity Record Coverage
**What it does:** Count of distinct entity records each agent has interacted with
over a time window.

**Business benefit:** Identifies agents with narrow vs broad portfolio coverage —
useful for workload balancing and ensuring no agent is siloed on a small set of accounts.

**Trigger questions:**
- "How many accounts is each agent covering?"
- "Which agent has the broadest entity coverage?"
- "Show me entity record coverage per agent"
- "Are any agents only working on a small number of accounts?"

---

### Constitution Version Compliance
**What it does:** Agent confidence trends correlated with constitution version
changes — tracks whether new constitution versions improve or degrade extraction.

**Business benefit:** The primary feedback loop for constitution management.
Validates that constitution updates are actually improving agent performance.

**Trigger questions:**
- "Has the latest constitution update improved agent performance?"
- "How has confidence changed across constitution versions?"
- "Show me the impact of constitution changes on agent output"
- "Are agents performing better or worse after the last update?"

---

### Telephony Call Outcome Analyzer
**What it does:** Call outcome breakdown per agent — completed, no answer,
voicemail, callback — with signal attribution per outcome type.

**Business benefit:** Ties telephony outcomes to intelligence yield — identifies
which call dispositions are actually producing signal extraction.

**Trigger questions:**
- "How are agents performing on telephony?"
- "Which call outcomes are producing signals?"
- "Show me call outcome breakdown by agent"
- "Are agents generating intelligence from phone calls?"

---

### Knowledge Store Utilisation
**What it does:** Tracks how frequently each agent draws from the knowledge store
during sessions, with utilisation rate and coverage.

**Business benefit:** Low knowledge store utilisation suggests agents are not
leveraging available context — a gap between stored intelligence and active use.

**Trigger questions:**
- "Are agents using the knowledge store effectively?"
- "Which agents use the knowledge store the most?"
- "Show me knowledge store utilisation per agent"
- "Are agents drawing on existing intelligence during sessions?"

---

### MCP Tool Execution Auditor
**What it does:** Frequency and pattern of MCP tool calls per agent — which tools
are being invoked and how often.

**Business benefit:** Surfaces agents that are not leveraging available tools,
and identifies tools that may be over or under-utilised across the platform.

**Trigger questions:**
- "Which MCP tools are agents using?"
- "Are agents using all available tools?"
- "Show me tool execution frequency by agent"
- "Which tools are being underutilised?"
- "Audit MCP tool usage across our agents"

---

## 👤 Category 5 — User
> Scoped to individual internal users — activity, accuracy, and engagement.

---

### User Activity Digest
**What it does:** Summary of sessions initiated, messages sent, and signals
contributed for a specific user over a defined time window.

**Business benefit:** Tracks individual platform engagement and productivity —
useful for adoption reviews, performance conversations, and identifying power users.

**Trigger questions:**
- "What has [user] been doing on the platform?"
- "Show me activity for a specific team member"
- "How active is this user over the last month?"
- "Give me a summary of sessions and contributions for this user"

---

### Entity Records Touched
**What it does:** Entity records a specific user has interacted with, with
recency and depth of engagement.

**Business benefit:** Maps a user's account footprint — who they're engaging
with and whether that aligns with their assigned portfolio.

**Trigger questions:**
- "Which accounts has this user been working on?"
- "Show me the entity records this user has touched"
- "What accounts is this person engaged with?"
- "Map this user's account interactions"

---

### Session Quality Over Time
**What it does:** Session quality metrics for a specific user tracked over time —
engagement scores, message quality, and signal contribution rate.

**Business benefit:** Identifies whether a user's session quality is improving,
plateauing, or declining — the key input for coaching conversations.

**Trigger questions:**
- "Is this user's session quality improving?"
- "How has this person's performance trended over time?"
- "Show me session quality trends for this user"
- "Is this user getting better at running sessions?"

---

### Pinned Records Engagement
**What it does:** Engagement depth on a user's pinned entity records — how
actively they are working their priority accounts.

**Business benefit:** Validates that pinned records are actually being worked.
A user with many pinned accounts but low engagement is a workflow alignment issue.

**Trigger questions:**
- "Is this user actively working their pinned accounts?"
- "Show me engagement on pinned records for this user"
- "Are pinned accounts getting enough attention from this person?"

---

### Signal Detection Accuracy
**What it does:** Ratio of high to low confidence signals contributed by a user —
extraction accuracy benchmarking.

**Business benefit:** Identifies users whose interactions consistently produce
high-quality signals vs those whose sessions yield lower-confidence extractions.
Informs coaching and session design.

**Trigger questions:**
- "How accurate is this user's signal detection?"
- "What's the confidence profile of signals this user generates?"
- "Is this user's session producing high or low quality intelligence?"
- "Compare signal accuracy across team members"

---

### Cross-Entity Coverage
**What it does:** Breadth of a user's engagement across entity types and schemas —
how many different entity categories they are covering.

**Business benefit:** Identifies users who are specialised vs those with broad
portfolio coverage — informs territory design and knowledge risk.

**Trigger questions:**
- "How broadly is this user engaged across entity types?"
- "Is this user covering a diverse set of accounts?"
- "Show me cross-entity coverage for this user"

---

### Telephony Patterns
**What it does:** Call frequency, average duration, call outcome distribution,
and signal yield per call for a specific user.

**Business benefit:** Surfaces telephony-specific performance — whether a user
is generating intelligence from calls or treating telephony as a low-yield channel.

**Trigger questions:**
- "How is this user performing on calls?"
- "Show me telephony patterns for this user"
- "What does this person's call activity look like?"
- "Are this user's calls producing signals?"

---

### Last Active Per Entity
**What it does:** The last date a specific user was active on each entity record
they have previously touched.

**Business benefit:** Quickly surfaces accounts a user has dropped — useful for
account review meetings and preventing relationship gaps from forming silently.

**Trigger questions:**
- "Which accounts has this user not touched recently?"
- "Show me last active dates per account for this user"
- "Are there accounts this user used to work that have gone quiet?"
- "When was this user last active on each of their accounts?"

---

## 🎙️ Category 6 — Session
> Scoped to a single meeting or conversation. Requires `sourceId` and `sourceType`.

---

### Session Arc Synthesizer
**What it does:** Three-part narrative arc for a session: opening posture,
mid-session shifts, and closing posture — synthesised from signals and transcript.

**Business benefit:** Replaces the need to read a full transcript. Gives the
reader the shape of what happened and what shifted — in under two minutes.

**Trigger questions:**
- "What happened in this meeting?"
- "Give me a session narrative for this call"
- "Walk me through this conversation"
- "What was the arc of this session?"
- "Debrief this meeting for me"
- "What shifted during this conversation?"

---

### Coverage Gap Detector
**What it does:** Finds agent questions in a session where the user gave a
substantive response but no signal was extracted.

**Business benefit:** Identifies missed extraction opportunities — questions
that generated useful answers but where the Signal Extractor did not fire.
The primary tool for improving constitution recall.

**Trigger questions:**
- "Did we miss any signal extractions in this session?"
- "Were there answers that should have produced signals but didn't?"
- "Show me coverage gaps in this conversation"
- "Where did the agent ask good questions but we didn't capture the answer?"

---

### Session Absence Finder
**What it does:** Identifies user utterances that discussed signal-relevant
topics but produced no extraction at all — missed signals not linked to any
agent question.

**Business benefit:** Surfaces spontaneous intelligence the entity volunteered
that the extractor missed. Different from coverage gaps — these are unprompted
disclosures.

**Trigger questions:**
- "Did the entity say anything important that we didn't capture?"
- "Show me utterances that should have triggered signals but didn't"
- "What did we miss extracting from this session?"
- "Find any spontaneous disclosures we didn't capture"

---

### Composite Signal Analyst
**What it does:** Finds emergent patterns where three or more signals of
different types together imply an observation that none individually triggered.

**Business benefit:** Recovers compound intelligence that no single signal rule
would surface. The analytical layer above raw signal extraction.

**Trigger questions:**
- "Are there any patterns in this session's signals that imply something bigger?"
- "What do the signals in this session collectively suggest?"
- "Show me emergent patterns from the signals in this conversation"
- "Is there a composite picture forming from these signals?"

---

### Orphan Rationale Finder
**What it does:** Finds signals whose reasoning references context or entities
that no other signal connects to — isolated reasoning chains.

**Business benefit:** Surfaces signals that may be technically correct but
contextually isolated — a quality indicator and a prompt to validate the
extraction reasoning.

**Trigger questions:**
- "Are there signals in this session whose reasoning doesn't connect to anything else?"
- "Show me orphaned signal rationale for this session"
- "Find signals where the reasoning seems disconnected"
- "Are there any signals with unexplained or isolated reasoning?"

---

### Meeting vs Call Quality
**What it does:** Side-by-side signal quality comparison between structured
meetings and telephony calls — confidence, volume, and category coverage.

**Business benefit:** Answers the format question — are structured meetings
producing better intelligence than unstructured calls, or vice versa?
Informs session design decisions.

**Trigger questions:**
- "Do we get better signals from meetings or calls?"
- "Compare signal quality between meetings and telephony"
- "Is one session format better than another for intelligence extraction?"
- "Show me signal quality by session type"
- "Are calls or meetings more productive for signal extraction?"
