---
name: analytics-session
description: >
  Single session analytics for meetings and conversations. Covers session arc
  synthesis, coverage gap detection, absence finding, composite signal analysis,
  orphan rationale detection, and meeting vs call quality comparison.
  Requires sourceId and sourceType.
metadata:
  author: Auron
  version: 1.0.0
  category: analytics-session
---

Important: Please read `auron-docs` and `api` skills before running session analytics. You need an organizationId, a valid API key, and a valid session token.

# Session Analytics

Session analytics operate on a **single meeting or conversation**. Every skill in this file (except Meeting vs Call Quality) requires an `organizationId`, a `sourceId`, and a `sourceType` to operate. These skills answer questions like "what happened in this session?", "what did we miss?", and "are there hidden patterns across the signals?" Most session analytics use generative tools that produce LLM-authored narrative analysis rather than raw aggregations.

All session analytics work by querying the Explore API with the appropriate context. The Explore API internally selects the right pre-built aggregation or generative tools for each question.

---

## Required Inputs

Every session analytics skill requires the following inputs. **You must collect all required inputs before making any query.** Never guess or assume values.

| Input | Required | Description | How to obtain |
|-------|----------|-------------|---------------|
| `organizationId` | Yes | The organization scope for all data | Ask the user to select their organization. Use the `api` skill to list organizations if needed. |
| `sourceId` | Yes | The Meeting ID or Conversation ID to analyze | Ask the user which session they want to analyze. Use the `api` skill to list recent meetings or conversations if needed. |
| `sourceType` | Yes | Either "meeting" or "conversation" | Determine from context or ask the user. If they say "call" or "meeting", use "meeting". If they say "chat" or "conversation", use "conversation". |

### Input Collection Rules

1. If the user says "this meeting" or "last call" without providing an ID, **ask them to specify which session**. Do not guess.
2. If the user gives a session name instead of an ID, search by name and confirm the match before proceeding.
3. Never proceed with a query if `organizationId`, `sourceId`, or `sourceType` is missing.
4. If the user has previously selected an organization or session in the conversation, reuse it -- do not ask again.
5. **Exception**: Meeting vs Call Quality does NOT require `sourceId` or `sourceType` -- it is an org-level comparison across formats.

---

## Session Arc Synthesizer

### What It Does

Produces a three-part narrative analysis of a session: opening posture, mid-session shifts, and closing posture. Uses signals and transcript data to reconstruct the emotional and informational arc of the conversation. This is a generative skill -- the output is LLM-authored narrative, not raw data.

### When to Use

Trigger this skill when the user asks questions like:
- "What happened in this meeting?"
- "Walk me through the arc of this session"
- "How did the conversation evolve?"
- "What was the tone at the start vs the end?"
- "Give me a narrative summary of this call"
- "How did the mood shift during the meeting?"

### Arc Sections

| Section | What It Covers |
|---------|---------------|
| **Opening Posture** | Initial tone, stated objectives, early signal indicators, participant energy |
| **Mid-Session Shifts** | Pivot points where the conversation changed direction, new topics introduced, emotional shifts, unexpected disclosures |
| **Closing Posture** | Final tone, commitments made, unresolved topics, next steps, overall trajectory (positive/neutral/negative) |

### Workflow

1. Collect `organizationId`, `sourceId`, and `sourceType` from the user (see Required Inputs above)
2. Query `analyze_session_arc` with the collected inputs
3. The tool returns a generative narrative analysis -- present it as authored analysis, not raw data
4. Ensure all three sections (Opening, Shift, Closing) are present in the output
5. If transcript data is unavailable, say so clearly -- do not fabricate transcript content
6. Present the results in the output format below

### Example Output

