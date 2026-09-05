import FeedbackQueue from "@/src/components/admin/FeedbackQueue";
import FeedbackTelemetry from "@/src/components/admin/FeedbackTelemetry";

export const metadata = {
  title: "Laporan Masukan — Respivarda Admin",
  description: "Daftar dan penanganan laporan masukan masyarakat terkait kualitas udara dan sensor.",
};

export default function AdminFeedbackPage() {
  return (
    <div className="flex flex-col gap-6">
      <FeedbackTelemetry />
      <FeedbackQueue />
    </div>
  );
}
