export type IntentTag = "Meeting Request" | "Objection" | "Not Interested" | "Other";

// Keyword-based MVP classifier — no LLM call, no API key required.
// Swap the body of this function for an Anthropic/OpenAI call later; every
// caller only depends on the (text) => IntentTag signature.
const MEETING_PATTERNS = /\b(call|chat|meet(ing)?|15\s*min|schedule|calendar|available|works? for you|zoom|tuesday|wednesday|thursday|monday|friday)\b/i;
const NOT_INTERESTED_PATTERNS = /\b(not interested|no thanks|please remove|unsubscribe|stop messaging|not a fit)\b/i;
const OBJECTION_PATTERNS = /\b(budget|not the right time|next quarter|already (have|using)|too expensive|maybe later|check back)\b/i;

export function classifyIntent(text: string): IntentTag {
  if (NOT_INTERESTED_PATTERNS.test(text)) return "Not Interested";
  if (MEETING_PATTERNS.test(text)) return "Meeting Request";
  if (OBJECTION_PATTERNS.test(text)) return "Objection";
  return "Other";
}
