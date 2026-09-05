import type { Metadata } from "next";
import FeedbackPage from "@/src/components/feedback/FeedbackPage";

export const metadata: Metadata = {
  title: "Send Feedback — Respivarda",
  description:
    "Report sensor discrepancies or suggest improvements to the Respivarda civic telemetry team. 100% anonymous.",
};

export default function Page() {
  return <FeedbackPage />;
}
