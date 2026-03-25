---
name: analytics-user
description: >
  Individual user activity and performance analytics. Covers activity digests,
  entity records touched, session quality trends, pinned records engagement,
  signal detection accuracy, cross-entity coverage, telephony patterns, and
  last active tracking.
metadata:
  author: Auron
  version: 1.0.0
  category: analytics-user
---

Important: Please read `auron-docs` and `api` skills before running user analytics. You need an organizationId, a valid API key, and a valid session token.

# User Analytics

User analytics measure individual user activity, engagement quality, and productivity across entity records, sessions, and channels. Every skill in this file requires an `organizationId` and a `userId` to operate. These skills answer questions like "what has this user been working on?", "are their sessions producing good signals?", and "which accounts have they gone quiet on?"

All user analytics work by querying the Explore API with the appropriate context. The Explore API internally selects the right pre-built aggregation tools for each question.

---

## Required Inputs

Every user analytics skill requires the following inputs. **You must collect all required inputs before making any query.** Never guess or assume values.

| Input | Required | Description | How to obtain |
|-------|----------|-------------|---------------|
| `organizationId` | Yes | The organization scope for all data | Ask the user to select their organization. Use the `api` skill to list organizations if needed. |
| `userId` | Yes | The specific user to analyze | Ask the user which team member they want to analyze, or confirm they want their own data. Use the `api` skill to list users if needed. |
| `fromDate` | No | Start of time window (ISO 8601) | Ask the user if they want to scope the analysis to a specific time range. Default: last 30 days. |
| `toDate` | No | End of time window (ISO 8601) | Same as above. Default: now. |

### Input Collection Rules

1. If the user says "my activity" or "my data", use their own `userId` from the session context.
2. If the user asks about another team member by name, search users by name and confirm the match before proceeding.
3. Never proceed with a query if `organizationId` or `userId` is missing.
4. If the user has previously selected an organization or user in the conversation, reuse it -- do not ask again.

### Access Control (CRITICAL)

- Admin/owner of the organization can query any user's data without restriction.
- Regular users can ONLY query their own data. The `userId` must match the API key owner.
- If a non-admin tries to query another user's data, respond: "You can only view your own activity. Contact an admin for team-wide analytics."
- **Never bypass this restriction.** Even if the user provides another user's ID, enforce the check.

---

## User Activity Digest

### What It Does

Produces a comprehensive activity summary for a user including sessions initiated, messages sent, signals contributed, and period-over-period change. Shows both absolute numbers and trend direction to quickly assess whether the user's engagement is increasing, stable, or declining.

### When to Use

Trigger this skill when the user asks questions like:
- "What has [user] been up to?"
- "Show me my activity summary"
- "How active has this user been?"
- "Give me a digest of [user]'s work"
- "Is [user] more or less active than last month?"

### Activity Dimensions

| Dimension | What It Measures |
|-----------|-----------------|
| Sessions Initiated | Total sessions the user started or participated in |
| Messages Sent | Total messages sent across all sessions |
| Signals Contributed | Signals extracted from sessions the user participated in |
| Active Days | Distinct days with at least one session |
| Avg Session Duration | Mean duration of the user's sessions |

### Workflow

1. Collect `organizationId` and `userId` from the user (see Required Inputs above)
2. Enforce access control -- verify the requesting user can see this data
3. Query `user_activity_summary` with the collected inputs
4. Compute period-over-period change for each dimension (current period vs equivalent prior period)
5. Classify each trend as Improving / Stable / Declining
6. Present the results in the output format below

### Example Output

