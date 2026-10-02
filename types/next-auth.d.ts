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
    /** Staff only: epoch ms after which the session is refused (lib/auth.ts). */
    staffUntil?: number;
    /** Set on a token whose roles were removed (staff lifetime over, collaborator deactivated). */
    expired?: boolean;
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
    /** Staff only: epoch ms after which the session is refused (lib/auth.ts). */
    staffUntil?: number;
    /** Set on a token whose roles were removed (staff lifetime over, collaborator deactivated). */
    expired?: boolean;
  }
}
