---
name: analytics-org
description: >
  Organisation-wide analytics covering portfolio health, interaction volume,
  credit consumption, team coverage, signal adoption, label usage, member
  engagement, cross-entity patterns, coverage gaps, and intelligence scoring.
  No entity context required — all queries are scoped to the full organisation.
metadata:
  author: Auron
  version: 1.0.0
  category: analytics-org
---

Important: Please read `auron-docs` and `api` skills before running org analytics. You need an organizationId, a valid API key, and a valid session token.

# Organisation Analytics

Organisation analytics are scoped to the **full organisation**. Every skill in this file requires only an `organizationId` to operate — no entity record context is needed. These skills answer questions like "how healthy is our portfolio?", "where are we spending credits?", "which accounts are completely dark?", and "what market-level patterns are emerging?"

All org analytics work by querying the Explore API with the appropriate context. The Explore API internally selects the right pre-built aggregation tools for each question.

If a user asks about a **specific account or entity record**, route them to entity analytics instead.

---

## Required Inputs

Every org analytics skill requires the following inputs. **You must collect all required inputs before making any query.** Never guess or assume values.

| Input | Required | Description | How to obtain |
|-------|----------|-------------|---------------|
| `organizationId` | Yes | The organization scope for all data | Ask the user to select their organization. Use the `api` skill to list organizations if needed. |
| `fromDate` | No | Start of time window (ISO 8601) | Ask the user if they want to scope the analysis to a specific time range. Default: 30 days ago. |
| `toDate` | No | End of time window (ISO 8601) | Same as above. Default: now. |

### Input Collection Rules

1. If the user says "my org" or "our organisation" but no `organizationId` is in context, **ask them to specify which organisation**.
2. If the user gives a name instead of an ID, search organisations by name and confirm the match before proceeding.
3. Never proceed with a query if `organizationId` is missing.
4. If the user has previously selected an organization in the conversation, reuse it — do not ask again.
5. **Do not ask for an `entityRecordId`.** If the user provides one or asks about a specific account, redirect to entity analytics.
6. If no time window is specified, default to the last 30 days.

---

## Access Control Rules

These access rules apply to **all org analytics skills** in this file.

| Role | Access Level |
|------|-------------|
| **Admin / Owner** | Full access to all org-wide analytics, including individual member breakdowns |
| **Regular User** | Can see aggregate org data (totals, distributions, tier counts) but NOT individual user/member breakdowns — route member-level requests to user analytics with self-only restriction |

Before executing any skill, verify the user's role via the API. If a regular user requests member-level data (e.g., Member Engagement Ranking), return only their own entry and explain that full rankings require admin access.

---

## Portfolio Health Overview

### What It Does

Produces a portfolio-level health summary by computing health scores for every entity record in the organisation and aggregating them into tier buckets. Returns tier distribution, percentage breakdown, and a list of at-risk and dark accounts requiring attention.

### When to Use

Trigger this skill when the user asks questions like:
- "How healthy is our account portfolio overall?"
- "How many accounts are at risk?"
- "Give me a portfolio health overview"
- "What percentage of our entities are well-covered?"
- "Show me the health tier breakdown across all records"
- "How does our portfolio look?"

### Health Tier Classification

Each entity record is classified into one of four tiers based on its composite health score (see entity analytics Account Health Pulse for scoring methodology):

| Tier | Score Range | Meaning |
|------|-------------|---------|
| **Strong** | 75-100 | Account is well-covered with fresh, high-quality intelligence |
| **Watch** | 50-74 | Account has some gaps or declining trends — monitor closely |
| **At Risk** | 25-49 | Significant intelligence gaps or staleness — intervention needed |
| **Dark** | 0-24 | Little to no usable intelligence on this account |

### Workflow

1. Collect `organizationId` from the user (see Required Inputs above)
2. Query `org_portfolio_health` with `organizationId` and optional date range
3. Extract tier counts and percentage distribution from the response
4. Identify all accounts in the At Risk and Dark tiers
5. Sort at-risk accounts by score (lowest first) to prioritise intervention
6. Present the results in the output format below

### Example Output

```
## Portfolio Health Overview

**Organisation: TechCorp Global**
**Period: 2026-02-23 to 2026-03-25**

### Tier Distribution

| Tier | Count | % of Portfolio | Status |
|------|-------|----------------|--------|
| Strong | 34 | 42.5% | 🟢 |
| Watch | 24 | 30.0% | 🟡 |
| At Risk | 15 | 18.75% | 🟠 |
| Dark | 7 | 8.75% | 🔴 |
| **Total** | **80** | **100%** | |

### At-Risk Accounts (Immediate Attention)

| Account | Health Score | Weakest Dimension | Last Interaction |
|---------|-------------|-------------------|------------------|
| Meridian Labs | 28 | Signal Freshness (12) | 45 days ago |
| Apex Solutions | 31 | Agent Rotation (15) | 32 days ago |
| Nova Retail | 33 | Engagement Velocity (18) | 28 days ago |
| ... (12 more) | | | |

### Dark Accounts (No Usable Intelligence)

| Account | Health Score | Total Interactions | Last Interaction |
|---------|-------------|-------------------|------------------|
| Zenith Corp | 8 | 2 | 90 days ago |
| Orion Medical | 12 | 0 | Never |
| Pinnacle Group | 15 | 1 | 72 days ago |
| ... (4 more) | | | |

### Summary

42.5% of the portfolio is in strong health, but 22 accounts (27.5%) require attention.
7 accounts are effectively dark with little to no intelligence. The most common weakness
across at-risk accounts is signal freshness — many accounts have not had signals refreshed
in over 21 days.

### Recommendations

1. **Dark accounts**: Schedule immediate engagement for the 7 dark accounts, starting with
   Orion Medical (zero interactions) and Zenith Corp (90-day gap). Even a single session
   would move these out of Dark tier.

2. **Signal freshness**: 9 of 15 at-risk accounts have stale signals as their weakest
   dimension. Consider running a re-engagement campaign targeting accounts with no
   interaction in the last 30 days.

3. **Trend watch**: The At Risk tier has grown from 12 to 15 accounts since last month.
   Investigate whether this is seasonal or indicates a systemic engagement drop.
```

---

## Monthly Interaction Volume

### What It Does

Produces a month-by-month breakdown of interaction volume across the organisation, split by channel type (meetings, conversations, calls). Returns monthly counts, trend direction, and channel-level distribution.

### When to Use

Trigger this skill when the user asks questions like:
- "How has our interaction volume trended?"
- "Are we having more or fewer conversations month over month?"
- "Show me monthly activity across the organisation"
- "Is engagement volume up or down?"
- "How many meetings did we have last month?"
- "What's our interaction trend over the last quarter?"

### Workflow

1. Collect `organizationId` from the user (see Required Inputs above)
2. Query `org_monthly_interaction_volume` with `organizationId` and optional date range
3. Extract monthly counts split by channel type
4. Calculate month-over-month change percentages
5. Determine overall trend direction (accelerating, stable, declining, stalled)
6. Present the results in the output format below

