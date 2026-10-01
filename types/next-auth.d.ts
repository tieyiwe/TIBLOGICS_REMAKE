import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      isAdmin: boolean;
      isOwner: boolean;
      collaboratorId?: string;
      studentId?: string;
      permissions: string[];
      /** Learner session version (lib/learn/account-status: "sign out everywhere"). */
      sv?: number;
    };
  }
  interface User {
    id: string;
    email: string;
    name: string;
    isAdmin: boolean;
    isOwner: boolean;
    collaboratorId?: string;
    studentId?: string;
    permissions: string[];
    sv?: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    isAdmin: boolean;
    isOwner: boolean;
    collaboratorId?: string;
    studentId?: string;
    permissions: string[];
    sv?: number;
  }
}
