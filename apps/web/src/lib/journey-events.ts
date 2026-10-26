export type JourneyEvent = {
  type: "step_completed" | "blocked" | "sample_document" | "sample_submitted" | "comprehension_checked";
  step: number;
  at: string;
  detail?: string;
};

export const eventStorageKey = "accesspath-finance-synthetic-events-v1";

export function readJourneyEvents(): JourneyEvent[] {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(eventStorageKey) || "[]");
    return Array.isArray(parsed) ? parsed.filter((event): event is JourneyEvent =>
      typeof event === "object" && event !== null &&
      "type" in event && "step" in event && "at" in event &&
      typeof event.type === "string" && typeof event.step === "number" && typeof event.at === "string") : [];
  } catch { return []; }
}

export function recordJourneyEvent(type: JourneyEvent["type"], step: number, detail?: string) {
  try {
    const events = readJourneyEvents();
    events.push({ type, step, at: new Date().toISOString(), detail });
    window.localStorage.setItem(eventStorageKey, JSON.stringify(events.slice(-80)));
  } catch { /* The journey remains usable when browser storage is disabled. */ }
}

export function clearJourneyEvents() {
  try { window.localStorage.removeItem(eventStorageKey); }
  catch { /* Browser storage may be disabled. */ }
}
