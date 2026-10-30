"use client";

import { createContext, useContext, useMemo } from "react";
import { useLocale } from "@/lib/i18n/client";
import { makeFormatters, type Formatters } from "@/lib/calculator/format";
import type { Results } from "@/lib/calculator/engine";
import type { Inputs } from "@/lib/calculator/types";

export interface CalcCtx {
  inputs: Inputs;
  update: (patch: Partial<Inputs>) => void;
  results: Results;
}

const Ctx = createContext<CalcCtx | null>(null);

export const CalcProvider = Ctx.Provider;

export function useCalc(): CalcCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCalc outside CalcProvider");
  return c;
}

export function useFmt(): Formatters {
  const locale = useLocale();
  return useMemo(() => makeFormatters(locale), [locale]);
}
