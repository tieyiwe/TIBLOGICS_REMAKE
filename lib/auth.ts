import { NextAuthOptions } from "next-auth";
import { checkRateLimit, clearRateLimit } from "@/lib/rate-limit";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { timingSafeEqual } from "crypto";

// tieyiwebass@gmail.com is the Owner — the super account above all admins
export const OWNER_EMAIL = "tieyiwebass@gmail.com";

// These two helpers are duplicated from lib/require-admin.ts rather than
// imported: that module imports `authOptions` from here, and a cycle through
// the auth config is not worth saving a few lines.

/** Constant-time compare of a guess against a configured secret. */
function secretEquals(presented: unknown, secret: string | undefined): boolean {
  if (!secret || typeof presented !== "string") return false;
  const a = Buffer.from(presented);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Per-identity throttle on sign-in attempts.
 *
 * The credentials endpoint had no limit at all, so both providers accepted
 * unlimited online guesses — against the owner's master password, a
 * collaborator's hash, or any student account. Keyed by the attempted email
 * (not the IP) so a distributed attempt on one account is still bounded; the
 * cost of a wrong guess is a bcrypt compare, which is exactly what we are
 * rationing.
 *
 * The counter is shared (lib/rate-limit). It used to be a per-instance Map,
 * which meant a redeploy handed an attacker a fresh ten guesses — and on a
 * platform that recycles idle containers, that is not a rare event.
 */
const MAX_LOGIN_ATTEMPTS = 10;
const LOGIN_WINDOW_MS = 900_000; // 15 minutes

function loginAllowed(key: string): Promise<boolean> {
  return checkRateLimit(`login:${key}`, MAX_LOGIN_ATTEMPTS, LOGIN_WINDOW_MS);
}

/** Clear the counter on success so normal use never trips the limit. */
function loginSucceeded(key: string): void {
  // Not awaited: the login should not wait on a bookkeeping delete, and a
  // failure only means the caller keeps a few counted attempts.
  void clearRateLimit(`login:${key}`);
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const throttleKey = `staff:${credentials.email.toLowerCase().trim()}`;
        // Thrown, not `return null`, so the login page can say "wait 15
        // minutes" instead of a misleading "wrong password".
        if (!(await loginAllowed(throttleKey))) throw new Error("TooManyAttempts");

        // Lazy import so a Prisma binary failure doesn't crash the auth module at load time
        let prisma: Awaited<typeof import("@/lib/prisma")>["prisma"];
        try {
          ({ prisma } = await import("@/lib/prisma"));
        } catch {
          return null;
        }

        // ── Owner login ───────────────────────────────────────────────────────
        if (credentials.email.toLowerCase() === OWNER_EMAIL.toLowerCase()) {
          const ownerUser = {
            id: "owner",
            email: OWNER_EMAIL,
            name: process.env.ADMIN_NAME ?? "Tieyiwe",
            isAdmin: true,
            isOwner: true,
            permissions: ["*"],
          };

          // Priority 1: ADMIN_PASSWORD env var acts as a master credential that
          // works in every environment (dev, staging, prod) without needing the
          // DB to be seeded first.
          if (process.env.ADMIN_PASSWORD) {
            // Constant-time — a `===` here compares a master credential against
            // unlimited attacker-chosen guesses and exits at the first mismatch.
            if (secretEquals(credentials.password, process.env.ADMIN_PASSWORD)) {
              // Auto-seed bcrypt hash into this environment's DB if missing
              try {
                const existing = await prisma.adminSettings.findUnique({
                  where: { key: "admin_password_hash" },
                });
                if (!existing) {
                  const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
                  await prisma.adminSettings.create({
                    data: { key: "admin_password_hash", value: hash },
                  }).catch(() => {});
                }
              } catch { /* non-blocking */ }
              loginSucceeded(throttleKey);
              return ownerUser;
            }
          }

          // Priority 2: DB-stored bcrypt hash (set via admin "Change Password" UI)
          try {
            const stored = await prisma.adminSettings.findUnique({
              where: { key: "admin_password_hash" },
            });
            if (stored?.value) {
              const valid = await bcrypt.compare(credentials.password, stored.value);
              if (valid) {
                loginSucceeded(throttleKey);
                return ownerUser;
              }
            }
          } catch { /* fall through */ }

          return null;
        }

        // ── Collaborator login ────────────────────────────────────────────────
        try {
          const collab = await prisma.collaborator.findUnique({
            where: { email: credentials.email.toLowerCase() },
          });
          if (!collab || !collab.active || !collab.passwordHash) return null;

          const valid = await bcrypt.compare(credentials.password, collab.passwordHash);
          if (!valid) return null;

          await prisma.collaborator.update({
            where: { id: collab.id },
            data: { lastLoginAt: new Date() },
          });

          loginSucceeded(throttleKey);
          return {
            id: collab.id,
            email: collab.email,
            name: collab.name,
            isAdmin: collab.isAdmin,
            isOwner: false,
            collaboratorId: collab.id,
            permissions: collab.isAdmin ? ["*"] : collab.permissions,
          };
        } catch {
          return null;
        }
      },
    }),
    // ── TIBLOGICS Learn students ──────────────────────────────────────────
    // Separate provider id so the student flow stays distinct from admin
    // login while sharing one JWT session system.
    CredentialsProvider({
      id: "student",
      name: "student",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const throttleKey = `student:${credentials.email.toLowerCase().trim()}`;
        if (!(await loginAllowed(throttleKey))) return null;

        let prisma: Awaited<typeof import("@/lib/prisma")>["prisma"];
        try {
          ({ prisma } = await import("@/lib/prisma"));
        } catch {
          return null;
        }

        try {
          const student = await prisma.student.findUnique({
            where: { email: credentials.email.toLowerCase().trim() },
          });
          if (!student) return null;

          const valid = await bcrypt.compare(credentials.password, student.passwordHash);
          if (!valid) return null;

          await prisma.student
            .update({ where: { id: student.id }, data: { lastLoginAt: new Date() } })
            .catch(() => {});

          loginSucceeded(throttleKey);
          return {
            id: student.id,
            email: student.email,
            name: student.name,
            isAdmin: false,
            isOwner: false,
            studentId: student.id,
            permissions: [],
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/admin_pro/login" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.isAdmin = user.isAdmin;
        token.isOwner = user.isOwner;
        token.collaboratorId = user.collaboratorId;
        token.studentId = user.studentId;
        token.permissions = user.permissions;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.isAdmin = token.isAdmin;
        session.user.isOwner = token.isOwner;
        session.user.collaboratorId = token.collaboratorId;
        session.user.studentId = token.studentId;
        session.user.permissions = token.permissions ?? [];
      }
      return session;
    },
  },
};