```
## Session Arc: Discovery Call with Acme Corp

**Meeting ID: mtg_abc123 | Date: Mar 20, 2026 | Duration: 42 minutes**
**Participants: Sarah K. (Seller), James M. (Acme VP Engineering), Lisa T. (Acme CTO)**

### Opening Posture

The session opened with a collaborative tone. James M. led the introductions and framed
the meeting as an exploratory conversation, stating "we're evaluating three options and want
to understand the technical fit." Lisa T. was initially quiet, joining with camera off. Early
signals indicate the Acme team had done prior research -- James referenced specific product
features by name, suggesting familiarity beyond a cold evaluation.

**Key signal**: Competitive awareness detected (confidence: 0.84) -- James mentioned two
competing solutions by name within the first five minutes.

### Mid-Session Shifts

At the 18-minute mark, the conversation shifted significantly when Lisa T. unmuted to ask
a detailed question about data residency compliance. This was the first indication that
compliance was a primary evaluation criterion, which had not been mentioned in the meeting
agenda. Sarah K. pivoted effectively, dedicating the next 12 minutes to compliance
architecture.

A second shift occurred at minute 31 when James M. asked about pricing for a 500-seat
deployment. The tone became more transactional, suggesting the team had moved past
technical evaluation and into commercial consideration. Lisa T. became more engaged during
this section, asking follow-up questions about implementation timeline.

**Key signals**: Compliance requirement detected (confidence: 0.91), Budget signal detected
(confidence: 0.78), Timeline urgency detected (confidence: 0.72).

### Closing Posture

The session closed on a positive trajectory. James committed to scheduling a technical
deep-dive with their engineering team within two weeks. Lisa T. asked for written
documentation on the compliance architecture, indicating she intended to circulate it
internally. No objections or blockers were raised in the closing minutes.

**Unresolved**: The competitive evaluation timeline was not clarified -- Acme did not state
when they plan to make a decision, and Sarah did not ask.

### Summary

This session followed a classic discovery-to-commercial arc. The mid-session compliance
pivot revealed a critical evaluation criterion that was not on the original agenda.
The closing was positive with concrete next steps, but the competitive timeline remains
an open question that should be addressed in the follow-up.

### Recommendations

1. **Address the competitive timeline**: In the next interaction, ask directly when Acme
   plans to make their decision. The absence of this information makes it difficult to
   gauge urgency.

2. **Prepare compliance documentation**: Lisa T.'s request for written compliance details
   is a buying signal. Prioritize this deliverable to maintain momentum.
```

---

## Coverage Gap Detector

### What It Does

Identifies instances where the agent asked a substantive question, the user/contact gave a meaningful response, but no signal was extracted from that exchange. These are missed extraction opportunities -- the information was surfaced but not captured. This is a generative skill that analyzes Q&A patterns in the transcript.

### When to Use

Trigger this skill when the user asks questions like:
- "What did we miss in this session?"
- "Were there any extraction gaps?"
- "Did the agent miss any signals?"
- "What information was shared but not captured?"
- "Find coverage gaps in this meeting"
- "What fell through the cracks?"

### Gap Classification

| Type | Definition |
|------|-----------|
| **Clear Gap** | Agent asked a direct question, contact gave a specific answer, no signal extracted |
| **Partial Gap** | Signal was extracted but at low confidence, when the response warranted higher confidence |
| **Contextual Gap** | The response contained signal-relevant information as a secondary point, not the primary answer |

### Workflow

1. Collect `organizationId`, `sourceId`, and `sourceType` from the user
2. Query `analyze_coverage_gap` with the collected inputs
3. The tool returns a generative analysis of Q&A exchanges with missed extractions
4. Clearly distinguish between "agent asked, user answered, no signal" vs "no question asked" (the latter is an Absence, not a Coverage Gap -- see next skill)
5. Present the results in the output format below

### Example Output

