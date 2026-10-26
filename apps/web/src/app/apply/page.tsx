"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { calculateLoan, initialDraft, restoreLoanDraft, rupees, samplePaySlip, sampleTerms, type Language, type LoanDraft, type LoanPurpose } from "../../lib/loan-demo";
import { clearJourneyEvents, recordJourneyEvent } from "../../lib/journey-events";
import styles from "./page.module.css";

const content = {
  en: {
    demo: "SYNTHETIC DEMO · NO REAL APPLICATION",
    title: "Your loan journey, one clear step at a time.",
    subtitle: "Try the guided flow with sample information. No data is sent to a lender.",
    steps: ["Your need", "Sample document", "Confirm details", "Understand costs", "Done"],
    back: "Back", next: "Continue", startOver: "Start over", saved: "Your progress is saved in this browser only.",
    amount: "How much would you like to borrow?", purpose: "What is the loan for?", term: "Repayment period",
    purposes: { medical: "Medical", education: "Education", home: "Home", other: "Other" },
    firstHeading: "Tell us what you need", firstHelp: "A smaller amount or shorter term usually changes the monthly payment. You can review the full cost before continuing.",
    docHeading: "Review a sample income document", docHelp: "For this prototype, use a fictional payslip. The next step shows every extracted field so you can correct it.",
    sampleDoc: "SAMPLE PAYSLIP", sampleUse: "Use sample document", sampleApplied: "Sample fields ready for review", docNoUpload: "Real document upload is not enabled in this demo.",
    confirmHeading: "Check every detail", confirmHelp: "The fictional document suggests these values. Edit them before they enter the sample application.",
    name: "Full name", income: "Monthly income", employment: "Employment type", confirmFields: "I checked these fields against the sample document.",
    costHeading: "Understand the cost before deciding", costHelp: "These are sample loan terms, not an offer or eligibility decision.",
    monthly: "Estimated monthly payment", rate: "Annual interest rate", fee: "Processing fee", repayment: "Total instalments", allIn: "Total including fee",
    apr: "Is 18% the APR?", aprText: "No. The 18% shown here is an illustrative annual interest rate. APR also accounts for borrowing costs such as fees. A real lender must provide its own APR and Key Facts Statement. The 2% sample fee is shown separately here.",
    whyIncome: "Why ask for income?", whyIncomeText: "A lender may use income to assess whether repayments are affordable. AccessPath Finance does not make that decision.",
    read: "Read explanation aloud", aiSource: "AI explanation · Sarvam · sample terms", sampleSource: "Sample explanation · fixed terms", confirmTerms: "I understand these are illustrative terms and want to submit this sample application.",
    submit: "Submit sample application", doneHeading: "Sample application submitted", doneText: "This completes the demo journey. No lender received the application and no credit decision was made.",
    summary: "Your sample summary", nextStep: "In a real journey, the lender would acknowledge the application and explain the next step. Here, you can restart or review the existing route audit.",
    errorAmount: "Choose an amount between ₹10,000 and ₹1,00,000.", errorDoc: "Choose the sample document to continue.", errorDetails: "Enter a name and a valid monthly income, then confirm the fields.", errorTerms: "Review and confirm the illustrative terms before submitting.",
  },
  hi: {
    demo: "केवल नमूना · असली आवेदन नहीं",
    title: "लोन आवेदन का हर कदम, आसान भाषा में।",
    subtitle: "नमूना जानकारी से प्रक्रिया देखें। किसी ऋणदाता को डेटा नहीं भेजा जाता।",
    steps: ["ज़रूरत", "नमूना दस्तावेज़", "जानकारी जाँचें", "खर्च समझें", "पूरा हुआ"],
    back: "पीछे", next: "आगे बढ़ें", startOver: "फिर से शुरू करें", saved: "आपकी प्रगति केवल इस ब्राउज़र में सहेजी जाती है।",
    amount: "आप कितना उधार लेना चाहते हैं?", purpose: "लोन किस लिए चाहिए?", term: "भुगतान की अवधि",
    purposes: { medical: "इलाज", education: "शिक्षा", home: "घर", other: "अन्य" },
    firstHeading: "अपनी ज़रूरत बताएँ", firstHelp: "रकम या अवधि बदलने से मासिक किस्त बदल सकती है। आगे बढ़ने से पहले पूरा खर्च देख पाएँगे।",
    docHeading: "नमूना आय दस्तावेज़ देखें", docHelp: "इस नमूने में काल्पनिक वेतन पर्ची का उपयोग करें। अगले कदम पर हर जानकारी जाँच सकते हैं।",
    sampleDoc: "नमूना वेतन पर्ची", sampleUse: "नमूना दस्तावेज़ चुनें", sampleApplied: "नमूना जानकारी जाँचने के लिए तैयार है", docNoUpload: "असली दस्तावेज़ अपलोड इस नमूने में उपलब्ध नहीं है।",
    confirmHeading: "हर जानकारी जाँचें", confirmHelp: "ये जानकारी काल्पनिक दस्तावेज़ से ली गई है। इसे बदलकर पुष्टि करें।",
    name: "पूरा नाम", income: "मासिक आय", employment: "काम का प्रकार", confirmFields: "मैंने नमूना दस्तावेज़ से जानकारी जाँच ली है।",
    costHeading: "फ़ैसले से पहले पूरा खर्च समझें", costHelp: "ये नमूना शर्तें हैं, असली ऑफ़र या पात्रता का फ़ैसला नहीं।",
    monthly: "अनुमानित मासिक किस्त", rate: "सालाना ब्याज दर", fee: "प्रोसेसिंग शुल्क", repayment: "सभी किस्तों का योग", allIn: "शुल्क सहित कुल रकम",
    apr: "क्या 18% ही APR है?", aprText: "नहीं। यहाँ 18% नमूना सालाना ब्याज दर है। APR में शुल्क जैसे दूसरे खर्च भी शामिल होते हैं। असली ऋणदाता अपना APR और मुख्य तथ्य विवरण देगा। नमूना 2% शुल्क यहाँ अलग दिखाया गया है।",
    whyIncome: "आय क्यों पूछी जाती है?", whyIncomeText: "ऋणदाता यह देखने के लिए आय पूछ सकता है कि किस्त चुकाना संभव है या नहीं। AccessPath Finance यह फ़ैसला नहीं करता।",
    read: "समझाया गया पाठ सुनें", aiSource: "AI से समझाया · Sarvam · नमूना शर्तें", sampleSource: "नमूना विवरण · तय शर्तें", confirmTerms: "मैं समझता/समझती हूँ कि ये नमूना शर्तें हैं और नमूना आवेदन जमा करना चाहता/चाहती हूँ।",
    submit: "नमूना आवेदन जमा करें", doneHeading: "नमूना आवेदन जमा हुआ", doneText: "नमूना प्रक्रिया पूरी हुई। किसी ऋणदाता को आवेदन नहीं भेजा गया और कोई क्रेडिट फ़ैसला नहीं हुआ।",
    summary: "नमूना सारांश", nextStep: "असली प्रक्रिया में ऋणदाता आवेदन की पुष्टि और अगला कदम बताएगा। यहाँ आप फिर शुरू कर सकते हैं या मौजूदा रूट ऑडिट देख सकते हैं।",
    errorAmount: "₹10,000 से ₹1,00,000 के बीच रकम चुनें।", errorDoc: "आगे बढ़ने के लिए नमूना दस्तावेज़ चुनें।", errorDetails: "नाम और सही मासिक आय भरें, फिर जानकारी की पुष्टि करें।", errorTerms: "जमा करने से पहले नमूना शर्तों की पुष्टि करें।",
  },
} as const;

