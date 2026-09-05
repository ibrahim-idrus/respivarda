import FeedbackTelemetry from "@/src/components/admin/FeedbackTelemetry";
import UserRegistry from "@/src/components/admin/UserRegistry";

export default function AdminConsolePage() {
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
      <aside className="xl:col-span-4">
        <FeedbackTelemetry />
      </aside>
      <section className="min-w-0 xl:col-span-8">
        <UserRegistry />
      </section>
    </div>
  );
}