```
## Coverage Gap Analysis: Discovery Call with Acme Corp

**Meeting ID: mtg_abc123 | Date: Mar 20, 2026**
**Gaps Detected: 3**

### Gap 1: Decision Timeline (Clear Gap)

**Agent question** (minute 22): "What does your evaluation timeline look like?"
**Contact response**: "We're aiming to have a shortlist by end of April and make a final
decision by mid-May."

**Why this is a gap**: The contact provided a specific two-stage timeline with concrete
dates. This should have triggered a Timeline & Urgency signal with high confidence, but
no signal was extracted for this exchange.

**Expected signal**: Timeline & Urgency (estimated confidence: 0.85+)

---

### Gap 2: Internal Champion (Partial Gap)

**Agent question** (minute 35): "Who else on your team would be involved in the next steps?"
**Contact response**: "Our head of security, David, would need to sign off on compliance.
And frankly, I'm the one pushing for this internally -- I've already shared your materials
with the team."

**Why this is a gap**: A Stakeholder Map signal was extracted (confidence: 0.52) for David's
role, but the contact's self-identification as an internal champion was not captured. This
disclosure warrants a separate Champion Identified signal at high confidence.

**Extracted**: Stakeholder Map (confidence: 0.52)
**Missing**: Champion Identified (estimated confidence: 0.80+)

---

### Gap 3: Budget Constraint Context (Contextual Gap)

**Agent question** (minute 28): "How does this fit into your current infrastructure plans?"
**Contact response**: "We've allocated budget for this quarter, but we'd need to pull from
the Q3 infrastructure reserve if the deployment takes longer than expected."

**Why this is a gap**: The primary answer was about infrastructure planning, but the budget
constraint information (Q3 reserve dependency) is signal-relevant. A Budget & Spend signal
was not extracted, likely because the budget information was embedded in an infrastructure
answer.

**Expected signal**: Budget & Spend (estimated confidence: 0.70)

---

### Summary

Three coverage gaps were identified in this session. The most critical is the missed
Decision Timeline signal -- the contact gave explicit dates that should have been captured.
The Champion identification gap is also significant as it represents a high-value
intelligence point. The budget constraint was contextually embedded and is a lower-priority
gap but still actionable.

### Recommendations

1. **Decision Timeline**: Manually add this signal or ensure the agent's signal detection
   configuration includes timeline-related trigger phrases like "aiming to", "by end of",
   and "final decision by".

2. **Champion Identification**: The agent's constitution should be updated to detect
   self-identification language like "I'm the one pushing for this" as a champion indicator.

3. **Contextual extraction**: Review whether the signal detection pipeline handles secondary
   information in compound responses. Budget information embedded in infrastructure answers
   is a common pattern that should be captured.
```

---

## Session Absence Finder

### What It Does

Identifies user utterances where signal-relevant topics were discussed unprompted -- the contact volunteered information without being asked -- but no signal was extracted. This is different from Coverage Gaps: absences are about **unprompted disclosures**, not responses to agent questions. This is a generative skill.

### When to Use

Trigger this skill when the user asks questions like:
- "Did the contact volunteer anything we didn't capture?"
- "Were there unprompted disclosures we missed?"
- "What did they bring up on their own that we didn't track?"
- "Find signal absences in this session"
- "What intelligence was offered freely but not captured?"

### Absence vs Coverage Gap

| Aspect | Coverage Gap | Absence |
|--------|-------------|---------|
| Trigger | Agent asked a question | Contact volunteered unprompted |
| Information flow | Agent-initiated | Contact-initiated |
| Significance | Missed extraction from a structured exchange | Missed extraction from an organic disclosure |
| Typical value | High -- agent targeted this topic | Very high -- contact chose to share this without prompting |

### Workflow

1. Collect `organizationId`, `sourceId`, and `sourceType` from the user
2. Query `analyze_session_absence` with the collected inputs
3. The tool returns a generative analysis of unprompted disclosures without signal extraction
4. Clearly distinguish these from Coverage Gaps -- absences are contact-initiated, not agent-initiated
5. Emphasize that unprompted disclosures often carry higher intelligence value because the contact chose to share them voluntarily
6. Present the results in the output format below

### Example Output

