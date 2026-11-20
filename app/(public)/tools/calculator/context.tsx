"use client";

import { createContext, useContext, useMemo } from "react";
import { useLocale } from "@/lib/i18n/client";
import { makeFormatters, type Formatters } from "@/lib/calculator/format";
import type { FreeResults } from "@/lib/calculator/core";
import type { FullResults } from "@/lib/calculator/engine";
import type { Inputs } from "@/lib/calculator/types";

// The paid numbers' type only: the engine itself stays on the server.

export interface PlanState {
  /** The Full Plan is active in this browser (a paid plan, or staff). */
  full: boolean;
  via: "plan" | "staff" | null;
  expiresAt: string | null;
  /** The plan's price, formatted; null when it is not on sale. */
  price: string | null;
  days: number;
  /** The status has been read from the server. */
  loaded: boolean;
}

export interface CalcCtx {
  inputs: Inputs;
  update: (patch: Partial<Inputs>) => void;
  /** Computed in the browser as you type. */
  results: FreeResults;
  /** The Full Plan numbers from the server, for the current (or just previous) inputs. */
  full: FullResults | null;
  /** True while the Full Plan numbers are catching up with an edit. */
  fullStale: boolean;
  plan: PlanState;
  /** Opens Stripe checkout for the Full Plan. */
  buyPlan: (email?: string) => Promise<string | null>;
  /** Forgets the plan on this browser. */
  forgetPlan: () => Promise<void>;
}

const Ctx = createContext<CalcCtx | null>(null);

export const CalcProvider = Ctx.Provider;

export function useCalc(): CalcCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCalc outside CalcProvider");
  return c;
}

/** The Full Plan numbers. Only for components rendered inside <PaidSection>. */
export function useFull(): FullResults {
  const c = useCalc();
  if (!c.full) throw new Error("useFull outside a paid section");
  return c.full;
}

export function useFmt(): Formatters {
  const locale = useLocale();
  return useMemo(() => makeFormatters(locale), [locale]);
}
