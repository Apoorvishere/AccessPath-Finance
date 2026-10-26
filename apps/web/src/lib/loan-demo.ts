export type Language = "en" | "hi";
export type LoanPurpose = "medical" | "education" | "home" | "other";

export type LoanDraft = {
  amount: number;
  purpose: LoanPurpose;
  termMonths: number;
  fullName: string;
  monthlyIncome: number;
  employment: string;
  documentConfirmed: boolean;
  termsConfirmed: boolean;
};

export const sampleTerms = {
  annualRate: 0.18,
  processingFeeRate: 0.02,
  minAmount: 10000,
  maxAmount: 100000,
} as const;

export const initialDraft: LoanDraft = {
  amount: 30000,
  purpose: "medical",
  termMonths: 12,
  fullName: "",
  monthlyIncome: 0,
  employment: "",
  documentConfirmed: false,
  termsConfirmed: false,
};

export const samplePaySlip = {
  name: "Aarav Mehta",
  income: 42000,
  employment: "Salaried",
  period: "September 2026",
};

export function restoreLoanDraft(value: unknown): LoanDraft | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const draft = value as Record<string, unknown>;
  if (typeof draft.amount !== "number" || !Number.isInteger(draft.amount) || draft.amount < 0 || draft.amount > sampleTerms.maxAmount) return null;
  if (![6, 12, 24].includes(draft.termMonths as number)) return null;
  if (!["medical", "education", "home", "other"].includes(draft.purpose as string)) return null;
  if (typeof draft.fullName !== "string" || draft.fullName.length > 100) return null;
  if (typeof draft.employment !== "string" || draft.employment.length > 80) return null;
  if (typeof draft.monthlyIncome !== "number" || !Number.isFinite(draft.monthlyIncome) || draft.monthlyIncome < 0 || draft.monthlyIncome > 10000000) return null;
  if (typeof draft.documentConfirmed !== "boolean" || typeof draft.termsConfirmed !== "boolean") return null;
  return draft as LoanDraft;
}

export function calculateLoan(amount: number, months: number) {
  const monthlyRate = sampleTerms.annualRate / 12;
  const paise = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
  const emi = paise(amount * monthlyRate / (1 - Math.pow(1 + monthlyRate, -months)));
  const totalRepayment = paise(emi * months);
  const processingFee = paise(amount * sampleTerms.processingFeeRate);
  return {
    emi,
    totalRepayment,
    processingFee,
    totalCost: paise(totalRepayment + processingFee),
  };
}

export const rupees = (amount: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: Number.isInteger(amount) ? 0 : 2, maximumFractionDigits: 2 }).format(amount);
