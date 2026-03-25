---
name: analytics-signal
description: >
  Detailed analytics skills for signal behaviour, quality, and trend analysis.
  Covers detection frequency, confidence distribution, coverage, co-occurrence,
  staleness, conflicts, corroboration, and emerging patterns. Works at entity
  or organisation level depending on the sub-skill.
metadata:
  author: Auron
  version: 1.0.0
  category: analytics-signal
---

Important: Please read `auron-docs` and `api` skills before running signal analytics. You need an organizationId, a valid API key, and a valid session token. Some sub-skills also require an entityRecordId.

# Signal Analytics

Signal analytics cover the behaviour, quality, and trends of detected signals across the Auron platform. These skills answer questions like "which signals fire most often?", "are any signals contradicting each other?", "what's our confidence distribution?", and "where is intelligence going stale?"

Signal analytics operate in **two modes**:

- **Org-wide** (default): requires only `organizationId`. Analyses signal patterns across the entire organisation.
- **Entity-scoped**: requires `organizationId` + `entityRecordId`. Analyses signal patterns for a specific entity record, typically running detector tools that surface conflicts, corroboration, drift, and concentration risks.

All signal analytics work by querying the Explore API with the appropriate context. The Explore API internally selects the right pre-built aggregation tools for each question.

---

## Required Inputs

Every signal analytics skill requires the following base inputs. **You must collect all required inputs before making any query.** Never guess or assume values.

| Input | Required | Description | How to obtain |
|-------|----------|-------------|---------------|
| `organizationId` | Yes | Organization scope for all data | Ask the user to select their organization. Use the `api` skill to list organizations if needed. |
| `entityRecordId` | Entity-scoped sub-skills only | Specific entity record for entity-level analyses | Ask the user which account or entity record they are asking about. If ambiguous, list entity records and ask them to pick one. |
| `signalId` | No | Filter results to a specific signal | Ask the user if they want to scope to a particular signal. Use the `api` skill to list signals if needed. |
| `fromDate` | No | Start of time window (ISO 8601) | Ask the user if they want to scope the analysis to a specific time range. Default: last 30 days for trends, all time for profiles. |
| `toDate` | No | End of time window (ISO 8601) | Same as above. Default: now. |
| `confidenceThreshold` | No | Minimum confidence filter | Default: 0.3. Ask only if the user indicates they want to adjust sensitivity. |
| `staleThresholdDays` | No | Days after which a signal is considered stale | Default: 21. Ask only if the user indicates a custom freshness window. |

### Input Collection Rules

1. If the user asks an **org-wide** question, only `organizationId` is required. Do not ask for `entityRecordId`.
2. If the user asks about a **specific entity** (e.g., "conflicts for Acme Corp"), collect both `organizationId` and `entityRecordId` before proceeding.
3. If the user says "this account" or "this entity" but no `entityRecordId` is in context, **ask them to specify which account**.
4. If the user gives a name instead of an ID, search entity records by name and confirm the match before proceeding.
5. Never proceed with a query if `organizationId` is missing.
6. If the user has previously selected an organization or entity record in the conversation, reuse it -- do not ask again.
7. For `confidenceThreshold` and `staleThresholdDays`, use defaults unless the user explicitly overrides them.

---

## Signal Detection Frequency

**Scope**: Org-wide

### What It Does

Ranks all signals by detection count and average confidence across the entire organisation. Produces a sorted table showing which signals fire most frequently and how confident those detections are.

### When to Use

Trigger this skill when the user asks questions like:
- "Which signals are we detecting most often?"
- "What are the most common signals across the organisation?"
- "Rank our signals by detection frequency"
- "Which signal types fire the most?"
- "What are our top signals by volume?"
- "Which signals are rare or inconsistent?"

### Workflow

1. Collect `organizationId` from the user (see Required Inputs above)
2. Query `signal_detection_frequency` via the Explore API, passing `organizationId` and optional `fromDate`/`toDate` and `confidenceThreshold`
3. Sort results by detection count descending
4. Classify each signal's reliability tier based on count and avg confidence
5. Present the results in the output format below

### Reliability Classification

| Tier | Criteria | Indicator |
|------|----------|-----------|
| **Reliable** | 10+ detections and avg confidence >= 0.7 | Consistently detected with high quality |
| **Moderate** | 5-9 detections or avg confidence 0.5-0.69 | Detected regularly but may need attention |
| **Sparse** | 1-4 detections or avg confidence 0.3-0.49 | Infrequent or low quality detections |
| **Inactive** | 0 detections in the time window | Configured but never firing |

### Example Output

```
## Signal Detection Frequency (Org-wide)

**Time Window**: Last 30 days
**Total Signals Configured**: 14 | **Active**: 11 | **Inactive**: 3

| Rank | Signal | Category | Detections | Avg Confidence | Tier |
|------|--------|----------|-----------|----------------|------|
| 1 | Budget Authority | Budget & Spend | 87 | 0.82 | 🟢 Reliable |
| 2 | Pain Point Mentioned | Pain Points | 74 | 0.78 | 🟢 Reliable |
| 3 | Decision Timeline | Timeline & Urgency | 61 | 0.71 | 🟢 Reliable |
| 4 | Competitive Mention | Competitive Landscape | 38 | 0.64 | 🟡 Moderate |
| 5 | Technical Requirement | Technical Requirements | 22 | 0.58 | 🟡 Moderate |
| 6 | Stakeholder Identified | Stakeholder Map | 15 | 0.53 | 🟡 Moderate |
| 7 | Risk Blocker | Risk & Blockers | 8 | 0.47 | 🟠 Sparse |
| 8 | Success Criteria | Success Metrics | 4 | 0.41 | 🟠 Sparse |
| ... | ... | ... | ... | ... | ... |
| 12 | Renewal Intent | Renewal Signals | 0 | — | 🔴 Inactive |
| 13 | Expansion Trigger | Growth Signals | 0 | — | 🔴 Inactive |
| 14 | Champion Change | Stakeholder Map | 0 | — | 🔴 Inactive |

### Summary

11 of 14 configured signals have fired in the last 30 days. Budget Authority and Pain Point
Mentioned are the most reliably detected signals, both with high confidence. Three signals
(Renewal Intent, Expansion Trigger, Champion Change) have never fired — review whether these
are configured correctly in the constitution or if conversations are not surfacing these topics.

### Recommendations

1. **Inactive signals**: Review the constitution definitions for Renewal Intent, Expansion
   Trigger, and Champion Change. These may need prompt tuning or the topics may not be arising
   in current conversations.

2. **Sparse signals**: Risk Blocker and Success Criteria are detected infrequently and with
   lower confidence. Consider adding explicit probing questions to agent playbooks to improve
   extraction rates.
```

---

## Confidence Distribution View

**Scope**: Org-wide

### What It Does

Produces a histogram of signal confidence scores across the organisation, bucketed into ranges from 0.3 to 1.0. Shows the shape of the confidence distribution and what it implies about extraction quality.

### When to Use

Trigger this skill when the user asks questions like:
- "How confident are our signals overall?"
- "What does our signal confidence distribution look like?"
- "Are we detecting signals with high or low confidence?"
- "Show me a breakdown of confidence levels across all signals"
- "Is our signal extraction quality good?"

### Confidence Buckets

| Bucket | Range | Interpretation |
|--------|-------|----------------|
| Very High | 0.9 - 1.0 | Extraction is highly certain — explicit, unambiguous statements |
| High | 0.7 - 0.89 | Strong extraction — clear context supporting the signal |
| Medium | 0.5 - 0.69 | Moderate extraction — some inference required |
| Low | 0.3 - 0.49 | Weak extraction — significant uncertainty, may need corroboration |

### Distribution Shape Interpretation

