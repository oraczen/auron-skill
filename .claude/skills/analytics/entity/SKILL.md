---
name: analytics-entity
description: >
  Detailed analytics skills scoped to a single entity record. Covers Account Health
  Pulse, Signal Coverage Check, and all other entity-level analytical workflows.
  Use when the user asks about the health, coverage, engagement, signals, or
  intelligence quality of a specific account or entity record.
metadata:
  author: Auron
  version: 1.0.0
  category: analytics-entity
---

Important: Please read `auron-docs` and `api` skills before running entity analytics. You need an organizationId, an entityRecordId, a valid API key, and a valid session token.

# Entity Analytics

Entity analytics are scoped to a **single entity record**. Every skill in this file requires an `organizationId` and an `entityRecordId` to operate. These skills answer questions like "how healthy is this account?", "what signals are we missing?", and "is engagement trending up or down?"

All entity analytics work by querying the Explore API with the appropriate context. The Explore API internally selects the right pre-built aggregation tools for each question.

---

## Required Inputs

Every entity analytics skill requires the following inputs. **You must collect all required inputs before making any query.** Never guess or assume values.

| Input | Required | Description | How to obtain |
|-------|----------|-------------|---------------|
| `organizationId` | Yes | The organization scope for all data | Ask the user to select their organization. Use the `api` skill to list organizations if needed. |
| `entityRecordId` | Yes | The specific account or record to analyze | Ask the user which account or entity record they are asking about. If ambiguous, list entity records and ask them to pick one. |
| `fromDate` | No | Start of time window (ISO 8601) | Ask the user if they want to scope the analysis to a specific time range. Default: all time. |
| `toDate` | No | End of time window (ISO 8601) | Same as above. Default: now. |

### Input Collection Rules

1. If the user says "this account" or "this entity" but no `entityRecordId` is in context, **ask them to specify which account**.
2. If the user gives a name instead of an ID, search entity records by name and confirm the match before proceeding.
3. Never proceed with a query if `organizationId` or `entityRecordId` is missing.
4. If the user has previously selected an organization in the conversation, reuse it — do not ask again.

---

## Account Health Pulse

### What It Does

Produces a composite health score for an entity record by assessing seven dimensions of intelligence quality. Returns a health tier classification with a per-dimension breakdown and plain-language recommendations.

### When to Use

Trigger this skill when the user asks questions like:
- "How healthy is this account?"
- "Is this account at risk?"
- "Give me a health check on [entity]"
- "What's the status of this record?"
- "Run an account overview for me"
- "Should I be worried about this account?"

### Health Dimensions

The health score is assembled from seven dimensions. Each dimension is scored independently and contributes to the overall tier.

| # | Dimension | What It Measures | Explore Tool |
|---|-----------|-----------------|--------------|
| 1 | Signal Coverage | % of expected signal categories that have been detected | `entity_context_coverage` |
| 2 | Signal Confidence | Average confidence score across all detected signals | `entity_signal_profile` |
| 3 | Engagement Velocity | Current vs prior period interaction rate with trend direction | `entity_velocity_score` |
| 4 | Interaction Cadence | Regularity of engagement and presence of dangerous silence gaps | `entity_cadence_and_gaps` |
| 5 | Agent Rotation | Number of agents covering the account and single-agent risk | `entity_agent_rotation` |
| 6 | Session Quality | Feedback scores, starred messages, engagement depth | `entity_engagement_quality` |
| 7 | Signal Freshness | How many signals are stale (not refreshed in 21+ days) | `entity_stale_signals` |

### Scoring Rubric

Each dimension receives a score from 0 to 100 based on the data returned by its explore tool.

**Signal Coverage**
- 80–100: 80%+ of expected categories detected
- 50–79: 50–79% of categories detected
- 20–49: 20–49% of categories detected
- 0–19: Less than 20% of categories detected

**Signal Confidence**
- 80–100: Average confidence ≥ 0.8
- 50–79: Average confidence 0.5–0.79
- 20–49: Average confidence 0.3–0.49
- 0–19: Average confidence < 0.3 or no signals

**Engagement Velocity**
- 80–100: Accelerating (current period > prior period by 20%+)
- 50–79: Stable (within ±20% of prior period)
- 20–49: Declining (current period < prior period by 20–50%)
- 0–19: Stalled (current period < prior period by 50%+ or zero activity)

**Interaction Cadence**
- 80–100: Regular cadence, no gaps > 14 days
- 50–79: Mostly regular, occasional gaps of 14–30 days
- 20–49: Irregular, gaps of 30–60 days present
- 0–19: Highly irregular or gaps > 60 days

**Agent Rotation**
- 80–100: 3+ agents with balanced session distribution
- 50–79: 2 agents or 3+ with unbalanced distribution
- 20–49: Single agent with moderate session count
- 0–19: Single agent with few sessions (single-thread risk)

**Session Quality**
- 80–100: Consistently high feedback scores, frequent starred messages
- 50–79: Mixed feedback, some starred messages
- 20–49: Low feedback scores, few starred messages
- 0–19: No feedback data or consistently poor quality

**Signal Freshness**
- 80–100: Less than 10% of signals are stale
- 50–79: 10–30% of signals are stale
- 20–49: 30–60% of signals are stale
- 0–19: More than 60% of signals are stale or no signals at all

### Health Tier Classification

The overall health tier is determined by the **weighted average** of all dimension scores:

| Tier | Score Range | Meaning |
|------|-------------|---------|
| **Strong** | 75–100 | Account is well-covered with fresh, high-quality intelligence |
| **Watch** | 50–74 | Account has some gaps or declining trends — monitor closely |
| **At Risk** | 25–49 | Significant intelligence gaps or staleness — intervention needed |
| **Dark** | 0–24 | Little to no usable intelligence on this account |