```
## User Activity Digest: Sarah K.

**Organization: Acme Inc | Period: Feb 24 – Mar 25, 2026**

| Dimension | Current Period | Prior Period | Change | Trend |
|-----------|---------------|-------------|--------|-------|
| Sessions Initiated | 34 | 28 | +21.4% | 🟢 Improving |
| Messages Sent | 412 | 389 | +5.9% | 🟢 Stable |
| Signals Contributed | 98 | 74 | +32.4% | 🟢 Improving |
| Active Days | 22 | 19 | +15.8% | 🟢 Improving |
| Avg Session Duration | 18m 24s | 16m 02s | +14.8% | 🟢 Improving |

### Summary

Sarah K.'s activity is trending upward across all dimensions. Signal contribution has increased 32.4% period-over-period, the strongest growth area, suggesting her sessions are becoming more productive. She has been active 22 of the past 30 days, showing consistent engagement.

### Recommendations

1. **Leverage the momentum**: Sarah's increasing signal yield suggests her session quality is
   improving. Consider assigning her to higher-priority accounts to maximize the intelligence
   return from her growing productivity.
```

---

## Entity Records Touched

### What It Does

Lists all entity records the user has interacted with during the time window, sorted by recency. Shows interaction depth (number of sessions per record) and time since last interaction, making it easy to see where the user is focusing and where engagement has lapsed.

### When to Use

Trigger this skill when the user asks questions like:
- "Which accounts has [user] worked on?"
- "What records have I touched recently?"
- "Show me [user]'s account coverage"
- "Which accounts has [user] been focused on?"
- "Where is [user] spending their time?"

### Engagement Dimensions

| Dimension | What It Measures |
|-----------|-----------------|
| Sessions | Number of sessions with this entity record |
| Last Interaction | Days since the most recent session |
| Signals | Signals extracted from sessions with this record |
| Depth Rating | Engagement depth classification (Deep / Moderate / Light) |

### Depth Rating Classification

| Rating | Definition |
|--------|-----------|
| **Deep** | 5+ sessions in the period with recent activity (last 7 days) |
| **Moderate** | 2-4 sessions or 5+ sessions with stale activity (8+ days) |
| **Light** | 1 session only |

### Workflow

1. Collect `organizationId` and `userId` from the user
2. Enforce access control
3. Query `user_entity_records_touched` with the collected inputs
4. Sort by last interaction date (most recent first)
5. Classify each record's engagement depth
6. Flag records with last interaction > 30 days as potentially stale
7. Present the results in the output format below

### Example Output

```
## Entity Records Touched: Sarah K.

**Organization: Acme Inc | Period: Feb 24 – Mar 25, 2026**
**Total Records: 12**

| Entity Record | Sessions | Last Interaction | Signals | Depth |
|--------------|----------|-----------------|---------|-------|
| Acme Corp | 8 | 2 days ago | 24 | 🟢 Deep |
| GlobalTech Solutions | 6 | 4 days ago | 18 | 🟢 Deep |
| Vertex Industries | 4 | 9 days ago | 11 | 🟡 Moderate |
| NovaBridge Corp | 3 | 12 days ago | 8 | 🟡 Moderate |
| Summit Analytics | 2 | 18 days ago | 5 | 🟡 Moderate |
| Pinnacle Group | 1 | 22 days ago | 2 | 🟠 Light |
| ... | ... | ... | ... | ... |

### Stale Records (Last interaction > 30 days)

| Entity Record | Last Interaction | Sessions | Notes |
|--------------|-----------------|----------|-------|
| CloudFirst Inc | 35 days ago | 2 | No other user has touched this record since |
| DataSync Ltd | 42 days ago | 1 | Record also covered by Michael R. (active 5 days ago) |

### Summary

Sarah is actively engaged with 5 entity records (interaction within the last 14 days), with deep engagement on Acme Corp and GlobalTech Solutions. Two records have gone stale with no interaction in 30+ days. CloudFirst Inc is a concern as no other user has touched it either.

### Recommendations

1. **CloudFirst Inc (35 days stale)**: This record has no coverage from any user. Schedule a
   check-in session within the next week to prevent the account from going dark.

2. **Pinnacle Group (Light engagement)**: Only one session with this record. Determine if this
   account requires deeper coverage or if the single session was sufficient.
```

---

## Session Quality Over Time

### What It Does

Tracks the quality of a user's sessions over time using multiple quality indicators. Shows whether the user's session effectiveness is improving, stable, or declining, with specific metrics that explain the trend.

### When to Use