### Trend Classification

| Trend | Definition | Indicator |
|-------|-----------|-----------|
| **Accelerating** | 3+ consecutive months of growth (10%+ MoM) | 🟢 |
| **Stable** | Volume within +/-10% of prior month | 🟡 |
| **Declining** | 2+ consecutive months of decline (10%+ MoM) | 🟠 |
| **Stalled** | Current month < 50% of 3-month average | 🔴 |

### Example Output

```
## Monthly Interaction Volume

**Organisation: TechCorp Global**
**Period: 2025-10-01 to 2026-03-25**

### Volume by Month

| Month | Meetings | Conversations | Calls | Total | MoM Change |
|-------|----------|--------------|-------|-------|------------|
| Oct 2025 | 120 | 85 | 42 | 247 | — |
| Nov 2025 | 134 | 91 | 38 | 263 | 🟢 +6.5% |
| Dec 2025 | 98 | 72 | 31 | 201 | 🟠 -23.6% |
| Jan 2026 | 145 | 102 | 50 | 297 | 🟢 +47.8% |
| Feb 2026 | 152 | 110 | 55 | 317 | 🟢 +6.7% |
| Mar 2026 | 138 | 95 | 48 | 281 | 🟠 -11.4% |

**Overall Trend: Stable** 🟡 (seasonal dip in Dec recovered in Jan-Feb; Mar slight decline)

### Channel Split (Period Average)

| Channel | Avg Monthly Volume | % of Total |
|---------|--------------------|------------|
| Meetings | 131 | 49.4% |
| Conversations | 92 | 34.7% |
| Calls | 44 | 16.6% |

### Summary

Total interaction volume has been broadly stable over the past 6 months, with a seasonal
dip in December that fully recovered in January. Meetings remain the dominant channel at
49% of volume. March is trending slightly below February, which is worth monitoring but
not yet a concern.

### Recommendations

1. **December pattern**: The December dip is likely seasonal. Plan for reduced volume in
   December and ensure critical accounts receive proactive outreach before the holiday period.

2. **Call channel**: Calls represent only 16.6% of interactions. If telephony is an
   expected engagement channel, investigate whether agents are underutilising it or
   if accounts prefer other channels.
```

---

## Credit Consumption Breakdown

### What It Does

Produces a breakdown of platform credit consumption by source type, with period-over-period comparison. Returns per-source credit usage, absolute and percentage changes, and flags any anomalous consumption patterns.

### When to Use

Trigger this skill when the user asks questions like:
- "Where are our platform credits being consumed?"
- "Show me credit usage by source type"
- "Which parts of the platform are using the most credits?"
- "Are there any credit consumption anomalies?"
- "How are we burning credits?"
- "Compare our credit usage this month vs last month"

### Workflow

1. Collect `organizationId` from the user (see Required Inputs above)
2. Query `org_credit_consumption` with `organizationId` and optional date range
3. Extract per-source credit usage for the current and prior period
4. Calculate period-over-period changes (absolute and percentage)
5. Flag any source with a change greater than 30% as requiring attention
6. Present the results in the output format below

### Example Output

```
## Credit Consumption Breakdown

**Organisation: TechCorp Global**
**Current Period: 2026-02-23 to 2026-03-25**
**Prior Period: 2026-01-23 to 2026-02-22**

### Consumption by Source

| Source Type | Current Period | Prior Period | Change | % Change | Status |
|------------|---------------|-------------|--------|----------|--------|
| Meetings | 4,250 | 3,800 | +450 | +11.8% | 🟢 Stable |
| Conversations | 2,100 | 2,050 | +50 | +2.4% | 🟢 Stable |
| Telephony | 1,850 | 1,200 | +650 | +54.2% | 🟠 Spike |
| Signal Extraction | 3,400 | 3,100 | +300 | +9.7% | 🟢 Stable |
| Knowledge Store | 800 | 850 | -50 | -5.9% | 🟢 Stable |
| **Total** | **12,400** | **11,000** | **+1,400** | **+12.7%** | |

### Anomaly Flags

| Source | Alert | Details |
|--------|-------|---------|
| Telephony | 🟠 +54.2% spike | Credit usage jumped from 1,200 to 1,850 — investigate whether this reflects increased call volume or a configuration change |

### Summary

Total credit consumption increased 12.7% period-over-period, driven primarily by a 54.2%
spike in telephony credits. All other sources are within normal variance. Meetings remain
the largest credit consumer at 34.3% of total usage.

### Recommendations

1. **Telephony spike**: Investigate the 54% increase in telephony credits. Cross-reference
   with the Monthly Interaction Volume skill to see if call volume increased proportionally.
   If volume is flat but credits are up, a configuration or pricing change may be the cause.

2. **Budget planning**: At the current run rate of 12,400 credits/month, project the
   quarterly consumption and compare against allocation. Flag to finance if trending above budget.
```

---

## Team Interaction Coverage

### What It Does

Maps which teams are engaging with which entity records across the organisation. Identifies uncovered accounts (no team engagement), over-covered accounts (multiple teams overlapping), and team coverage distribution.

### When to Use

Trigger this skill when the user asks questions like:
- "Which teams are covering which accounts?"
- "Are there accounts no team is actively engaging?"
- "Show me team coverage across our entity portfolio"
- "How is account coverage distributed across teams?"
- "Are teams stepping on each other's accounts?"
- "Find uncovered accounts"

### Coverage Classification

| State | Definition | Indicator |
|-------|-----------|-----------|
| **Well-Covered** | Exactly one team with regular engagement (3+ interactions in period) | 🟢 |
| **Under-Covered** | One team but infrequent engagement (1-2 interactions in period) | 🟡 |
| **Uncovered** | No team has interacted with the account in the period | 🔴 |
| **Overlapping** | Two or more teams engaging the same account | 🟠 |

### Workflow

1. Collect `organizationId` from the user (see Required Inputs above)
2. Query `org_team_interaction_coverage` with `organizationId` and optional date range
3. Extract team-to-entity mapping with interaction counts
4. Classify each entity record into coverage states using the table above
5. Identify uncovered accounts and overlapping accounts
6. Present the results in the output format below

### Example Output

