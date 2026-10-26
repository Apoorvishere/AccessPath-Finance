export type JourneyStep = {
  title: string;
  url: string;
  action: string;
  observation: string;
};

export type JourneyResult = {
  outcome: "completed" | "not_found" | "blocked";
  summary: string;
  steps: JourneyStep[];
  scopeNote?: string;
};

export type JourneyRun = {
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED";
  result: JourneyResult | null;
  error: string | null;
};