Trigger this skill when the user asks questions like:
- "Is [user]'s session quality improving?"
- "How good are my sessions?"
- "Show me session quality trends"
- "Are [user]'s conversations getting better?"
- "Track my session effectiveness over time"

### Quality Dimensions

| Dimension | What It Measures |
|-----------|-----------------|
| Signal Yield | Signals extracted per session |
| Avg Confidence | Mean signal confidence across sessions |
| Session Duration | Average time spent per session |
| Feedback Score | User/recipient feedback when available |
| Starred Messages | Count of messages marked as important |

### Trend Classification

| Direction | Definition | Indicator |
|-----------|-----------|-----------|
| **Improving** | Current period metric > prior period by 10%+ | 🟢 |
| **Stable** | Within +/-10% of prior period | 🟡 |
| **Declining** | Current period metric < prior period by 10%+ | 🟠 |
| **Critical Decline** | Current period metric < prior period by 30%+ | 🔴 |

### Workflow

1. Collect `organizationId` and `userId` from the user
2. Enforce access control
3. Query `user_session_quality` with the collected inputs
4. Compute each quality dimension for the current and prior period
5. Classify trend direction for each dimension
6. If any dimension shows Critical Decline, flag it prominently
7. Present the results in the output format below

### Example Output

```
## Session Quality Over Time: Sarah K.

**Organization: Acme Inc | Period: Feb 24 – Mar 25, 2026**

| Dimension | Current Period | Prior Period | Change | Trend |
|-----------|---------------|-------------|--------|-------|
| Signal Yield | 2.88 / session | 2.64 / session | +9.1% | 🟡 Stable |
| Avg Confidence | 0.79 | 0.72 | +9.7% | 🟡 Stable |
| Avg Duration | 18m 24s | 16m 02s | +14.8% | 🟢 Improving |
| Feedback Score | 4.2 / 5.0 | 4.0 / 5.0 | +5.0% | 🟡 Stable |
| Starred Messages | 12 | 8 | +50.0% | 🟢 Improving |

### Weekly Breakdown (Last 4 Weeks)

| Week | Sessions | Yield/Session | Avg Confidence | Starred |
|------|----------|---------------|----------------|---------|
| Mar 18-25 | 9 | 3.11 | 0.81 | 4 |
| Mar 11-17 | 8 | 2.88 | 0.80 | 3 |
| Mar 4-10 | 10 | 2.80 | 0.77 | 3 |
| Feb 25-Mar 3 | 7 | 2.57 | 0.76 | 2 |

### Summary

Sarah's session quality is stable to improving across all dimensions. Starred messages have increased 50%, indicating that sessions are producing more noteworthy insights. The weekly breakdown shows a steady upward trend in signal yield, from 2.57 four weeks ago to 3.11 this week.

### Recommendations

1. **Sustain the trajectory**: Sarah's improving trend is clear in the weekly breakdown. No
   corrective action needed -- continue current approach.

2. **Share best practices**: With consistently improving quality, Sarah's session techniques
   could serve as a template for other team members. Consider a knowledge-sharing session.
```

---

## Pinned Records Engagement

### What It Does

Measures engagement depth specifically on entity records the user has pinned (bookmarked or prioritized). Pinned records represent accounts the user has explicitly flagged as important, so low engagement on pinned records is a workflow alignment issue that should be surfaced.

### When to Use

Trigger this skill when the user asks questions like:
- "Am I engaging enough with my pinned accounts?"
- "Show me activity on my bookmarked records"
- "Are my priority accounts getting attention?"
- "Which pinned records have I been ignoring?"
- "Check my pinned account engagement"

### Engagement Dimensions

| Dimension | What It Measures |
|-----------|-----------------|
| Sessions | Sessions with this pinned record in the period |
| Signals | Signals extracted from sessions with this record |
| Last Interaction | Days since most recent session |
| Engagement Status | Active / Cooling / Neglected classification |

### Engagement Status Classification

| Status | Definition |
|--------|-----------|
| **Active** | Session within the last 7 days |
| **Cooling** | Last session 8-21 days ago |
| **Neglected** | Last session 22+ days ago or no sessions in the period |

