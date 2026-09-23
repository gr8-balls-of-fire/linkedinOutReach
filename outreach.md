1. Product Overview
Product Name: Multi-Agent LinkedIn Prospecting Engine
Objective: To orchestrate a two-tier AI agent workflow that automates top-of-funnel LinkedIn Sales Navigator outreach while strictly adhering to platform safety limits, and provides an intent-categorized daily digest of inbound responses.
Core Tech Stack: n8n/Make (Orchestration), Unipile/LinkedAPI (LinkedIn Connector), OpenAI/Anthropic (Intelligence), HubSpot (CRM), Email/Slack (Delivery).

2. System Architecture & Workflows
Workflow 1: Agent 1 (Outbound Orchestration)
Trigger: CRON job scheduled Monday–Friday (e.g., 9:00 AM EST).

Data Ingestion: Fetch exactly 20 new profile payloads from a predefined LinkedIn Sales Navigator search URL via API.

Intelligence Routing: Pass profile data (Headline, Summary, Recent Posts) to Agent 1 (LLM node).

Execution: Agent 1 generates a highly personalized, two-sentence connection request payload.

Delivery Mechanism: Route back to the LinkedIn API to dispatch the connection request.

Safety Protocol: Inject a randomized wait timer (3 to 10 minutes) between each dispatch to mimic human pacing.

Workflow 2: Agent 2 (Inbound Triage & Reporting)
Trigger 1 (Capture): Webhook listens continuously for incoming LinkedIn messages.

Data Logging: Upsert message payload (Sender ID, Text, Timestamp) to the CRM (HubSpot) to update the contact record and lifecycle stage.

Trigger 2 (Summarization): CRON job scheduled daily (e.g., 5:00 PM EST).

Intelligence Routing: Batch query all unread/new replies from the past 24 hours and pass to Agent 2.

Execution: Agent 2 categorizes the intent of each reply (e.g., "Meeting Request", "Objection", "Not Interested") and generates a structured summary.

Delivery Mechanism: Push the compiled digest via email or Slack.

3. Functional Requirements
Requirement 1 - Configurable Search: The system must accept dynamic Sales Navigator search URLs as the primary lead generation source.

Requirement 2 - Duplicate Prevention: The orchestration layer must check the CRM or a caching database to ensure a profile has not been contacted previously before generating a message.

Requirement 3 - Auto-Withdrawal: The system must scan for pending connection requests older than 14 days and automatically withdraw them to prevent the pending queue from exceeding 500 requests.

Requirement 4 - Intent Tagging: Agent 2 must be strictly prompted to output categorization tags alongside its summary, mapping directly to HubSpot custom properties or lead statuses.

4. Non-Functional & Security Requirements
Platform Compliance: The outbound volume must be hard-capped at 20 requests per day (maximum 100 per rolling 7-day period) to prevent platform restriction.

Infrastructure: The API integration layer must utilize a dedicated IP address or residential proxy rather than shared datacenter IPs to maintain account reputation.

Resilience: The orchestration layer must include error handling for API timeouts or failed LLM generations, automatically skipping to the next lead without breaking the loop.

5. Success Metrics
Connection Acceptance Rate: Target >20% to maintain a high platform trust score.

Positive Reply Rate: Target >5% positive intent categorization from Agent 2.

Account Health: Maintain 100% uptime with zero LinkedIn platform restrictions or shadow-bans.