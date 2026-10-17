// Game Forge: changes as small operations on the config ("set jump to 8",
// "add a level", "remove item 2"). The AI and the quick changes both produce
// them; they are applied to a copy and the result must pass parseConfig
// before anything is shown. Client-safe.
import { z } from "zod";
import { parseConfig, type ConfigIssue, type GameConfig } from "./schema";

// "levels/1/rows/3", "jump", "npcs/0/lines". Only plain keys and indexes:
// nothing that can reach an object's prototype.
const Path = z
  .string()
  .min(1)
  .max(80)
  .regex(/^[a-zA-Z]+(\/(\d{1,2}|[a-zA-Z]+))*$/)
  .refine((p) => !/(^|\/)(__proto__|prototype|constructor|template)(\/|$)/.test(p), "path");

export const OpSchema = z.discriminatedUnion("op", [
  z.object({ op: z.literal("set"), path: Path, value: z.unknown() }).strict(),
  /** Appends to the array at `path`, or inserts at `index`. */
  z.object({ op: z.literal("add"), path: Path, value: z.unknown(), index: z.number().int().min(0).max(50).optional() }).strict(),
  z.object({ op: z.literal("remove"), path: Path }).strict(),
]);
export type Op = z.infer<typeof OpSchema>;
export const OpsSchema = z.array(OpSchema).max(40);

type Json = unknown;
const isObj = (v: Json): v is Record<string, Json> => !!v && typeof v === "object" && !Array.isArray(v);

/** Applies the ops to a deep copy. Throws on a path that does not exist. */
function applyRaw(config: GameConfig, ops: Op[]): Json {
  const root = structuredClone(config) as Json;
  for (const op of ops) {
    const keys = op.path.split("/");
    const last = keys.pop()!;
    let parent: Json = root;
    for (const k of keys) {
      parent = Array.isArray(parent) ? parent[Number(k)] : isObj(parent) && Object.prototype.hasOwnProperty.call(parent, k) ? parent[k] : undefined;
      if (parent === undefined || parent === null || typeof parent !== "object") throw new Error("path");
    }
    const value = "value" in op ? structuredClone(op.value) : undefined;
    if (op.op === "set") {
      if (Array.isArray(parent)) {
        const i = Number(last);
        if (!/^\d+$/.test(last) || i > parent.length) throw new Error("path");
        parent[i] = value;
      } else if (isObj(parent)) {
        parent[last] = value;
      } else throw new Error("path");
    } else if (op.op === "add") {
      const arr = Array.isArray(parent) ? parent[Number(last)] : isObj(parent) ? parent[last] : undefined;
      if (!Array.isArray(arr)) throw new Error("path");
      if (op.index !== undefined && op.index <= arr.length) arr.splice(op.index, 0, value);
      else arr.push(value);
    } else {
      if (Array.isArray(parent) && /^\d+$/.test(last) && Number(last) < parent.length) parent.splice(Number(last), 1);
      else if (isObj(parent) && Object.prototype.hasOwnProperty.call(parent, last)) delete parent[last];
      else throw new Error("path");
    }
  }
  return root;
}

export type PatchResult = { ok: true; config: GameConfig } | { ok: false; issues: ConfigIssue[] };

/** The changed config when every op applies and the result is valid. */
export function applyOps(config: GameConfig, rawOps: unknown): PatchResult {
  const ops = OpsSchema.safeParse(rawOps);
  if (!ops.success) return { ok: false, issues: [{ path: "", code: "ops" }] };
  let next: Json;
  try {
    next = applyRaw(config, ops.data);
  } catch {
    return { ok: false, issues: [{ path: "", code: "path" }] };
  }
  return parseConfig(next);
}

/**
 * How many values differ between two configs (each changed number, string or
 * colour counts once; an added or removed list entry counts once).
 */
export function countChanges(a: Json, b: Json): number {
  if (Array.isArray(a) && Array.isArray(b)) {
    let n = Math.abs(a.length - b.length);
    for (let i = 0; i < Math.min(a.length, b.length); i++) n += countChanges(a[i], b[i]);
    return n;
  }
  if (isObj(a) && isObj(b)) {
    let n = 0;
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
      if (!(k in a) || !(k in b)) n++;
      else n += countChanges(a[k], b[k]);
    }
    return n;
  }
  return Object.is(a, b) ? 0 : 1;
}