| Shape | What It Means |
|-------|--------------|
| **Right-skewed** (most detections in High/Very High) | Strong extraction quality — constitution is well-tuned |
| **Uniform / flat** | Mixed quality — some signals extract well, others poorly |
| **Left-skewed** (most detections in Low/Medium) | Extraction quality issues — constitution may need tuning or conversations lack explicit signal language |
| **Bimodal** (peaks at Low and High) | Two distinct signal populations — some signals are easy to detect, others are fundamentally ambiguous |

### Workflow

1. Collect `organizationId` from the user (see Required Inputs above)
2. Query `signal_confidence_distribution` via the Explore API, passing `organizationId` and optional `fromDate`/`toDate`
3. Bucket the results into the four confidence ranges
4. Calculate the distribution shape and identify the dominant bucket
5. Present the results with shape interpretation

### Example Output

```
## Confidence Distribution View (Org-wide)

**Time Window**: Last 30 days
**Total Detections Analysed**: 347

| Bucket | Range | Count | % of Total | Visual |
|--------|-------|-------|-----------|--------|
| Very High | 0.9 - 1.0 | 62 | 17.9% | ████████░░░░░░░░░░░░ |
| High | 0.7 - 0.89 | 148 | 42.7% | █████████████████░░░ |
| Medium | 0.5 - 0.69 | 94 | 27.1% | ███████████░░░░░░░░░ |
| Low | 0.3 - 0.49 | 43 | 12.4% | █████░░░░░░░░░░░░░░░ |

**Distribution Shape**: Right-skewed (dominant bucket: High at 42.7%)

**Median Confidence**: 0.72
**Mean Confidence**: 0.69

### What This Means

The confidence distribution is right-skewed, which indicates healthy extraction quality. Over
60% of detections land in the High or Very High buckets, meaning the constitution is producing
reliable intelligence for most signal types.

The 12.4% in the Low bucket is within normal range — some signals are inherently harder to
extract with certainty (e.g., competitive mentions may be implicit rather than explicit).

### Summary

Signal extraction quality is strong overall, with a median confidence of 0.72. The distribution
shape suggests the constitution is well-tuned for the majority of signals.

### Recommendations

1. **Low-confidence tail**: Investigate which specific signal types are contributing most
   detections in the 0.3-0.49 range. If a single signal type dominates the low bucket,
   its constitution definition may need refinement.

2. **Consider raising the threshold**: If the team only acts on high-confidence intelligence,
   a threshold of 0.5 would filter 12.4% of detections while retaining 87.6% of the most
   reliable signals.
```

---

## Coverage by Entity Schema

**Scope**: Org-wide

### What It Does

Breaks down signal coverage by entity schema type across the organisation. Shows which entity schemas have strong, moderate, or weak signal detection and highlights schema-level blind spots.

### When to Use

Trigger this skill when the user asks questions like:
- "How does signal coverage differ across entity types?"
- "Which entity schemas have the best signal detection?"
- "Are some record types getting less intelligence than others?"
- "Compare signal coverage across our entity schemas"
- "Which entity type has the weakest signal profile?"

### Coverage Classification per Schema

| Tier | Criteria | Indicator |
|------|----------|-----------|
| **Strong** | 70%+ of signal categories have detections | Well-covered schema |
| **Moderate** | 40-69% of signal categories have detections | Partial coverage, room for improvement |
| **Weak** | 10-39% of signal categories have detections | Significant gaps |
| **Dark** | Less than 10% of signal categories have detections | Almost no intelligence |

### Workflow

1. Collect `organizationId` from the user (see Required Inputs above)
2. Query `signal_coverage_by_entity_schema` via the Explore API, passing `organizationId`
3. For each entity schema, calculate the percentage of signal categories with at least one detection
4. Classify each schema into the coverage tiers
5. Identify the weakest schema and the most common missing categories
6. Present the results in the output format below

### Example Output

```
## Signal Coverage by Entity Schema (Org-wide)

**Schemas Analysed**: 3

| Schema | Entity Count | Avg Coverage | Categories Covered | Status |
|--------|-------------|-------------|-------------------|--------|
| Enterprise Account | 24 | 78% | 7 of 9 | 🟢 Strong |
| Mid-Market Account | 42 | 54% | 5 of 9 | 🟡 Moderate |
| Partner | 11 | 22% | 2 of 9 | 🟠 Weak |

### Missing Categories by Schema

| Category | Enterprise | Mid-Market | Partner |
|----------|-----------|------------|---------|
| Budget & Spend | 🟢 | 🟢 | 🔴 |
| Pain Points | 🟢 | 🟢 | 🟢 |
| Decision Process | 🟢 | 🟢 | 🔴 |
| Timeline & Urgency | 🟢 | 🟡 | 🔴 |
| Competitive Landscape | 🟢 | 🔴 | 🔴 |
| Stakeholder Map | 🟢 | 🔴 | 🔴 |
| Technical Requirements | 🟡 | 🟡 | 🟢 |
| Risk & Blockers | 🔴 | 🔴 | 🔴 |
| Success Metrics | 🔴 | 🟡 | 🔴 |

### Summary

Enterprise Accounts have the strongest signal coverage at 78%, while Partner entities are
significantly underserved at 22%. Risk & Blockers is the most consistently missing category
across all three schemas.

### Recommendations

1. **Partner schema**: Coverage is critically low. Review whether agents are using the right
   conversation frameworks for partner interactions, or if the constitution needs partner-specific
   signal definitions.

2. **Risk & Blockers**: Missing across all schemas. This is likely a constitution gap rather
   than a schema-specific issue — consider strengthening the extraction prompts for risk-related
   language patterns.

3. **Mid-Market Competitive Landscape**: Enterprise accounts capture competitive intelligence
   well, but mid-market does not. Agents covering mid-market accounts may need prompting to
   ask about alternatives and competitive evaluation.
```

---

## Source Type Breakdown

**Scope**: Org-wide

### What It Does

Breaks down signal detection counts by source type -- meetings, conversations, and telephony calls. Shows which interaction channels produce the most intelligence and which are underperforming.

### When to Use

Trigger this skill when the user asks questions like:
- "Are we getting more signals from meetings or conversations?"
- "Which source type produces the most intelligence?"
- "Break down signal detection by meeting type"
- "How do meetings compare to calls for signal extraction?"
- "Where is our intelligence coming from?"

### Workflow

1. Collect `organizationId` from the user (see Required Inputs above)
2. Query `signal_source_type_breakdown` via the Explore API, passing `organizationId` and optional `fromDate`/`toDate`
3. Calculate the detection count and average confidence per source type
4. Identify the dominant source and any source types producing disproportionately few signals
5. Present the results in the output format below

### Example Output

```
## Signal Source Type Breakdown (Org-wide)

**Time Window**: Last 30 days
**Total Detections**: 347

| Source Type | Sessions | Detections | % of Total | Avg Confidence | Signals/Session |
|-------------|---------|-----------|-----------|----------------|-----------------|
| Meeting | 89 | 214 | 61.7% | 0.74 | 2.4 |
| Conversation | 156 | 98 | 28.2% | 0.68 | 0.6 |
| Telephony | 34 | 35 | 10.1% | 0.59 | 1.0 |

### Source Efficiency

| Source Type | Efficiency Rating | Notes |
|-------------|------------------|-------|
| Meeting | 🟢 High | 2.4 signals per session — richest source of intelligence |
| Telephony | 🟡 Moderate | 1.0 signal per session — adequate but lower confidence |
| Conversation | 🟠 Low | 0.6 signals per session — high volume but low signal yield |

### Summary

Meetings are the dominant source of intelligence, producing 61.7% of all detections with the
highest average confidence (0.74) and 2.4 signals per session. Conversations have the highest
session volume but the lowest signal yield at 0.6 per session. Telephony is a moderate
contributor with adequate but not strong confidence.

### Recommendations

1. **Conversation yield**: Despite 156 sessions, conversations produce only 0.6 signals each.
   Investigate whether the constitution is well-tuned for conversational (async/text) formats,
   or if conversations tend to be shorter and less signal-rich by nature.

2. **Telephony confidence**: Average confidence for telephony (0.59) is notably lower than
   meetings (0.74). This may be a transcription quality issue — review whether telephony
   transcription is producing clean enough text for reliable extraction.
```

