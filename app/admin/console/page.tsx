import UserRegistry from "@/src/components/admin/UserRegistry";

export const metadata = {
  title: "Konsol Pengguna — Respivarda Admin",
  description: "Pemantauan pengguna Telegram dan sistem peringatan dini kualitas udara.",
};

export default function AdminConsolePage() {
  return (
    <div className="flex flex-col gap-6">
      <UserRegistry />
    </div>
  );
}
