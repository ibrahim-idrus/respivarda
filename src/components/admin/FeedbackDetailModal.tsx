"use client";

import { Badge, Button, Dialog } from "@cloudflare/kumo";
import { MapPin } from "@phosphor-icons/react";
import {
  CATEGORY_LABEL,
  formatWIB,
  STATUS_BADGE,
  STATUS_LABEL,
  type Feedback,
} from "@/src/lib/admin-utils";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
        {label}
      </span>
      <span className="text-sm text-on-surface">{value}</span>
    </div>
  );
}

export default function FeedbackDetailModal({
  feedback,
  onClose,
}: {
  feedback: Feedback | null;
  onClose: () => void;
}) {
  return (
    <Dialog.Root
      open={feedback !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog size="lg" className="p-6">
        {feedback && (
          <div className="flex flex-col gap-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-1">
                <Dialog.Title>{feedback.reportRef}</Dialog.Title>
                <Dialog.Description>
                  Dikirim {formatWIB(feedback.createdAt)}
                </Dialog.Description>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {CATEGORY_LABEL[feedback.category]}
                </Badge>
                <Badge
                  variant={
                    STATUS_BADGE[feedback.status] as
                      | "neutral"
                      | "info"
                      | "warning"
                      | "success"
                  }
                >
                  {STATUS_LABEL[feedback.status]}
                </Badge>
              </div>
            </div>

            <Row label="Deskripsi" value={feedback.description} />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Row
                label="Nama Kontak"
                value={feedback.contactName ?? "Anonim"}
              />
              <Row label="WhatsApp" value={feedback.contactWhatsApp ?? "-"} />
              <Row label="Telegram" value={feedback.contactTelegram ?? "-"} />
            </div>

            <Row
              label="Lokasi"
              value={
                feedback.locationText || feedback.coordinates ? (
                  <span className="flex flex-col gap-0.5">
                    {feedback.locationText && (
                      <span>{feedback.locationText}</span>
                    )}
                    {feedback.coordinates && (
                      <span className="flex items-center gap-1 text-on-surface-variant">
                        <MapPin size={14} />
                        Lat {feedback.coordinates.lat}, Long{" "}
                        {feedback.coordinates.long}
                      </span>
                    )}
                  </span>
                ) : (
                  "-"
                )
              }
            />

            {(feedback.affectedDevices?.length ?? 0) > 0 && (
              <Row
                label="Perangkat Terdampak"
                value={
                  <span className="flex flex-wrap gap-1.5">
                    {feedback.affectedDevices!.map((d: string) => (
                      <Badge key={d} variant="secondary">
                        {d}
                      </Badge>
                    ))}
                  </span>
                }
              />
            )}

            <div className="flex justify-end">
              <Dialog.Close
                render={(p) => (
                  <Button {...p} variant="secondary">
                    Tutup
                  </Button>
                )}
              />
            </div>
          </div>
        )}
      </Dialog>
    </Dialog.Root>
  );
}
