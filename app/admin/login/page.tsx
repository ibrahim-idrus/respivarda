import type { Metadata } from "next";
import AdminLogin from "@/src/components/admin/AdminLogin";

export const metadata: Metadata = {
  title: "Admin Login — Respivarda",
  description: "Secure access to the Respivarda operations workspace.",
};

export default function AdminLoginPage() {
  return <AdminLogin />;
}
