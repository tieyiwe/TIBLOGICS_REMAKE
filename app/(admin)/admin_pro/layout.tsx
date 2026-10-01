import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import AdminShell from "./AdminShell";
import "../admin.css";

// Reads the session on the server (a JWT decode, no database) and hands it to
// the client shell, which used to show "Loading admin" until the browser had
// fetched it. Access control is unchanged: proxy.ts and each page's
// requireAdminPage() still decide who gets in.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions).catch(() => null);
  return <AdminShell session={session}>{children}</AdminShell>;
}