Dimension weights (equal by default):
- Signal Coverage: 1x
- Signal Confidence: 1x
- Engagement Velocity: 1x
- Interaction Cadence: 1x
- Agent Rotation: 1x
- Session Quality: 1x
- Signal Freshness: 1x

### Workflow

1. Collect `organizationId` and `entityRecordId` from the user (see Required Inputs above)
2. Query **all seven explore tools** listed in the Health Dimensions table, passing `organizationId` and `entityRecordId` as context
3. Score each dimension using the Scoring Rubric
4. Compute the weighted average to determine the overall Health Tier
5. Identify the **two weakest dimensions** as priority areas for improvement
6. Generate plain-language recommendations for each weak dimension
7. Present the results in the output format below

### Example Output

```
## Account Health Pulse: Acme Corp

**Overall Health: Watch (Score: 62/100)**

| Dimension | Score | Status |
|-----------|-------|--------|
| Signal Coverage | 72 | 🟡 6 of 9 expected categories detected |
| Signal Confidence | 81 | 🟢 Average confidence: 0.83 |
| Engagement Velocity | 45 | 🟠 Declining — 32% fewer interactions vs prior period |
| Interaction Cadence | 68 | 🟡 Last interaction 18 days ago, one 25-day gap in history |
| Agent Rotation | 35 | 🟠 Single agent (Sarah K.) handles all sessions |
| Session Quality | 78 | 🟢 Strong feedback scores, 4 starred messages |
| Signal Freshness | 55 | 🟡 3 of 11 signals not refreshed in 21+ days |

### Priority Recommendations

1. **Agent Rotation (35)**: This account is covered by a single agent. If Sarah K. is
   unavailable, institutional knowledge is at risk. Assign a second agent to upcoming
   sessions to build shared context.

2. **Engagement Velocity (45)**: Interaction frequency has dropped 32% compared to the
   prior period. Consider scheduling a proactive check-in to re-establish cadence before
   the account goes dark.

### Summary

Acme Corp has strong signal confidence and session quality, but engagement is declining
and the account is dependent on a single agent. The most urgent action is diversifying
agent coverage to reduce single-thread risk. Re-establishing regular cadence should be
the secondary priority.
```

---

## Signal Coverage Check

### What It Does

Shows what percentage of expected signal categories have been detected for a specific entity record, broken down by category. Identifies which signal categories are covered, which are missing, and rates the severity of each gap.

### When to Use

Trigger this skill when the user asks questions like:
- "What signals are we missing for this account?"
- "How complete is our intelligence on this entity?"
- "What percentage of signal categories are covered?"
- "Where are the gaps in what we know?"
- "Which signal types haven't fired for this record?"

### Coverage Dimensions

| Aspect | What It Measures | Explore Tool |
|--------|-----------------|--------------|
| Category Coverage | % of signal categories with at least one detection | `entity_context_coverage` |
| Detection Depth | Number of detections per covered category | `entity_signal_profile` |
| Confidence Profile | Average confidence per covered category | `entity_signal_profile` |

### Coverage Classification

Each signal category for the entity record is classified into one of four states:

| State | Definition | Indicator |
|-------|-----------|-----------|
| **Strong** | 3+ detections with average confidence ≥ 0.7 | Category is well-covered and reliable |
| **Adequate** | 1–2 detections with average confidence ≥ 0.5 | Category has been detected but needs more corroboration |
| **Weak** | 1+ detections with average confidence < 0.5 | Category detected but low quality — may not be actionable |
| **Missing** | Zero detections | Category has never been detected for this entity record |

### Gap Severity

Missing categories are rated by severity based on whether other entity records of the same type have detections in that category:

| Severity | Definition |
|----------|-----------|
| **Critical** | Category is detected for 70%+ of similar entity records but missing here |
| **Moderate** | Category is detected for 30–69% of similar entity records but missing here |
| **Low** | Category is detected for less than 30% of similar entity records — may be uncommon |

### Workflow

1. Collect `organizationId` and `entityRecordId` from the user (see Required Inputs above)
2. Query `entity_context_coverage` to get the category coverage breakdown
3. Query `entity_signal_profile` to get detection counts and confidence per category
4. Classify each category into Strong / Adequate / Weak / Missing using the table above
5. For missing categories, determine gap severity by comparing against coverage across similar entity records
6. Present the results in the output format below

### Example Output

```
## Signal Coverage Check: Acme Corp

**Overall Coverage: 67% (6 of 9 categories detected)**

### Covered Categories

| Category | Detections | Avg Confidence | Status |
|----------|-----------|----------------|--------|
| Budget & Spend | 5 | 0.88 | 🟢 Strong |
| Decision Process | 4 | 0.76 | 🟢 Strong |
| Pain Points | 3 | 0.71 | 🟢 Strong |
| Competitive Landscape | 2 | 0.65 | 🟡 Adequate |
| Timeline & Urgency | 1 | 0.58 | 🟡 Adequate |
| Technical Requirements | 1 | 0.42 | 🟠 Weak |

### Missing Categories

| Category | Gap Severity | Notes |
|----------|-------------|-------|
| Stakeholder Map | 🔴 Critical | Detected in 85% of similar records — likely a coverage gap |
| Risk & Blockers | 🔴 Critical | Detected in 72% of similar records — likely a coverage gap |
| Success Metrics | 🟡 Moderate | Detected in 45% of similar records |

### Recommendations

1. **Stakeholder Map** (Critical): This is the most common gap. Agents should ask directly
   about decision-makers, influencers, and champions in upcoming sessions. Example:
   "Who else is involved in evaluating this?"

2. **Risk & Blockers** (Critical): Asking about potential obstacles or concerns in the next
   session should surface signals in this category. Example: "What could prevent this
   from moving forward?"

3. **Technical Requirements** (Weak): The single detection has low confidence (0.42).
   Consider asking more specific technical questions to strengthen this category.

### Summary

Acme Corp has strong coverage in financial and decision-related signal categories, but
is missing stakeholder and risk intelligence that is present for most similar accounts.
Prioritise stakeholder mapping and risk/blocker questions in upcoming sessions to close
the two critical gaps.
```