```
## Session Absence Analysis: Discovery Call with Acme Corp

**Meeting ID: mtg_abc123 | Date: Mar 20, 2026**
**Absences Detected: 2**

### Absence 1: Vendor Dissatisfaction

**Context**: During a discussion about infrastructure requirements (minute 14), Lisa T.
volunteered without being asked:

> "Honestly, we've been frustrated with [Competitor X] for the past six months. Their
> support response times have gotten worse and we've had three outages this quarter."

**Why this is an absence**: This is an unprompted competitive intelligence disclosure. The
contact chose to share specific dissatisfaction with a named competitor, including
quantifiable issues (three outages, six-month timeline). No signal was extracted.

**Expected signals**:
- Competitive Intelligence (estimated confidence: 0.90) -- named competitor with specific grievances
- Pain Point (estimated confidence: 0.85) -- support responsiveness and reliability concerns

**Intelligence value**: Very high. Unprompted vendor dissatisfaction indicates strong
motivation to switch, which is a key buying signal.

---

### Absence 2: Organizational Restructuring

**Context**: While discussing implementation timeline (minute 33), James M. mentioned
casually:

> "This is especially important because our engineering org is restructuring in Q3 --
> we'd want to have this in place before that happens."

**Why this is an absence**: The contact volunteered information about an upcoming
organizational change that creates a deployment urgency. This was not a response to a
question about org structure -- it was offered as context for timeline preferences.
No signal was extracted.

**Expected signal**: Timeline & Urgency (estimated confidence: 0.82) -- externally
imposed deadline due to organizational restructuring

**Intelligence value**: High. The restructuring creates a natural deadline that was
not otherwise captured, and it explains the underlying urgency behind the timeline
preferences expressed elsewhere in the session.

---

### Summary

Two unprompted disclosures were identified that did not produce signals. The vendor
dissatisfaction disclosure is particularly valuable -- it reveals strong switching
motivation that the contact chose to share voluntarily. The organizational restructuring
mention adds critical context to the timeline signals already captured, explaining
WHY the timeline matters, not just what it is.

### Recommendations

1. **Vendor dissatisfaction**: This is high-value competitive intelligence. Manually add
   a Competitive Intelligence signal and ensure follow-up sessions probe this topic
   further. The contact is clearly open to discussing it.

2. **Organizational restructuring**: Add this as context to existing Timeline signals.
   The Q3 restructuring creates a hard deployment deadline that should inform deal
   strategy and resource planning.

3. **Constitution update**: Consider adding detection patterns for unprompted disclosures
   that contain emotional language ("frustrated", "honestly") or unsolicited comparisons
   to competitors. These are high-signal linguistic patterns.
```

---

## Composite Signal Analyst

### What It Does

Identifies emergent patterns where three or more individual signals, taken together, imply something that none of them individually triggered. These composite patterns reveal strategic insights that only become visible when signals are analyzed as a group rather than in isolation. This is a generative skill.

### When to Use

Trigger this skill when the user asks questions like:
- "Are there patterns across the signals in this session?"
- "What do the signals tell us when you look at them together?"
- "Is there a bigger picture I'm missing?"
- "Find composite patterns in this meeting"
- "What emerges when you combine the signals?"
- "Are there hidden insights across the signals?"

### Pattern Types

| Pattern | Definition |
|---------|-----------|
| **Convergence** | Multiple signals from different categories point to the same conclusion |
| **Contradiction** | Signals that appear to conflict, suggesting complexity or hidden dynamics |
| **Escalation** | A chain of signals that together indicate increasing urgency or risk |
| **Opportunity** | Combined signals that suggest an unarticulated opportunity |

### Workflow

1. Collect `organizationId`, `sourceId`, and `sourceType` from the user
2. Query `analyze_composite_signals` with the collected inputs
3. The tool returns a generative analysis of multi-signal patterns
4. Always list the individual signals that form each pattern
5. Explain what the pattern implies that no individual signal captured
6. Present the results in the output format below

### Example Output