```
## Team Interaction Coverage

**Organisation: TechCorp Global**
**Period: 2026-02-23 to 2026-03-25**

### Coverage Summary

| Coverage State | Count | % of Portfolio | Status |
|---------------|-------|----------------|--------|
| Well-Covered | 48 | 60.0% | 🟢 |
| Under-Covered | 14 | 17.5% | 🟡 |
| Uncovered | 11 | 13.75% | 🔴 |
| Overlapping | 7 | 8.75% | 🟠 |
| **Total** | **80** | **100%** | |

### Team Coverage Matrix

| Team | Accounts Covered | Avg Interactions / Account | Top Account |
|------|-----------------|---------------------------|-------------|
| Enterprise Sales | 28 | 5.2 | Acme Corp (12) |
| Mid-Market | 22 | 3.8 | Nova Retail (8) |
| Customer Success | 18 | 4.5 | Meridian Labs (7) |
| Strategic | 8 | 7.1 | Zenith Corp (11) |

### Uncovered Accounts (No Team Engagement)

| Account | Days Since Last Interaction | Health Tier |
|---------|---------------------------|-------------|
| Orion Medical | Never | 🔴 Dark |
| Pinnacle Group | 72 days | 🔴 Dark |
| Cedar Finance | 45 days | 🟠 At Risk |
| ... (8 more) | | |

### Overlapping Accounts (Multi-Team)

| Account | Teams Engaged | Interaction Count |
|---------|--------------|-------------------|
| Apex Solutions | Enterprise Sales (4), Customer Success (3) | 7 total |
| Atlas Corp | Mid-Market (2), Strategic (5) | 7 total |
| ... (5 more) | | |

### Summary

60% of accounts are well-covered by a single team. However, 11 accounts (13.75%) have
no team engagement at all in the last 30 days, and 7 accounts are being worked by
multiple teams simultaneously, creating coordination risk.

### Recommendations

1. **Uncovered accounts**: Assign the 11 uncovered accounts to teams immediately. Start
   with Orion Medical and Pinnacle Group — both are in Dark tier and need urgent outreach.

2. **Overlapping accounts**: Review the 7 overlapping accounts with the relevant team
   leads. Assign a primary owner for each to avoid conflicting messaging. Apex Solutions
   and Atlas Corp should be prioritised as they have the highest overlap.

3. **Under-covered accounts**: The 14 under-covered accounts each had only 1-2 interactions
   in the period. Consider whether these are intentionally low-touch or slipping through
   the cracks.
```

---

## Signal Category Adoption

### What It Does

Measures detection rates for each signal category across the organisation. Shows which categories are actively being detected, which have low adoption, and which have zero detections — flagging constitution effectiveness issues.

### When to Use

Trigger this skill when the user asks questions like:
- "Which signal categories are being detected across the org?"
- "Are there any signal types that never fire?"
- "Show me signal category adoption rates"
- "Which parts of our constitution aren't working?"
- "What signal categories have low adoption?"
- "How effective is our signal extraction?"

### Adoption Classification

| State | Definition | Indicator |
|-------|-----------|-----------|
| **High Adoption** | Detected in 60%+ of entity records with interactions | 🟢 |
| **Moderate Adoption** | Detected in 30-59% of entity records with interactions | 🟡 |
| **Low Adoption** | Detected in 1-29% of entity records with interactions | 🟠 |
| **Zero Adoption** | Never detected across any entity record | 🔴 |

### Workflow

1. Collect `organizationId` from the user (see Required Inputs above)
2. Query `org_signal_category_adoption` with `organizationId` and optional date range
3. Extract per-category detection rates and total detection counts
4. Classify each category into adoption states using the table above
5. Flag zero-adoption categories as constitution issues
6. Present the results in the output format below

### Example Output

```
## Signal Category Adoption

**Organisation: TechCorp Global**
**Period: 2026-02-23 to 2026-03-25**
**Entity Records with Interactions: 69**

### Adoption by Category

| Category | Records Detected In | Adoption % | Total Detections | Avg Confidence | Status |
|----------|-------------------|------------|-----------------|----------------|--------|
| Budget & Spend | 52 | 75.4% | 184 | 0.82 | 🟢 High |
| Pain Points | 48 | 69.6% | 156 | 0.78 | 🟢 High |
| Decision Process | 41 | 59.4% | 112 | 0.74 | 🟡 Moderate |
| Timeline & Urgency | 35 | 50.7% | 88 | 0.71 | 🟡 Moderate |
| Competitive Landscape | 22 | 31.9% | 54 | 0.68 | 🟡 Moderate |
| Technical Requirements | 15 | 21.7% | 32 | 0.61 | 🟠 Low |
| Stakeholder Map | 12 | 17.4% | 28 | 0.55 | 🟠 Low |
| Risk & Blockers | 8 | 11.6% | 14 | 0.48 | 🟠 Low |
| Success Metrics | 0 | 0.0% | 0 | — | 🔴 Zero |

### Zero Adoption Categories

| Category | Configured Since | Sessions Since Config | Possible Cause |
|----------|-----------------|----------------------|----------------|
| Success Metrics | 2025-11-15 | 342 | Constitution may not have extraction rules for this category, or agents are not asking questions that surface success criteria |

### Adoption Distribution

| State | Categories | % of Total |
|-------|-----------|------------|
| High Adoption | 2 | 22.2% |
| Moderate Adoption | 3 | 33.3% |
| Low Adoption | 3 | 33.3% |
| Zero Adoption | 1 | 11.1% |

### Summary

Only 2 of 9 signal categories have high adoption (60%+). Three categories — Technical
Requirements, Stakeholder Map, and Risk & Blockers — have low adoption below 22%.
Success Metrics has never been detected despite being configured for 4+ months and
342 sessions since configuration. This strongly suggests a constitution or question
design issue.

### Recommendations

1. **Success Metrics (Zero)**: Review the constitution extraction rules for this category.
   After 342 sessions with zero detections, the rules are likely misconfigured or the
   category requires more specific trigger questions. Consider adding agent prompts like
   "What does success look like for you?" or "How will you measure the outcome?"

2. **Stakeholder Map (17.4%)**: This is a high-value category with low adoption. Train
   agents to ask "Who else is involved in this decision?" or "Can you walk me through
   the approval process?" to improve detection rates.

3. **Risk & Blockers (11.6%)**: Similar to Stakeholder Map — high-value but under-detected.
   Consider adding explicit risk-surfacing questions to agent playbooks.
```

---

## Label Usage Distribution

### What It Does

Analyses label frequency and distribution across conversations, entity records, and signals. Surfaces top labels, usage patterns by resource type, and consistency scores to evaluate labelling practices.

### When to Use

Trigger this skill when the user asks questions like:
- "How are labels being used across the platform?"
- "Which labels are used most frequently?"
- "Show me label distribution across entities and signals"
- "Is labelling consistent across the team?"
- "Are there labels we're not using?"
- "What's our tagging hygiene like?"

### Workflow

1. Collect `organizationId` from the user (see Required Inputs above)
2. Query `org_label_usage_distribution` with `organizationId` and optional date range
3. Extract label frequency by resource type (conversations, entities, signals)
4. Calculate a consistency score based on how evenly labels are applied across resources
5. Identify overused and underused labels
6. Present the results in the output format below

### Consistency Score

The consistency score measures how uniformly labels are applied across the organisation:

| Score Range | Meaning | Indicator |
|------------|---------|-----------|
| 80-100 | Labels applied consistently across teams and resource types | 🟢 |
| 50-79 | Some inconsistency — certain labels used heavily by some teams but not others | 🟡 |
| 20-49 | Significant inconsistency — labelling practices vary widely | 🟠 |
| 0-19 | Labels rarely used or applied sporadically | 🔴 |

