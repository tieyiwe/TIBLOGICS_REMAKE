import { Lock } from "lucide-react";
import { Button, EmptyState } from "@/components/admin/ui";
import { CAPABILITIES, featureOf } from "@/lib/admin/permissions";
import { requireAdminPage } from "../_lib/admin-page-auth";

export const dynamic = "force-dynamic";

// Shown (with a 403 status, by proxy.ts) when a staff member opens a page
// their role does not include, and by page guards that redirect here.
function describe(need: string): string | null {
  if (!need) return null;
  const cap = CAPABILITIES.find((c) => c.key === need);
  if (cap) return cap.label;
  const [key, level] = need.split(":");
  const f = featureOf(key);
  if (f) return level === "manage" ? `${f.label} (manage)` : f.label;
  if (need === "__admin__") return "Admin";
  return null;
}

export default async function NoAccessPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await requireAdminPage();
  const sp = await searchParams;
  const need = typeof sp.need === "string" ? sp.need.slice(0, 60) : "";
  const label = describe(need);
  return (
    <div className="mx-auto max-w-xl pt-6 sm:pt-12">
      <EmptyState
        icon={Lock}
        title="You do not have access to this page"
        body={
          <>
            {label ? (
              <>
                It needs the <strong>{label}</strong> permission.{" "}
              </>
            ) : null}
            {session.user.isOwner
              ? "As the owner you can open everything; this page may have moved."
              : "Ask the owner (or a team manager) to give you access in Team & Roles."}
          </>
        }
        action={
          <Button href="/admin_pro" variant="primary">
            Go to the dashboard
          </Button>
        }
      />
    </div>
  );
}