```
## Composite Signal Analysis: Discovery Call with Acme Corp

**Meeting ID: mtg_abc123 | Date: Mar 20, 2026**
**Total Signals in Session: 9 | Composite Patterns Found: 2**

### Pattern 1: High-Urgency Qualified Buyer (Convergence)

**Contributing signals**:
1. Budget & Spend (confidence: 0.78) -- "allocated budget for this quarter"
2. Timeline & Urgency (confidence: 0.72) -- "aiming for decision by mid-May"
3. Decision Process (confidence: 0.81) -- "shortlist by end of April"
4. Champion Identified (confidence: 0.68) -- internal advocate pushing evaluation

**What this pattern implies**: These four signals individually indicate budget availability,
timeline awareness, process maturity, and internal sponsorship. Taken together, they form
a **High-Urgency Qualified Buyer** pattern -- this is not an early-stage exploratory
conversation. The account has budget, a timeline, a defined process, and an internal champion.
No individual signal captures the composite conclusion that this is a late-stage, high-intent
buyer.

**Strategic implication**: Prioritize this account for immediate follow-up. The convergence
of all four qualifying signals in a single session is a strong indicator of near-term
close potential.

---

### Pattern 2: Compliance-Driven Decision Gate (Escalation)

**Contributing signals**:
1. Technical Requirements (confidence: 0.74) -- data residency requirements
2. Stakeholder Map (confidence: 0.52) -- head of security must sign off
3. Compliance Requirement (confidence: 0.91) -- explicit compliance evaluation criterion

**What this pattern implies**: Individually, these signals suggest technical needs, a
stakeholder, and a compliance requirement. Together, they reveal an **escalation pattern**:
compliance is not just a checkbox -- it is a decision gate controlled by a specific
stakeholder (head of security) with specific requirements (data residency). If compliance
is not satisfied, the deal cannot proceed regardless of how well other criteria are met.

**Strategic implication**: The compliance deep-dive must be the top priority for the next
interaction. Preparing a compliance package specifically for the head of security
(David) is not optional -- it is the critical path to closing this deal.

---

### Summary

Two composite patterns emerge from this session's signals. The Convergence pattern reveals
a late-stage, high-intent buyer that should be treated with deal-closing urgency. The
Escalation pattern identifies compliance as the single most critical gate to clear. Together,
these patterns tell a clear story: this deal is winnable but compliance is the linchpin.

### Recommendations

1. **Treat as late-stage opportunity**: The convergence of budget, timeline, process, and
   champion signals means this account should be escalated in pipeline priority. Do not
   treat it as early-stage discovery.

2. **Compliance-first follow-up**: Prepare the compliance documentation Lisa T. requested,
   and tailor it specifically for David (head of security). This is the critical path --
   other follow-up activities are secondary until compliance is cleared.

3. **Map the decision chain**: The composite analysis suggests David's compliance sign-off
   is a prerequisite. Confirm whether there are other gates (legal, procurement) that
   could block after compliance clears.
```

---

## Orphan Rationale Finder

### What It Does

Identifies signals whose reasoning or rationale references context, entities, or topics that no other signal in the session connects to. These "orphan" rationales may indicate isolated intelligence points that need further investigation, or they may reveal extraction errors where the reasoning does not match the session content. This is a generative skill.

### When to Use

Trigger this skill when the user asks questions like:
- "Are there any disconnected signals in this session?"
- "Do any signals reference things not connected to other signals?"
- "Find orphan rationales"
- "Are there any isolated intelligence points?"
- "Do any signals seem out of place?"
- "Check for signal coherence in this meeting"

### Orphan Types

| Type | Definition |
|------|-----------|
| **Isolated Reference** | Signal rationale mentions an entity, topic, or context that no other signal references |
| **Unconnected Thread** | Signal relates to a conversational thread that appears only once and is never revisited |
| **Rationale Mismatch** | Signal's stated reasoning does not clearly connect to the signal category or the transcript content |

### Workflow

1. Collect `organizationId`, `sourceId`, and `sourceType` from the user
2. Query `analyze_orphan_rationale` with the collected inputs
3. The tool returns a generative analysis of signals with disconnected reasoning
4. For each orphan, explain what the rationale references and why it is disconnected from the rest of the session's signal graph
5. Distinguish between genuinely isolated intelligence (valuable but needs follow-up) and potential extraction errors (should be reviewed for accuracy)
6. Present the results in the output format below

### Example Output