---

## Interaction Timeline

### What It Does

Produces a chronological feed of all meetings, conversations, and calls associated with an entity record. Each entry includes the date, channel, participating agents, and a brief content summary so the user can trace exactly what happened and when.

### When to Use

Trigger this skill when the user asks questions like:
- "Show me the interaction history for this account"
- "When did we last speak to this entity?"
- "Give me a timeline of all touchpoints"
- "What conversations have we had with this account?"
- "List every meeting and call for this record"

### Timeline Entry Dimensions

| Aspect | What It Captures | Explore Tool |
|--------|-----------------|--------------|
| Interaction Log | Date, channel, direction, participants, summary | `entity_interaction_timeline` |

### Workflow

1. Collect `organizationId` and `entityRecordId` from the user (see Required Inputs above)
2. If the user specified a date range, pass `fromDate` and `toDate`; otherwise retrieve all interactions
3. Query `entity_interaction_timeline` with the collected context
4. Sort results in reverse chronological order (most recent first)
5. Group by month or week if the list exceeds 20 entries, to keep the output scannable
6. Present the results in the output format below

### Example Output

```
## Interaction Timeline: Acme Corp

**Total Interactions: 14** (showing last 90 days)

| Date | Channel | Direction | Agent | Summary |
|------|---------|-----------|-------|---------|
| 2026-03-18 | Meeting | — | Sarah K. | Quarterly review; discussed renewal pricing and expansion timeline |
| 2026-03-10 | Conversation | Inbound | Sarah K. | Customer asked about SSO integration and data export options |
| 2026-03-02 | Telephony | Outbound | James R. | Follow-up on support ticket #4821; issue resolved |
| 2026-02-22 | Meeting | — | Sarah K. | Product demo for new analytics module with VP Engineering |
| 2026-02-14 | Conversation | Inbound | Sarah K. | Billing inquiry — clarified pro-rated charges for mid-cycle upgrade |
| 2026-02-03 | Telephony | Outbound | James R. | Proactive check-in after service disruption on 2026-01-30 |
| 2026-01-20 | Meeting | — | Sarah K. | Kickoff for Phase 2 implementation |

### Summary

Acme Corp has had 14 interactions over the last 90 days across three channels. Meetings
are the most frequent touchpoint (5 of 14), followed by conversations (5) and telephony
calls (4). The most recent interaction was a quarterly review on 2026-03-18. Two agents
(Sarah K. and James R.) have participated.

### Recommendations

1. **Document key outcomes**: The quarterly review on 2026-03-18 covered renewal pricing —
   ensure action items and decisions are captured so follow-up can be tracked.

2. **Balance channel usage**: Most strategic discussions happen in meetings. Consider using
   asynchronous conversations for routine updates to free meeting time for high-value
   discussions.
```

---

## Engagement Velocity Tracker

### What It Does

Compares the interaction rate between the current period and a prior period of equal length, producing a velocity score and trend label. Helps determine whether engagement with an entity is accelerating, holding steady, declining, or has stalled entirely.

### When to Use

Trigger this skill when the user asks questions like:
- "Is engagement picking up or slowing down?"
- "What's the velocity trend for this account?"
- "Has activity increased recently?"
- "Are we engaging more or less than before?"
- "How does this month compare to last month?"

### Velocity Classification

| Trend Label | Definition | Indicator |
|-------------|-----------|-----------|
| **Accelerating** | Current period interactions exceed prior period by 20%+ | 🟢 Positive momentum |
| **Stable** | Current period within ±20% of prior period | 🟡 Holding steady |
| **Declining** | Current period is 20–50% below prior period | 🟠 Losing momentum |
| **Stalled** | Current period is 50%+ below prior period, or zero activity | 🔴 Engagement at risk |

### Workflow

1. Collect `organizationId` and `entityRecordId` from the user (see Required Inputs above)
2. Determine the comparison window: default is current 30 days vs prior 30 days; respect `fromDate`/`toDate` if the user specifies a custom range
3. Query `entity_velocity_score` with the collected context
4. Classify the trend using the Velocity Classification table
5. Break down velocity by channel if data permits
6. Present the results in the output format below

### Example Output

```
## Engagement Velocity Tracker: Acme Corp

**Trend: 🟠 Declining** — 32% fewer interactions compared to prior period

| Metric | Current Period (Mar 1–25) | Prior Period (Jan 30–Feb 28) | Change |
|--------|--------------------------|------------------------------|--------|
| Total Interactions | 6 | 9 | -33% |
| Meetings | 2 | 4 | -50% |
| Conversations | 3 | 3 | 0% |
| Telephony Calls | 1 | 2 | -50% |

### Channel Breakdown

| Channel | Trend | Notes |
|---------|-------|-------|
| Meetings | 🔴 Stalled | Dropped from 4 to 2 — half the cadence |
| Conversations | 🟡 Stable | Consistent at 3 per period |
| Telephony | 🟠 Declining | Dropped from 2 to 1 |

### Summary

Engagement with Acme Corp has declined 32% period-over-period. The decline is concentrated
in meetings (down 50%) and telephony (down 50%), while conversation volume has remained
stable. This pattern suggests that scheduled/proactive touchpoints are dropping while
reactive conversations persist.

### Recommendations

1. **Restore meeting cadence**: Meeting frequency halved this period. Schedule at least two
   meetings in the next 30 days to arrest the decline — one strategic review and one
   tactical check-in.

2. **Investigate telephony drop**: Outbound call volume fell 50%. Confirm whether this
   reflects a conscious routing change or an unintended gap in proactive outreach.
```