### Workflow

1. Collect `organizationId` and `userId` from the user
2. Enforce access control
3. Query `user_pinned_records_engagement` with the collected inputs
4. Classify each pinned record's engagement status
5. Flag neglected records prominently -- these are records the user explicitly prioritized but is not engaging with
6. Present the results in the output format below

### Example Output

```
## Pinned Records Engagement: Sarah K.

**Organization: Acme Inc | Period: Feb 24 – Mar 25, 2026**
**Total Pinned Records: 8**

| Entity Record | Sessions | Signals | Last Interaction | Status |
|--------------|----------|---------|-----------------|--------|
| Acme Corp | 8 | 24 | 2 days ago | 🟢 Active |
| GlobalTech Solutions | 6 | 18 | 4 days ago | 🟢 Active |
| Vertex Industries | 4 | 11 | 9 days ago | 🟡 Cooling |
| NovaBridge Corp | 3 | 8 | 12 days ago | 🟡 Cooling |
| Pinnacle Group | 1 | 2 | 22 days ago | 🟠 Neglected |
| Summit Analytics | 0 | 0 | 38 days ago | 🔴 Neglected |
| CloudFirst Inc | 0 | 0 | Never | 🔴 Neglected |
| DataSync Ltd | 1 | 3 | 26 days ago | 🟠 Neglected |

**Active: 2 | Cooling: 2 | Neglected: 4**

### Summary

Half of Sarah's pinned records are in neglected status, including CloudFirst Inc which has never had a session despite being pinned. Summit Analytics and DataSync Ltd have also gone stale. This suggests a workflow alignment issue -- the user's stated priorities (pinned records) do not match their actual engagement patterns.

### Recommendations

1. **CloudFirst Inc (Never contacted)**: This record was pinned but never engaged. Either
   schedule an initial session immediately or unpin it if priorities have changed.

2. **Summit Analytics (38 days stale)**: Re-engage with this account within the next week. If
   it is no longer a priority, unpin it to keep the pinned list meaningful.

3. **Workflow alignment**: With 4 of 8 pinned records neglected, consider reviewing and
   reprioritizing the pinned list. A smaller, actively engaged pinned list is more useful
   than a large, partially neglected one.
```

---

## Signal Detection Accuracy

### What It Does

Analyzes the ratio of high-confidence signals to low-confidence signals produced from a user's sessions. A high ratio of low-confidence signals may indicate that the user's conversational approach is not eliciting clear, actionable information from contacts.

### When to Use

Trigger this skill when the user asks questions like:
- "How accurate are the signals from my sessions?"
- "What's the confidence distribution for [user]?"
- "Are my sessions producing reliable signals?"
- "Show me signal quality breakdown"
- "How many low-confidence signals am I generating?"

### Confidence Tiers

| Tier | Confidence Range | Meaning |
|------|-----------------|---------|
| **High** | 0.80 - 1.00 | Strong, actionable signal with clear evidence |
| **Medium** | 0.50 - 0.79 | Reasonable signal but may need corroboration |
| **Low** | 0.00 - 0.49 | Weak signal -- may not be reliable for decisions |

### Workflow

1. Collect `organizationId` and `userId` from the user
2. Enforce access control
3. Query `user_signal_detection_accuracy` with the collected inputs
4. Compute the distribution across High / Medium / Low tiers
5. Calculate the High-to-Low ratio (high count / low count)
6. Compare against the organization average if available
7. Present the results in the output format below

### Example Output