---

## Signal Co-occurrence (Org-wide)

**Scope**: Org-wide

### What It Does

Identifies signal pairs that frequently co-occur within the same session across the entire organisation. Reveals compound intelligence patterns where two signals consistently appear together.

### When to Use

Trigger this skill when the user asks questions like:
- "Which signals tend to appear together across all accounts?"
- "Are there any signal combinations we should be watching for?"
- "Show me org-wide signal co-occurrence patterns"
- "What signal pairs fire together most often?"
- "Are there compound signal patterns?"

### Co-occurrence Strength Classification

| Strength | Criteria | Meaning |
|----------|----------|---------|
| **Strong** | Co-occur in 60%+ of sessions where either appears | Nearly always together -- likely causally linked |
| **Moderate** | Co-occur in 30-59% of sessions where either appears | Frequently together -- correlated but not guaranteed |
| **Weak** | Co-occur in 10-29% of sessions where either appears | Occasional pairing -- situational |

### Workflow

1. Collect `organizationId` from the user (see Required Inputs above)
2. Query `signal_cooccurrence_org_wide` via the Explore API, passing `organizationId` and optional `fromDate`/`toDate`
3. Rank signal pairs by co-occurrence rate
4. Classify each pair into the strength tiers
5. Highlight any unexpected or novel pairings
6. Present the results in the output format below

### Example Output

```
## Signal Co-occurrence Patterns (Org-wide)

**Time Window**: Last 30 days
**Pairs Analysed**: 91 | **Significant Pairs** (10%+ co-occurrence): 12

| Rank | Signal A | Signal B | Co-occurrences | Rate | Strength |
|------|----------|----------|---------------|------|----------|
| 1 | Budget Authority | Decision Timeline | 48 | 72% | 🟢 Strong |
| 2 | Pain Point Mentioned | Technical Requirement | 35 | 64% | 🟢 Strong |
| 3 | Budget Authority | Stakeholder Identified | 29 | 43% | 🟡 Moderate |
| 4 | Pain Point Mentioned | Competitive Mention | 26 | 38% | 🟡 Moderate |
| 5 | Decision Timeline | Risk Blocker | 18 | 33% | 🟡 Moderate |
| 6 | Technical Requirement | Success Criteria | 11 | 22% | 🟠 Weak |
| ... | ... | ... | ... | ... | ... |

### Notable Patterns

- **Budget + Timeline** (72%): When budget authority surfaces, decision timelines almost always
  appear in the same session. This pair could form the basis of a composite "Deal Readiness" signal.

- **Pain + Technical** (64%): Pain points and technical requirements co-occur strongly, suggesting
  that technical discussions are driven by pain rather than speculative exploration.

### Summary

Budget Authority and Decision Timeline form the strongest co-occurrence pair at 72%, suggesting
these topics naturally arise together. The top five pairs all involve commercially important
signals, indicating that high-value sessions tend to surface multiple intelligence types
simultaneously.

### Recommendations

1. **Composite signal opportunity**: Consider creating a compound "Deal Readiness" signal that
   triggers when Budget Authority + Decision Timeline + Stakeholder Identified all appear in
   the same session — this trio was present in 19 sessions.

2. **Missing expected pair**: Competitive Mention and Technical Requirement have only a 15%
   co-occurrence rate despite both being evaluation-stage signals. Agents may not be connecting
   competitive and technical discussions in the same conversations.
```

---

## First Detection by Agent

**Scope**: Org-wide

### What It Does

For each signal type, identifies the first session in which it was ever detected and attributes that detection to the agent that ran the session. Shows which agents are breaking new intelligence ground.

### When to Use

Trigger this skill when the user asks questions like:
- "Which agent first detected each signal type?"
- "Who discovered our most important signals first?"
- "Show me signal first detection attribution by agent"
- "Which agents are best at surfacing new intelligence?"
- "Who breaks ground on new signal types?"

### Workflow

1. Collect `organizationId` from the user (see Required Inputs above)
2. Query `signal_first_detection_by_agent` via the Explore API, passing `organizationId`
3. For each signal, identify the earliest detection and the associated agent
4. Aggregate by agent to show which agents have the most first-detection credits
5. Present the results in the output format below

### Example Output

```
## First Detection by Agent (Org-wide)

**Signals Analysed**: 11 (active signals with at least one detection)

### First Detections

| Signal | Category | First Detected | Agent | Entity Record | Confidence |
|--------|----------|---------------|-------|---------------|------------|
| Budget Authority | Budget & Spend | 2025-11-03 | Sarah K. | Acme Corp | 0.88 |
| Pain Point Mentioned | Pain Points | 2025-11-05 | Sarah K. | Globex Inc | 0.76 |
| Decision Timeline | Timeline & Urgency | 2025-11-07 | Marcus R. | TechStart Ltd | 0.81 |
| Competitive Mention | Competitive Landscape | 2025-11-12 | Sarah K. | Acme Corp | 0.69 |
| Technical Requirement | Technical Requirements | 2025-11-15 | James W. | DataFlow Co | 0.72 |
| Stakeholder Identified | Stakeholder Map | 2025-11-18 | Marcus R. | Globex Inc | 0.65 |
| Risk Blocker | Risk & Blockers | 2025-12-01 | Sarah K. | NovaPay | 0.54 |
| Success Criteria | Success Metrics | 2025-12-08 | James W. | TechStart Ltd | 0.48 |
| ... | ... | ... | ... | ... | ... |

### Agent Attribution Summary

| Agent | First Detections | Avg First-Detection Confidence |
|-------|-----------------|-------------------------------|
| Sarah K. | 4 | 0.72 |
| Marcus R. | 3 | 0.71 |
| James W. | 2 | 0.60 |
| Lisa M. | 2 | 0.65 |

### Summary

Sarah K. has the most first-detection credits (4 of 11), indicating she is the primary
pathfinder for new signal types. All four agents have contributed at least one first detection.
Average confidence on first detections is 0.67, which is expected — first detections often
have lower confidence than subsequent corroborations.

### Recommendations

1. **Leverage Sarah K.'s approach**: She surfaces new signal types more frequently than
   other agents. Consider reviewing her conversation techniques to identify replicable
   questioning patterns.

2. **First-detection confidence gap**: James W.'s first detections average 0.60 confidence.
   This may indicate his conversations are less explicit — coaching on direct questioning
   could improve initial extraction quality.
```

---

## Staleness Across Portfolio

**Scope**: Org-wide

### What It Does

Analyses signal staleness across all entity records in the organisation. Identifies which signals are going stale most frequently, which entity records have the most stale signals, and whether staleness patterns indicate systematic engagement gaps.

### When to Use

Trigger this skill when the user asks questions like:
- "Which signals are going stale across our portfolio?"
- "Give me a staleness overview across all accounts"
- "Are there signals that haven't been refreshed anywhere recently?"
- "What's the freshness state of our intelligence portfolio?"
- "How many stale signals do we have?"

### Staleness Classification

