"use client";

import { Badge } from "@cloudflare/kumo";
import {
  Baby,
  Compass,
  DoorOpen,
  MaskHappy,
  PersonSimpleRun,
  TrendDown,
  TrendUp,
  Warning,
} from "@phosphor-icons/react";
import {
  GUIDANCE,
  SCENARIOS,
  SCENARIO_STYLES,
} from "@/src/lib/mock-data";
import type { District } from "@/src/lib/mock-data";

const GUIDANCE_ICONS = {
  mask: MaskHappy,
  run: PersonSimpleRun,
  window: DoorOpen,
  child: Baby,
  wind: Compass,
} as const;

export default function StatusPanel({ district }: { district: District }) {
  const data = SCENARIOS[district.scenario];
  const s = SCENARIO_STYLES[district.scenario];
  const Trend = data.trendUp ? TrendUp : TrendDown;

  return (
    <section className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-4 px-4 sm:px-6 lg:grid-cols-12">
      {/* Guidance */}
      <div className="rounded-2xl border border-surface-container bg-surface-container-lowest p-6 shadow-sm lg:col-span-5">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-lg font-extrabold tracking-tight">
            What You Should Know
          </h2>
          <Badge variant="secondary">Live Protocol</Badge>
        </div>
        <p className="mb-4 text-sm text-on-surface-variant">
          Immediate, situation-specific guidance based on current smoke levels
        </p>
        <ul className="space-y-4">
          {GUIDANCE.map((g) => {
            const Icon = GUIDANCE_ICONS[g.icon];
            return (
              <li key={g.title} className="flex gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary-container text-on-secondary-container">
                  <Icon size={18} weight="fill" />
                </div>
                <div>
                  <p className="text-sm font-bold">{g.title}</p>
                  <p className="text-xs text-on-surface-variant">{g.body}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Drift insight */}
      <div className="rounded-2xl border border-surface-container bg-surface-container-lowest p-6 shadow-sm lg:col-span-3">
        <div className="mb-2 flex items-center gap-2">
          <Compass size={20} className="text-secondary" />
          <h3 className="text-sm font-extrabold">
            Nearby Smoke Insight &amp; Drift
          </h3>
        </div>
        <p className="text-sm leading-relaxed text-on-surface-variant">
          Plume core is currently located{" "}
          <strong className="text-on-surface">{data.plumeDistance}</strong> and
          drifting at{" "}
          <strong className="text-on-surface">{data.driftSpeed}</strong> towards
          coastal corridors. The maritime sea breeze is projected to sustain
          current trajectory over the next 45 minutes before leveling.
        </p>
      </div>

      {/* Status card */}
      <div
        className={`rounded-2xl border p-6 shadow-sm ${s.bg} ${s.border} lg:col-span-4`}
      >
        <div className="mb-2 flex items-center justify-between">
          <h3 className={`flex items-center gap-2 text-base font-extrabold ${s.text}`}>
            <Warning size={20} weight="fill" />
            {data.title}
          </h3>
          <Badge variant="primary">{data.badge}</Badge>
        </div>
        <p className="mb-4 text-sm text-on-surface">{data.description}</p>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-white/70 p-3">
            <dt className="text-[11px] font-semibold text-on-surface-variant">
              Smoke Status
            </dt>
            <dd className="font-extrabold">{data.smokeStatus}</dd>
            <dd className="text-xs text-on-surface-variant">
              PM2.5: {data.pm25}
            </dd>
          </div>
          <div className="rounded-xl bg-white/70 p-3">
            <dt className="text-[11px] font-semibold text-on-surface-variant">
              Proximity
            </dt>
            <dd className="font-extrabold">{data.proximity}</dd>
            <dd className="text-xs text-on-surface-variant">
              From selected location
            </dd>
          </div>
          <div className="rounded-xl bg-white/70 p-3">
            <dt className="text-[11px] font-semibold text-on-surface-variant">
              Plume Trend
            </dt>
            <dd className={`flex items-center gap-1 font-extrabold ${s.text}`}>
              <Trend size={16} weight="bold" />
              {data.trend}
            </dd>
            <dd className="text-xs text-on-surface-variant">
              Over last 30 minutes
            </dd>
          </div>
          <div className="rounded-xl bg-white/70 p-3">
            <dt className="text-[11px] font-semibold text-on-surface-variant">
              Last Updated
            </dt>
            <dd className="font-extrabold">10 mins ago</dd>
            <dd className="text-xs text-on-surface-variant">
              Automated sensor SW-04
            </dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