```
## Signal Detection Accuracy: Sarah K.

**Organization: Acme Inc | Period: Feb 24 – Mar 25, 2026**
**Total Signals: 98**

| Tier | Count | Percentage | Status |
|------|-------|-----------|--------|
| High (0.80+) | 42 | 42.9% | 🟢 |
| Medium (0.50-0.79) | 39 | 39.8% | 🟡 |
| Low (< 0.50) | 17 | 17.3% | 🟠 |

**High-to-Low Ratio: 2.47** (org average: 1.85)

### Comparison to Organization Average

| Metric | Sarah K. | Org Average | Status |
|--------|---------|-------------|--------|
| High % | 42.9% | 35.2% | 🟢 Above average |
| Medium % | 39.8% | 41.0% | 🟡 On par |
| Low % | 17.3% | 23.8% | 🟢 Below average (good) |
| High-to-Low Ratio | 2.47 | 1.85 | 🟢 Above average |

### Summary

Sarah's signal accuracy profile is above the organization average, with a High-to-Low ratio of 2.47 vs the org average of 1.85. She produces proportionally more high-confidence signals and fewer low-confidence ones. Her 17.3% low-confidence rate is 6.5 percentage points better than the org average.

### Recommendations

1. **Low-confidence signals (17.3%)**: While below average, reviewing the 17 low-confidence
   signals may reveal patterns -- are they clustered around a specific entity record or signal
   category? Targeted follow-up questions in future sessions could convert some of these to
   higher confidence.

2. **Best practice sharing**: Sarah's above-average accuracy suggests effective conversational
   techniques. Document her approach for team training.
```

---

## Cross-Entity Coverage

### What It Does

Measures the breadth of a user's engagement across different entity types in the organization. Shows whether the user is focused narrowly on one type of entity (e.g., only enterprise accounts) or has balanced coverage across all entity types they are expected to engage with.

### When to Use

Trigger this skill when the user asks questions like:
- "How broad is my coverage across entity types?"
- "Am I focusing too much on one type of account?"
- "Show me [user]'s engagement by entity type"
- "Which entity types am I neglecting?"
- "Break down my activity by record type"

### Coverage Dimensions

| Dimension | What It Measures |
|-----------|-----------------|
| Entity Type | The category or type of entity record |
| Records Engaged | Number of distinct records of this type the user interacted with |
| Sessions | Total sessions with records of this type |
| Signals | Signals extracted from sessions with records of this type |
| Type Coverage | Records engaged / total records of this type (percentage) |

### Workflow

1. Collect `organizationId` and `userId` from the user
2. Enforce access control
3. Query `user_cross_entity_coverage` with the collected inputs
4. Group engagement metrics by entity type
5. Identify entity types with zero or very low engagement
6. Compare against expected coverage if role-based expectations are available
7. Present the results in the output format below

### Example Output

```
## Cross-Entity Coverage: Sarah K.

**Organization: Acme Inc | Period: Feb 24 – Mar 25, 2026**

| Entity Type | Total Records | Records Engaged | Sessions | Signals | Coverage |
|-------------|--------------|----------------|----------|---------|----------|
| Enterprise | 15 | 8 | 22 | 58 | 🟢 53% |
| Mid-Market | 28 | 4 | 9 | 22 | 🟠 14% |
| SMB | 42 | 0 | 0 | 0 | 🔴 0% |
| Partner | 8 | 2 | 3 | 6 | 🟡 25% |

### Summary

Sarah's engagement is heavily concentrated in Enterprise accounts (53% coverage, 67% of her signals) with minimal Mid-Market engagement and zero SMB coverage. If her role requires cross-segment engagement, this represents a significant coverage gap. Partner engagement is low but may be appropriate depending on role expectations.

### Recommendations

1. **SMB gap (0% coverage)**: If Sarah's role includes SMB accounts, this is a critical gap.
   Discuss with her manager whether SMB accounts should be reassigned or whether Sarah needs
   to allocate time to this segment.

2. **Mid-Market (14% coverage)**: With only 4 of 28 Mid-Market records engaged, there is
   significant room for broader coverage. Identify the highest-priority Mid-Market accounts
   and schedule introductory sessions.

3. **Enterprise focus**: Sarah's deep Enterprise engagement is a strength. Ensure this focus
   is intentional and aligned with organizational priorities before reallocating effort.
```

---

## Telephony Patterns

### What It Does

Analyzes a user's telephone call patterns including call frequency, average duration, call outcomes, and signal yield per call. Reveals whether the user's telephony engagement is productive and identifies opportunities to improve call effectiveness.