| Severity | Days Since Last Detection | Indicator |
|----------|--------------------------|-----------|
| **Fresh** | 0-7 days | Recently detected -- intelligence is current |
| **Aging** | 8-20 days | Approaching stale -- monitor for refresh |
| **Stale** | 21-45 days | Exceeds default threshold -- may not reflect current reality |
| **Critical** | 45+ days | Significantly outdated -- treat as unreliable |

### Workflow

1. Collect `organizationId` from the user (see Required Inputs above)
2. Query `signal_staleness_portfolio` via the Explore API, passing `organizationId` and `staleThresholdDays`
3. Aggregate staleness data by signal type and by entity record
4. Identify signals that are systematically stale across multiple entity records
5. Identify entity records with the highest proportion of stale signals
6. Present the results in the output format below

### Example Output

```
## Staleness Across Portfolio (Org-wide)

**Stale Threshold**: 21 days
**Entity Records Analysed**: 77
**Total Signal Instances**: 412 | **Stale**: 89 (21.6%) | **Critical**: 23 (5.6%)

### Staleness by Signal Type

| Signal | Total Instances | Stale | Critical | Stale % | Status |
|--------|----------------|-------|----------|---------|--------|
| Competitive Mention | 38 | 14 | 5 | 36.8% | 🟠 Systemic staleness |
| Stakeholder Identified | 15 | 8 | 4 | 53.3% | 🔴 Critical staleness |
| Success Criteria | 4 | 3 | 2 | 75.0% | 🔴 Critical staleness |
| Risk Blocker | 8 | 4 | 1 | 50.0% | 🔴 Critical staleness |
| Budget Authority | 87 | 12 | 3 | 13.8% | 🟡 Manageable |
| Pain Point Mentioned | 74 | 9 | 1 | 12.2% | 🟡 Manageable |
| Decision Timeline | 61 | 7 | 2 | 11.5% | 🟡 Manageable |
| Technical Requirement | 22 | 5 | 1 | 22.7% | 🟠 Watch |
| ... | ... | ... | ... | ... | ... |

### Most Stale Entity Records

| Entity Record | Total Signals | Stale | Critical | Stale % |
|---------------|--------------|-------|----------|---------|
| NovaPay | 6 | 5 | 3 | 83.3% |
| GreyRock Ltd | 8 | 5 | 2 | 62.5% |
| Vertex Systems | 5 | 3 | 1 | 60.0% |
| Orion Health | 9 | 4 | 0 | 44.4% |
| DataFlow Co | 7 | 3 | 0 | 42.9% |

### Summary

21.6% of all signal instances are stale, with 5.6% in critical condition (45+ days without
refresh). Stakeholder Identified and Success Criteria have the highest staleness rates,
suggesting these signal types are captured once and rarely revisited. NovaPay has the most
stale entity profile at 83.3% — this account may be going dark.

### Recommendations

1. **NovaPay (83.3% stale)**: This account has almost no fresh intelligence. Prioritise a
   check-in session to refresh signal coverage before the account goes fully dark.

2. **Stakeholder Identified (53.3% stale)**: Stakeholder information changes over time.
   Build a periodic stakeholder refresh question into agent playbooks — ask "Has the team
   or decision structure changed?" in recurring sessions.

3. **Success Criteria (75% stale)**: This signal is rarely re-extracted after initial detection.
   Consider prompting agents to revisit success criteria quarterly as project goals evolve.
```

---

## Weekly Category Trend

**Scope**: Org-wide

### What It Does

Shows detection count and average confidence per signal category over a rolling 12-week window. Visualises whether specific signal categories are improving, degrading, or flat over time.

### When to Use

Trigger this skill when the user asks questions like:
- "How has signal detection trended over the last quarter?"
- "Are we getting better at detecting certain signal types?"
- "Show me weekly signal category trends"
- "Which signal categories are improving or declining?"
- "What's the trend in our signal detection quality?"

### Trend Classification

| Trend | Criteria | Indicator |
|-------|----------|-----------|
| **Improving** | Detection count or confidence increasing over 4+ consecutive weeks | Signal extraction is getting stronger |
| **Stable** | Fluctuations within +/-15% week over week | Consistent performance |
| **Declining** | Detection count or confidence decreasing over 4+ consecutive weeks | Signal extraction is weakening |
| **Volatile** | Large swings (>30%) with no consistent direction | Unpredictable behaviour |
| **Emerging** | First appeared in the last 4 weeks | New signal type ramping up |

### Workflow

1. Collect `organizationId` from the user (see Required Inputs above)
2. Query `signal_category_trend_weekly` via the Explore API, passing `organizationId`
3. For each signal category, extract the 12-week detection count and average confidence series
4. Classify each category's trend using the criteria above
5. Identify the most notable improving and declining categories
6. Present the results in the output format below

### Example Output

```
## Weekly Category Trend (Org-wide, Last 12 Weeks)

### Trend Summary

| Category | Detections (W1) | Detections (W12) | Trend | Avg Confidence Trend |
|----------|----------------|------------------|-------|---------------------|
| Budget & Spend | 14 | 22 | 🟢 Improving (+57%) | 0.76 -> 0.82 🟢 |
| Pain Points | 18 | 19 | 🟢 Stable | 0.78 -> 0.77 🟢 |
| Timeline & Urgency | 16 | 15 | 🟢 Stable | 0.70 -> 0.72 🟢 |
| Competitive Landscape | 12 | 7 | 🟠 Declining (-42%) | 0.68 -> 0.58 🟠 |
| Technical Requirements | 5 | 6 | 🟢 Stable | 0.56 -> 0.60 🟢 |
| Stakeholder Map | 3 | 4 | 🟢 Stable | 0.52 -> 0.55 🟡 |
| Risk & Blockers | 4 | 1 | 🔴 Declining (-75%) | 0.49 -> 0.38 🔴 |
| Success Metrics | 0 | 2 | 🟢 Emerging | — -> 0.47 🟡 |

### Week-over-Week Detail (Top 3 Categories)

| Week | Budget & Spend | Pain Points | Competitive Landscape |
|------|---------------|-------------|----------------------|
| W1 (Jan 6) | 14 | 18 | 12 |
| W2 (Jan 13) | 15 | 16 | 11 |
| W3 (Jan 20) | 16 | 19 | 10 |
| W4 (Jan 27) | 17 | 17 | 9 |
| ... | ... | ... | ... |
| W12 (Mar 24) | 22 | 19 | 7 |

### Summary

Budget & Spend is the most notable improver, with detections increasing 57% and confidence
climbing from 0.76 to 0.82 over the 12-week window. Risk & Blockers is declining sharply --
both in detection frequency (-75%) and confidence (0.49 to 0.38). Success Metrics is a newly
emerging category with its first detections appearing in the last 4 weeks.

### Recommendations

1. **Risk & Blockers declining**: This category has dropped from 4 to 1 detection per week.
   Investigate whether agents have stopped probing for risks, or if the constitution definition
   for this category has become too narrow.

2. **Competitive Landscape declining**: Steady decline from 12 to 7 detections. If competitive
   dynamics are genuinely less relevant, this may be normal. If not, agents may need re-coaching
   on competitive questioning.

3. **Success Metrics emerging**: New detections at 0.47 average confidence suggest this category
   is starting to produce intelligence. Monitor confidence over the next 4 weeks — if it
   stabilises above 0.5, the extraction is viable.
```

---

## Signal Conflict Resolver

**Scope**: Entity-scoped (requires `entityRecordId`)

### What It Does

Detects contradictory insights within the same signal category across different sessions for a specific entity record. Surfaces intelligence that cannot both be true and presents both sides for the team to resolve.

### When to Use

Trigger this skill when the user asks questions like:
- "Are there any conflicting signals for this account?"
- "Do any signals contradict each other?"
- "Is there conflicting intelligence on this entity?"
- "Show me where signals disagree for this record"
- "Flag any signal conflicts I should investigate"

