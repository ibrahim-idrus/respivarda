import type { Metadata } from "next";
import FeedbackPage from "@/src/components/feedback/FeedbackPage";

export const metadata: Metadata = {
  title: "Masukan, Respivarda",
  description:
    "Laporkan perbedaan bacaan AQI atau usulan perbaikan untuk tim Respivarda. Anonim.",
};

export default function Page() {
  return <FeedbackPage />;
}