### When to Use

Trigger this skill when the user asks questions like:
- "How are my phone calls going?"
- "Show me [user]'s telephony activity"
- "What's my call success rate?"
- "How many signals come from my calls?"
- "Am I making enough calls?"
- "Break down my call performance"

### Telephony Dimensions

| Dimension | What It Measures |
|-----------|-----------------|
| Total Calls | Number of telephony sessions in the period |
| Connection Rate | % of calls that were answered |
| Avg Duration | Mean duration of connected calls |
| Signal Yield | Signals extracted per connected call |
| Productive Rate | % of connected calls that produced at least one signal |

### Workflow

1. Collect `organizationId` and `userId` from the user
2. Enforce access control
3. Query `user_telephony_patterns` with the collected inputs
4. Compute call outcomes, duration, yield, and productive rate
5. Compare against user's prior period if available
6. Present the results in the output format below

### Example Output

```
## Telephony Patterns: Sarah K.

**Organization: Acme Inc | Period: Feb 24 – Mar 25, 2026**

| Metric | Current Period | Prior Period | Change | Trend |
|--------|---------------|-------------|--------|-------|
| Total Calls | 18 | 14 | +28.6% | 🟢 Improving |
| Connection Rate | 72% (13/18) | 64% (9/14) | +8pp | 🟢 Improving |
| Avg Duration | 14m 18s | 11m 42s | +22.2% | 🟢 Improving |
| Signal Yield | 2.85 / call | 2.33 / call | +22.3% | 🟢 Improving |
| Productive Rate | 85% (11/13) | 78% (7/9) | +7pp | 🟢 Improving |

### Call Outcome Breakdown (Current Period)

| Outcome | Count | % | Avg Duration | Signals |
|---------|-------|---|-------------|---------|
| Connected | 13 | 72% | 14m 18s | 37 |
| Voicemail | 3 | 17% | 0m 45s | 0 |
| No Answer | 2 | 11% | -- | 0 |

### Summary

Sarah's telephony patterns are improving across all metrics. Connection rate is up 8 percentage points, and signal yield per connected call has increased 22.3%. Her productive rate of 85% means the vast majority of connected calls produce actionable intelligence. Total call volume has also increased by 28.6%.

### Recommendations

1. **Continue current approach**: All telephony metrics are improving. No corrective action
   needed for call strategy.

2. **Voicemail follow-up**: 3 calls went to voicemail. Ensure follow-up is scheduled for these
   contacts to convert them into connected conversations in the next period.
```

---

## Last Active Per Entity

### What It Does

Shows the last active date for every entity record the user has interacted with, highlighting records with engagement gaps greater than 30 days. This is a quick way to identify accounts that may be slipping through the cracks.

### When to Use

Trigger this skill when the user asks questions like:
- "When was I last active on each account?"
- "Which accounts have I been ignoring?"
- "Show me stale accounts"
- "Where are my engagement gaps?"
- "Which records need attention?"

### Staleness Classification

| Status | Definition | Indicator |
|--------|-----------|-----------|
| **Current** | Last active within 7 days | 🟢 |
| **Recent** | Last active 8-14 days ago | 🟡 |
| **Aging** | Last active 15-30 days ago | 🟠 |
| **Stale** | Last active 31-60 days ago | 🔴 |
| **Dark** | Last active 60+ days ago or never | 🔴 |

### Workflow

1. Collect `organizationId` and `userId` from the user
2. Enforce access control
3. Query `user_last_active_per_entity` with the collected inputs
4. Classify each record by staleness
5. Highlight records with gaps > 30 days prominently
6. Cross-reference with pinned status if available -- stale pinned records are highest priority
7. Present the results in the output format below

### Example Output

