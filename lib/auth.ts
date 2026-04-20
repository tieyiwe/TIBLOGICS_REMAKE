import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const ADMIN_EMAIL = "Tieyiwebass@gmail.com";

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

        // Only this email is allowed
        if (credentials.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) return null;

        // Check DB for hashed password first, fall back to env var
        const stored = await prisma.adminSettings.findUnique({
          where: { key: "admin_password_hash" },
        });

        let passwordValid = false;
        if (stored?.value) {
          passwordValid = await bcrypt.compare(credentials.password, stored.value);
        } else if (process.env.ADMIN_PASSWORD) {
          // First-time: plain-text comparison against env var
          passwordValid = credentials.password === process.env.ADMIN_PASSWORD;
        }

        if (!passwordValid) return null;

        return {
          id: "admin",
          email: ADMIN_EMAIL,
          name: process.env.ADMIN_NAME ?? "Tieyiwe",
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/admin/login" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user) (session.user as any).id = token.id;
      return session;
    },
  },
};