### Example Output

```
## Label Usage Distribution

**Organisation: TechCorp Global**
**Period: 2026-02-23 to 2026-03-25**
**Consistency Score: 62/100** 🟡

### Top Labels by Usage

| Label | Conversations | Entities | Signals | Total | Status |
|-------|--------------|----------|---------|-------|--------|
| enterprise | 85 | 34 | 120 | 239 | 🟢 Well-used |
| high-priority | 62 | 28 | 95 | 185 | 🟢 Well-used |
| renewal | 48 | 22 | 67 | 137 | 🟢 Well-used |
| upsell | 31 | 15 | 42 | 88 | 🟡 Moderate |
| at-risk | 12 | 8 | 18 | 38 | 🟡 Moderate |
| competitor-mentioned | 5 | 2 | 8 | 15 | 🟠 Underused |
| expansion | 3 | 1 | 4 | 8 | 🟠 Underused |
| churn-risk | 0 | 0 | 2 | 2 | 🔴 Rarely used |

### Usage by Resource Type

| Resource Type | Labelled | Total | Coverage % |
|--------------|----------|-------|------------|
| Conversations | 312 | 420 | 74.3% |
| Entity Records | 58 | 80 | 72.5% |
| Signals | 356 | 512 | 69.5% |

### Summary

Labels are moderately well-used with a consistency score of 62/100. The top three labels
(enterprise, high-priority, renewal) account for 63% of all label usage, suggesting the
organisation has strong conventions for these categories. However, churn-risk and
expansion labels are nearly unused despite being configured, and labelling coverage
drops below 70% for signals.

### Recommendations

1. **churn-risk label**: This label has only 2 uses despite being configured. Either
   remove it (if it duplicates the at-risk label) or promote its adoption through
   team training. If it serves a distinct purpose from at-risk, clarify the distinction
   in labelling guidelines.

2. **Signal labelling gap**: 30.5% of signals are unlabelled. Consider automating label
   assignment for signals based on signal category to improve coverage without manual effort.

3. **Standardisation**: Review whether competitor-mentioned and expansion labels need
   promotion or consolidation. Low-adoption labels add noise to the taxonomy without
   providing filtering value.
```

---

## Member Engagement Ranking

### What It Does

Ranks organisation members by their platform engagement across session count, message volume, and signal contribution. Returns a ranked table with activity metrics for each member.

### When to Use

Trigger this skill when the user asks questions like:
- "Who is most active on the platform?"
- "Show me team engagement rankings"
- "Which members are contributing the most signals?"
- "Who are the top and bottom platform users?"
- "Rank team members by their platform engagement"
- "Who isn't using the platform?"

### Access Control

| Role | What They See |
|------|--------------|
| **Admin / Owner** | Full ranked list of all org members |
| **Regular User** | Only their own entry with rank position (e.g., "You are ranked 5th of 18 members") |

Before returning results, verify the user's role. If a regular user requests the full list, explain the restriction and show their own metrics only.

### Workflow

1. Collect `organizationId` from the user (see Required Inputs above)
2. Verify user's role (admin/owner or regular user)
3. Query `org_member_engagement_ranking` with `organizationId` and optional date range
4. If admin/owner: return full ranked list
5. If regular user: return only the requesting user's entry with their rank position
6. Present the results in the output format below

### Example Output

```
## Member Engagement Ranking

**Organisation: TechCorp Global**
**Period: 2026-02-23 to 2026-03-25**
**Total Members: 18**

### Rankings (Admin View)

| Rank | Member | Sessions | Messages | Signals Contributed | Accounts Covered | Status |
|------|--------|----------|----------|--------------------|--------------------|--------|
| 1 | Sarah K. | 42 | 1,280 | 156 | 14 | 🟢 Power user |
| 2 | James L. | 38 | 1,105 | 132 | 12 | 🟢 Power user |
| 3 | Maria P. | 35 | 980 | 118 | 11 | 🟢 Active |
| 4 | David R. | 28 | 750 | 89 | 9 | 🟢 Active |
| 5 | Rachel T. | 22 | 620 | 71 | 8 | 🟡 Moderate |
| ... | ... | ... | ... | ... | ... | |
| 16 | Alex M. | 3 | 85 | 8 | 2 | 🟠 Low |
| 17 | Chris B. | 1 | 22 | 2 | 1 | 🔴 Inactive |
| 18 | Pat W. | 0 | 0 | 0 | 0 | 🔴 No activity |

### Engagement Distribution

| Tier | Members | % of Team |
|------|---------|-----------|
| Power User (30+ sessions) | 3 | 16.7% |
| Active (15-29 sessions) | 5 | 27.8% |
| Moderate (5-14 sessions) | 6 | 33.3% |
| Low (1-4 sessions) | 3 | 16.7% |
| No Activity | 1 | 5.6% |

### Summary

The top 3 members generate 43% of all sessions and 42% of all signals. 4 members
(22.2%) have low or no platform activity, representing an adoption gap. Pat W. has
had zero activity in the period and should be checked for account access issues or
training needs.

### Recommendations

1. **No-activity members**: Reach out to Pat W. to determine whether the lack of activity
   is due to role fit, access issues, or training gaps. Consider pairing them with a
   power user for onboarding support.

2. **Low-activity members**: Alex M. and Chris B. have minimal engagement. Review whether
   their accounts are properly assigned and whether they've received platform training.

3. **Concentration risk**: The top 3 members cover 37 of 80 accounts. If any of them
   is unavailable, a significant portion of the portfolio loses active coverage. Consider
   distributing some accounts to moderate-tier users.
```

---

## Cross-Entity Shared Signals

### What It Does

Identifies signals that have been detected across multiple entity records, revealing market-level patterns and shared themes across the portfolio. Returns shared signals with entity counts, affected accounts, and potential market implications.

### When to Use

Trigger this skill when the user asks questions like:
- "Are the same signals appearing across multiple accounts?"
- "Show me signals that span multiple entities"
- "Are there portfolio-wide signal patterns?"
- "Which signals are we seeing across accounts?"
- "What market trends are emerging from our signals?"
- "Are there common themes across our portfolio?"

### Workflow

1. Collect `organizationId` from the user (see Required Inputs above)
2. Query `cross_entity_shared_signals` with `organizationId` and optional date range
3. Extract signals appearing in 2 or more entity records
4. Group by signal category and sort by entity count (highest first)
5. Identify potential market-level themes from high-frequency shared signals
6. Present the results in the output format below

### Example Output