```
## Last Active Per Entity: Sarah K.

**Organization: Acme Inc**
**Total Records Touched: 14**

| Entity Record | Last Active | Days Ago | Sessions (All Time) | Status |
|--------------|------------|----------|-------------------|--------|
| Acme Corp | Mar 23, 2026 | 2 | 24 | 🟢 Current |
| GlobalTech Solutions | Mar 21, 2026 | 4 | 18 | 🟢 Current |
| Vertex Industries | Mar 16, 2026 | 9 | 11 | 🟡 Recent |
| NovaBridge Corp | Mar 13, 2026 | 12 | 8 | 🟡 Recent |
| Summit Analytics | Mar 7, 2026 | 18 | 5 | 🟠 Aging |
| Pinnacle Group | Mar 3, 2026 | 22 | 3 | 🟠 Aging |
| DataSync Ltd | Feb 27, 2026 | 26 | 4 | 🟠 Aging |
| CloudFirst Inc | Feb 18, 2026 | 35 | 2 | 🔴 Stale |
| Horizon Media | Feb 10, 2026 | 43 | 1 | 🔴 Stale |
| Redstone Partners | Jan 15, 2026 | 69 | 1 | 🔴 Dark |

### Attention Required (30+ Day Gaps)

| Entity Record | Days Since Last Active | Pinned? | Other Users Active? |
|--------------|----------------------|---------|-------------------|
| CloudFirst Inc | 35 days | Yes | No |
| Horizon Media | 43 days | No | Yes (Michael R., 5 days ago) |
| Redstone Partners | 69 days | No | No |

### Summary

3 of Sarah's 14 entity records have engagement gaps exceeding 30 days. CloudFirst Inc is the highest priority concern because it is pinned and no other user is covering it. Redstone Partners has been dark for 69 days with no coverage from any user. Horizon Media is stale for Sarah but still actively covered by Michael R.

### Recommendations

1. **CloudFirst Inc (35 days, pinned, no coverage)**: This is the most urgent gap. Schedule a
   session within the next 3 days. As a pinned record with no other user coverage, it risks
   going completely dark.

2. **Redstone Partners (69 days, no coverage)**: Determine if this account is still active. If
   so, re-engage immediately. If the account has churned or is no longer relevant, remove it
   from the active roster.

3. **Horizon Media (43 days)**: While stale for Sarah, Michael R. is actively covering it.
   Confirm whether Sarah still needs to engage with this account or if coverage has been
   transferred.
```

---

## Shared Rules

These rules apply to **all user analytics skills** in this file.

### Access Control

1. **ALWAYS enforce access control.** Non-admin users can only see their own data. This is the most critical rule in this file. Never bypass it.
2. **Verify before querying.** Check the requesting user's role and ID before making any tool call. Do not query first and filter after.
3. **Clear denial message.** If access is denied, respond: "You can only view your own activity. Contact an admin for team-wide analytics."

### Data Integrity

4. **Never fabricate data.** If a tool returns empty or insufficient results, say so clearly. Do not invent metrics, entity records, or activity counts.
5. **Always present evidence.** Every claim in the output must trace back to a specific tool result. Do not make qualitative judgements without data backing.
6. **Distinguish between "no activity" and "no data."** A user with zero sessions may be new, on leave, or have a data issue. State what the data shows without assuming the reason.

### Presentation Rules

7. **For activity digests, show absolute numbers AND period-over-period change.** Raw numbers without trend context are incomplete.
8. **For session quality, show trend direction** (improving/stable/declining) using the defined indicators.
9. **For last-active queries, highlight records with gaps > 30 days.** These are the records most likely to need immediate attention.
10. **Pinned records with low engagement should be flagged as a workflow alignment issue.** The user explicitly prioritized these records -- low engagement is a contradiction that needs surfacing.

### Output Formatting

11. **Use structured tables** for breakdowns, rankings, and comparisons.
12. **Use status indicators** consistently: 🟢 strong/good/current, 🟡 watch/adequate/recent, 🟠 weak/declining/aging, 🔴 critical/stale/dark.
13. **Always include a Summary section** at the end -- 2-5 sentences, lead with the most important finding.
14. **Always include Recommendations** -- at least one actionable suggestion per issue area. Recommendations should be specific enough to act on ("schedule a session with CloudFirst Inc this week") not generic ("improve engagement").
