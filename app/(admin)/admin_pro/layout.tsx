"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { SessionWrapper } from "@/components/admin/SessionWrapper";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import { AdminShellProvider } from "@/components/admin/shell/AdminShellContext";
import { ToastProvider } from "@/components/admin/ui";
import "../admin.css";

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
  if (isPublic) return <div className="admin-root min-h-screen">{children}</div>;

  if (status === "loading") {
    return (
      <div className="admin-root flex h-screen items-center justify-center" role="status" aria-live="polite">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--a-blue)] border-t-transparent" aria-hidden />
          <p className="font-dm text-sm text-[var(--a-ink-3)]">Loading admin</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <AdminShellProvider>
      <ToastProvider>
        <div className="admin-root flex h-[100dvh] overflow-hidden">
          <a
            href="#admin-main"
            className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[90] focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:font-dm focus:text-sm focus:shadow-lg"
          >
            Skip to content
          </a>
          <AdminSidebar />
          <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
            <AdminHeader />
            <main id="admin-main" tabIndex={-1} className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-4 focus:outline-none sm:p-6">
              {children}
            </main>
          </div>
        </div>
      </ToastProvider>
    </AdminShellProvider>
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
