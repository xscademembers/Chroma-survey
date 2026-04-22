"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { DEFAULT_FORM_OPTIONS, FormOptions, PatientSubmission } from "@/types";

const initialForm: PatientSubmission = {
  fullName: "",
  mobileNumber: "",
  visitType: "First-Time",
  age: "",
  gender: "",
  address: "",
  selectedCategory: "",
  reason: "",
  leadSource: "",
  otherSourceDetails: "",
  adAttribution: ""
};

type Step =
  | "welcome"
  | "visitType"
  | "returningMobile"
  | "welcomeBack"
  | "fullName"
  | "mobile"
  | "age"
  | "gender"
  | "address"
  | "category"
  | "reason"
  | "leadSource"
  | "otherSource"
  | "thankYou";

export default function HomePage() {
  const [form, setForm] = useState<PatientSubmission>(initialForm);
  const [options, setOptions] = useState<FormOptions>(DEFAULT_FORM_OPTIONS);
  const [step, setStep] = useState<Step>("welcome");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [lookupFound, setLookupFound] = useState<boolean | null>(null);

  const reasons = useMemo(
    () => options.reasons.find((r) => r.name === form.selectedCategory)?.items ?? [],
    [form.selectedCategory, options.reasons]
  );

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const res = await fetch("/api/options");
        const data = await res.json();
        if (data?.reasons?.length || data?.sources?.length) {
          setOptions(data);
        }
      } catch {
        // Keep local fallback options.
      }
    };
    void loadOptions();
  }, []);

  const sharedTailSteps = useMemo(() => {
    const base: Step[] = ["age", "gender", "address", "category", "reason", "leadSource"];
    if (form.leadSource === "Other") {
      return [...base, "otherSource", "thankYou"] as Step[];
    }
    return [...base, "thankYou"] as Step[];
  }, [form.leadSource]);

  const flowSteps = useMemo(() => {
    if (form.visitType === "First-Time") {
      return ["fullName", "mobile", ...sharedTailSteps] as Step[];
    }
    if (lookupFound === true) {
      return ["welcomeBack", ...sharedTailSteps] as Step[];
    }
    if (lookupFound === false) {
      return ["fullName", ...sharedTailSteps] as Step[];
    }
    return [] as Step[];
  }, [form.visitType, lookupFound, sharedTailSteps]);

  const progressPercent = useMemo(() => {
    if (step === "welcome") {
      return 0;
    }
    if (step === "visitType") {
      return 14;
    }
    if (step === "returningMobile") {
      return 22;
    }
    const idx = flowSteps.indexOf(step);
    if (idx === -1) {
      return 14;
    }
    return 22 + Math.round(((idx + 1) / Math.max(flowSteps.length, 1)) * 78);
  }, [flowSteps, step]);

  const nextStep = (current: Step) => {
    const idx = flowSteps.indexOf(current);
    if (idx >= 0 && idx < flowSteps.length - 1) {
      setStep(flowSteps[idx + 1]);
    }
  };

  const prevStep = () => {
    if (step === "fullName" && form.visitType === "Returning" && lookupFound === false) {
      setStep("returningMobile");
      return;
    }
    if (step === "welcomeBack") {
      setStep("returningMobile");
      return;
    }
    const idx = flowSteps.indexOf(step);
    if (idx > 0) {
      setStep(flowSteps[idx - 1]);
      return;
    }
    setStep("visitType");
  };

  const submitCheckin = async (override?: Partial<PatientSubmission>) => {
    const payload = { ...form, ...override };
    setSubmitLoading(true);
    try {
      const res = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        throw new Error("submit failed");
      }
      setStep("thankYou");
    } catch {
      alert("Submission failed. Please retry.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const onContinueReturning = async () => {
    if (!form.mobileNumber?.trim()) {
      return;
    }
    setLookupLoading(true);
    try {
      const res = await fetch("/api/patients/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobileNumber: form.mobileNumber.trim() })
      });
      if (res.ok) {
        const data = (await res.json()) as { found?: boolean; fullName?: string | null };
        if (data.found) {
          setLookupFound(true);
          setForm((prev) => ({ ...prev, fullName: data.fullName ?? prev.fullName }));
          setStep("welcomeBack");
        } else {
          setLookupFound(false);
          setForm((prev) => ({ ...prev, fullName: "" }));
          setStep("fullName");
        }
      } else {
        setLookupFound(false);
        setStep("fullName");
      }
    } catch {
      setLookupFound(false);
      setStep("fullName");
    } finally {
      setLookupLoading(false);
    }
  };

  const shell = (content: React.ReactNode) => (
    <div className="pb-12">
      <div className="h-1.5 w-full bg-slate-200">
        <div className="h-1.5 bg-[#008080]" style={{ width: `${progressPercent}%` }} />
      </div>
      <div className="mx-auto max-w-md px-4 pt-6">
        <div className="mb-8 flex items-center justify-between text-sm">
          <p className="font-semibold text-[#008080]">Chroma Eye Hospitals</p>
          <button type="button" className="text-slate-400 hover:text-slate-600" onClick={prevStep}>
            Back
          </button>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-8 shadow-md">{content}</div>
        <p className="mt-7 text-center text-xs text-slate-400">© 2026 Chroma Eye Hospitals</p>
        <Link className="mt-1 block text-center text-xs text-slate-400 hover:text-slate-600" href="/dashboard">
          Admin Login
        </Link>
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-slate-100">
      {step === "welcome" ? (
        <div className="mx-auto flex min-h-[80vh] max-w-md flex-col items-center justify-center">
          <div className="w-full rounded-2xl border border-slate-200 bg-white px-8 py-10 text-center shadow-lg">
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-slate-200 bg-slate-50">
              <Sparkles className="h-6 w-6 text-slate-900" />
            </div>
            <h1 className="text-4xl font-bold leading-tight text-slate-900">
              Welcome to <span className="text-[#008080]">Chroma Eye Hospitals</span>
            </h1>
            <p className="mx-auto mt-4 max-w-xs text-sm text-slate-500">
              We&apos;re happy to see you! Please fill out these quick details to check in.
            </p>
            <button
              className="mt-8 w-full rounded-lg bg-[#008080] py-3 font-semibold text-white transition hover:bg-[#006666]"
              type="button"
              onClick={() => setStep("visitType")}
            >
              Start Check-in
            </button>
          </div>
          <p className="mt-5 text-xs text-slate-400">© 2026 Chroma Eye Hospitals</p>
          <Link className="mt-1 text-xs text-slate-400 hover:text-slate-600" href="/dashboard">
            Admin Login
          </Link>
        </div>
      ) : step === "visitType" ? (
        shell(
          <>
            <h2 className="text-[31px] font-semibold leading-tight text-slate-900">
              Is this your first visit to Chroma Eye Hospitals?
            </h2>
            <div className="mt-6 space-y-3">
              <button
                type="button"
                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-left text-slate-700 transition hover:bg-slate-50"
                onClick={() => {
                  setForm({ ...initialForm, visitType: "First-Time" });
                  setLookupFound(null);
                  setStep("fullName");
                }}
              >
                First-Time
              </button>
              <button
                type="button"
                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-left text-slate-700 transition hover:bg-slate-50"
                onClick={() => {
                  setForm({ ...initialForm, visitType: "Returning" });
                  setLookupFound(null);
                  setStep("returningMobile");
                }}
              >
                Returning
              </button>
            </div>
          </>
        )
      ) : step === "returningMobile" ? (
        shell(
          <>
            <h2 className="text-3xl font-semibold leading-tight text-slate-900">
              Please enter your mobile number
            </h2>
            <p className="mt-4 text-sm text-slate-500">We&apos;ll look up your previous visit details</p>
            <input
              className="mt-4 w-full rounded-lg border border-slate-200 px-4 py-3 text-slate-700 outline-none ring-[#008080]/30 transition focus:ring-2"
              placeholder="1234567890"
              value={form.mobileNumber}
              onChange={(e) =>
                setForm({
                  ...form,
                  mobileNumber: e.target.value.replace(/\D/g, "").slice(0, 10)
                })
              }
              inputMode="numeric"
              maxLength={10}
              pattern="\d{10}"
            />
            <button
              type="button"
              className="mt-4 w-full rounded-lg bg-[#008080] py-3 font-semibold text-white transition hover:bg-[#006666] disabled:cursor-not-allowed disabled:opacity-45"
              onClick={onContinueReturning}
              disabled={form.mobileNumber?.trim().length !== 10 || lookupLoading}
            >
              {lookupLoading ? "Checking..." : "Continue"}
            </button>
          </>
        )
      ) : step === "welcomeBack" ? (
        shell(
          <>
            <h2 className="text-3xl font-semibold leading-tight text-slate-900">
              Welcome back, {form.fullName || "Patient"}!
            </h2>
            <p className="mt-4 text-sm text-slate-500">We found your previous record.</p>
            <button
              type="button"
              className="mt-6 w-full rounded-lg bg-[#008080] py-3 font-semibold text-white transition hover:bg-[#006666]"
              onClick={() => nextStep("welcomeBack")}
            >
              Continue
            </button>
          </>
        )
      ) : step === "fullName" ? (
        shell(
          <>
            <h2 className="text-3xl font-semibold leading-tight text-slate-900">What is your full name?</h2>
            <input
              className="mt-5 w-full rounded-lg border border-slate-200 px-4 py-3 text-slate-700 outline-none ring-[#008080]/30 transition focus:ring-2"
              placeholder="e.g. John Doe"
              value={form.fullName}
              onChange={(e) =>
                setForm({
                  ...form,
                  fullName: e.target.value.replace(/[^A-Za-z ]/g, "")
                })
              }
              inputMode="text"
              pattern="[A-Za-z ]+"
            />
            <button
              type="button"
              className="mt-4 w-full rounded-lg bg-[#008080] py-3 font-semibold text-white transition hover:bg-[#006666] disabled:cursor-not-allowed disabled:opacity-45"
              onClick={() => nextStep("fullName")}
              disabled={!form.fullName?.trim()}
            >
              Next
            </button>
          </>
        )
      ) : step === "mobile" ? (
        shell(
          <>
            <h2 className="text-3xl font-semibold leading-tight text-slate-900">Your mobile number?</h2>
            <input
              className="mt-5 w-full rounded-lg border border-slate-200 px-4 py-3 text-slate-700 outline-none ring-[#008080]/30 transition focus:ring-2"
              placeholder="1234567890"
              value={form.mobileNumber}
              onChange={(e) =>
                setForm({
                  ...form,
                  mobileNumber: e.target.value.replace(/\D/g, "").slice(0, 10)
                })
              }
              inputMode="numeric"
              maxLength={10}
              pattern="\d{10}"
            />
            <button
              type="button"
              className="mt-4 w-full rounded-lg bg-[#008080] py-3 font-semibold text-white transition hover:bg-[#006666] disabled:cursor-not-allowed disabled:opacity-45"
              onClick={() => nextStep("mobile")}
              disabled={form.mobileNumber?.trim().length !== 10}
            >
              Next
            </button>
          </>
        )
      ) : step === "age" ? (
        shell(
          <>
            <h2 className="text-3xl font-semibold leading-tight text-slate-900">What is your age?</h2>
            <input
              className="mt-5 w-full rounded-lg border border-slate-200 px-4 py-3 text-slate-700 outline-none ring-[#008080]/30 transition focus:ring-2"
              placeholder="e.g. 30"
              value={form.age}
              onChange={(e) => {
                const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 3);
                const normalized = digitsOnly ? String(Math.min(Number(digitsOnly), 100)) : "";
                setForm({ ...form, age: normalized });
              }}
              inputMode="numeric"
              maxLength={3}
              pattern="^(100|[1-9]?[0-9])$"
            />
            <button
              type="button"
              className="mt-4 w-full rounded-lg bg-[#008080] py-3 font-semibold text-white transition hover:bg-[#006666] disabled:cursor-not-allowed disabled:opacity-45"
              onClick={() => nextStep("age")}
              disabled={!form.age?.trim() || Number(form.age) < 1 || Number(form.age) > 100}
            >
              Next
            </button>
          </>
        )
      ) : step === "gender" ? (
        shell(
          <>
            <h2 className="text-3xl font-semibold leading-tight text-slate-900">What is your gender?</h2>
            <div className="mt-5 space-y-2.5">
              {["Male", "Female", "Other", "Prefer not to say"].map((gender) => (
                <button
                  key={gender}
                  type="button"
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-left text-slate-700 transition hover:bg-slate-50"
                  onClick={() => {
                    setForm({ ...form, gender });
                    nextStep("gender");
                  }}
                >
                  {gender}
                </button>
              ))}
            </div>
          </>
        )
      ) : step === "address" ? (
        shell(
          <>
            <h2 className="text-3xl font-semibold leading-tight text-slate-900">What is your address?</h2>
            <textarea
              className="mt-5 min-h-24 w-full rounded-lg border border-slate-200 px-4 py-3 text-slate-700 outline-none ring-[#008080]/30 transition focus:ring-2"
              placeholder="Enter your full address..."
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
            <button
              type="button"
              className="mt-4 w-full rounded-lg bg-[#008080] py-3 font-semibold text-white transition hover:bg-[#006666] disabled:cursor-not-allowed disabled:opacity-45"
              onClick={() => nextStep("address")}
              disabled={(form.address?.match(/[A-Za-z]/g)?.length ?? 0) < 5}
            >
              Next
            </button>
          </>
        )
      ) : step === "category" ? (
        shell(
          <>
            <h2 className="text-3xl font-semibold leading-tight text-slate-900">
              What brings you in today?
            </h2>
            <div className="mt-5 space-y-2.5">
              {options.reasons.map((category) => (
                <button
                  key={category.name}
                  type="button"
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-left text-slate-700 transition hover:bg-slate-50"
                  onClick={() => {
                    setForm({ ...form, selectedCategory: category.name, reason: "" });
                    nextStep("category");
                  }}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </>
        )
      ) : step === "reason" ? (
        shell(
          <>
            <h2 className="text-3xl font-semibold leading-tight text-slate-900">
              Select a specific procedure
            </h2>
            <div className="mt-5 space-y-2.5">
              {reasons.map((reason) => (
                <button
                  key={reason}
                  type="button"
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-left text-slate-700 transition hover:bg-slate-50"
                  onClick={() => {
                    setForm({ ...form, reason });
                    nextStep("reason");
                  }}
                >
                  {reason}
                </button>
              ))}
            </div>
          </>
        )
      ) : step === "leadSource" ? (
        shell(
          <>
            <h2 className="text-3xl font-semibold leading-tight text-slate-900">
              How did you hear about us?
            </h2>
            <div className="mt-5 space-y-2.5">
              {options.sources.map((source) => (
                <button
                  key={source}
                  type="button"
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-left text-slate-700 transition hover:bg-slate-50"
                  onClick={() => {
                    setForm({ ...form, leadSource: source, otherSourceDetails: "" });
                    if (source === "Other") {
                      setStep("otherSource");
                    } else {
                      void submitCheckin({ leadSource: source, otherSourceDetails: "" });
                    }
                  }}
                >
                  {source}
                </button>
              ))}
            </div>
          </>
        )
      ) : step === "otherSource" ? (
        shell(
          <>
            <h2 className="text-3xl font-semibold leading-tight text-slate-900">Tell us the source</h2>
            <input
              className="mt-5 w-full rounded-lg border border-slate-200 px-4 py-3 text-slate-700 outline-none ring-[#008080]/30 transition focus:ring-2"
              placeholder="Please specify source"
              value={form.otherSourceDetails}
              onChange={(e) => setForm({ ...form, otherSourceDetails: e.target.value })}
            />
            <button
              type="button"
              className="mt-4 w-full rounded-lg bg-[#008080] py-3 font-semibold text-white transition hover:bg-[#006666] disabled:cursor-not-allowed disabled:opacity-45"
              onClick={() =>
                void submitCheckin({
                  leadSource: "Other",
                  otherSourceDetails: form.otherSourceDetails?.trim() ?? ""
                })
              }
              disabled={!form.otherSourceDetails?.trim() || submitLoading}
            >
              {submitLoading ? "Submitting..." : "Next"}
            </button>
          </>
        )
      ) : (
        shell(
          <>
            <h2 className="text-3xl font-semibold leading-tight text-slate-900">Thank you!</h2>
            <p className="mt-4 text-sm text-slate-500">
              Your check-in has been submitted successfully.
            </p>
            <button
              type="button"
              className="mt-6 w-full rounded-lg bg-[#008080] py-3 font-semibold text-white transition hover:bg-[#006666]"
              onClick={() => {
                setForm(initialForm);
                setLookupFound(null);
                setStep("welcome");
              }}
            >
              Start New Check-in
            </button>
          </>
        )
      )}
    </main>
  );
}
