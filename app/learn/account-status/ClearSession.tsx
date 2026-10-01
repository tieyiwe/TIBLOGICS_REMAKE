"use client";

import { useEffect } from "react";
import { signOut } from "next-auth/react";

/** Ends the refused session (clears the cookie) without leaving the page. */
export default function ClearSession() {
  useEffect(() => {
    signOut({ redirect: false }).catch(() => {});
  }, []);
  return null;
}
