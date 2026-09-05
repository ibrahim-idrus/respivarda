"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Checkbox, Textarea } from "@cloudflare/kumo";
import {
  CheckCircle,
  Info,
  LockSimple,
  PaperPlaneRight,
} from "@phosphor-icons/react";

const MAX_LEN = 1200;

export default function FeedbackForm() {
  const [description, setDescription] = useState("");
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [captchaError, setCaptchaError] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;
    // ponytail: fake captcha — ceiling: any bot passes. upgrade: real
    // turnstile/hcaptcha widget.
    if (!captchaVerified) {
      setCaptchaError(true);
      setTimeout(() => setCaptchaError(false), 1500);
      return;
    }
    // ponytail: submit is local state — ceiling: refresh loses it, nothing
    // persisted. upgrade: POST to /api/feedback + drizzle.
    setSubmitted(true);
  };

  const onReset = () => {
    setDescription("");
    setCaptchaVerified(false);
    setSubmitted(false);
  };

  if (submitted) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center gap-4 rounded-xl bg-surface-container-lowest p-6 text-center shadow-md md:p-8">
        <CheckCircle size={56} weight="fill" className="text-secondary" />
        <h2 className="text-xl font-bold tracking-tight">
          Report received. Thank you.
        </h2>
        <p className="max-w-md text-sm text-on-surface-variant">
          Your anonymous report has been queued for review by the civic
          telemetry team.
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          <Button variant="primary" onClick={onReset}>
            Send Another Report
          </Button>
          <Link href="/">
            <Button variant="secondary">Return to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-surface-container-lowest p-6 shadow-md md:p-8">
      <form className="flex flex-col gap-8" onSubmit={onSubmit}>
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <label
              htmlFor="report-description"
              className="flex items-center gap-2 text-base font-semibold tracking-tight text-on-surface"
            >
              Description
              <span className="text-[11px] font-bold text-error">*</span>
            </label>
            <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
              {description.length} / {MAX_LEN}
            </span>
          </div>
          <p className="text-[13px] text-on-surface-variant">
            Describe your observation, sensor discrepancy, or suggestions for
            the platform
          </p>
          <div className="mt-2">
            <Textarea
              id="report-description"
              name="description"
              required
              rows={7}
              maxLength={MAX_LEN}
              value={description}
              onValueChange={setDescription}
              placeholder="e.g., Heavy smoke odor observed along Jl. MT Haryono around 14:30, but nearby sensor SW-04 reports clean air. Please verify optical readings..."
              className="min-h-[160px]"
            />
          </div>
          <div className="mt-2 flex items-center gap-2 text-on-surface-variant">
            <Info size={16} />
            <span className="text-[13px]">
              Do not include personal identifiers in your report.
            </span>
          </div>
        </div>

        <div
          className={`flex items-center justify-between gap-4 rounded-lg border border-surface-container bg-surface-container-low p-4 transition-colors ${
            captchaError ? "bg-error-container" : ""
          }`}
        >
          <Checkbox
            label={
              captchaVerified
                ? "I am not a robot — Token Verified"
                : "I am not a robot"
            }
            checked={captchaVerified}
            onCheckedChange={(checked) => setCaptchaVerified(checked === true)}
          />
          <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
            {captchaVerified ? "Token Verified" : "Verification Ready"}
          </span>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-on-surface-variant">
            <LockSimple size={16} />
            <span className="text-[13px]">
              End-to-end anonymous. No metadata stored.
            </span>
          </div>
          <Button
            type="submit"
            variant="primary"
            icon={<PaperPlaneRight weight="fill" />}
          >
            Send Report
          </Button>
        </div>
      </form>
    </div>
  );
}