```
## Cross-Entity Shared Signals

**Organisation: TechCorp Global**
**Period: 2026-02-23 to 2026-03-25**
**Signals Appearing in 2+ Entities: 18**

### Most Shared Signals

| Signal | Category | Entities | Avg Confidence | Key Insight |
|--------|----------|----------|---------------|-------------|
| Budget freeze Q1 | Budget & Spend | 12 | 0.79 | 🟠 Market-wide budget tightening |
| Evaluating competitor X | Competitive Landscape | 8 | 0.74 | 🟠 Competitive pressure rising |
| Q2 expansion planned | Timeline & Urgency | 7 | 0.82 | 🟢 Growth signal across accounts |
| Security compliance concern | Risk & Blockers | 6 | 0.71 | 🟡 Regulatory theme emerging |
| Executive sponsor change | Stakeholder Map | 5 | 0.68 | 🟡 Organisational churn detected |
| ... (13 more) | | | | |

### Market Themes

| Theme | Signals Contributing | Entities Affected | Confidence |
|-------|---------------------|-------------------|------------|
| Budget Tightening | Budget freeze Q1, Cost reduction mandate | 14 | 🟠 High (cross-corroborated) |
| Competitive Pressure | Evaluating competitor X, RFP in progress | 10 | 🟠 Moderate |
| Growth Pipeline | Q2 expansion planned, New headcount approved | 9 | 🟢 High |

### Summary

18 signals appear across multiple entity records. The strongest cross-entity theme is
budget tightening, affecting 14 accounts (17.5% of portfolio) — this likely reflects
a market-wide trend rather than account-specific dynamics. Competitive pressure from
Competitor X is appearing in 8 accounts, suggesting an active competitive campaign.
On the positive side, 9 accounts show expansion signals for Q2.

### Recommendations

1. **Budget tightening (14 accounts)**: This is likely a macro trend. Prepare
   value-reinforcement messaging and ROI documentation for affected accounts. Brief
   the team on handling budget objections with concrete usage data.

2. **Competitor X evaluation (8 accounts)**: Escalate to competitive intelligence.
   8 accounts evaluating the same competitor suggests an organised campaign. Prepare
   competitive battle cards and schedule defensive sessions for affected accounts.

3. **Q2 expansion (9 accounts)**: Prioritise these accounts for upsell conversations.
   The expansion intent is corroborated across signals — strike while intent is fresh.
```

---

## Zero Signal Record Finder

### What It Does

Identifies entity records that have had interactions but have never yielded a single detected signal. These are accounts where engagement is happening but no structured intelligence is being captured — the highest-priority extraction gaps.

### When to Use

Trigger this skill when the user asks questions like:
- "Which accounts have no signals at all?"
- "Show me entity records with zero signal extraction"
- "Find our intelligence blind spots"
- "Which records have we never extracted anything from?"
- "Where are we talking to accounts but capturing nothing?"

### Workflow

1. Collect `organizationId` from the user (see Required Inputs above)
2. Query `records_with_zero_signals` with `organizationId` and optional date range
3. Extract entity records with zero signals but non-zero interaction count
4. Sort by interaction count descending (highest engagement with zero intelligence first)
5. Include interaction count and last interaction date for context
6. Present the results in the output format below

### Example Output

```
## Zero Signal Records

**Organisation: TechCorp Global**
**Period: 2026-02-23 to 2026-03-25**
**Records with Zero Signals: 9 of 80 (11.25%)**

### Zero-Signal Records (Sorted by Interaction Count)

| Account | Interactions | Last Interaction | Channel | Assigned Team | Status |
|---------|-------------|------------------|---------|---------------|--------|
| Summit Health | 14 | 3 days ago | Meetings | Customer Success | 🔴 High priority — active but no extraction |
| Beacon Analytics | 11 | 7 days ago | Conversations | Mid-Market | 🔴 High priority — active but no extraction |
| Alpine Tech | 8 | 12 days ago | Meetings | Enterprise Sales | 🔴 High priority — recent engagement |
| Redwood Corp | 5 | 21 days ago | Calls | Mid-Market | 🟠 Moderate — engagement fading |
| Cascade Media | 4 | 28 days ago | Conversations | Customer Success | 🟠 Moderate — engagement fading |
| ... (4 more) | | | | | |

### By Assigned Team

| Team | Zero-Signal Records | % of Team Portfolio |
|------|--------------------|--------------------|
| Customer Success | 3 | 16.7% |
| Mid-Market | 3 | 13.6% |
| Enterprise Sales | 2 | 7.1% |
| Strategic | 1 | 12.5% |

### Summary

9 accounts (11.25%) have had interactions but zero signal extraction. Summit Health is
the most urgent case — 14 interactions with no intelligence captured, suggesting a
systematic extraction failure rather than a lack of engagement. Customer Success and
Mid-Market teams each have 3 zero-signal records, indicating potential team-level
constitution or agent configuration issues.

### Recommendations

1. **Summit Health (14 interactions, 0 signals)**: This is almost certainly an extraction
   failure, not an engagement issue. Review the session recordings for this account to
   determine if signals should have been detected. Check whether the assigned agent has
   the correct constitution version configured.

2. **Team-level investigation**: Customer Success has the highest proportion of zero-signal
   records (16.7%). Compare their agent configurations and session formats with Enterprise
   Sales, which has the lowest proportion (7.1%).

3. **Quick wins**: Beacon Analytics and Alpine Tech are still actively engaged. A single
   targeted session with properly configured signal extraction could move all three from
   zero to detected status.
```

---

## Context Desert Scanner

### What It Does

Identifies entity records with no context at all — no signals, no interactions, no coverage of any kind. These are accounts that exist in the system but are completely dark, representing the most severe coverage gaps.

### When to Use

Trigger this skill when the user asks questions like:
- "Which accounts have no data at all?"
- "Find records with no context attached"
- "Show me completely empty entity records"
- "Which entities are total blind spots?"
- "Find our darkest accounts"
- "Which records have never been touched?"

### Workflow

1. Collect `organizationId` from the user (see Required Inputs above)
2. Query `records_without_context` with `organizationId` and optional date range
3. Extract entity records with zero interactions AND zero signals
4. Sort by creation date (oldest first — longest-neglected records first)
5. Include creation date and assigned team (if any) for context
6. Present the results in the output format below

### Example Output