### Conflict Severity Classification

| Severity | Criteria | Indicator |
|----------|----------|-----------|
| **Hard Conflict** | Both signals have confidence >= 0.6 and directly contradict | Both are strong — one must be wrong |
| **Soft Conflict** | One signal has confidence >= 0.6, the other < 0.6 | The weaker signal may be the error |
| **Potential Conflict** | Both signals have confidence < 0.6 | Both are uncertain — may resolve with more data |

### Workflow

1. Collect `organizationId` and `entityRecordId` from the user (see Required Inputs above)
2. Query `detect_conflicts` via the Explore API, passing `organizationId` and `entityRecordId`
3. Group conflicting signal pairs by category
4. Classify each conflict by severity
5. For each conflict, present BOTH sides with session context and confidence
6. Present the results in the output format below

### Example Output

```
## Signal Conflict Resolver: Acme Corp

**Conflicts Detected**: 3

### Conflict 1: Budget & Spend — Hard Conflict 🔴

| Aspect | Signal A | Signal B |
|--------|----------|----------|
| Insight | "Budget is approved for Q2, $200K allocated" | "Budget is under review, no commitment yet" |
| Session | Q1 Review (Feb 12) | Follow-up Call (Mar 3) |
| Agent | Sarah K. | Marcus R. |
| Confidence | 0.85 | 0.78 |
| Days Apart | 19 |

**Assessment**: Both signals have high confidence but directly contradict on budget status.
The more recent session (Mar 3) may reflect a genuine change — budgets can be retracted.
Alternatively, Marcus R. may have spoken with a different stakeholder who was unaware of
the approval.

### Conflict 2: Timeline & Urgency — Soft Conflict 🟡

| Aspect | Signal A | Signal B |
|--------|----------|----------|
| Insight | "Targeting go-live by end of Q2" | "No firm timeline, evaluating options" |
| Session | Discovery Call (Jan 22) | Technical Deep Dive (Feb 28) |
| Agent | Sarah K. | James W. |
| Confidence | 0.72 | 0.48 |
| Days Apart | 37 |

**Assessment**: Signal A is significantly stronger (0.72 vs 0.48). The weaker signal may
reflect a different stakeholder's perspective or a less definitive statement. The timeline
may have genuinely slipped over the 37-day gap.

### Conflict 3: Competitive Landscape — Potential Conflict 🟠

| Aspect | Signal A | Signal B |
|--------|----------|----------|
| Insight | "Currently evaluating CompetitorX" | "Not looking at alternatives" |
| Session | Intro Call (Dec 15) | Account Review (Feb 10) |
| Agent | Lisa M. | Sarah K. |
| Confidence | 0.52 | 0.44 |
| Days Apart | 57 |

**Assessment**: Both signals have low confidence. Over the 57-day gap, competitive
evaluation may have concluded. This may not be a true conflict but rather a resolved
situation.

### Summary

Three signal conflicts detected for Acme Corp. The Budget & Spend conflict is the highest
priority — it is a hard conflict between two high-confidence signals 19 days apart. The
Timeline conflict is likely a natural drift. The Competitive conflict may already be resolved
given the 57-day gap.

### Recommendations

1. **Budget conflict (Priority 1)**: Clarify directly in the next session whether the $200K
   budget is still approved. Ask: "Last we heard, the budget was approved — is that still
   the case?"

2. **Timeline conflict**: Confirm whether the Q2 go-live target is still active. The weaker
   signal may simply reflect a less informed stakeholder.

3. **Competitive conflict**: Low priority — likely resolved. If competitive positioning is
   important, a brief check ("Are you still looking at other options?") would close this.
```

---

## Corroboration Finder

**Scope**: Entity-scoped (requires `entityRecordId`)

### What It Does

Identifies signal categories that have been independently confirmed across two or more sessions for a specific entity record. Ranks by number of confirming sessions to show which intelligence is most reliable.

### When to Use

Trigger this skill when the user asks questions like:
- "Which signals have been confirmed across multiple sessions?"
- "What intelligence is corroborated for this account?"
- "Show me signals that have fired more than once"
- "Which signals are the most reliable for this entity?"
- "What do we know for sure about this account?"

### Corroboration Strength

| Level | Criteria | Meaning |
|-------|----------|---------|
| **Strong** | 4+ confirming sessions with avg confidence >= 0.7 | Highly reliable — multiple independent validations |
| **Moderate** | 2-3 confirming sessions with avg confidence >= 0.5 | Reasonably reliable — confirmed but limited |
| **Weak** | 2+ confirming sessions but avg confidence < 0.5 | Confirmed by volume but low individual quality |
| **Uncorroborated** | Only 1 session | Single source — treat as hypothesis, not fact |

### Workflow

1. Collect `organizationId` and `entityRecordId` from the user (see Required Inputs above)
2. Query `detect_corroboration` via the Explore API, passing `organizationId` and `entityRecordId`
3. Group signals by category and count distinct confirming sessions
4. Calculate average confidence per corroborated category
5. Rank by number of confirming sessions descending
6. Present the results in the output format below

### Example Output

```
## Corroboration Finder: Acme Corp

**Signal Categories Analysed**: 7 | **Corroborated (2+ sessions)**: 5 | **Uncorroborated**: 2

### Corroborated Signals

| Category | Confirming Sessions | Avg Confidence | Latest Session | Strength |
|----------|-------------------|----------------|----------------|----------|
| Budget & Spend | 5 | 0.84 | Mar 3 | 🟢 Strong |
| Pain Points | 4 | 0.76 | Feb 28 | 🟢 Strong |
| Decision Process | 3 | 0.71 | Feb 12 | 🟢 Strong |
| Timeline & Urgency | 2 | 0.65 | Feb 28 | 🟡 Moderate |
| Competitive Landscape | 2 | 0.48 | Feb 10 | 🟠 Weak |

### Uncorroborated Signals

| Category | Sessions | Confidence | Last Detected | Risk |
|----------|---------|------------|---------------|------|
| Stakeholder Map | 1 | 0.65 | Jan 22 | 🟡 Single-source, moderate confidence |
| Technical Requirements | 1 | 0.42 | Jan 22 | 🟠 Single-source, low confidence |

### Top Corroborated Insights (Strongest Category: Budget & Spend)

| Session | Date | Agent | Insight | Confidence |
|---------|------|-------|---------|------------|
| Q1 Review | Mar 3 | Marcus R. | "Budget approved at $200K for Q2" | 0.88 |
| Executive Briefing | Feb 12 | Sarah K. | "CFO confirmed $200K budget line" | 0.86 |
| Discovery Follow-up | Jan 30 | Sarah K. | "Budget in final approval stage" | 0.84 |
| Initial Discovery | Jan 15 | Sarah K. | "Budgeting for $150-200K range" | 0.80 |
| Intro Call | Dec 20 | Lisa M. | "Have budget set aside for this" | 0.82 |

### Summary

Five of seven signal categories are corroborated across multiple sessions. Budget & Spend
is the strongest with five confirming sessions and rising confidence — the budget narrative
is internally consistent. Stakeholder Map and Technical Requirements are uncorroborated
single-source signals and should be treated as hypotheses until confirmed.

### Recommendations

1. **Stakeholder Map (uncorroborated)**: Only one session has identified stakeholders. In
   the next session, ask "Who else is involved in this decision?" to either confirm or
   expand the stakeholder picture.

2. **Technical Requirements (uncorroborated, low confidence)**: The single detection at 0.42
   confidence is unreliable on its own. Dedicate part of the next technical discussion to
   explicitly validating requirements.

3. **Competitive Landscape (weak corroboration)**: Two sessions confirm competitive evaluation,
   but average confidence is only 0.48. Ask more directly about alternatives to strengthen
   this signal.
```