---

## Cadence & Gap Analysis

### What It Does

Analyses the intervals between consecutive interactions for an entity record, identifies silence periods, and classifies their severity. Provides a clear picture of engagement regularity and highlights dangerous gaps that may indicate an account drifting out of attention.

### When to Use

Trigger this skill when the user asks questions like:
- "How consistent is our cadence with this account?"
- "Are there dangerous gaps in engagement?"
- "When was the last touchpoint?"
- "How long between our interactions?"
- "Has this account gone silent?"

### Gap Severity Classification

| Severity | Gap Length | Indicator |
|----------|-----------|-----------|
| **Normal** | 0–14 days | 🟢 Within expected cadence |
| **Watch** | 15–30 days | 🟡 Approaching the edge of healthy cadence |
| **Danger** | 31–60 days | 🟠 Significant silence — re-engagement needed |
| **Critical** | 61+ days | 🔴 Account may be going dark |

### Workflow

1. Collect `organizationId` and `entityRecordId` from the user (see Required Inputs above)
2. Query `entity_cadence_and_gaps` with the collected context (and optional `fromDate`/`toDate`)
3. Calculate the interval in days between each consecutive interaction
4. Classify each gap using the Gap Severity Classification table
5. Compute cadence statistics: average gap, median gap, longest gap, current gap (days since last interaction)
6. Present the results in the output format below

### Example Output

```
## Cadence & Gap Analysis: Acme Corp

**Current Gap: 7 days** (last interaction: 2026-03-18) — 🟢 Normal

### Cadence Statistics

| Metric | Value |
|--------|-------|
| Average gap between interactions | 8.2 days |
| Median gap | 6 days |
| Longest gap | 28 days (2026-01-05 to 2026-02-02) |
| Current gap | 7 days |
| Total interactions analyzed | 14 |

### Gap History

| From | To | Gap (days) | Severity |
|------|----|-----------|----------|
| 2026-03-10 | 2026-03-18 | 8 | 🟢 Normal |
| 2026-03-02 | 2026-03-10 | 8 | 🟢 Normal |
| 2026-02-22 | 2026-03-02 | 8 | 🟢 Normal |
| 2026-02-14 | 2026-02-22 | 8 | 🟢 Normal |
| 2026-02-03 | 2026-02-14 | 11 | 🟢 Normal |
| 2026-01-20 | 2026-02-03 | 14 | 🟢 Normal |
| 2026-01-05 | 2026-01-20 | 15 | 🟡 Watch |
| 2025-12-10 | 2026-01-05 | 26 | 🟡 Watch |

### Summary

Acme Corp has maintained generally healthy cadence with an average gap of 8.2 days. Two
watch-level gaps occurred around the holiday period (late December to mid-January), which
may be seasonal. The current gap of 7 days is within normal range.

### Recommendations

1. **Monitor holiday periods**: The two longest gaps both occurred over year-end holidays.
   Consider scheduling a pre-holiday check-in in future years to maintain continuity.

2. **Set a cadence alert**: With an average gap of 8 days, a 14-day silence alert would
   catch anomalies early without generating false positives.
```

---

## Channel Touchpoint Summary

### What It Does

Breaks down all interactions for an entity record by channel (meetings, conversations, telephony), showing first/last touch dates, session counts, and signal totals per channel. Provides a clear view of which channels are carrying the relationship.

### When to Use

Trigger this skill when the user asks questions like:
- "Which channels have we used with this account?"
- "Breakdown of meetings vs calls vs conversations"
- "How many sessions per channel?"
- "When was the first meeting with this account?"
- "Which channel generates the most signals?"

### Channel Dimensions

| Aspect | What It Measures | Explore Tool |
|--------|-----------------|--------------|
| Channel Distribution | Session counts, first/last touch, signal totals per channel | `entity_channel_touchpoints` |

### Workflow

1. Collect `organizationId` and `entityRecordId` from the user (see Required Inputs above)
2. Query `entity_channel_touchpoints` with the collected context (and optional `fromDate`/`toDate`)
3. Build the per-channel summary: session count, first touch, last touch, total signals generated
4. Calculate channel concentration (percentage of total sessions per channel)
5. Flag any channel that carries more than 70% of total sessions as a concentration risk
6. Present the results in the output format below

### Example Output

```
## Channel Touchpoint Summary: Acme Corp

**Total Sessions: 28** across 3 channels

### Per-Channel Breakdown

| Channel | Sessions | % of Total | First Touch | Last Touch | Signals Generated |
|---------|----------|-----------|-------------|------------|-------------------|
| Meeting | 12 | 43% | 2025-09-15 | 2026-03-18 | 34 |
| Conversation | 10 | 36% | 2025-09-20 | 2026-03-10 | 22 |
| Telephony | 6 | 21% | 2025-10-08 | 2026-03-02 | 9 |

### Signal Density by Channel

| Channel | Signals per Session | Indicator |
|---------|-------------------|-----------|
| Meeting | 2.83 | 🟢 High — meetings generate the richest intelligence |
| Conversation | 2.20 | 🟡 Moderate |
| Telephony | 1.50 | 🟡 Moderate |

### Summary

Acme Corp's relationship is distributed across three channels with meetings as the
primary touchpoint (43% of sessions, 52% of signals). No single channel exceeds the
70% concentration threshold, indicating healthy channel diversity. Meetings produce
the highest signal density at 2.83 signals per session.

### Recommendations

1. **Leverage high-density channels**: Meetings generate nearly 3 signals per session.
   For accounts where intelligence gaps exist, prioritize scheduling a meeting over
   other channels to maximize signal capture.

2. **Increase telephony signal capture**: Telephony sessions average only 1.5 signals
   each. Review whether call summaries are being properly processed for signal extraction.
```

