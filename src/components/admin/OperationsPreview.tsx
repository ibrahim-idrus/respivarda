import {
  Broadcast,
  ShieldCheck,
  TelegramLogo,
  UsersThree,
  Waveform,
} from "@phosphor-icons/react";

const metrics = [
  { label: "Telegram subscribers", value: "1,248", icon: UsersThree },
  { label: "Alerts delivered today", value: "384", icon: Broadcast },
  { label: "Sensors online", value: "28 / 30", icon: Waveform },
];

export default function OperationsPreview() {
  return (
    <section className="rounded-3xl bg-primary p-6 text-white shadow-sm sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-secondary-fixed">
            Operations console
          </p>
          <h2 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">
            A clearer view of the people you protect
          </h2>
        </div>
        <TelegramLogo className="shrink-0 text-secondary-fixed" size={30} weight="fill" />
      </div>

      <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-slate-200">
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        Civic data network online
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {metrics.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/15">
            <Icon className="text-secondary-fixed" size={22} weight="fill" />
            <p className="mt-4 text-2xl font-extrabold">{value}</p>
            <p className="mt-1 text-sm font-medium text-slate-200">{label}</p>
          </div>
        ))}
      </div>

      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">
        Preview data
      </p>

      <p className="mt-6 text-sm leading-6 text-slate-200">
        This admin-only workspace helps teams understand Telegram alerts and
        neighborhood pollution context before they support the community.
      </p>

      <div className="mt-6 flex gap-3 rounded-2xl bg-white/10 p-4 ring-1 ring-white/15">
        <ShieldCheck className="mt-0.5 shrink-0 text-secondary-fixed" size={22} weight="fill" />
        <p className="text-sm leading-6 text-slate-100">
          Guest access stays open to the public dashboard and pollution map.
        </p>
      </div>
    </section>
  );
}
