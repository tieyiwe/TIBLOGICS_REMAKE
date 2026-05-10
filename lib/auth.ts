import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

// tieyiwebass@gmail.com is the Owner — the super account above all admins
const OWNER_EMAIL = "tieyiwebass@gmail.com";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

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
            if (credentials.password === process.env.ADMIN_PASSWORD) {
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
              if (valid) return ownerUser;
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
        session.user.permissions = token.permissions ?? [];
      }
      return session;
    },
  },
};