---

## Agent Rotation Map

### What It Does

Identifies all agents who have handled sessions for an entity record, their session counts, signal attribution, and whether the account is at risk of single-agent dependency. Helps teams understand coverage breadth and institutional knowledge distribution.

### When to Use

Trigger this skill when the user asks questions like:
- "Which agents have worked with this account?"
- "Is this account dependent on a single agent?"
- "Who has the most sessions with this entity?"
- "What's the agent coverage like?"
- "Is there a single-thread risk?"

### Rotation Risk Classification

| Risk Level | Definition | Indicator |
|------------|-----------|-----------|
| **Healthy** | 3+ agents with no single agent exceeding 50% of sessions | 🟢 Good coverage breadth |
| **Concentrated** | 2 agents, or 3+ with one agent handling 50–70% of sessions | 🟡 Acceptable but monitor |
| **Single-Thread** | 1 agent handles 70%+ of sessions | 🟠 High dependency risk |
| **Critical** | 1 agent handles 100% of sessions | 🔴 Total single-point-of-failure |

### Workflow

1. Collect `organizationId` and `entityRecordId` from the user (see Required Inputs above)
2. Query `entity_agent_rotation` with the collected context (and optional `fromDate`/`toDate`)
3. Build the per-agent breakdown: session count, percentage of total sessions, signals attributed, last active date
4. Classify the rotation risk using the table above
5. Identify the primary agent (highest session count) and flag single-thread scenarios
6. Present the results in the output format below

### Example Output

```
## Agent Rotation Map: Acme Corp

**Rotation Risk: 🟠 Single-Thread** — one agent handles 79% of sessions

### Agent Breakdown

| Agent | Sessions | % of Total | Signals Attributed | Last Active |
|-------|----------|-----------|-------------------|-------------|
| Sarah K. | 22 | 79% | 48 | 2026-03-18 |
| James R. | 4 | 14% | 9 | 2026-03-02 |
| Priya M. | 2 | 7% | 8 | 2026-01-15 |

### Risk Assessment

| Factor | Status |
|--------|--------|
| Primary agent | Sarah K. (79% of sessions) |
| Backup agents | James R. (14%), Priya M. (7%) |
| Knowledge concentration | 🟠 High — 74% of signals attributed to one agent |
| Last backup agent activity | 23 days ago (James R.) |
| Priya M. last active | 69 days ago — effectively inactive |

### Summary

Acme Corp is heavily dependent on Sarah K., who handles 79% of sessions and 74% of
attributed signals. James R. provides limited backup but has not engaged in 23 days.
Priya M. has been effectively inactive for over two months. If Sarah K. becomes
unavailable, institutional knowledge continuity is at significant risk.

### Recommendations

1. **Shadow sessions**: Have James R. join Sarah K.'s next two meetings as a shadow to
   build context without disrupting the client relationship.

2. **Rotate proactive outreach**: Assign James R. to handle the next telephony check-in
   to increase his signal attribution and familiarity with the account.

3. **Reactivate or replace Priya M.**: With 69 days of inactivity, Priya M. should either
   be re-engaged with a specific session assignment or replaced in the rotation.
```

---

## Signal Co-occurrence View

### What It Does

Identifies pairs of signal categories that consistently fire within the same session for an entity record. Co-occurrence patterns reveal which topics naturally surface together, helping teams prepare for sessions and identify hidden relationships between intelligence themes.

### When to Use

Trigger this skill when the user asks questions like:
- "Which signals appear together?"
- "Any signal pairs that keep firing together?"
- "What topics tend to come up in the same session?"
- "Are there correlated signals for this account?"
- "What signal patterns exist?"

### Co-occurrence Strength Classification

| Strength | Definition | Indicator |
|----------|-----------|-----------|
| **Strong** | Pair co-occurs in 60%+ of sessions where either signal appears | 🟢 Consistent pattern |
| **Moderate** | Pair co-occurs in 30–59% of sessions where either signal appears | 🟡 Notable pattern |
| **Weak** | Pair co-occurs in 10–29% of sessions where either signal appears | 🟠 Occasional pattern |

### Workflow

1. Collect `organizationId` and `entityRecordId` from the user (see Required Inputs above)
2. Query `entity_signal_cooccurrence` with the collected context (and optional `fromDate`/`toDate`)
3. Identify all signal pairs that appeared in the same session at least twice
4. Calculate co-occurrence rate for each pair: (sessions with both signals) / (sessions with either signal)
5. Classify each pair using the Co-occurrence Strength table
6. Rank pairs by co-occurrence rate, descending
7. Present the results in the output format below

### Example Output

