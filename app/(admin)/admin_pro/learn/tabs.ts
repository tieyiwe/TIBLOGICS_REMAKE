import type { TabItem } from "@/components/admin/ui";

/** Section tabs shared by the Learning Box admin pages. */
export const LEARN_TABS: TabItem[] = [
  { label: "Overview", href: "/admin_pro/learn" },
  { label: "Learners", href: "/admin_pro/learn/learners" },
  { label: "Teams", href: "/admin_pro/learn/teams" },
  { label: "Cohorts", href: "/admin_pro/learn/cohorts" },
  { label: "Community", href: "/admin_pro/learn/community" },
  { label: "Live", href: "/admin_pro/learn/live" },
  { label: "Videos", href: "/admin_pro/learn/videos" },
  { label: "Certificates", href: "/admin_pro/learn/certificates" },
  { label: "Tutor", href: "/admin_pro/learn/tutor" },
];