```
## Context Desert Scanner

**Organisation: TechCorp Global**
**Records with No Context: 7 of 80 (8.75%)**

### Completely Dark Records (Sorted by Age)

| Account | Created | Days Since Created | Schema Type | Assigned Team | Status |
|---------|---------|-------------------|-------------|---------------|--------|
| Orion Medical | 2025-06-12 | 286 days | Enterprise | None | 🔴 No team, no context |
| Pinnacle Group | 2025-08-03 | 234 days | Enterprise | Strategic | 🔴 Assigned but neglected |
| Frost Logistics | 2025-09-18 | 188 days | Mid-Market | None | 🔴 No team, no context |
| Cedar Finance | 2025-11-01 | 144 days | Enterprise | Enterprise Sales | 🔴 Assigned but neglected |
| Quartz Systems | 2026-01-10 | 74 days | Mid-Market | Mid-Market | 🟠 Recently created |
| Prism Labs | 2026-02-05 | 48 days | Startup | None | 🟠 Recently created |
| Vertex AI | 2026-03-01 | 24 days | Startup | None | 🟡 Very new |

### By Schema Type

| Schema Type | Dark Records | Total Records | % Dark |
|-------------|-------------|---------------|--------|
| Enterprise | 3 | 35 | 8.6% |
| Mid-Market | 2 | 28 | 7.1% |
| Startup | 2 | 17 | 11.8% |

### By Team Assignment

| Status | Count | Details |
|--------|-------|---------|
| Assigned but neglected | 3 | Have a team but zero engagement |
| Unassigned | 3 | No team ownership at all |
| Recently created (< 30 days) | 1 | May not yet have had time for engagement |

### Summary

7 accounts (8.75%) are completely dark — no interactions and no signals. 3 of these
have been in the system for over 6 months without any engagement, and 3 have no team
assignment at all. Startups have the highest dark rate at 11.8%, possibly reflecting
a lack of structured onboarding for that schema type.

### Recommendations

1. **Immediate team assignment**: Orion Medical (286 days), Frost Logistics (188 days),
   and Prism Labs (48 days) have no team ownership. Assign them to appropriate teams
   before any other action.

2. **Neglected assigned accounts**: Pinnacle Group and Cedar Finance are assigned to
   teams but have zero engagement. Escalate to team leads to understand why these
   accounts have been ignored. They should be either actively engaged or marked as
   inactive if they are no longer relevant.

3. **Startup onboarding process**: Startups have the highest dark rate. Consider whether
   the startup schema type needs a different onboarding workflow — perhaps a mandatory
   initial session within 14 days of record creation.

4. **Grace period**: Vertex AI was created 24 days ago. Flag for review in 7 days if
   still dark, but do not escalate yet.
```

---

## High Velocity / No Signal Alert

### What It Does

Identifies entity records with high engagement velocity (many interactions) but no recent signal detections. These are the highest-risk accounts — actively engaged but producing no captured intelligence, indicating a signal extraction failure on the most active accounts.

### When to Use

Trigger this skill when the user asks questions like:
- "Which active accounts aren't generating signals?"
- "Show me high velocity accounts with no recent signal activity"
- "Are there accounts we're talking to but not capturing intelligence from?"
- "Flag accounts where engagement is high but signals are absent"
- "Find extraction failures on active accounts"

### Risk Classification

| Risk Level | Definition | Indicator |
|-----------|-----------|-----------|
| **Critical** | 10+ interactions in period, 0 signals in last 30 days | 🔴 |
| **High** | 5-9 interactions in period, 0 signals in last 30 days | 🟠 |
| **Elevated** | 3-4 interactions in period, 0 signals in last 30 days | 🟡 |

### Workflow

1. Collect `organizationId` from the user (see Required Inputs above)
2. Query `high_velocity_no_recent_signal` with `organizationId` and optional date range
3. Extract records with high interaction count but zero recent signals
4. Classify by risk level using the table above
5. Sort by interaction count descending (most active with zero signals first)
6. Present the results in the output format below

### Example Output

```
## High Velocity / No Signal Alert

**Organisation: TechCorp Global**
**Period: 2026-02-23 to 2026-03-25**
**High-Velocity Records with No Recent Signals: 5**

### Alert Records

| Account | Interactions (Period) | Last Signal | Signal Gap (Days) | Channel | Risk |
|---------|----------------------|------------|-------------------|---------|------|
| Summit Health | 14 | Never | — | Meetings | 🔴 Critical |
| Beacon Analytics | 11 | 2025-12-15 | 100 days | Conversations | 🔴 Critical |
| Alpine Tech | 8 | 2026-01-28 | 56 days | Meetings | 🟠 High |
| Sterling Group | 6 | 2026-02-10 | 43 days | Calls | 🟠 High |
| Redwood Corp | 4 | 2026-01-05 | 79 days | Calls | 🟡 Elevated |

### Root Cause Indicators

| Account | Possible Cause | Evidence |
|---------|---------------|----------|
| Summit Health | Extraction failure — agent config | 14 meetings with zero lifetime signals suggests misconfigured agent |
| Beacon Analytics | Signal decay — constitution gap | Signals stopped 100 days ago despite continued engagement — constitution may have changed |
| Alpine Tech | Agent coverage change | Different agent assigned 60 days ago — new agent may lack constitution training |
| Sterling Group | Channel gap | Telephony channel may not have signal extraction enabled |
| Redwood Corp | Low-quality sessions | 4 interactions but all under 5 minutes — insufficient depth for extraction |

### Summary

5 accounts are actively engaged but producing no recent signals. Summit Health is the
most critical — 14 interactions with zero lifetime signals, which is almost certainly
an agent configuration issue. Beacon Analytics was previously generating signals but
stopped 100 days ago, suggesting a constitution or agent change broke extraction for
this account.

### Recommendations

1. **Summit Health (Critical)**: Audit the agent configuration for this account immediately.
   14 meetings with zero signals is not normal — check constitution version, signal
   categories enabled, and agent assignment.

2. **Beacon Analytics (Critical)**: Compare the constitution version active when signals
   were last detected (Dec 2025) with the current version. Something changed that stopped
   extraction for this account.

3. **Sterling Group (High)**: Verify that signal extraction is enabled for the telephony
   channel. If this account is primarily engaged via calls and telephony extraction is
   disabled, that explains the gap.

4. **Redwood Corp (Elevated)**: Review session duration. If all 4 interactions are under
   5 minutes, there may not be enough content for signal extraction. Consider switching
   to a longer-format engagement channel.
```

---

## Schema Signal Coverage Comparison

### What It Does

Produces a side-by-side comparison of signal coverage across entity schema types. Shows per-schema coverage percentages, category-level comparison, and identifies schema types that are structurally under-served by the current constitution.

### When to Use

Trigger this skill when the user asks questions like:
- "How does signal coverage compare across entity types?"
- "Are some schemas getting better coverage than others?"
- "Compare signal extraction across our entity schemas"
- "Which entity type has the worst signal coverage?"
- "Is our constitution working equally well for all record types?"

### Workflow

1. Collect `organizationId` from the user (see Required Inputs above)
2. Query `entity_schema_signal_coverage` with `organizationId` and optional date range
3. Extract per-schema coverage percentages and category-level breakdowns
4. Identify schemas with significantly lower coverage than the org average
5. Highlight category-level gaps specific to each schema
6. Present the results in the output format below

### Example Output

