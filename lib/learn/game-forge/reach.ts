// Game Forge: can this platformer level be beaten? A simple, slightly
// cautious reachability check over the tile grid, using the same physics as
// the engine (./schema.ts physics). It walks from the start to every ground
// spot the player can run or jump to, and passes when the goal is one jump
// away from one of them. Enemies are treated as avoidable; lava and pits are
// not. The real proof is beating the level in the preview: this check is the
// hint ("level 2 looks impossible: the goal is too high").
import { LEVEL_H, physics, type PlatformerConfig } from "./schema";

export type ReachResult = { ok: true } | { ok: false; reason: "start" | "goal" | "fall" | "unreachable" };

export function checkLevel(rows: string[], cfg: Pick<PlatformerConfig, "speed" | "jump" | "gravity">): ReachResult {
  const H = rows.length || LEVEL_H;
  const W = rows[0]?.length ?? 0;
  const at = (x: number, y: number) => (x < 0 || x >= W ? "#" : y < 0 ? "." : y >= H ? "." : rows[y][x]);
  const solid = (x: number, y: number) => at(x, y) === "#";
  const lava = (x: number, y: number) => at(x, y) === "L";
  const clear = (x: number, y: number) => y < H && !solid(x, y) && !lava(x, y);
  const stand = (x: number, y: number) => x >= 0 && x < W && y >= 0 && y < H - 1 && clear(x, y) && solid(x, y + 1);

  let sx = -1, sy = -1, gx = -1, gy = -1;
  for (let y = 0; y < H; y++) {
    const p = rows[y].indexOf("P");
    if (p >= 0) [sx, sy] = [p, y];
    const g = rows[y].indexOf("G");
    if (g >= 0) [gx, gy] = [g, y];
  }
  if (sx < 0) return { ok: false, reason: "start" };
  if (gx < 0) return { ok: false, reason: "goal" };
  // The player drops from the start onto the ground below.
  while (sy < H - 1 && !solid(sx, sy + 1)) {
    sy++;
    if (lava(sx, sy)) return { ok: false, reason: "fall" };
  }
  if (!stand(sx, sy)) return { ok: false, reason: "fall" };

  const ph = physics(cfg);
  // A margin, so a jump that only just works in theory is not promised.
  const up = Math.floor(ph.height - 0.15);
  const reach = (dy: number) => {
    // Air time until the player comes down to `dy` tiles above the take-off.
    const disc = ph.jumpV * ph.jumpV - 2 * ph.g * dy;
    if (disc < 0) return -1;
    const t = (ph.jumpV + Math.sqrt(disc)) / ph.g;
    return Math.floor(0.85 * ph.run * t);
  };

  // Up the take-off column to `top`, across, then down to the target.
  const pathClear = (x: number, y: number, x2: number, y2: number, top: number) => {
    for (let yy = y; yy >= top; yy--) if (!clear(x, yy)) return false;
    const step = x2 >= x ? 1 : -1;
    for (let xx = x; xx !== x2 + step; xx += step) if (!clear(xx, top)) return false;
    for (let yy = top; yy <= y2; yy++) if (!clear(x2, yy)) return false;
    return true;
  };
  const canMove = (x: number, y: number, x2: number, y2: number) => {
    const dy = y - y2; // > 0: the target is higher
    if (dy > up) return false;
    const dx = Math.abs(x2 - x);
    if (dx > Math.max(1, reach(dy))) return false;
    for (let lift = Math.max(dy, 0); lift <= up; lift++) {
      const top = y - lift;
      if (top < 0) break;
      if (pathClear(x, y, x2, y2, Math.min(top, y2))) return true;
    }
    return false;
  };

  const seen = new Set<number>([sy * W + sx]);
  const queue: Array<[number, number]> = [[sx, sy]];
  const maxDx = Math.max(1, reach(-H));
  while (queue.length) {
    const [x, y] = queue.shift()!;
    if (canMove(x, y, gx, gy) || (x === gx && y === gy)) return { ok: true };
    for (let y2 = Math.max(0, y - up); y2 < H - 1; y2++) {
      for (let x2 = Math.max(0, x - maxDx); x2 <= Math.min(W - 1, x + maxDx); x2++) {
        const k = y2 * W + x2;
        if (seen.has(k) || !stand(x2, y2)) continue;
        if (!canMove(x, y, x2, y2)) continue;
        seen.add(k);
        queue.push([x2, y2]);
      }
    }
  }
  return { ok: false, reason: "unreachable" };
}

/** One result per level. */
export function checkLevels(c: PlatformerConfig): ReachResult[] {
  return c.levels.map((l) => checkLevel(l.rows, c));
}
