import { SessionWrapper } from "@/components/admin/SessionWrapper";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionWrapper>
      <div className="flex h-screen bg-[#F4F7FB] overflow-hidden">
        <AdminSidebar />
        <div className="flex-1 flex flex-col overflow-hidden ml-0 lg:ml-64">
          <AdminHeader />
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </SessionWrapper>
  );
}