```
## Schema Signal Coverage Comparison

**Organisation: TechCorp Global**
**Period: 2026-02-23 to 2026-03-25**
**Schemas Analysed: 3**

### Coverage by Schema

| Schema | Records | Avg Coverage % | Avg Confidence | Strongest Category | Weakest Category | Status |
|--------|---------|---------------|----------------|-------------------|-----------------|--------|
| Enterprise | 35 | 72.4% | 0.78 | Budget & Spend (89%) | Success Metrics (12%) | 🟢 Strong |
| Mid-Market | 28 | 58.3% | 0.71 | Pain Points (74%) | Stakeholder Map (8%) | 🟡 Moderate |
| Startup | 17 | 41.2% | 0.62 | Pain Points (65%) | Risk & Blockers (0%) | 🟠 Weak |

### Category-Level Comparison

| Category | Enterprise | Mid-Market | Startup | Org Average |
|----------|-----------|-----------|---------|-------------|
| Budget & Spend | 🟢 89% | 🟡 62% | 🟠 35% | 65.3% |
| Pain Points | 🟢 82% | 🟢 74% | 🟡 65% | 74.7% |
| Decision Process | 🟢 78% | 🟡 55% | 🟠 38% | 59.3% |
| Timeline & Urgency | 🟡 68% | 🟡 52% | 🟠 42% | 55.3% |
| Competitive Landscape | 🟡 65% | 🟠 48% | 🟠 32% | 50.3% |
| Technical Requirements | 🟡 58% | 🟠 42% | 🟠 28% | 44.0% |
| Stakeholder Map | 🟡 55% | 🔴 8% | 🟠 22% | 31.3% |
| Risk & Blockers | 🟠 48% | 🟠 38% | 🔴 0% | 31.7% |
| Success Metrics | 🔴 12% | 🟠 25% | 🟠 18% | 17.7% |

### Key Gaps

| Schema | Critical Gaps | Description |
|--------|-------------|-------------|
| Mid-Market | Stakeholder Map (8%) | 47 points below Enterprise on this category — likely a question design gap |
| Startup | Risk & Blockers (0%) | Zero detection across all 17 records — constitution rules may not apply to startup context |
| All Schemas | Success Metrics (<25%) | Consistently low across all schemas — systemic constitution issue |

### Summary

Enterprise accounts have the strongest signal coverage at 72.4%, followed by Mid-Market
at 58.3% and Startup at 41.2%. The coverage gap between Enterprise and Startup is
31 percentage points, suggesting the constitution is optimised for enterprise conversations
but not adapted to startup engagement patterns. Success Metrics is consistently weak
across all schemas.

### Recommendations

1. **Startup constitution tuning**: At 41.2% coverage, startups are significantly under-served.
   Review whether the constitution's extraction rules assume enterprise-style conversations.
   Startup interactions tend to be more informal — the rules may need adaptation.

2. **Mid-Market stakeholder gap**: Stakeholder Map is at 8% for Mid-Market vs 55% for
   Enterprise. This specific gap suggests Mid-Market agents are not asking stakeholder
   questions. Add stakeholder mapping prompts to Mid-Market playbooks.

3. **Success Metrics across all schemas**: At under 25% for every schema type, this is a
   systemic issue. The extraction rules for this category likely need a complete rewrite
   rather than schema-specific tuning.
```

---

## Multi-Team Account Monitor

### What It Does

Identifies entity records that are being accessed or engaged by more than one team, with overlap details and coordination risk assessment. Surfaces accounts where multiple teams may be sending conflicting messages or duplicating effort.

### When to Use

Trigger this skill when the user asks questions like:
- "Which accounts are multiple teams touching?"
- "Are there coordination risks across our portfolio?"
- "Show me accounts with multi-team access"
- "Flag accounts where more than one team is engaged"
- "Where do we have team overlap on accounts?"
- "Are teams stepping on each other?"

### Overlap Classification

| State | Definition | Indicator |
|-------|-----------|-----------|
| **Coordinated** | Multiple teams, one designated primary owner | 🟢 |
| **Uncoordinated** | Multiple teams, no clear primary owner | 🟠 |
| **Conflicting** | Multiple teams with recent overlapping sessions on same topics | 🔴 |

### Workflow

1. Collect `organizationId` from the user (see Required Inputs above)
2. Query `records_accessed_by_multiple_teams` with `organizationId` and optional date range
3. Extract records with 2 or more teams involved
4. Classify overlap type based on ownership and engagement patterns
5. Sort by number of teams and interaction overlap
6. Present the results in the output format below

### Example Output

```
## Multi-Team Account Monitor

**Organisation: TechCorp Global**
**Period: 2026-02-23 to 2026-03-25**
**Records with Multi-Team Engagement: 7 of 80 (8.75%)**

### Multi-Team Records

| Account | Teams | Interactions by Team | Primary Owner | Overlap Type | Status |
|---------|-------|---------------------|---------------|-------------|--------|
| Apex Solutions | Enterprise Sales (4), Customer Success (3) | 7 total | None assigned | Uncoordinated | 🟠 |
| Atlas Corp | Mid-Market (2), Strategic (5) | 7 total | Strategic | Coordinated | 🟢 |
| Meridian Labs | Customer Success (6), Enterprise Sales (2) | 8 total | Customer Success | Coordinated | 🟢 |
| Nova Retail | Mid-Market (3), Customer Success (3) | 6 total | None assigned | Uncoordinated | 🟠 |
| Zenith Corp | Strategic (4), Enterprise Sales (3), Mid-Market (1) | 8 total | None assigned | Conflicting | 🔴 |
| Summit Health | Customer Success (5), Mid-Market (2) | 7 total | Customer Success | Coordinated | 🟢 |
| Alpine Tech | Enterprise Sales (4), Strategic (2) | 6 total | None assigned | Uncoordinated | 🟠 |

### Overlap Summary

| Overlap Type | Count | % of Multi-Team Records |
|-------------|-------|------------------------|
| Coordinated | 3 | 42.9% |
| Uncoordinated | 3 | 42.9% |
| Conflicting | 1 | 14.3% |

### Conflict Detail

| Account | Issue | Evidence |
|---------|-------|---------|
| Zenith Corp | 3 teams engaging, no primary owner, overlapping topics in last 2 weeks | Strategic and Enterprise Sales both discussed pricing in separate sessions 3 days apart — risk of conflicting commitments |

### Summary

7 accounts (8.75%) have multi-team engagement. 3 of these are well-coordinated with
a clear primary owner, but 3 are uncoordinated and 1 (Zenith Corp) has active conflicting
engagement — two teams discussed pricing independently within 3 days, creating a risk
of inconsistent commitments.

### Recommendations

1. **Zenith Corp (Conflicting)**: Immediately assign a primary owner and schedule a
   handoff meeting between Strategic, Enterprise Sales, and Mid-Market to align on
   account strategy. Conflicting pricing discussions are the highest-risk overlap type.

2. **Uncoordinated accounts**: Apex Solutions, Nova Retail, and Alpine Tech each have
   multi-team engagement with no primary owner. Assign primary ownership for all three
   before the next engagement cycle.

3. **Process improvement**: 57% of multi-team accounts lack coordination. Consider
   implementing an automatic notification when a second team initiates engagement
   with an account already being covered by another team.
```

---

## Top Accounts by Intelligence Score

### What It Does

Ranks entity records by a composite intelligence score that combines signal volume, average confidence, category coverage, and signal freshness. Surfaces the accounts with the richest, most reliable intelligence — useful for case study selection, reference accounts, and expansion targeting.

### When to Use

Trigger this skill when the user asks questions like:
- "Which accounts have the best intelligence coverage?"
- "Rank our accounts by intelligence quality"
- "Show me our best-covered entity records"
- "Which accounts have the highest intelligence scores?"
- "What are our best-understood accounts?"
- "Find our strongest accounts for case studies"