---

## Low Confidence Cluster Detector

**Scope**: Entity-scoped (requires `entityRecordId`)

### What It Does

Finds clusters of individually low-confidence signals within the same category that collectively suggest a real pattern. Recovers intelligence that would otherwise be discarded by looking at the aggregate rather than individual detections.

### When to Use

Trigger this skill when the user asks questions like:
- "Are there weak signals that together suggest something important?"
- "Show me low confidence signal clusters"
- "Are we missing anything by discarding low confidence signals?"
- "Detect any emerging patterns from uncertain signals"
- "What patterns hide in our weak signals?"

### Cluster Criteria

A low-confidence cluster is identified when:
- 3+ signals in the same category all have individual confidence below the threshold (default 0.5)
- The signals span 2+ distinct sessions
- The aggregate pattern points in a consistent direction

### Cluster Significance Classification

| Significance | Criteria | Meaning |
|-------------|----------|---------|
| **High** | 5+ signals across 3+ sessions, consistent direction | Strong emergent pattern — likely real despite individual weakness |
| **Medium** | 3-4 signals across 2+ sessions, mostly consistent | Plausible pattern — worth investigating |
| **Low** | 3+ signals but from same session or inconsistent direction | Noise cluster — probably not actionable |

### Workflow

1. Collect `organizationId` and `entityRecordId` from the user (see Required Inputs above)
2. Query `detect_low_confidence_clusters` via the Explore API, passing `organizationId`, `entityRecordId`, and `confidenceThreshold`
3. Identify categories with 3+ low-confidence detections
4. Assess consistency of direction across the cluster
5. Classify each cluster by significance
6. Present the results in the output format below

### Example Output

```
## Low Confidence Cluster Detector: Acme Corp

**Confidence Threshold**: 0.5
**Clusters Found**: 2

### Cluster 1: Risk & Blockers — High Significance 🟢

| # | Session | Date | Agent | Insight | Confidence |
|---|---------|------|-------|---------|------------|
| 1 | Discovery Call | Jan 22 | Sarah K. | "Mentioned internal resistance from IT" | 0.38 |
| 2 | Technical Review | Feb 5 | James W. | "Concerns about integration complexity" | 0.42 |
| 3 | Follow-up | Feb 15 | Sarah K. | "IT team has reservations about migration" | 0.45 |
| 4 | Account Review | Feb 28 | Marcus R. | "Internal pushback mentioned briefly" | 0.36 |
| 5 | Check-in | Mar 10 | Sarah K. | "Still navigating internal objections" | 0.41 |

**Assessment**: Five low-confidence signals across four sessions and three agents, all
pointing toward internal IT resistance. No individual detection crosses the confidence
threshold, but the cluster is highly consistent. This is very likely a real blocker that
conversations are touching on indirectly.

**Composite Cluster Confidence**: 0.78 (adjusted for volume and consistency)

### Cluster 2: Renewal Signals — Medium Significance 🟡

| # | Session | Date | Agent | Insight | Confidence |
|---|---------|------|-------|---------|------------|
| 1 | Q1 Review | Feb 12 | Sarah K. | "Mentioned renewing for another year" | 0.44 |
| 2 | Executive Brief | Feb 28 | Marcus R. | "Implied continued partnership" | 0.39 |
| 3 | Follow-up | Mar 10 | Sarah K. | "Talked about next year's plans" | 0.47 |

**Assessment**: Three low-confidence signals across two sessions, generally pointing toward
renewal intent. The language is indirect ("implied", "mentioned"), which explains the low
individual confidence. Plausible but not definitive.

**Composite Cluster Confidence**: 0.62 (adjusted for volume and consistency)

### Summary

Two low-confidence clusters found. The Risk & Blockers cluster (5 signals, 4 sessions) is
highly significant — internal IT resistance appears to be a real blocker that conversations
are surfacing indirectly. The Renewal Signals cluster (3 signals, 2 sessions) is plausible
but less certain.

### Recommendations

1. **Risk & Blockers cluster (High)**: This cluster strongly suggests an IT resistance blocker.
   In the next session, ask directly: "We've sensed some internal concerns from the IT side —
   can you tell us more about that?" Converting this to a high-confidence detection would
   validate the pattern.

2. **Renewal Signals cluster (Medium)**: Renewal intent is hinted at but not explicit. If
   renewal timing matters, ask directly: "Are you planning to renew, and when would that
   decision need to happen?"
```

---

## Recency Drift Detector

**Scope**: Entity-scoped (requires `entityRecordId`)

### What It Does

Identifies signal categories that have gone quiet or are weakening in confidence over recent sessions compared to earlier sessions. Detects intelligence decay for a specific entity record.

### When to Use

Trigger this skill when the user asks questions like:
- "Which signals are getting weaker over time for this account?"
- "Are any signal categories going quiet?"
- "Detect recency drift in our signal profile"
- "Show me signals that were strong before but aren't anymore"
- "Is our intelligence on this account getting stale?"

### Drift Classification

| Type | Criteria | Indicator |
|------|----------|-----------|
| **Gone Quiet** | Signal was detected in earlier sessions but absent from the last 3+ sessions | Category has stopped appearing entirely |
| **Weakening** | Signal still detected but confidence has dropped 20%+ from peak | Quality is degrading |
| **Stable** | Signal detection frequency and confidence are consistent | No drift detected |
| **Strengthening** | Signal confidence has increased 20%+ over recent sessions | Intelligence is improving |

### Workflow

1. Collect `organizationId` and `entityRecordId` from the user (see Required Inputs above)
2. Query `detect_recency_drift` via the Explore API, passing `organizationId`, `entityRecordId`, and optional `staleThresholdDays`
3. Compare recent-window signal activity to historical baseline for each category
4. Classify each category's drift status
5. Highlight categories with the most concerning drift
6. Present the results in the output format below

### Example Output

```
## Recency Drift Detector: Acme Corp

**Sessions Analysed**: 9 (over 4 months)
**Recent Window**: Last 3 sessions | **Baseline**: First 6 sessions

### Drift Analysis

| Category | Baseline Detections | Baseline Avg Conf | Recent Detections | Recent Avg Conf | Drift |
|----------|--------------------|--------------------|-------------------|-----------------|-------|
| Budget & Spend | 4 | 0.82 | 2 | 0.86 | 🟢 Stable |
| Pain Points | 5 | 0.78 | 3 | 0.74 | 🟢 Stable |
| Decision Process | 3 | 0.73 | 2 | 0.70 | 🟢 Stable |
| Timeline & Urgency | 3 | 0.71 | 0 | — | 🔴 Gone Quiet |
| Competitive Landscape | 3 | 0.67 | 1 | 0.44 | 🟠 Weakening |
| Technical Requirements | 2 | 0.58 | 2 | 0.72 | 🟢 Strengthening |
| Stakeholder Map | 1 | 0.65 | 0 | — | 🟡 Gone Quiet (limited baseline) |

### Detailed Drift: Timeline & Urgency (Gone Quiet)

| Session | Date | Detected? | Confidence | Insight |
|---------|------|-----------|------------|---------|
| Intro Call | Dec 20 | Yes | 0.68 | "Targeting Q2 go-live" |
| Discovery | Jan 15 | Yes | 0.72 | "Q2 deadline confirmed" |
| Follow-up | Jan 30 | Yes | 0.74 | "On track for Q2 timeline" |
| Technical Review | Feb 5 | No | — | — |
| Executive Brief | Feb 12 | No | — | — |
| Account Review | Feb 28 | No | — | — |

**Last detected**: Jan 30 (54 days ago)

### Summary

Timeline & Urgency has gone completely quiet after three consistent detections in the first
month. Competitive Landscape is weakening — still detected but with declining confidence.
Technical Requirements is the one category showing improvement, with confidence increasing
from 0.58 to 0.72 in recent sessions.

### Recommendations

1. **Timeline & Urgency (Gone Quiet)**: This category was consistently detected until Jan 30
   and has not appeared in the last three sessions. The Q2 go-live target may have slipped or
   been abandoned. Ask directly: "Is the Q2 timeline still the target?"

2. **Competitive Landscape (Weakening)**: Confidence dropped from 0.67 to 0.44. The competitive
   evaluation may be concluding, or discussions have become less explicit. Confirm whether they
   are still evaluating alternatives.
```