```
## Signal Co-occurrence View: Acme Corp

**Distinct Signal Pairs: 8** (appearing in 2+ sessions together)

### Top Co-occurring Pairs

| Signal A | Signal B | Co-occurring Sessions | Total Sessions (Either) | Rate | Strength |
|----------|----------|----------------------|------------------------|------|----------|
| Budget & Spend | Timeline & Urgency | 5 | 7 | 71% | 🟢 Strong |
| Pain Points | Competitive Landscape | 4 | 8 | 50% | 🟡 Moderate |
| Decision Process | Stakeholder Map | 3 | 6 | 50% | 🟡 Moderate |
| Budget & Spend | Decision Process | 3 | 9 | 33% | 🟡 Moderate |
| Pain Points | Technical Requirements | 2 | 7 | 29% | 🟠 Weak |

### Pattern Insights

| Pattern | Interpretation |
|---------|---------------|
| Budget + Timeline (71%) | Budget discussions almost always include timeline context — these topics are tightly coupled for this account |
| Pain Points + Competitive (50%) | When pain points surface, competitors are mentioned half the time — competitive positioning is intertwined with need |
| Decision + Stakeholder (50%) | Decision process conversations naturally reveal stakeholder information |

### Summary

The strongest co-occurrence for Acme Corp is between Budget & Spend and Timeline & Urgency
(71%), indicating these topics are tightly linked in client conversations. Pain Points and
Competitive Landscape co-occur at a 50% rate, suggesting the client evaluates pain relief
in a competitive context. These patterns can guide session preparation.

### Recommendations

1. **Prepare for paired topics**: When planning a session focused on budget, prepare timeline
   discussion points as well — they co-occur 71% of the time and the client likely expects
   both to be addressed.

2. **Leverage co-occurrence for gap-filling**: Decision Process and Stakeholder Map co-occur
   at 50%. If Stakeholder Map coverage is weak, steering a conversation toward decision
   process may naturally surface stakeholder information.
```

---

## Top Insights Extractor

### What It Does

Surfaces the most important verbatim insights for an entity record, organized by signal category and ranked by confidence score. Provides a distilled view of the best intelligence captured across all sessions without requiring the user to read through individual transcripts.

### When to Use

Trigger this skill when the user asks questions like:
- "Most important things we know about this account"
- "Top insights from all sessions"
- "What's the best intelligence we have?"
- "Summarise what we know about this entity"
- "Give me the highlights for this account"

### Insight Quality Classification

| Quality | Confidence Range | Indicator |
|---------|-----------------|-----------|
| **High** | 0.80–1.00 | 🟢 Reliable and actionable |
| **Medium** | 0.50–0.79 | 🟡 Useful but may need corroboration |
| **Low** | Below 0.50 | 🟠 Tentative — treat with caution |

### Workflow

1. Collect `organizationId` and `entityRecordId` from the user (see Required Inputs above)
2. Query `entity_insight_extraction` with the collected context (and optional `fromDate`/`toDate`)
3. Group insights by signal category
4. Within each category, sort by confidence descending and select the top 3 insights
5. Classify each insight using the Insight Quality table
6. Present the results in the output format below

### Example Output

```
## Top Insights Extractor: Acme Corp

**Total Insights: 34** across 6 categories — showing top 3 per category

### Budget & Spend

| # | Insight | Confidence | Source Date | Quality |
|---|---------|-----------|-------------|---------|
| 1 | "Our budget for this initiative is $450K, approved through Q3" | 0.92 | 2026-03-18 | 🟢 High |
| 2 | "We may have room to expand by $80K if the Phase 1 ROI is demonstrated" | 0.81 | 2026-02-22 | 🟢 High |
| 3 | "Procurement requires three competitive bids for anything over $200K" | 0.74 | 2026-01-20 | 🟡 Medium |

### Decision Process

| # | Insight | Confidence | Source Date | Quality |
|---|---------|-----------|-------------|---------|
| 1 | "Final sign-off sits with the VP of Engineering, not the CTO" | 0.88 | 2026-03-18 | 🟢 High |
| 2 | "Legal review takes 2-3 weeks and must happen before contract execution" | 0.85 | 2026-02-22 | 🟢 High |
| 3 | "The evaluation committee meets bi-weekly on Thursdays" | 0.67 | 2026-02-03 | 🟡 Medium |

### Pain Points

| # | Insight | Confidence | Source Date | Quality |
|---|---------|-----------|-------------|---------|
| 1 | "Our current system can't handle real-time analytics — that's the #1 frustration" | 0.91 | 2026-03-10 | 🟢 High |
| 2 | "Manual reporting takes our team 15 hours per week" | 0.83 | 2026-02-14 | 🟢 High |
| 3 | "Data silos between marketing and sales are causing forecast errors" | 0.72 | 2026-01-20 | 🟡 Medium |

### Summary

Acme Corp's intelligence portfolio is strongest in Budget & Spend and Decision Process,
with multiple high-confidence insights providing a clear picture of funding, approval
workflows, and timelines. Pain Points are well-documented and specific. The top insight
across all categories is the confirmed $450K budget through Q3 (confidence: 0.92).

### Recommendations

1. **Act on high-confidence insights**: The budget figure ($450K) and decision-maker
   identification (VP Engineering) are both high-confidence and recent. Use these to
   shape your proposal and ensure it is routed to the right approver.

2. **Corroborate medium-confidence items**: The procurement requirement for three competitive
   bids (0.74 confidence) should be confirmed in the next session — this could significantly
   impact deal timing.
```

---

## Session Quality Summary

### What It Does

Evaluates the quality of sessions for an entity record by analysing feedback scores, starred messages, message volume, and engagement depth. Identifies which sessions were most productive and flags quality trends over time.

### When to Use

Trigger this skill when the user asks questions like:
- "How good are our sessions with this account?"
- "Which sessions were most productive?"
- "What's the average session quality?"
- "Are session scores improving or declining?"
- "Which sessions had the most engagement?"

### Quality Tier Classification

| Tier | Definition | Indicator |
|------|-----------|-----------|
| **Excellent** | Feedback score 4.5+, 2+ starred messages, high signal yield | 🟢 Highly productive |
| **Good** | Feedback score 3.5–4.4, or 1+ starred messages | 🟡 Solid engagement |
| **Fair** | Feedback score 2.5–3.4, no starred messages | 🟠 Adequate but room for improvement |
| **Poor** | Feedback score below 2.5, or no feedback captured | 🔴 Quality concern |

### Workflow

1. Collect `organizationId` and `entityRecordId` from the user (see Required Inputs above)
2. Query `entity_engagement_quality` with the collected context (and optional `fromDate`/`toDate`)
3. For each session, compile: date, channel, agent, feedback score, starred message count, total messages, signals generated
4. Classify each session using the Quality Tier table
5. Calculate aggregate statistics: average feedback score, total starred messages, quality trend direction
6. Present the results in the output format below