### Intelligence Score Components

The composite intelligence score is assembled from four equally weighted components:

| Component | What It Measures | Weight | Score Range |
|-----------|-----------------|--------|-------------|
| **Volume** | Total number of detected signals | 25% | 0-100 based on percentile rank across portfolio |
| **Confidence** | Average confidence across all detected signals | 25% | 0-100 (mapped from 0.0-1.0 confidence) |
| **Coverage** | % of expected signal categories detected | 25% | 0-100 (% directly) |
| **Freshness** | % of signals refreshed in the last 21 days | 25% | 0-100 (% directly) |

### Intelligence Tier

| Tier | Score Range | Meaning |
|------|-------------|---------|
| **Platinum** | 85-100 | Best-in-class intelligence — ideal for case studies and references |
| **Gold** | 70-84 | Strong intelligence with minor gaps |
| **Silver** | 50-69 | Adequate intelligence but room for improvement |
| **Bronze** | 25-49 | Below-average intelligence — needs investment |
| **Unranked** | 0-24 | Insufficient data to score meaningfully |

### Workflow

1. Collect `organizationId` from the user (see Required Inputs above)
2. Query `top_records_by_intelligence_score` with `organizationId` and optional date range
3. Extract ranked records with component-level score breakdowns
4. Classify each into intelligence tiers using the table above
5. Present the top records and tier distribution
6. Present the results in the output format below

### Example Output

```
## Top Accounts by Intelligence Score

**Organisation: TechCorp Global**
**Period: 2026-02-23 to 2026-03-25**
**Scored Records: 73 (7 unranked due to insufficient data)**

### Top 10 Records

| Rank | Account | Score | Volume | Confidence | Coverage | Freshness | Tier |
|------|---------|-------|--------|-----------|----------|-----------|------|
| 1 | Acme Corp | 91 | 95 | 88 | 85 | 96 | 🟢 Platinum |
| 2 | Meridian Labs | 88 | 90 | 85 | 82 | 94 | 🟢 Platinum |
| 3 | Atlas Corp | 85 | 82 | 88 | 78 | 92 | 🟢 Platinum |
| 4 | Nova Retail | 79 | 78 | 82 | 74 | 82 | 🟢 Gold |
| 5 | Sterling Group | 76 | 72 | 80 | 72 | 80 | 🟢 Gold |
| 6 | Cascade Media | 71 | 68 | 76 | 68 | 72 | 🟢 Gold |
| 7 | Summit Health | 65 | 62 | 72 | 65 | 61 | 🟡 Silver |
| 8 | Cedar Finance | 62 | 58 | 68 | 62 | 60 | 🟡 Silver |
| 9 | Frost Logistics | 54 | 52 | 62 | 55 | 47 | 🟡 Silver |
| 10 | Beacon Analytics | 48 | 45 | 55 | 48 | 44 | 🟠 Bronze |

### Tier Distribution

| Tier | Count | % of Scored Records |
|------|-------|---------------------|
| Platinum (85-100) | 3 | 4.1% |
| Gold (70-84) | 12 | 16.4% |
| Silver (50-69) | 28 | 38.4% |
| Bronze (25-49) | 22 | 30.1% |
| Unranked (0-24) | 8 | 11.0% |

### Score Component Analysis

| Component | Portfolio Average | Best Performer | Worst Performer (scored) |
|-----------|-----------------|----------------|------------------------|
| Volume | 58.2 | Acme Corp (95) | Redwood Corp (18) |
| Confidence | 64.8 | Atlas Corp (88) | Alpine Tech (32) |
| Coverage | 61.5 | Acme Corp (85) | Quartz Systems (22) |
| Freshness | 59.1 | Acme Corp (96) | Pinnacle Group (15) |

### Summary

3 accounts qualify as Platinum intelligence — Acme Corp, Meridian Labs, and Atlas Corp.
These are the best candidates for case studies, reference accounts, and expansion
targeting, as they have the deepest and freshest intelligence. The portfolio average
intelligence score is 58.2 (Silver tier), with freshness being the weakest component
across the board at 59.1.

### Recommendations

1. **Case study candidates**: Acme Corp (91), Meridian Labs (88), and Atlas Corp (85)
   have Platinum-level intelligence. Use these as reference accounts or case study
   subjects — the data is rich enough to tell a compelling story.

2. **Freshness investment**: Freshness is the lowest-scoring component portfolio-wide
   (59.1). A targeted re-engagement campaign for accounts with stale signals could
   lift the portfolio average significantly.

3. **Bronze accounts**: 22 accounts (30.1%) are in Bronze tier. Cross-reference with
   the Zero Signal Record Finder and High Velocity / No Signal Alert to identify which
   are extraction failures vs genuine low-engagement accounts.

4. **Unranked accounts**: 8 accounts have insufficient data to score. These should be
   cross-referenced with the Context Desert Scanner for prioritisation.
```

---

## Shared Rules

These rules apply to **all organisation analytics skills** in this file.

### Data Integrity

1. **Never fabricate data.** If a tool returns empty or insufficient results, say so clearly. Do not invent scores, percentages, counts, or categories.
2. **Always present evidence.** Every claim in the output must trace back to a specific tool result. Do not make qualitative judgements without data backing.
3. **Distinguish between "no data" and "zero."** An account with zero signals may still have interactions. An account with no interactions may still exist. Be precise about what is missing.

### Scope Enforcement

4. **Only `organizationId` is required** — do not ask for entity context. If the user asks about a specific account, redirect them to entity analytics.
5. **Default time window is last 30 days** unless the user specifies otherwise.
6. **Reuse context from the conversation.** If the user already selected an organization earlier, do not ask again.

### Access Control

7. **For member-level data, check access.** Admin/owner sees all members. Regular users see only their own entry. Never expose individual member metrics to unauthorised users.
8. **Aggregate data is visible to all authenticated org members.** Totals, distributions, and tier counts do not require admin access.

### Output Formatting

9. **Use structured tables** for tier breakdowns, rankings, and distributions.
10. **Use status indicators** (🟢 🟡 🟠 🔴) consistently: green = strong/good, yellow = watch/moderate, orange = weak/declining, red = critical/missing.
11. **Always include a Summary section** at the end — 2-5 sentences, lead with the most important finding.
12. **Always include Recommendations** — at least one actionable suggestion per identified issue. Recommendations should be specific enough to act on ("assign a team to Orion Medical") not generic ("improve coverage").

### Cross-Skill Routing

13. **For zero-signal and context-desert queries**, suggest concrete next steps including which teams to notify and what actions to take.
14. **For portfolio health**, present tier counts AND list specific at-risk accounts. Never show just the aggregate without naming the accounts that need attention.
15. **If a finding in org analytics warrants deeper investigation on a specific account**, recommend running the relevant entity analytics skill (e.g., "Run Account Health Pulse on Summit Health to diagnose the extraction failure").