```
## Orphan Rationale Analysis: Discovery Call with Acme Corp

**Meeting ID: mtg_abc123 | Date: Mar 20, 2026**
**Total Signals in Session: 9 | Orphan Rationales Found: 2**

### Orphan 1: Partnership Reference (Isolated Reference)

**Signal**: Competitive Landscape (confidence: 0.62)
**Rationale**: "Contact mentioned a potential partnership with [Company Y] that could
affect their evaluation criteria."

**Why this is an orphan**: No other signal in this session references Company Y or a
partnership dynamic. The competitive signals focus on Competitor X (dissatisfaction) and
the general evaluation process. This partnership mention appears once in the transcript
at minute 26 and is never revisited by either party.

**Assessment**: This is likely **genuinely isolated intelligence** rather than an extraction
error. The contact mentioned it in passing, and neither party followed up. It may be worth
probing in the next session.

**Action**: Flag for follow-up. Ask about the Company Y partnership in the next interaction
to determine if it materially affects the evaluation.

---

### Orphan 2: Regulatory Mention (Unconnected Thread)

**Signal**: Risk & Blockers (confidence: 0.48)
**Rationale**: "Contact referenced upcoming regulatory changes in their industry that could
impact procurement timelines."

**Why this is an orphan**: The session contains strong compliance signals (data residency,
security sign-off), but the regulatory change mentioned in this signal's rationale refers
to industry-wide regulatory shifts, not the account's internal compliance requirements.
No other signal connects to external regulatory pressure.

**Assessment**: This could be either isolated intelligence or a **rationale mismatch**. The
low confidence (0.48) suggests the extraction may be conflating the account's compliance
requirements with a separate, broader regulatory concern. The transcript at minute 38 shows
a brief mention that is ambiguous.

**Action**: Review the transcript segment at minute 38 to determine if the regulatory
mention is distinct from the compliance discussion. If distinct, it is valuable isolated
intelligence about external pressure. If it is the same topic restated, the signal may be
a duplicate of the Compliance Requirement signal.

---

### Summary

Two orphan rationales were identified. The Company Y partnership reference is likely genuine
isolated intelligence that deserves follow-up. The regulatory mention has a lower confidence
and may be a rationale mismatch with existing compliance signals. Neither orphan represents
a critical issue, but both warrant attention in the next interaction.

### Recommendations

1. **Company Y partnership**: Add this as a follow-up topic for the next session. If the
   partnership materializes, it could change the competitive landscape significantly.

2. **Regulatory mention**: Review the transcript at minute 38 to clarify whether this is
   distinct from the compliance discussion. If distinct, strengthen the signal with
   additional context. If redundant, consider merging it with the Compliance Requirement
   signal.
```

---

## Meeting vs Call Quality

### What It Does

Compares signal quality and extraction effectiveness between meetings (video/audio with screen sharing) and telephony calls (phone calls) across the entire organization. This is a **format comparison**, not a session-specific analysis. It helps determine which interaction format produces higher quality intelligence. This skill does NOT require a `sourceId` or `sourceType` -- it is an org-level comparison.

### When to Use

Trigger this skill when the user asks questions like:
- "Are meetings or calls better for signal quality?"
- "Which format produces better intelligence?"
- "Compare meeting signals vs call signals"
- "Should we do more meetings or more calls?"
- "How does signal quality differ between meetings and calls?"
- "Meeting vs telephony comparison"

### Comparison Dimensions

| Dimension | What It Measures |
|-----------|-----------------|
| Total Sessions | Number of sessions per format |
| Signal Yield | Signals per session by format |
| Avg Confidence | Mean signal confidence by format |
| Signal Categories | Number of distinct categories detected per format |
| Avg Duration | Mean session length by format |
| Signals/Minute | Signal density normalized by duration |

### Workflow

1. Collect `organizationId` from the user (sourceId and sourceType are NOT needed)
2. Query `meeting_vs_call_signal_quality` with `organizationId`
3. Compute all comparison dimensions for both formats
4. Calculate the difference and statistical significance if sample size permits
5. Identify which format is stronger for each dimension
6. Present the results in the output format below

### Example Output