### Example Output

```
## Session Quality Summary: Acme Corp

**Average Feedback Score: 4.1 / 5.0** | **Total Starred Messages: 7** | **Trend: 🟢 Improving**

### Session Breakdown (Last 10 Sessions)

| Date | Channel | Agent | Feedback | Stars | Messages | Signals | Quality |
|------|---------|-------|----------|-------|----------|---------|---------|
| 2026-03-18 | Meeting | Sarah K. | 4.5 | 2 | 48 | 5 | 🟢 Excellent |
| 2026-03-10 | Conversation | Sarah K. | 4.2 | 1 | 32 | 3 | 🟡 Good |
| 2026-03-02 | Telephony | James R. | 3.8 | 0 | 18 | 2 | 🟡 Good |
| 2026-02-22 | Meeting | Sarah K. | 4.6 | 2 | 55 | 6 | 🟢 Excellent |
| 2026-02-14 | Conversation | Sarah K. | 3.5 | 1 | 25 | 2 | 🟡 Good |
| 2026-02-03 | Telephony | James R. | 3.2 | 0 | 15 | 1 | 🟠 Fair |
| 2026-01-20 | Meeting | Sarah K. | 4.3 | 1 | 42 | 4 | 🟡 Good |
| 2026-01-15 | Conversation | Priya M. | 2.8 | 0 | 12 | 1 | 🟠 Fair |
| 2026-01-05 | Meeting | Sarah K. | 4.0 | 0 | 38 | 3 | 🟡 Good |
| 2025-12-18 | Telephony | James R. | 2.4 | 0 | 10 | 0 | 🔴 Poor |

### Aggregate Statistics

| Metric | Value |
|--------|-------|
| Average feedback score | 4.1 |
| Sessions rated Excellent | 2 (20%) |
| Sessions rated Good | 5 (50%) |
| Sessions rated Fair | 2 (20%) |
| Sessions rated Poor | 1 (10%) |
| Total starred messages | 7 |
| Average signals per session | 2.7 |

### Summary

Session quality for Acme Corp is good and improving. The two most recent meetings both
rated Excellent, with high signal yield and multiple starred messages. Meetings consistently
produce the highest quality scores, while telephony sessions tend toward lower engagement.
The single Poor-rated session (2025-12-18) was an early telephony call with minimal content.

### Recommendations

1. **Replicate meeting success**: Meetings average 4.35 feedback and 4.5 signals per session.
   For important intelligence-gathering objectives, prefer meeting format over other channels.

2. **Improve telephony quality**: Telephony sessions average 3.13 feedback and 1.0 signals.
   Consider providing agents with structured call guides to increase engagement depth and
   signal capture during phone calls.
```

---

## User Access Monitor

### What It Does

Tracks which internal users are accessing an entity record, how frequently, and how recently. Identifies concentration risk where a single user monopolises access and flags accounts that may be operating as single-person silos.

### When to Use

Trigger this skill when the user asks questions like:
- "Who internally is looking at this account?"
- "Is this entity a single-person silo?"
- "Which team members access this record?"
- "How many people are engaged with this account?"
- "Is anyone else paying attention to this entity?"

### Access Concentration Classification

| Risk Level | Definition | Indicator |
|------------|-----------|-----------|
| **Distributed** | 3+ users with no single user exceeding 50% of access events | 🟢 Healthy team awareness |
| **Concentrated** | 2 users, or one user at 50–70% of access events | 🟡 Limited awareness |
| **Siloed** | 1 user at 70–90% of access events | 🟠 Single-person dependency |
| **Isolated** | 1 user at 90%+ of access events, or only 1 user total | 🔴 Complete silo |

### Workflow

1. Collect `organizationId` and `entityRecordId` from the user (see Required Inputs above)
2. Query `entity_user_access` with the collected context (and optional `fromDate`/`toDate`)
3. Build the per-user breakdown: access count, percentage of total, first access, last access
4. Classify the access concentration using the table above
5. Flag single-user risk and identify users who have not accessed the record recently
6. Present the results in the output format below

### Example Output

```
## User Access Monitor: Acme Corp

**Access Concentration: 🟠 Siloed** — one user accounts for 76% of access events

### User Access Breakdown

| User | Access Events | % of Total | First Access | Last Access | Recency |
|------|--------------|-----------|--------------|-------------|---------|
| Sarah K. | 45 | 76% | 2025-09-15 | 2026-03-25 | Today |
| James R. | 10 | 17% | 2025-10-08 | 2026-03-10 | 15 days ago |
| Priya M. | 3 | 5% | 2025-11-01 | 2026-01-15 | 69 days ago |
| David L. | 1 | 2% | 2026-02-01 | 2026-02-01 | 52 days ago |

### Risk Assessment

| Factor | Status |
|--------|--------|
| Total unique users | 4 |
| Active users (last 30 days) | 2 (Sarah K., James R.) |
| Primary user concentration | 🟠 76% (Sarah K.) |
| Knowledge silo risk | 🟠 High — institutional knowledge concentrated in one person |
| Users gone inactive | 2 (Priya M. at 69 days, David L. at 52 days) |

### Summary

Acme Corp entity access is concentrated on Sarah K. (76% of all access events). While
James R. provides some secondary coverage, his access is less than a quarter of Sarah K.'s.
Two other users (Priya M. and David L.) have effectively disengaged. This creates
significant institutional knowledge risk if Sarah K. becomes unavailable.

### Recommendations

1. **Broaden active awareness**: Encourage James R. to increase access frequency. Consider
   adding Acme Corp to his regular review cadence so access patterns move toward the
   50% threshold.

2. **Re-engage inactive users**: Priya M. and David L. have not accessed this entity in
   over 50 days. If they are still assigned to this account, schedule a brief handoff
   session to re-establish context.

3. **Set up access alerts**: Configure notifications so that if no user other than Sarah K.
   accesses this entity for 14+ days, a reminder is sent to the team.
```