---

## Insight Volatility Scanner

**Scope**: Entity-scoped (requires `entityRecordId`)

### What It Does

Identifies signal categories whose extracted insights keep changing across sessions. Finds unstable intelligence where the substance of the insight shifts significantly from session to session.

### When to Use

Trigger this skill when the user asks questions like:
- "Which signals keep changing their meaning across sessions?"
- "Show me signals with volatile or inconsistent insights"
- "Is the intelligence on this account stable?"
- "Flag any signals where the insights keep shifting"
- "How consistent are our signals for this entity?"

### Volatility Classification

| Level | Criteria | Meaning |
|-------|----------|---------|
| **High Volatility** | Insight substance changes in 60%+ of sessions where the signal fires | Intelligence is unreliable — cannot base decisions on it |
| **Moderate Volatility** | Insight substance changes in 30-59% of sessions | Intelligence is shifting — may reflect genuine change or inconsistent extraction |
| **Low Volatility** | Insight substance changes in less than 30% of sessions | Intelligence is stable and consistent |

### Workflow

1. Collect `organizationId` and `entityRecordId` from the user (see Required Inputs above)
2. Query `detect_insight_volatility` via the Explore API, passing `organizationId` and `entityRecordId`
3. For each signal category with 3+ detections, compare insight text across sessions
4. Calculate the volatility rate (% of sessions where insight substance changed)
5. Classify each category by volatility level
6. Present the results showing the insight evolution over time

### Example Output

```
## Insight Volatility Scanner: Acme Corp

**Categories with 3+ Detections**: 5

### Volatility Summary

| Category | Detections | Insight Changes | Volatility Rate | Level |
|----------|-----------|----------------|-----------------|-------|
| Budget & Spend | 5 | 1 | 20% | 🟢 Low |
| Pain Points | 4 | 1 | 25% | 🟢 Low |
| Timeline & Urgency | 3 | 2 | 67% | 🔴 High |
| Decision Process | 3 | 1 | 33% | 🟡 Moderate |
| Competitive Landscape | 3 | 2 | 67% | 🔴 High |

### High Volatility Detail: Timeline & Urgency

| Session | Date | Insight | Confidence | Change? |
|---------|------|---------|------------|---------|
| Discovery | Jan 15 | "Targeting Q1 go-live" | 0.72 | — |
| Follow-up | Jan 30 | "Pushed to Q2, dependencies unresolved" | 0.68 | Yes - timeline slipped |
| Executive Brief | Feb 12 | "No firm timeline, re-evaluating scope" | 0.61 | Yes - timeline removed |

**Assessment**: The timeline has shifted three times in four weeks — from Q1 to Q2 to no
firm date. This is likely genuine volatility in the deal timeline, not an extraction issue.
The declining confidence (0.72 -> 0.61) also suggests increasing uncertainty on the entity side.

### High Volatility Detail: Competitive Landscape

| Session | Date | Insight | Confidence | Change? |
|---------|------|---------|------------|---------|
| Intro | Dec 20 | "Evaluating CompetitorX and CompetitorY" | 0.65 | — |
| Discovery | Jan 15 | "CompetitorX dropped, focused on us" | 0.58 | Yes - competitor dropped |
| Account Review | Feb 28 | "Brought CompetitorZ into evaluation" | 0.52 | Yes - new competitor |

**Assessment**: The competitive landscape is genuinely shifting. New competitors entering and
exiting the evaluation is real intelligence — the volatility reflects deal dynamics, not
extraction errors.

### Summary

Two categories show high insight volatility: Timeline & Urgency and Competitive Landscape.
In both cases, the volatility appears to reflect genuine changes in the entity's situation
rather than extraction inconsistency. Budget & Spend and Pain Points are stable and reliable.

### Recommendations

1. **Timeline & Urgency (High Volatility)**: The timeline has shifted repeatedly. In the next
   session, ask for a definitive timeline commitment or acknowledge that the timeline is fluid.
   Avoid planning around the Q2 target until it stabilises.

2. **Competitive Landscape (High Volatility)**: New competitors keep entering the evaluation.
   Ask: "Has the competitive landscape settled, or are you still considering new options?"
   Understanding whether evaluation is open or closing is critical.

3. **Decision Process (Moderate)**: One insight change in three sessions is borderline. Monitor
   in the next 2-3 sessions — if it continues shifting, escalate attention.
```

---

## Source Concentration Risk

**Scope**: Entity-scoped (requires `entityRecordId`)

### What It Does

Identifies sessions or speakers that are responsible for a disproportionate share of the entity's signal profile. Surfaces over-reliance on a single source of intelligence.

### When to Use

Trigger this skill when the user asks questions like:
- "Is our signal profile for this account over-reliant on one session?"
- "Are we getting signals from a diverse range of interactions?"
- "Detect source concentration risk for this entity"
- "Which session or speaker dominates our signal profile?"
- "How diversified is our intelligence sourcing?"

### Concentration Risk Classification

| Level | Criteria | Meaning |
|-------|----------|---------|
| **Critical** | Single session contributes 60%+ of all signals | Profile is fragile — one bad session could invalidate most intelligence |
| **High** | Single session contributes 40-59% of all signals | Significant over-reliance on one interaction |
| **Moderate** | Top session contributes 25-39% of all signals | Somewhat concentrated but manageable |
| **Healthy** | No single session exceeds 25% of signals | Well-distributed intelligence sourcing |

### Workflow

1. Collect `organizationId` and `entityRecordId` from the user (see Required Inputs above)
2. Query `detect_concentration` via the Explore API, passing `organizationId` and `entityRecordId`
3. Calculate per-session and per-speaker signal contribution percentages
4. Classify the concentration risk level
5. Identify the dominant session(s) and speaker(s)
6. Present the results in the output format below

### Example Output

```
## Source Concentration Risk: Acme Corp

**Total Signals**: 18 | **Sessions Contributing**: 6 | **Agents Contributing**: 3

### Session Concentration

| Session | Date | Agent | Signals | % of Total | Status |
|---------|------|-------|---------|-----------|--------|
| Discovery Call | Jan 15 | Sarah K. | 7 | 38.9% | 🟠 High concentration |
| Q1 Review | Feb 12 | Sarah K. | 4 | 22.2% | 🟡 Moderate |
| Technical Review | Feb 5 | James W. | 3 | 16.7% | 🟢 Healthy |
| Follow-up | Jan 30 | Sarah K. | 2 | 11.1% | 🟢 Healthy |
| Account Review | Feb 28 | Marcus R. | 1 | 5.6% | 🟢 Healthy |
| Check-in | Mar 10 | Sarah K. | 1 | 5.6% | 🟢 Healthy |

**Concentration Level**: 🟠 High — the Discovery Call contributes 38.9% of all signals

### Agent Concentration

| Agent | Sessions | Signals | % of Total | Status |
|-------|---------|---------|-----------|--------|
| Sarah K. | 4 | 14 | 77.8% | 🔴 Critical agent concentration |
| James W. | 1 | 3 | 16.7% | — |
| Marcus R. | 1 | 1 | 5.6% | — |

**Agent Risk**: 🔴 Critical — Sarah K. is responsible for 77.8% of the signal profile

### Summary

The signal profile for Acme Corp has high session concentration (Discovery Call at 38.9%)
and critical agent concentration (Sarah K. at 77.8%). If Sarah K. were to leave or change
accounts, 77.8% of the intelligence would lose its primary source. The Discovery Call alone
drives nearly 40% of all signals — subsequent sessions have been less intelligence-rich.

### Recommendations

1. **Agent diversification (Critical)**: Sarah K. dominates the signal profile. Assign Marcus R.
   or James W. to lead the next 2-3 sessions to build independent intelligence sources.

2. **Session depth**: Sessions after Discovery have produced fewer signals. Review whether
   follow-up sessions are structured to surface new intelligence, or if they are purely
   relationship maintenance.

3. **Discovery session dependency**: The Discovery Call was disproportionately productive.
   Consider whether key stakeholders present in that session should be re-engaged in future
   sessions.
```

