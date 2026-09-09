"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { SessionWrapper } from "@/components/admin/SessionWrapper";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";

// Routes inside the (admin) group that must render WITHOUT the auth guard
const PUBLIC_ADMIN_ROUTES = ["/admin_pro/login", "/admin_pro/accept-invite"];

function AdminGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const isPublic = PUBLIC_ADMIN_ROUTES.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  useEffect(() => {
    if (!isPublic && status === "unauthenticated") {
      router.replace("/admin_pro/login");
    }
  }, [status, router, isPublic]);

  // Let login / accept-invite render without the guard shell
  if (isPublic) return <>{children}</>;

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F4F7FB]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#2251A3] border-t-transparent rounded-full animate-spin" />
          <p className="font-dm text-sm text-[#7A8FA6]">Loading…</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="flex h-screen bg-[#F4F7FB] overflow-hidden">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden ml-0 lg:ml-64">
        <AdminHeader />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionWrapper>
      <AdminGuard>{children}</AdminGuard>
    </SessionWrapper>
  );
}