---

## Stale Signal Audit

### What It Does

Identifies signals for an entity record that have not been refreshed within a configurable staleness threshold (default: 21 days). Ranks stale signals by severity and age, highlighting intelligence that may no longer be reliable.

### When to Use

Trigger this skill when the user asks questions like:
- "Which signals haven't been seen recently?"
- "Is the intelligence up to date?"
- "Are there stale signals for this account?"
- "What information is getting outdated?"
- "When were our signals last refreshed?"

### Staleness Severity Classification

| Severity | Days Since Last Refresh | Indicator |
|----------|------------------------|-----------|
| **Fresh** | 0–20 days | 🟢 Current and reliable |
| **Aging** | 21–45 days | 🟡 Approaching staleness — monitor |
| **Stale** | 46–90 days | 🟠 Likely outdated — re-verification needed |
| **Expired** | 91+ days | 🔴 Unreliable — treat as unverified |

Default stale threshold: **21 days** (user can override by specifying a custom threshold).

### Workflow

1. Collect `organizationId` and `entityRecordId` from the user (see Required Inputs above)
2. If the user specifies a custom staleness threshold, use it; otherwise default to 21 days
3. Query `entity_stale_signals` with the collected context (and optional `fromDate`/`toDate`)
4. For each signal, calculate days since last refresh
5. Classify each signal using the Staleness Severity table
6. Sort stale signals by days since refresh (most stale first)
7. Present the results in the output format below

### Example Output

```
## Stale Signal Audit: Acme Corp

**Stale Threshold: 21 days** | **Stale Signals: 4 of 11** (36%)

### Signal Freshness Overview

| Category | Last Refreshed | Days Ago | Severity |
|----------|---------------|----------|----------|
| Budget & Spend | 2026-03-18 | 7 | 🟢 Fresh |
| Decision Process | 2026-03-18 | 7 | 🟢 Fresh |
| Pain Points | 2026-03-10 | 15 | 🟢 Fresh |
| Competitive Landscape | 2026-03-10 | 15 | 🟢 Fresh |
| Timeline & Urgency | 2026-03-02 | 23 | 🟡 Aging |
| Technical Requirements | 2026-02-22 | 31 | 🟡 Aging |
| Success Metrics | 2026-02-03 | 50 | 🟠 Stale |
| Stakeholder Map | 2026-01-20 | 64 | 🟠 Stale |
| Risk & Blockers | 2026-01-05 | 79 | 🟠 Stale |
| Regulatory Compliance | 2025-12-10 | 105 | 🔴 Expired |
| Vendor Preferences | 2025-11-15 | 130 | 🔴 Expired |

### Staleness Breakdown

| Severity | Count | % of Total |
|----------|-------|-----------|
| 🟢 Fresh | 4 | 36% |
| 🟡 Aging | 3 | 27% |
| 🟠 Stale | 2 | 18% |
| 🔴 Expired | 2 | 18% |

### Summary

4 of 11 signals (36%) have not been refreshed in 21+ days. Two signals — Regulatory
Compliance (105 days) and Vendor Preferences (130 days) — have expired and should be
treated as unverified. The core commercial signals (Budget, Decision Process, Pain Points)
are fresh, but peripheral intelligence is aging rapidly.

### Recommendations

1. **Re-verify expired signals**: Regulatory Compliance (105 days) and Vendor Preferences
   (130 days) are unreliable at this age. In the next session, ask directly: "Has anything
   changed regarding compliance requirements?" and "Are you still evaluating the same vendors?"

2. **Refresh stale signals**: Stakeholder Map (64 days) and Risk & Blockers (79 days) need
   re-verification. These are high-value categories — steer the next conversation toward
   "Who's involved now?" and "What concerns do you have at this stage?"

3. **Proactively refresh aging signals**: Timeline & Urgency (23 days) and Technical
   Requirements (31 days) are approaching staleness. A brief check-in question in the next
   session can keep these current without requiring a dedicated session.
```

---

## Shared Rules

These rules apply to **all entity analytics skills** in this file.

### Data Integrity

1. **Never fabricate data.** If a tool returns empty or insufficient results, say so clearly. Do not invent scores, percentages, or categories.
2. **Always present evidence.** Every claim in the output must trace back to a specific tool result. Do not make qualitative judgements without data backing.
3. **Distinguish between "no signals detected" and "no signals configured."** An entity record with zero signals may have no configured signal categories at all — that is a setup issue, not a coverage gap.

### User Interaction

4. **Always collect required inputs before querying.** Never proceed without `organizationId` and `entityRecordId`.
5. **Ask clarifying questions when the entity is ambiguous.** If the user says "check my account" and multiple records could match, list the options and ask them to pick one.
6. **Reuse context from the conversation.** If the user already selected an organization or entity record earlier, do not ask again.

### Output Formatting

7. **Use structured tables** for dimension breakdowns and category lists.
8. **Use status indicators** (🟢 🟡 🟠 🔴) consistently: green = strong, yellow = adequate/watch, orange = weak/declining, red = missing/critical.
9. **Always include a Summary section** at the end — 2-5 sentences, lead with the most important finding.
10. **Always include Recommendations** — at least one actionable suggestion per weak or missing area. Recommendations should be specific enough to act on ("ask about X in the next session") not generic ("improve coverage").
11. **If the user asks for a visualisation**, confirm the preferred shape (table, ranking, trend) before generating.