---

## Orphaned High Confidence Finder

**Scope**: Entity-scoped (requires `entityRecordId`)

### What It Does

Finds high-confidence signals that have no corroboration across other sessions -- strong but isolated detections. These are signals that scored well but have never been independently confirmed.

### When to Use

Trigger this skill when the user asks questions like:
- "Are there any high confidence signals that haven't been confirmed elsewhere?"
- "Show me orphaned signals for this account"
- "Which strong signals are one-off detections?"
- "Find high confidence signals that appear only once"
- "What strong signals need validation?"

### Orphan Risk Classification

| Level | Criteria | Meaning |
|-------|----------|---------|
| **High Risk** | Confidence >= 0.8 with no corroboration | Very strong detection but completely unvalidated — high stakes if wrong |
| **Moderate Risk** | Confidence 0.6-0.79 with no corroboration | Good detection but untested — should be confirmed |
| **Low Risk** | Confidence 0.5-0.59 with no corroboration | Moderate detection without backup — less urgent to validate |

### Workflow

1. Collect `organizationId` and `entityRecordId` from the user (see Required Inputs above)
2. Query `detect_orphaned_high_confidence` via the Explore API, passing `organizationId`, `entityRecordId`, and optional `confidenceThreshold`
3. Identify signals with confidence above the threshold that appear in only one session
4. Classify each orphaned signal by risk level
5. Assess the age of the orphan — older orphans are higher priority for validation
6. Present the results in the output format below

### Example Output

```
## Orphaned High Confidence Finder: Acme Corp

**High-Confidence Signals (>= 0.6)**: 12 | **Orphaned (single session)**: 4

### Orphaned Signals

| Signal | Category | Confidence | Session | Date | Age (days) | Risk |
|--------|----------|------------|---------|------|-----------|------|
| "CFO is the final decision-maker" | Stakeholder Map | 0.82 | Discovery | Jan 15 | 69 | 🔴 High Risk |
| "Migration from legacy system required" | Technical Requirements | 0.75 | Technical Review | Feb 5 | 48 | 🟡 Moderate Risk |
| "Compliance deadline in June" | Timeline & Urgency | 0.71 | Executive Brief | Feb 12 | 41 | 🟡 Moderate Risk |
| "Previous vendor failed on implementation" | Risk & Blockers | 0.68 | Follow-up | Jan 30 | 54 | 🟡 Moderate Risk |

### Corroborated Signals (for comparison)

| Signal | Category | Sessions | Avg Confidence |
|--------|----------|---------|----------------|
| Budget approved $200K | Budget & Spend | 5 | 0.84 |
| Data integration pain | Pain Points | 4 | 0.76 |
| Evaluating Q2 timeline | Timeline & Urgency | 3 | 0.71 |
| ... | ... | ... | ... |

### Summary

Four high-confidence signals have never been corroborated across another session. The highest
risk orphan is the Stakeholder Map signal identifying the CFO as the final decision-maker —
at 0.82 confidence and 69 days old, this has been treated as fact but was only stated once.
If the decision structure has changed, plans built on this assumption may be misguided.

### Recommendations

1. **"CFO is final decision-maker" (High Risk, 69 days)**: This assumption may be driving
   account strategy. Validate in the next session: "Is [CFO name] still the final sign-off
   on this, or has the approval process changed?"

2. **"Migration from legacy system" (Moderate, 48 days)**: Technical assumptions should be
   confirmed periodically. Ask the technical stakeholder: "Are you still planning a migration
   from the legacy system, or has the approach changed?"

3. **"Compliance deadline in June" (Moderate, 41 days)**: If this deadline is real, it creates
   urgency. If it has moved, the deal timeline changes. Confirm: "Is the June compliance
   deadline still firm?"

4. **General pattern**: Four orphaned high-confidence signals suggest follow-up sessions are
   not revisiting topics from earlier conversations. Consider adding "signal validation"
   questions to agent playbooks for repeat sessions.
```

---

## Shared Rules

These rules apply to **all signal analytics skills** in this file.

### Data Integrity

1. **Never fabricate data.** If a tool returns empty or insufficient results, say so clearly. Do not invent scores, percentages, categories, or signal values.
2. **Always present evidence.** Every claim in the output must trace back to a specific tool result. Do not make qualitative judgements without data backing.
3. **Distinguish between "no signals configured" and "no signals detected."** An organisation or entity record with zero signals may have no configured signal categories at all -- that is a setup issue, not a detection failure. State which case applies.
4. **When presenting confidence distributions, explain what the shape means.** Do not show a histogram without interpreting the distribution shape (right-skewed, left-skewed, bimodal, uniform) and its implications for extraction quality.

### Conflict and Corroboration Rules

5. **For conflict detection, present BOTH sides of the conflict.** Do not pick a winner. Show both signals with their session context, agent, date, and confidence. Let the user decide or recommend how to resolve.
6. **For corroboration, rank by number of confirming sessions.** More sessions = more reliable. Always show the confirming session count alongside the average confidence.

### Entity-Scoped Detector Rules

7. **For entity-scoped detectors, always collect `entityRecordId` first.** Never run an entity-scoped detector tool without confirming the target entity record.
8. **For org-wide queries, only `organizationId` is needed.** Do not ask for `entityRecordId` when running org-wide sub-skills.

### Defaults and Thresholds

9. **Default stale threshold is 21 days** unless the user explicitly overrides it.
10. **Default confidence threshold is 0.3** unless the user explicitly overrides it.
11. **Default time window for trends is last 30 days.** For profile-type queries (e.g., detection frequency, corroboration), default to all time.

### User Interaction

12. **Always collect required inputs before querying.** Never proceed without `organizationId`. For entity-scoped sub-skills, never proceed without `entityRecordId`.
13. **Ask clarifying questions when the entity is ambiguous.** If the user says "check my account" and multiple records could match, list the options and ask them to pick one.
14. **Reuse context from the conversation.** If the user already selected an organization or entity record earlier, do not ask again.
15. **If the user asks for a visualisation**, confirm the preferred shape (table, ranking, trend, histogram) before generating.

### Output Formatting

16. **Use structured tables** for breakdowns, rankings, and comparisons.
17. **Use status indicators** consistently: 🟢 strong/good, 🟡 watch/adequate, 🟠 weak/declining, 🔴 critical/missing.
18. **Always include a Summary section** at the end -- 2-5 sentences, lead with the most important finding.
19. **Always include Recommendations** -- at least one actionable suggestion per issue found. Recommendations should be specific enough to act on (e.g., "ask about X in the next session") not generic (e.g., "improve coverage").
20. **For entity-scoped detectors, include the entity name in the heading** (e.g., "## Signal Conflict Resolver: Acme Corp").
