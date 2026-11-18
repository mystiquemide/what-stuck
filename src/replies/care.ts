/**
 * Fast first-pass check for replies that suggest someone may be in danger or
 * despair. It runs at submit time so the member sees help right away.
 *
 * It's deliberately broad: a false alarm only shows a kind message with
 * resources, while a miss could leave someone without help. The AI report
 * adds a second, context-aware pass for the pastor.
 */
const PATTERNS: RegExp[] = [
  // English
  /\bsuicid/i,
  /\bkill(ing)?\s+my\s*self\b/i,
  /\bend(ing)?\s+(my|it)\s+(life|all)\b/i,
  /\b(want|wanna|going)\s+to\s+die\b/i,
  /\bdon'?t\s+want\s+to\s+(live|be\s+here|wake\s+up)\b/i,
  /\bno\s+(reason|point)\s+(to|in)\s+(live|living|anything|going\s+on)\b/i,
  /\bdon'?t\s+see\s+the\s+point\s+(of|in)\s+(anything|living|life)\b/i,
  /\b(hurt|harm|cut)(ing)?\s+my\s*self\b/i,
  /\bself[-\s]?harm/i,
  /\bcan'?t\s+go\s+on\b/i,
  /\bbetter\s+off\s+(dead|without\s+me)\b/i,
  /\b(being|been|getting)\s+abused\b/i,
  /\b(he|she|they|husband|wife|boyfriend|girlfriend|dad|mom|father|mother|parent)\s+(hits|beats|hurts)\s+me\b/i,
  // Spanish ("suicid" above covers suicidio/suicidarme)
  /\bquitarme\s+la\s+vida\b/i,
  /\bno\s+quiero\s+(vivir|seguir)\b/i,
  /\bhacerme\s+da(ñ|n)o\b/i,
  /\bmejor\s+muert[oa]\b/i,
];

export function needsCare(...texts: Array<string | null | undefined>): boolean {
  return texts.some((text) => !!text && PATTERNS.some((pattern) => pattern.test(text)));
}
