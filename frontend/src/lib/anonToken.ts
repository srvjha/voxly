const KEY = "pulse_anon_token";
const SUBMITTED_KEY = "pulse_submitted_polls";

export function getAnonToken(): string {
  let token = localStorage.getItem(KEY);
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem(KEY, token);
  }
  return token;
}

function readSubmittedSet(): Set<string> {
  try {
    const raw = localStorage.getItem(SUBMITTED_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? new Set(parsed) : new Set();
  } catch {
    return new Set();
  }
}

export function hasSubmitted(pollId: string): boolean {
  return readSubmittedSet().has(pollId);
}

export function markSubmitted(pollId: string) {
  const set = readSubmittedSet();
  set.add(pollId);
  localStorage.setItem(SUBMITTED_KEY, JSON.stringify([...set]));
}