const storageKey = "accesspath-finance-synthetic-draft-v1";

export default function ApplyPage() {
  const [language, setLanguage] = useState<Language>("en");
  const [draft, setDraft] = useState<LoanDraft>(initialDraft);
  const [step, setStep] = useState(0);
  const [documentLoaded, setDocumentLoaded] = useState(false);
  const [documentSource, setDocumentSource] = useState<"sample" | "sarvam">("sample");
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState("");
  const [costAnswer, setCostAnswer] = useState<boolean | null>(null);
  const [extracted, setExtracted] = useState<{fullName: string; monthlyIncome: number; employment: string; period: string; confidence: {fullName: number | null; monthlyIncome: number | null; employment: number | null; period: number | null}} | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [ai, setAi] = useState<{ topic: "apr" | "income"; text: string } | null>(null);
  const [aiLoading, setAiLoading] = useState<"apr" | "income" | null>(null);
  const [aiError, setAiError] = useState(false);
  const extractionRun = useRef(0);
  const explanationRun = useRef(0);
  const submissionLocked = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const t = content[language];

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const value = window.localStorage.getItem(storageKey);
        if (value) {
          const saved = JSON.parse(value) as { draft?: unknown; step?: number; language?: Language; documentLoaded?: boolean; documentSource?: "sample" | "sarvam" };
          const restored = restoreLoanDraft(saved.draft);
          if (restored) setDraft(restored);
          if (restored && typeof saved.step === "number" && saved.step >= 0 && saved.step <= 4 && (saved.step === 0 || restored.amount >= sampleTerms.minAmount)) {
            const furthest = !saved.documentLoaded ? 1 : !restored.documentConfirmed ? 2 : !restored.termsConfirmed ? 3 : 4;
            setStep(Math.min(saved.step, furthest));
          }
          if (saved.language === "hi") setLanguage("hi");
          if (restored && saved.documentLoaded) setDocumentLoaded(true);
          if (restored && saved.documentLoaded && saved.documentSource === "sarvam") setDocumentSource("sarvam");
        }
      } catch { /* A bad local draft is ignored. */ }
      setReady(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try { window.localStorage.setItem(storageKey, JSON.stringify({ draft, step, language, documentLoaded, documentSource })); }
    catch { /* Continue without saved progress when browser storage is disabled. */ }
  }, [draft, step, language, documentLoaded, documentSource, ready]);

  useEffect(() => { if (ready) heading.current?.focus(); }, [step, ready]);
  const changeLanguage = (next: Language) => { explanationRun.current += 1; setLanguage(next); setAi(null); setAiError(false); setAiLoading(null); };

  const update = <K extends keyof LoanDraft>(field: K, value: LoanDraft[K]) => { setDraft((previous) => ({ ...previous, [field]: value })); explanationRun.current += 1; setAi(null); setAiLoading(null); setError(""); };
  const figures = calculateLoan(draft.amount, draft.termMonths);
  const goNext = () => {
    if (step === 0 && (!Number.isInteger(draft.amount) || draft.amount < sampleTerms.minAmount || draft.amount > sampleTerms.maxAmount || ![6, 12, 24].includes(draft.termMonths))) { recordJourneyEvent("blocked", step, "amount_out_of_range"); return setError(t.errorAmount); }
    if (step === 1 && !documentLoaded) { recordJourneyEvent("blocked", step, "sample_document_missing"); return setError(t.errorDoc); }
    if (step === 2 && (!draft.fullName.trim() || !Number.isInteger(draft.monthlyIncome) || draft.monthlyIncome <= 0 || draft.monthlyIncome > 10000000 || !draft.documentConfirmed)) { recordJourneyEvent("blocked", step, "details_not_confirmed"); return setError(t.errorDetails); }
    if (step === 3 && !draft.termsConfirmed) { recordJourneyEvent("blocked", step, "terms_not_confirmed"); return setError(t.errorTerms); }
    if (step === 3) {
      if (submissionLocked.current) return;
      submissionLocked.current = true;
    }
    recordJourneyEvent(step === 3 ? "sample_submitted" : "step_completed", step);
    setError(""); setStep(Math.min(4, step + 1));
  };
  const useSample = () => {
    extractionRun.current += 1;
    setDraft((previous) => ({ ...previous, fullName: samplePaySlip.name, monthlyIncome: samplePaySlip.income, employment: samplePaySlip.employment, documentConfirmed: false }));
    setDocumentLoaded(true); setDocumentSource("sample"); setExtracted(null); setExtracting(false); setExtractError(""); setError(""); recordJourneyEvent("sample_document", step, "manual_sample");
  };
  const extractSample = async () => {
    if (extracting) return;
    const run = ++extractionRun.current;
    setExtracting(true); setExtractError("");
    try {
      const start = await fetch("/api/finance/extract", { method: "POST" });
      if (!start.ok) throw new Error("Could not start document AI");
      const { jobId, token } = await start.json();
      let result: Record<string, unknown> | null = null;
      for (let attempt = 0; attempt < 24; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        if (run !== extractionRun.current) return;
        const response = await fetch(`/api/finance/extract?jobId=${encodeURIComponent(jobId)}&token=${encodeURIComponent(token)}`, { cache: "no-store" });
        if (!response.ok && response.status !== 202) throw new Error("Document AI unavailable");
        const data = await response.json();
        if (data.status === "completed") { result = data; break; }
      }
      if (run !== extractionRun.current) return;
      if (!result) throw new Error("Document AI timed out");
      const fields = result.fields as { fullName: string; monthlyIncome: number; employment: string; period: string };
      const confidence = result.confidence as { fullName: number | null; monthlyIncome: number | null; employment: number | null; period: number | null };
      setExtracted({ ...fields, confidence });
      setDraft((previous) => ({ ...previous, fullName: fields.fullName, monthlyIncome: fields.monthlyIncome, employment: fields.employment, documentConfirmed: false }));
      setDocumentLoaded(true); setDocumentSource("sarvam"); setError("");
      recordJourneyEvent("sample_document", step, "sarvam_document_ai");
    } catch { if (run === extractionRun.current) setExtractError(language === "hi" ? "दस्तावेज़ AI अभी उपलब्ध नहीं है। आप नमूना जानकारी से आगे बढ़ सकते हैं।" : "Document AI is unavailable. You can continue with the sample fields."); }
    finally { if (run === extractionRun.current) setExtracting(false); }
  };
  const reset = () => { extractionRun.current += 1; explanationRun.current += 1; submissionLocked.current = false; try { window.localStorage.removeItem(storageKey); } catch { /* Storage may be disabled. */ } clearJourneyEvents(); setDraft(initialDraft); setDocumentLoaded(false); setDocumentSource("sample"); setExtracted(null); setExtracting(false); setExtractError(""); setAi(null); setAiLoading(null); setAiError(false); setCostAnswer(null); setStep(0); setError(""); };
  const explain = async (topic: "apr" | "income") => {
    const run = ++explanationRun.current;
    setAiLoading(topic); setAiError(false);
    try {
      const response = await fetch("/api/finance/explain", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, language, amount: draft.amount, months: draft.termMonths }),
      });
      if (!response.ok) throw new Error("Explanation unavailable");
      const result = await response.json();
      if (typeof result.explanation !== "string") throw new Error("Invalid explanation");
      if (run === explanationRun.current) setAi({ topic, text: result.explanation });
    } catch { if (run === explanationRun.current) setAiError(true); }
    finally { if (run === explanationRun.current) setAiLoading(null); }
  };
  const speak = (value: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(value);
    utterance.lang = language === "hi" ? "hi-IN" : "en-IN";
    window.speechSynthesis.speak(utterance);
  };

  return (
    <main className={styles.page} lang={language}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand}>accesspath <strong>finance.</strong></Link>
        <div className={styles.headerRight}><span>{t.demo}</span><div className={styles.langSwitch} role="group" aria-label="Language"><button type="button" aria-pressed={language === "en"} onClick={() => changeLanguage("en")}>English</button><button type="button" aria-pressed={language === "hi"} onClick={() => changeLanguage("hi")}>हिन्दी</button></div></div>
      </header>
      <div className={styles.shell}>
        <aside className={styles.sidebar}>
          <p className={styles.kicker}>{language === "hi" ? "ACCESSPATH / मार्गदर्शित प्रक्रिया" : "ACCESSPATH / GUIDED JOURNEY"}</p>
          <h1>{t.title}</h1><p className={styles.sidebarLead}>{t.subtitle}</p>
          <ol className={styles.progress} aria-label="Application progress">{t.steps.map((label, index) => <li key={index} className={index === step ? styles.current : index < step ? styles.complete : ""} aria-current={index === step ? "step" : undefined}><span>{index < step ? "✓" : index + 1}</span>{label}</li>)}</ol>
          <p className={styles.saveNote}>{t.saved}</p>
        </aside>
        <div className={styles.main}>
          <div className={styles.topline}><span>{language === "hi" ? "चरण" : "STEP"} {String(step + 1).padStart(2, "0")} / 05</span><button type="button" onClick={reset}>{t.startOver}</button></div>
          {step === 0 && <section aria-labelledby="step-heading"><h2 id="step-heading" tabIndex={-1} ref={heading}>{t.firstHeading}</h2><p className={styles.intro}>{t.firstHelp}</p><div className={styles.formGrid}><label className={styles.field}>{t.amount}<input type="number" min="10000" max="100000" step="1000" value={draft.amount} onChange={(e) => update("amount", Number(e.target.value))} /><small>₹10,000 – ₹1,00,000 · {language === "hi" ? "नमूना सीमा" : "sample range"}</small></label><label className={styles.field}>{t.term}<select value={draft.termMonths} onChange={(e) => update("termMonths", Number(e.target.value))}><option value={6}>6 {language === "hi" ? "महीने" : "months"}</option><option value={12}>12 {language === "hi" ? "महीने" : "months"}</option><option value={24}>24 {language === "hi" ? "महीने" : "months"}</option></select></label></div><fieldset className={styles.purpose}><legend>{t.purpose}</legend><div>{(["medical", "education", "home", "other"] as LoanPurpose[]).map((purpose) => <label key={purpose}><input type="radio" name="purpose" checked={draft.purpose === purpose} onChange={() => update("purpose", purpose)} /><span>{t.purposes[purpose]}</span></label>)}</div></fieldset><div className={styles.insight}><span>✦</span><p>{language === "hi" ? "आप जमा करने से पहले किस्त और कुल खर्च जाँच पाएँगे।" : "You will see the monthly payment and total cost before you submit."}</p></div></section>}
          {step === 1 && <section aria-labelledby="step-heading"><h2 id="step-heading" tabIndex={-1} ref={heading}>{t.docHeading}</h2><p className={styles.intro}>{t.docHelp}</p><div className={styles.document}><div className={styles.documentTop}><span>{t.sampleDoc}</span><span>{samplePaySlip.period}</span></div><dl><div><dt>{t.name}</dt><dd>{samplePaySlip.name}</dd></div><div><dt>{t.income}</dt><dd>{rupees(samplePaySlip.income)}</dd></div><div><dt>{t.employment}</dt><dd>{samplePaySlip.employment}</dd></div></dl><p>{language === "hi" ? "काल्पनिक दस्तावेज़ / केवल नमूना" : "FICTIONAL DOCUMENT / DEMO ONLY"}</p></div><div className={styles.docActions}><button className={styles.sampleButton} type="button" disabled={extracting} onClick={extractSample}>{extracting ? (language === "hi" ? "AI पढ़ रहा है…" : "AI is reading…") : (language === "hi" ? "Sarvam AI से जानकारी निकालें" : "Extract with Sarvam AI")}</button><button className={styles.manualButton} type="button" onClick={useSample} disabled={documentLoaded && documentSource === "sample"}>{documentSource === "sarvam" ? (language === "hi" ? "इसके बजाय नमूना जानकारी चुनें" : "Use sample fields instead") : documentLoaded ? "✓ " + t.sampleApplied : t.sampleUse}</button></div><p className={styles.micro}><a href="/sample-payslip.pdf" target="_blank" rel="noreferrer">{language === "hi" ? "काल्पनिक PDF देखें ↗" : "View the fictional PDF ↗"}</a> · {language === "hi" ? "केवल यही नमूना फ़ाइल AI को भेजी जाती है।" : "Only this fictional PDF is sent to Sarvam. Real document upload is disabled."}</p>{extractError && <p className={styles.aiError} role="status">{extractError}</p>}{documentSource === "sarvam" && extracted && <div className={styles.extractedProof}><strong>{language === "hi" ? "AI ने जानकारी निकाली — आगे जाँचें" : "AI extracted these fields — review next"}</strong><span>{language === "hi" ? "स्रोत: नमूना PDF, पृष्ठ 1" : "Source: sample PDF, page 1"}</span><span>{language === "hi" ? "नाम" : "Name"}: {extracted.fullName} {extracted.confidence.fullName !== null ? `· ${extracted.confidence.fullName}% ${language === "hi" ? "विश्वास स्तर" : "confidence"}` : ""}</span><span>{language === "hi" ? "मासिक आय" : "Monthly income"}: {rupees(extracted.monthlyIncome)} {extracted.confidence.monthlyIncome !== null ? `· ${extracted.confidence.monthlyIncome}% ${language === "hi" ? "विश्वास स्तर" : "confidence"}` : ""}</span></div>}</section>}
          {step === 2 && <section aria-labelledby="step-heading"><h2 id="step-heading" tabIndex={-1} ref={heading}>{t.confirmHeading}</h2><p className={styles.intro}>{t.confirmHelp}</p><div className={styles.formGrid}><label className={styles.field}>{t.name}<input type="text" maxLength={100} value={draft.fullName} onChange={(e) => update("fullName", e.target.value)} autoComplete="off" /></label><label className={styles.field}>{t.income}<input type="number" min="1" max="10000000" step="1" value={draft.monthlyIncome || ""} onChange={(e) => update("monthlyIncome", Number(e.target.value))} /></label><label className={styles.field}>{t.employment}<input type="text" maxLength={80} value={draft.employment} onChange={(e) => update("employment", e.target.value)} /></label></div><label className={styles.check}><input type="checkbox" checked={draft.documentConfirmed} onChange={(e) => update("documentConfirmed", e.target.checked)} /><span>{t.confirmFields}</span></label><p className={styles.micro}>{documentSource === "sarvam" ? (language === "hi" ? "स्रोत: Sarvam Document AI · काल्पनिक PDF · पृष्ठ 1। AI की जानकारी जाँचकर ही पुष्टि करें।" : "Source: Sarvam Document AI · fictional PDF · page 1. Check every AI-suggested field before confirming.") : (language === "hi" ? "स्रोत: काल्पनिक नमूना वेतन पर्ची।" : "Source: fictional sample payslip. These fields were prefilled, not extracted by AI.")}</p></section>}
          {step === 3 && <section aria-labelledby="step-heading"><h2 id="step-heading" tabIndex={-1} ref={heading}>{t.costHeading}</h2><p className={styles.intro}>{t.costHelp}</p><div className={styles.costHero}><span>{t.monthly}</span><strong>{rupees(figures.emi)}</strong><small>{draft.termMonths} {language === "hi" ? "महीने" : "months"} · {rupees(draft.amount)} {language === "hi" ? "मूल रकम" : "principal"}</small></div><dl className={styles.costList}><div><dt>{t.rate}</dt><dd>18% <small>({language === "hi" ? "नमूना" : "sample"})</small></dd></div><div><dt>{t.fee}</dt><dd>{rupees(figures.processingFee)}</dd></div><div><dt>{t.repayment}</dt><dd>{rupees(figures.totalRepayment)}</dd></div><div className={styles.total}><dt>{t.allIn}</dt><dd>{rupees(figures.totalCost)}</dd></div></dl><details className={styles.explain}><summary>{t.apr}</summary><p>{ai?.topic === "apr" ? ai.text : t.aprText}</p><p className={styles.aiSource}>{ai?.topic === "apr" ? t.aiSource : t.sampleSource}</p><button type="button" disabled={aiLoading !== null} onClick={() => explain("apr")}>{aiLoading === "apr" ? (language === "hi" ? "समझाया जा रहा है…" : "Generating…") : (language === "hi" ? "AI से सरल भाषा में समझें" : "Explain with AI")}</button> <button type="button" onClick={() => speak(ai?.topic === "apr" ? ai.text : t.aprText)}>{t.read}</button></details><details className={styles.explain}><summary>{t.whyIncome}</summary><p>{ai?.topic === "income" ? ai.text : t.whyIncomeText}</p><p className={styles.aiSource}>{ai?.topic === "income" ? t.aiSource : t.sampleSource}</p><button type="button" disabled={aiLoading !== null} onClick={() => explain("income")}>{aiLoading === "income" ? (language === "hi" ? "समझाया जा रहा है…" : "Generating…") : (language === "hi" ? "AI से सरल भाषा में समझें" : "Explain with AI")}</button> <button type="button" onClick={() => speak(ai?.topic === "income" ? ai.text : t.whyIncomeText)}>{t.read}</button></details>{aiError && <p className={styles.aiError} role="status">{language === "hi" ? "AI अभी उपलब्ध नहीं है। नमूना जानकारी ऊपर दी गई है।" : "AI is unavailable right now. The fixed sample explanation is shown above."}</p>}<div className={styles.clarityCheck}><span className={styles.clarityKicker}>§04 · {language === "hi" ? "समझ जाँचें" : "CHECK YOUR UNDERSTANDING"}</span><h3>{language === "hi" ? "क्या कुल रकम में प्रोसेसिंग शुल्क शामिल है?" : "Does the total shown include the processing fee?"}</h3><div><button type="button" aria-pressed={costAnswer === true} onClick={() => { setCostAnswer(true); recordJourneyEvent("comprehension_checked", step, "correct"); }}>{language === "hi" ? "हाँ, शामिल है" : "Yes, it does"}</button><button type="button" aria-pressed={costAnswer === false} onClick={() => { setCostAnswer(false); recordJourneyEvent("comprehension_checked", step, "retry"); }}>{language === "hi" ? "नहीं" : "No"}</button></div>{costAnswer !== null && <p role="status">{costAnswer ? (language === "hi" ? "सही। शुल्क सहित कुल रकम ऊपर दिखाई गई है।" : "Correct. The total including the fee is shown above.") : (language === "hi" ? "ऊपर 'शुल्क सहित कुल रकम' देखें। आप अपना जवाब बदल सकते हैं।" : "Look for ‘Total including fee’ above. You can try again.")}</p>}</div><label className={styles.check}><input type="checkbox" checked={draft.termsConfirmed} onChange={(e) => update("termsConfirmed", e.target.checked)} /><span>{t.confirmTerms}</span></label></section>}
          {step === 4 && <section aria-labelledby="step-heading" className={styles.done}><div className={styles.doneIcon}>✓</div><h2 id="step-heading" tabIndex={-1} ref={heading}>{t.doneHeading}</h2><p className={styles.intro}>{t.doneText}</p><div className={styles.doneSummary}><h3>{t.summary}</h3><p>{rupees(draft.amount)} · {draft.termMonths} {language === "hi" ? "महीने" : "months"} · {rupees(figures.emi)} / {language === "hi" ? "महीना" : "month"}</p><p>{t.nextStep}</p></div><div className={styles.doneActions}><button type="button" onClick={reset}>{t.startOver}</button><Link href="/insights">{language === "hi" ? "यात्रा रिकॉर्ड देखें" : "See journey evidence"} ↗</Link><Link href="/audit">{language === "hi" ? "रूट ऑडिट देखें" : "See the route audit"} ↗</Link></div></section>}
          {error && <p className={styles.error} role="alert">{error}</p>}
          {step < 4 && <div className={styles.actions}>{step > 0 ? <button className={styles.back} type="button" onClick={() => { setStep(step - 1); setError(""); }}>{t.back}</button> : <span />}<button className={styles.next} type="button" onClick={goNext}>{step === 3 ? t.submit : t.next} <span aria-hidden="true">→</span></button></div>}
        </div>
      </div>
    </main>
  );
}
