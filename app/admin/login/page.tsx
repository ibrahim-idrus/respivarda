import type { Metadata } from "next";
import AdminLogin from "@/src/components/admin/AdminLogin";

export const metadata: Metadata = {
  title: "Admin Login — SmokeWatch",
  description: "Secure access to the SmokeWatch operations workspace.",
};

export default function AdminLoginPage() {
  return <AdminLogin />;
}