```
## Meeting vs Call Signal Quality

**Organization: Acme Inc | Period: Feb 24 – Mar 25, 2026**

| Dimension | Meetings | Telephony Calls | Difference | Winner |
|-----------|----------|----------------|-----------|--------|
| Total Sessions | 198 | 87 | -- | -- |
| Signal Yield | 3.82 / session | 2.71 / session | +41% | 🟢 Meetings |
| Avg Confidence | 0.79 | 0.74 | +6.8% | 🟢 Meetings |
| Signal Categories | 7.2 avg | 4.8 avg | +50% | 🟢 Meetings |
| Avg Duration | 32m | 14m | +129% | -- |
| Signals/Minute | 0.119 | 0.194 | +63% | 🟢 Calls |

### Category Breakdown

| Signal Category | Meeting Yield | Call Yield | Better Format |
|----------------|--------------|-----------|--------------|
| Budget & Spend | 0.62 | 0.48 | 🟢 Meetings |
| Timeline & Urgency | 0.54 | 0.51 | 🟡 Similar |
| Pain Points | 0.71 | 0.55 | 🟢 Meetings |
| Competitive Landscape | 0.48 | 0.21 | 🟢 Meetings |
| Decision Process | 0.52 | 0.38 | 🟢 Meetings |
| Stakeholder Map | 0.44 | 0.18 | 🟢 Meetings |
| Technical Requirements | 0.51 | 0.40 | 🟢 Meetings |

### Summary

Meetings produce 41% more signals per session and cover 50% more signal categories than
telephony calls. However, when normalized for duration, calls are 63% more efficient --
they extract more signals per minute of conversation. Meetings excel at complex categories
(Stakeholder Map, Competitive Landscape) where longer discussion enables deeper exploration.
Calls perform comparably on Timeline & Urgency, which tends to emerge quickly in any format.

### Recommendations

1. **Use meetings for complex intelligence**: Stakeholder mapping, competitive landscape,
   and decision process signals are dramatically better in meetings. Schedule meetings when
   these are the target intelligence areas.

2. **Use calls for quick check-ins**: Calls are more time-efficient per minute and perform
   comparably on timeline and urgency signals. Use calls for status updates and time-sensitive
   intelligence where scheduling a meeting would introduce delay.

3. **Do not abandon calls**: Despite lower absolute yield, calls are 63% more efficient per
   minute. A balanced channel strategy uses meetings for depth and calls for speed.
```

---

## Shared Rules

These rules apply to **all session analytics skills** in this file.

### Input Collection

1. **ALWAYS collect sourceId and sourceType before querying.** Never proceed with a session-level analysis without confirming which session to analyze.
2. **Exception: Meeting vs Call Quality** requires NO sourceId -- it is an org-level comparison. Only `organizationId` is needed.
3. **Disambiguate session references.** If the user says "this meeting" or "last call" without an ID, ask them to specify. If they give a name, search and confirm before proceeding.

### Generative Output Rules

4. **For generative tools** (session arc, coverage gap, absence, composite, orphan), the output is LLM-generated narrative. **Present it as authored analysis, not raw data.** Use prose paragraphs, not just tables.
5. **Never fabricate transcript content.** If transcript data is unavailable or incomplete, say so clearly. Do not invent quotes, timestamps, or participant statements.
6. **Quote the transcript when referencing specific statements.** Use blockquotes for direct quotes and always include the approximate timestamp.

### Skill-Specific Rules

7. **Coverage Gap vs Absence**: These are distinct skills. Coverage gaps are agent-initiated (agent asked, user answered, no signal). Absences are contact-initiated (unprompted disclosures with no signal). Always clarify which type was found and never conflate them.
8. **Session Arc must have three sections**: Opening Posture, Mid-Session Shifts, and Closing Posture. If the session is too short for meaningful shifts, note this and collapse to two sections.
9. **Composite signals must list contributing signals.** Never describe a composite pattern without explicitly listing the 3+ individual signals that form it.
10. **Orphan rationales must distinguish between isolated intelligence and extraction errors.** Not every orphan is a problem -- some are genuinely valuable isolated points that need follow-up.
11. **Meeting vs Call Quality requires NO sourceId.** It compares formats, not specific sessions. If a user asks to compare a specific meeting with a specific call, that is a different request -- handle it as two separate Session Arc analyses.

### Data Integrity

12. **Never fabricate data.** If a tool returns empty or insufficient results, say so clearly. Do not invent signals, patterns, or transcript content.
13. **Always present evidence.** Every claim must trace back to a specific tool result or transcript segment.
14. **Distinguish between "no patterns found" and "insufficient data."** A session with 2 signals may not have composite patterns -- that is expected, not a failure.

### Output Formatting

15. **Use structured tables** for comparisons, dimensions, and signal listings.
16. **Use narrative prose** for generative outputs (arc, gaps, absences, composites, orphans).
17. **Use status indicators** consistently: 🟢 strong/good, 🟡 watch/adequate, 🟠 weak/declining, 🔴 critical/missing.
18. **Always include a Summary section** at the end -- 2-5 sentences, lead with the most important finding.
19. **Always include Recommendations** -- at least one actionable suggestion per issue area. Recommendations should be specific enough to act on ("ask about Company Y in the next session") not generic ("follow up on open items").
