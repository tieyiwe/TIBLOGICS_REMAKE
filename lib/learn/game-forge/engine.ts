// Game Forge: the game engine. One self-contained HTML document per game:
// the config and labels as JSON data blocks, a small stylesheet and one inline
// script that draws the four templates (canvas for the platformer and the
// adventure map, plain buttons for the clicker and the quiz). No network, no
// storage, no eval: the document runs in a sandboxed iframe in the Studio
// (sandbox="allow-scripts", no allow-same-origin) and under a CSP "sandbox"
// header on /play/[token]. Every piece of game text is set with textContent
// or drawn on the canvas, never parsed as HTML.
//
// The engine reports what happens to the page around it with postMessage
// ({type:"gf", ev, data}): "clicks", "buy", "win", "quiz", "level", "item",
// "quest". The Studio uses them for the missions; /play ignores them.
import { physics, type GameConfig } from "./schema";

/** Engine texts (studio.game-forge.engine.<key>), with {placeholders}. */
export const ENGINE_LABEL_KEYS = [
  "start", "again", "next", "close", "keepPlaying", "youWin", "gameOver", "lives", "level", "levelDone", "coins", "shop", "upgrade", "owned", "perSec",
  "goal", "clickTo", "cost", "question", "finalScore", "quizAbout", "quizDone", "timesUp", "right", "wrong", "platHelp", "advHelp", "questFind", "questGoal",
  "questRemind", "questDone", "found", "items", "talk", "left", "rightKey", "jump", "up", "down", "ouch",
] as const;
export type EngineLabels = Record<(typeof ENGINE_LABEL_KEYS)[number], string>;

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
/** JSON that cannot end its <script> block or open a comment. */
const safeJson = (v: unknown) =>
  JSON.stringify(v)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");

/** The CSP for a game document (meta tag in the Studio; header on /play). */
export function gameCsp(nonce: string): string {
  return [
    "default-src 'none'",
    `script-src 'nonce-${nonce}'`,
    `style-src 'nonce-${nonce}'`,
    "img-src data:",
    "base-uri 'none'",
    "form-action 'none'",
  ].join("; ");
}

export function gameDocument(
  config: GameConfig,
  opts: { labels: EngineLabels; nonce: string; lang: string; mode: "preview" | "play"; run?: string },
): string {
  const n = opts.nonce.replace(/[^A-Za-z0-9+/=_-]/g, "");
  const extra = { mode: opts.mode, phys: config.template === "platformer" ? physics(config) : null, lang: opts.lang, run: opts.run ?? "" };
  return (
    `<!doctype html><html lang="${esc(opts.lang)}"><head><meta charset="utf-8">` +
    `<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">` +
    `<meta http-equiv="Content-Security-Policy" content="${esc(gameCsp(n))}">` +
    `<meta name="robots" content="noindex,nofollow"><meta name="referrer" content="no-referrer">` +
    `<title>${esc(config.title)}</title><style nonce="${n}">${CSS}</style></head>` +
    `<body><div id="app"></div><div id="live" class="sr" aria-live="polite"></div>` +
    `<script type="application/json" id="gf-config">${safeJson(config)}</script>` +
    `<script type="application/json" id="gf-labels">${safeJson(opts.labels)}</script>` +
    `<script type="application/json" id="gf-extra">${safeJson(extra)}</script>` +
    `<script nonce="${n}">${ENGINE}</script></body></html>`
  );
}

const CSS = `
*{box-sizing:border-box}
html,body{margin:0;height:100%;background:var(--bg);color:var(--text);font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;-webkit-tap-highlight-color:transparent;overscroll-behavior:none}
#app{position:relative;display:flex;flex-direction:column;height:100%;overflow:hidden;user-select:none;-webkit-user-select:none}
.hud{display:flex;align-items:center;gap:8px;justify-content:space-between;padding:8px 12px;background:var(--panel);color:#fff;font-weight:800;font-size:14px;min-height:40px}
.hud .t{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}
.hud .s{display:flex;gap:10px;white-space:nowrap;flex-shrink:0}
.stage{position:relative;flex:1;min-height:0}
canvas.world{position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none;outline:none}
.pad{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:8px 10px calc(8px + env(safe-area-inset-bottom));background:rgba(0,0,0,.08)}
.pad .grp{display:flex;gap:8px}
.pad button{min-width:58px;min-height:54px;border-radius:16px;border:0;background:var(--panel);color:#fff;font-size:22px;font-weight:900;touch-action:none;cursor:pointer}
.pad button.on{filter:brightness(1.25);transform:scale(.95)}
.btn{min-height:48px;padding:10px 22px;border-radius:14px;border:0;background:var(--accent);color:#fff;font-size:17px;font-weight:900;cursor:pointer}
button:focus-visible{outline:3px solid var(--text);outline-offset:2px}
.ov{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.5);padding:16px;z-index:5}
.ov-card{background:var(--bg);color:var(--text);border-radius:20px;padding:20px;max-width:380px;width:100%;text-align:center;box-shadow:0 10px 40px rgba(0,0,0,.35);border:3px solid var(--panel)}
.ov-card h2{margin:4px 0 6px;font-size:22px;line-height:1.2}
.ov-card p{margin:0 0 14px;font-size:15px;line-height:1.45}
.ov-big{font-size:56px;line-height:1.1}
#fx{position:absolute;inset:0;pointer-events:none;z-index:6;width:100%;height:100%}
.ck{display:flex;flex-direction:column;height:100%;overflow:auto;padding:14px;gap:12px}
.ck-top{display:flex;flex-direction:column;align-items:center;gap:6px;position:relative}
.ck-count{font-size:28px;font-weight:900;text-align:center}
.ck-rate{font-size:13px;opacity:.85;text-align:center}
.ck-big{font-size:88px;width:168px;height:168px;border-radius:50%;border:0;background:var(--panel);box-shadow:0 8px 0 rgba(0,0,0,.22);cursor:pointer;line-height:1;transition:transform .08s;touch-action:manipulation}
.ck-big.pop{transform:scale(.92)}
.bar{height:10px;border-radius:99px;background:rgba(127,127,127,.25);overflow:hidden;width:100%;max-width:340px}
.bar i{display:block;height:100%;background:var(--accent);width:0;transition:width .15s}
.ck h3{margin:4px 0 0;font-size:15px}
.shop{display:grid;gap:8px;grid-template-columns:repeat(auto-fill,minmax(150px,1fr))}
.shop button{display:flex;align-items:center;gap:8px;text-align:left;min-height:58px;padding:8px 10px;border-radius:14px;border:2px solid var(--panel);background:transparent;color:var(--text);font-size:13px;cursor:pointer;touch-action:manipulation}
.shop button[disabled]{opacity:.45;cursor:not-allowed}
.shop .e{font-size:26px;flex-shrink:0}
.shop b{display:block;font-size:14px}
.float{position:absolute;font-weight:900;font-size:22px;pointer-events:none;color:var(--accent);animation:gfup .8s ease-out forwards;z-index:3}
@keyframes gfup{to{transform:translateY(-60px);opacity:0}}
.qz{display:flex;flex-direction:column;height:100%;overflow:auto;padding:16px;gap:12px;max-width:560px;margin:0 auto;width:100%}
.qz-p{display:flex;justify-content:space-between;font-size:13px;font-weight:800;opacity:.85}
.qz-q{font-size:20px;font-weight:800;line-height:1.3;margin:0}
.qz-a{display:grid;gap:8px}
.qz-a button{min-height:56px;padding:10px 14px;border-radius:14px;border:2px solid var(--panel);background:transparent;color:var(--text);font-size:17px;font-weight:700;text-align:left;cursor:pointer;touch-action:manipulation}
.qz-a button.ok{background:#2f9e44;border-color:#2f9e44;color:#fff}
.qz-a button.no{background:#e03131;border-color:#e03131;color:#fff}
.qz-f{font-weight:900;min-height:1.4em}
.dlg{position:absolute;left:8px;right:8px;bottom:8px;background:var(--bg);color:var(--text);border:3px solid var(--panel);border-radius:16px;padding:12px;z-index:4;box-shadow:0 6px 24px rgba(0,0,0,.3)}
.dlg .who{font-weight:900;margin-bottom:4px}
.dlg .say{font-size:16px;line-height:1.4;min-height:2.6em}
.dlg .row{display:flex;justify-content:flex-end;margin-top:8px}
.toast{position:absolute;left:50%;top:12px;transform:translateX(-50%);background:var(--accent);color:#fff;font-weight:800;padding:6px 14px;border-radius:99px;z-index:4;font-size:14px;white-space:nowrap;pointer-events:none}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
`;

// The engine. Plain ES2017, no template literals (it lives in one).
const ENGINE = String.raw`
(function () {
"use strict";
function data(id) { try { return JSON.parse(document.getElementById(id).textContent); } catch (e) { return null; } }
var C = data("gf-config"), L = data("gf-labels") || {}, X = data("gf-extra") || {};
var app = document.getElementById("app"), live = document.getElementById("live");
if (!C || !app) return;
var rs = document.documentElement.style;
rs.setProperty("--bg", C.theme.bg); rs.setProperty("--panel", C.theme.panel); rs.setProperty("--text", C.theme.text); rs.setProperty("--accent", C.theme.accent);
var EF = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",system-ui,sans-serif';
var reduce = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
var coarse = !!(window.matchMedia && matchMedia("(pointer: coarse)").matches);

function fmt(s, v) { return String(s == null ? "" : s).replace(/\{(\w+)\}/g, function (m, k) { return v && v[k] != null ? String(v[k]) : m; }); }
function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
function btn(cls, text, id) { var b = el("button", cls, text); b.type = "button"; if (id) b.setAttribute("data-gf", id); return b; }
function send(ev, d) { try { if (window.parent && window.parent !== window) window.parent.postMessage({ type: "gf", run: X.run || "", ev: ev, data: d || {} }, "*"); } catch (e) {} }
function say(t) { if (live) { live.textContent = ""; setTimeout(function () { live.textContent = t; }, 30); } }
function num(n) { try { return Math.floor(n).toLocaleString(X.lang || "en"); } catch (e) { return String(Math.floor(n)); } }
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

// ── Shared pieces ──
function hud(title) {
  var h = el("div", "hud"); var t = el("div", "t", title); var s = el("div", "s");
  h.appendChild(t); h.appendChild(s); app.appendChild(h);
  return { title: t, stats: s };
}
var ovEl = null;
function closeOverlay() { if (ovEl && ovEl.parentNode) ovEl.parentNode.removeChild(ovEl); ovEl = null; }
function overlay(title, sub, label, onGo, big) {
  closeOverlay();
  var o = el("div", "ov"); o.setAttribute("role", "dialog"); o.setAttribute("aria-modal", "true"); o.setAttribute("aria-label", title);
  var c = el("div", "ov-card");
  if (big) c.appendChild(el("div", "ov-big", big));
  c.appendChild(el("h2", null, title));
  if (sub) c.appendChild(el("p", null, sub));
  var b = btn("btn", label, "ov-go");
  b.addEventListener("click", function () { closeOverlay(); if (onGo) onGo(); });
  c.appendChild(b); o.appendChild(c); app.appendChild(o); ovEl = o;
  say(title + ". " + (sub || ""));
  setTimeout(function () { try { b.focus({ preventScroll: true }); } catch (e) {} }, 40);
}
var toastT = 0;
function toast(stage, text) {
  var old = stage.querySelector(".toast"); if (old) old.parentNode.removeChild(old);
  var t = el("div", "toast", text); stage.appendChild(t); say(text);
  clearTimeout(toastT); toastT = setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 1600);
}
function confetti() {
  if (reduce) return;
  var cv = el("canvas"); cv.id = "fx"; app.appendChild(cv);
  var dpr = window.devicePixelRatio || 1, w = app.clientWidth, h = app.clientHeight;
  cv.width = w * dpr; cv.height = h * dpr; var x = cv.getContext("2d"); x.scale(dpr, dpr);
  var cols = [C.theme.accent, C.theme.panel, "#FFD43B", "#69DB7C", "#74C0FC", "#F783AC"], ps = [];
  for (var i = 0; i < 90; i++) ps.push({ x: w / 2, y: h / 3, vx: (Math.random() - 0.5) * 9, vy: -Math.random() * 9 - 2, c: cols[i % cols.length], s: 4 + Math.random() * 5, r: Math.random() * 6 });
  var t0 = performance.now();
  (function f(now) {
    var k = (now - t0) / 1000; x.clearRect(0, 0, w, h);
    ps.forEach(function (p) { p.vy += 0.25; p.x += p.vx; p.y += p.vy; p.r += 0.1; x.save(); x.translate(p.x, p.y); x.rotate(p.r); x.fillStyle = p.c; x.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.6); x.restore(); });
    if (k < 2.2) requestAnimationFrame(f); else if (cv.parentNode) cv.parentNode.removeChild(cv);
  })(t0);
}
function pad(groups) {
  var p = el("div", "pad"); app.appendChild(p);
  groups.forEach(function (g) {
    var grp = el("div", "grp"); p.appendChild(grp);
    g.forEach(function (b) {
      var e = btn("", b.icon, b.id); e.setAttribute("aria-label", b.label);
      var down = function (ev) { ev.preventDefault(); e.className = "on"; b.down(); };
      var up = function () { e.className = ""; if (b.up) b.up(); };
      e.addEventListener("pointerdown", down); e.addEventListener("pointerup", up); e.addEventListener("pointerleave", up); e.addEventListener("pointercancel", up);
      e.addEventListener("keydown", function (ev) { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); b.down(); setTimeout(up, 120); } });
      grp.appendChild(e);
    });
  });
  return p;
}
function canvasStage() {
  var stage = el("div", "stage"); app.appendChild(stage);
  var cv = el("canvas", "world"); cv.tabIndex = 0; stage.appendChild(cv);
  var ctx = cv.getContext("2d"), view = { w: 0, h: 0 };
  function fit() { var dpr = window.devicePixelRatio || 1; view.w = stage.clientWidth; view.h = stage.clientHeight; cv.width = Math.max(1, view.w * dpr); cv.height = Math.max(1, view.h * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
  fit(); window.addEventListener("resize", fit);
  cv.addEventListener("pointerdown", function () { try { cv.focus({ preventScroll: true }); } catch (e) {} });
  return { stage: stage, cv: cv, ctx: ctx, view: view };
}
function emoji(ctx, e, x, y, size, flip) {
  ctx.save(); ctx.translate(x, y); if (flip) ctx.scale(-1, 1);
  ctx.font = Math.round(size) + "px " + EF; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(e, 0, size * 0.05); ctx.restore();
}
function rrect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
var keys = {};
function isTyping(e) { var t = e.target && e.target.tagName; return t === "INPUT" || t === "TEXTAREA"; }

// ── Clicker ──
function clicker() {
  hud(C.title);
  var stage = el("div", "stage"); app.appendChild(stage);
  var wrap = el("div", "ck"); stage.appendChild(wrap);
  var top = el("div", "ck-top"); wrap.appendChild(top);
  var countEl = el("div", "ck-count"), rateEl = el("div", "ck-rate");
  var big = btn("ck-big", C.clickEmoji, "click"); big.setAttribute("aria-label", fmt(L.clickTo, { name: C.currencyName }));
  var bar = el("div", "bar"), barI = el("i"); bar.appendChild(barI);
  var goalEl = el("div", "ck-rate", fmt(L.goal, { n: num(C.goal), name: C.currencyName }));
  [countEl, rateEl, big, bar, goalEl].forEach(function (e) { top.appendChild(e); });
  wrap.appendChild(el("h3", null, L.shop));
  var shop = el("div", "shop"); wrap.appendChild(shop);
  var n = 0, clicks = 0, perClick = C.perClick, won = false, buys = 0;
  var owned = C.items.map(function () { return 0; }), done = C.upgrades.map(function () { return false; });
  function cost(i) { return Math.ceil(C.items[i].cost * Math.pow(1.15, owned[i])); }
  function rate() { var r = 0; for (var i = 0; i < C.items.length; i++) r += owned[i] * C.items[i].perSecond; return r; }
  var itemBtns = C.items.map(function (it, i) {
    var b = btn("", null, "buy-" + i); b.appendChild(el("span", "e", it.emoji)); var info = el("span"); b.appendChild(info);
    b.addEventListener("click", function () { var c = cost(i); if (n < c) return; n -= c; owned[i]++; buys++; send("buy", { buys: buys }); say(it.name + " ×" + owned[i]); render(); });
    shop.appendChild(b); return { b: b, info: info, it: it };
  });
  var upBtns = C.upgrades.map(function (u, i) {
    var b = btn("", null, "upgrade-" + i); b.appendChild(el("span", "e", u.emoji)); var info = el("span"); b.appendChild(info);
    b.addEventListener("click", function () { if (done[i] || n < u.cost) return; n -= u.cost; done[i] = true; perClick += u.clickBonus; buys++; send("buy", { buys: buys }); say(u.name); render(); });
    shop.appendChild(b); return { b: b, info: info, u: u };
  });
  big.addEventListener("click", function (ev) {
    n += perClick; clicks++; send("clicks", { clicks: clicks });
    big.className = "ck-big pop"; setTimeout(function () { big.className = "ck-big"; }, 80);
    if (!reduce) {
      var f = el("div", "float", "+" + num(perClick)); var r = top.getBoundingClientRect(), b = big.getBoundingClientRect();
      f.style.left = (b.left - r.left + b.width / 2 - 12 + (Math.random() - 0.5) * 60) + "px"; f.style.top = (b.top - r.top + 20) + "px";
      top.appendChild(f); setTimeout(function () { if (f.parentNode) f.parentNode.removeChild(f); }, 800);
    }
    render();
  });
  function info(e, title, line) { e.textContent = ""; e.appendChild(el("b", null, title)); e.appendChild(document.createTextNode(line)); }
  var lastTxt = "";
  function render() {
    var txt = C.currencyEmoji + " " + num(n) + " " + C.currencyName;
    if (txt !== lastTxt) { countEl.textContent = txt; lastTxt = txt; }
    rateEl.textContent = fmt(L.perSec, { n: num(rate()) });
    barI.style.width = Math.min(100, (n / C.goal) * 100) + "%";
    itemBtns.forEach(function (x, i) { var c = cost(i); x.b.disabled = n < c; info(x.info, x.it.name + (owned[i] ? " ×" + owned[i] : ""), fmt(L.cost, { n: num(c) }) + " · +" + x.it.perSecond + "/s"); });
    upBtns.forEach(function (x, i) { x.b.disabled = done[i] || n < x.u.cost; info(x.info, x.u.name + (done[i] ? " ✓" : ""), done[i] ? L.owned : fmt(L.cost, { n: num(x.u.cost) }) + " · +" + x.u.clickBonus + " " + L.upgrade); });
    if (!won && n >= C.goal) { won = true; send("win", {}); confetti(); overlay(L.youWin, C.winText, L.keepPlaying, null, C.clickEmoji); }
  }
  var last = performance.now(), acc = 0;
  (function loop(now) { var dt = Math.min(0.25, (now - last) / 1000); last = now; var r = rate(); if (r > 0) { n += r * dt; acc += dt; if (acc > 0.2) { acc = 0; render(); } } requestAnimationFrame(loop); })(last);
  render();
}

// ── Quiz ──
function quiz() {
  var h = hud(C.title);
  var stage = el("div", "stage"); app.appendChild(stage);
  var wrap = el("div", "qz"); stage.appendChild(wrap);
  var idx = 0, score = 0, lives = C.lives, left = 0, answered = false, running = false, count = 0, timerId = 0;
  function stats() { h.stats.textContent = "❤️ " + lives + "  ⭐ " + score; }
  function begin() { idx = 0; score = 0; lives = C.lives; count = 0; stats(); show(); }
  function show() {
    wrap.textContent = ""; answered = false; running = true; left = C.timer;
    var q = C.questions[idx];
    var p = el("div", "qz-p"); p.appendChild(el("span", null, fmt(L.question, { n: idx + 1, total: C.questions.length }))); var tl = el("span", null, C.timer + "s"); p.appendChild(tl); wrap.appendChild(p);
    var bar = el("div", "bar"), bi = el("i"); bar.appendChild(bi); bar.style.maxWidth = "none"; bi.style.width = "100%"; wrap.appendChild(bar);
    var qe = el("p", "qz-q", q.q); wrap.appendChild(qe);
    var box = el("div", "qz-a"); wrap.appendChild(box);
    var fb = el("div", "qz-f"); fb.setAttribute("aria-live", "polite"); wrap.appendChild(fb);
    var bs = q.answers.map(function (a, i) { var b = btn("", (i + 1) + ". " + a, "answer-" + i); b.addEventListener("click", function () { pick(i); }); box.appendChild(b); return b; });
    say(q.q);
    var t0 = performance.now();
    clearInterval(timerId);
    timerId = setInterval(function () {
      if (!running) return;
      left = C.timer - (performance.now() - t0) / 1000;
      bi.style.width = clamp(left / C.timer, 0, 1) * 100 + "%"; tl.textContent = Math.max(0, Math.ceil(left)) + "s";
      if (left <= 0) pick(-1);
    }, 100);
    function pick(i) {
      if (answered) return; answered = true; running = false; clearInterval(timerId); count++;
      var ok = i === q.correct;
      bs.forEach(function (b, j) { b.disabled = true; if (j === q.correct) b.className = "ok"; else if (j === i) b.className = "no"; });
      if (ok) score++; else lives--;
      fb.textContent = ok ? "✅ " + L.right : (i < 0 ? "⏰ " + L.timesUp : "❌ " + L.wrong) + " " + q.answers[q.correct];
      stats();
      setTimeout(function () { idx++; if (lives <= 0 || idx >= C.questions.length) end(); else show(); }, 1100);
    }
    try { bs[0].focus({ preventScroll: true }); } catch (e) {}
    showKeys = function (k) { var i = Number(k) - 1; if (i >= 0 && i < bs.length) pick(i); };
  }
  var showKeys = null;
  window.addEventListener("keydown", function (e) { if (showKeys && !answered && /^[1-4]$/.test(e.key)) { e.preventDefault(); showKeys(e.key); } });
  function end() {
    var total = C.questions.length; send("quiz", { score: score, total: total, answered: count });
    wrap.textContent = "";
    var all = score === total;
    if (all) confetti();
    overlay(all ? L.youWin : lives <= 0 ? L.gameOver : L.quizDone, fmt(L.finalScore, { score: score, total: total }) + (all && C.winText ? " " + C.winText : ""), L.again, begin, all ? "🏆" : "❓");
  }
  stats();
  overlay(C.title, fmt(L.quizAbout, { topic: C.topic, n: C.questions.length }), L.start, begin, "❓");
}

// ── Platformer ──
function platformer() {
  var P = X.phys || { run: 6, jumpV: 14, g: 33 };
  var h = hud(C.title);
  var S = canvasStage(), ctx = S.ctx;
  var grid, W, H = 10, pl, enemies, coinsGot, coinsTotal, li = 0, lives = C.lives, allCoins = true, paused = true, dying = 0, t = 0;
  var PW = 0.7, PH = 0.9;
  function load(i) {
    li = i; grid = C.levels[i].rows.map(function (r) { return r.split(""); }); W = grid[0].length; H = grid.length;
    enemies = []; coinsGot = 0; coinsTotal = 0;
    for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) {
      var ch = grid[y][x];
      if (ch === "P") { pl = { x: x + 0.15, y: y + 0.1, vx: 0, vy: 0, ground: false, face: 1 }; grid[y][x] = "."; }
      else if (ch === "E") { enemies.push({ x: x + 0.1, y: y + 0.2, vx: -2, vy: 0, alive: true }); grid[y][x] = "."; }
      else if (ch === "C") coinsTotal++;
    }
    dying = 0; stats(); h.title.textContent = C.title + " · " + C.levels[i].name;
  }
  function stats() { h.stats.textContent = C.coinEmoji + " " + coinsGot + "/" + coinsTotal + "  ❤️ " + lives; }
  function tile(x, y) { if (x < 0 || x >= W) return "#"; if (y < 0 || y >= H) return "."; return grid[y][x]; }
  function solid(x, y) { return tile(x, y) === "#"; }
  function overlapTiles(o, w, hh, fn) {
    for (var y = Math.floor(o.y); y <= Math.floor(o.y + hh - 0.001); y++) for (var x = Math.floor(o.x); x <= Math.floor(o.x + w - 0.001); x++) fn(x, y);
  }
  function move(o, w, hh, dt) {
    o.x += o.vx * dt; var hitX = false;
    if (o.vx > 0) { var tx = Math.floor(o.x + w - 0.001); for (var y = Math.floor(o.y); y <= Math.floor(o.y + hh - 0.001); y++) if (solid(tx, y)) { o.x = tx - w; hitX = true; } }
    else if (o.vx < 0) { var tx2 = Math.floor(o.x); for (var y2 = Math.floor(o.y); y2 <= Math.floor(o.y + hh - 0.001); y2++) if (solid(tx2, y2)) { o.x = tx2 + 1; hitX = true; } }
    o.y += o.vy * dt; o.ground = false;
    if (o.vy > 0) { var ty = Math.floor(o.y + hh - 0.001); for (var x = Math.floor(o.x); x <= Math.floor(o.x + w - 0.001); x++) if (solid(x, ty)) { o.y = ty - hh; o.vy = 0; o.ground = true; } }
    else if (o.vy < 0) { var ty2 = Math.floor(o.y); for (var x2 = Math.floor(o.x); x2 <= Math.floor(o.x + w - 0.001); x2++) if (solid(x2, ty2)) { o.y = ty2 + 1; o.vy = 0; } }
    return hitX;
  }
  function die() {
    if (dying) return; dying = 1; lives--; stats(); toast(S.stage, L.ouch);
    setTimeout(function () {
      if (lives <= 0) { paused = true; overlay(L.gameOver, "", L.again, restart, "💥"); }
      else load(li);
    }, 650);
  }
  function restart() { lives = C.lives; allCoins = true; load(0); paused = false; focus(); }
  function finish() {
    paused = true; send("level", { index: li, coins: coinsGot, total: coinsTotal });
    if (coinsGot < coinsTotal) allCoins = false;
    if (li + 1 < C.levels.length) overlay(fmt(L.levelDone, { n: li + 1 }), C.levels[li + 1].name, L.next, function () { load(li + 1); paused = false; focus(); }, C.goalEmoji);
    else { send("win", { allCoins: allCoins }); confetti(); overlay(L.youWin, C.winText, L.again, restart, "🏆"); }
  }
  function step(dt) {
    var dir = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
    pl.vx = dir * P.run; if (dir) pl.face = dir;
    if (keys.jump && pl.ground) { pl.vy = -P.jumpV; pl.ground = false; }
    pl.vy = Math.min(pl.vy + P.g * dt, 22);
    move(pl, PW, PH, dt);
    if (pl.x < 0) pl.x = 0; if (pl.x + PW > W) pl.x = W - PW;
    if (pl.y > H + 1) return die();
    var hurt = false, goal = false;
    overlapTiles(pl, PW, PH, function (x, y) { var c = tile(x, y); if (c === "L") hurt = true; else if (c === "C") { grid[y][x] = "."; coinsGot++; stats(); } else if (c === "G") goal = true; });
    if (hurt) return die();
    enemies.forEach(function (e) {
      if (!e.alive) return;
      e.vy = Math.min(e.vy + P.g * dt, 22);
      var ahead = e.vx > 0 ? Math.floor(e.x + 0.8 + 0.05) : Math.floor(e.x - 0.05);
      if (e.ground && !solid(ahead, Math.floor(e.y + 0.8 + 0.1))) e.vx = -e.vx;
      if (move(e, 0.8, 0.8, dt)) e.vx = -e.vx;
      if (e.y > H + 1 || tile(Math.floor(e.x + 0.4), Math.floor(e.y + 0.4)) === "L") { e.alive = false; return; }
      if (pl.x < e.x + 0.8 && pl.x + PW > e.x && pl.y < e.y + 0.8 && pl.y + PH > e.y) {
        if (pl.vy > 0 && pl.y + PH - e.y < 0.5) { e.alive = false; pl.vy = -P.jumpV * 0.6; }
        else hurt = true;
      }
    });
    if (hurt) return die();
    if (goal) finish();
  }
  function draw() {
    var v = S.view, T = Math.max(8, v.h / H);
    var viewTiles = v.w / T, cam = W <= viewTiles ? -(viewTiles - W) / 2 : clamp(pl.x + PW / 2 - viewTiles / 2, 0, W - viewTiles);
    ctx.fillStyle = C.theme.bg; ctx.fillRect(0, 0, v.w, v.h);
    ctx.globalAlpha = 0.12; ctx.fillStyle = C.theme.panel;
    for (var k = 0; k < 6; k++) { var hx = ((k * 7 - cam * 0.4) % (W + 7)) * T; ctx.beginPath(); ctx.arc(hx, v.h, T * 3.2, Math.PI, 0); ctx.fill(); }
    ctx.globalAlpha = 1;
    var x0 = Math.max(0, Math.floor(cam)), x1 = Math.min(W - 1, Math.ceil(cam + viewTiles));
    for (var y = 0; y < H; y++) for (var x = x0; x <= x1; x++) {
      var c = grid[y][x], px = (x - cam) * T, py = y * T;
      if (c === "#") { ctx.fillStyle = C.theme.panel; rrect(ctx, px + 0.5, py + 0.5, T - 1, T - 1, T * 0.18); ctx.fill(); if (!solid(x, y - 1)) { ctx.fillStyle = C.theme.accent; ctx.fillRect(px + 1, py + 1, T - 2, T * 0.18); } }
      else if (c === "L") { ctx.fillStyle = "#FF6B00"; ctx.fillRect(px, py + T * 0.25, T, T * 0.75); ctx.fillStyle = "#FFD43B"; ctx.beginPath(); for (var w = 0; w <= 4; w++) { var wx = px + (w / 4) * T, wy = py + T * 0.25 + Math.sin(t * 4 + x + w) * T * 0.08; if (w === 0) ctx.moveTo(wx, wy); else ctx.lineTo(wx, wy); } ctx.lineTo(px + T, py + T * 0.4); ctx.lineTo(px, py + T * 0.4); ctx.fill(); }
      else if (c === "C") emoji(ctx, C.coinEmoji, px + T / 2, py + T / 2 + (reduce ? 0 : Math.sin(t * 3 + x) * T * 0.06), T * 0.7);
      else if (c === "G") emoji(ctx, C.goalEmoji, px + T / 2, py + T / 2, T * 0.9);
    }
    enemies.forEach(function (e) { if (e.alive) emoji(ctx, C.enemyEmoji, (e.x + 0.4 - cam) * T, (e.y + 0.4) * T, T * 0.85, e.vx > 0); });
    if (!(dying && Math.floor(t * 12) % 2)) emoji(ctx, C.playerEmoji, (pl.x + PW / 2 - cam) * T, (pl.y + PH / 2) * T, T * 0.95, pl.face < 0);
  }
  function focus() { try { S.cv.focus({ preventScroll: true }); } catch (e) {} }
  var KEYMAP = { ArrowLeft: "left", a: "left", A: "left", ArrowRight: "right", d: "right", D: "right", ArrowUp: "jump", w: "jump", W: "jump", " ": "jump" };
  window.addEventListener("keydown", function (e) { if (isTyping(e) || ovEl) return; var k = KEYMAP[e.key]; if (k) { keys[k] = true; e.preventDefault(); } });
  window.addEventListener("keyup", function (e) { var k = KEYMAP[e.key]; if (k) keys[k] = false; });
  window.addEventListener("blur", function () { keys = {}; });
  if (coarse || window.innerWidth < 640 || X.mode === "preview") {
    pad([
      [{ id: "left", icon: "◀", label: L.left, down: function () { keys.left = true; }, up: function () { keys.left = false; } },
       { id: "right", icon: "▶", label: L.rightKey, down: function () { keys.right = true; }, up: function () { keys.right = false; } }],
      [{ id: "jump", icon: "⤒", label: L.jump, down: function () { keys.jump = true; }, up: function () { keys.jump = false; } }],
    ]);
    window.dispatchEvent(new Event("resize"));
  }
  load(0);
  var last = performance.now(), acc = 0;
  (function loop(now) {
    var dt = Math.min(0.1, (now - last) / 1000); last = now; t += dt;
    if (!paused && !dying) { acc += dt; while (acc >= 1 / 120) { step(1 / 120); acc -= 1 / 120; if (paused || dying) { acc = 0; break; } } }
    draw(); requestAnimationFrame(loop);
  })(last);
  overlay(C.title, L.platHelp, L.start, function () { paused = false; focus(); }, C.playerEmoji);
}

// ── Adventure ──
function adventure() {
  var h = hud(C.title);
  var S = canvasStage(), ctx = S.ctx;
  var rows = C.map.rows, W = rows[0].length, H = rows.length, t = 0;
  var px = 1, py = 1, fx = 1, fy = 1, face = { x: 0, y: 1 }, moving = null, held = null, holdT = 0;
  for (var y = 0; y < H; y++) { var i0 = rows[y].indexOf("P"); if (i0 >= 0) { px = fx = i0; py = fy = y; } }
  var npcs = C.npcs, items = C.items.map(function (it) { return { it: it, got: false }; });
  var quest = C.quest, qs = 0, got = 0, talked = npcs.map(function () { return 0; }), dlg = null;
  function stats() {
    var s = "🎒 " + got + "/" + items.length;
    if (quest) s = (qs === 2 ? "✅ " : qs === 1 ? "📜 " : "❗ ") + s;
    h.stats.textContent = s;
  }
  function npcAt(x, y) { for (var i = 0; i < npcs.length; i++) if (npcs[i].x === x && npcs[i].y === y) return i; return -1; }
  function blocked(x, y) { if (x < 0 || y < 0 || x >= W || y >= H) return true; var c = rows[y][x]; return c === "#" || c === "T" || c === "~" || npcAt(x, y) >= 0; }
  function tryMove(dx, dy) {
    if (dlg || ovEl || moving) return;
    face = { x: dx, y: dy };
    var nx = px + dx, ny = py + dy, n = npcAt(nx, ny);
    if (n >= 0) return talk(n);
    if (blocked(nx, ny)) return;
    moving = { x0: px, y0: py, x1: nx, y1: ny, k: 0 }; px = nx; py = ny;
  }
  function arrive() {
    items.forEach(function (o, i) {
      if (!o.got && o.it.x === px && o.it.y === py) {
        o.got = true; got++; stats(); send("item", { got: got, total: items.length });
        toast(S.stage, o.it.emoji + " " + fmt(L.found, { item: o.it.name }));
      }
    });
  }
  function hasQuestItem() { return !!quest && !!items[quest.item] && items[quest.item].got; }
  function talk(i) {
    var n = npcs[i], seq = [], after = null;
    if (n.greeting) seq.push(n.greeting);
    if (!talked[i]) seq = seq.concat(n.lines); else if (n.lines.length) seq.push(n.lines[(talked[i] - 1) % n.lines.length]);
    talked[i]++;
    if (quest && quest.giver === i) {
      if (qs === 0) { seq.push(quest.ask); after = function () { qs = 1; stats(); send("questStart", {}); }; }
      else if (qs === 1 && hasQuestItem()) {
        seq.push(quest.thanks);
        after = function () { qs = 2; stats(); send("quest", { got: got, total: items.length }); confetti(); overlay(L.questDone, C.winText, L.keepPlaying, focus, "🏆"); };
      } else if (qs === 1) seq.push(fmt(L.questRemind, { item: items[quest.item] ? items[quest.item].it.name : "" }));
    }
    if (!seq.length) seq.push("…");
    openDialog(n, seq, after);
  }
  function openDialog(n, seq, after) {
    var k = 0, box = el("div", "dlg"); box.setAttribute("role", "dialog"); box.setAttribute("aria-label", n.name);
    var who = el("div", "who", n.emoji + " " + n.name), sayEl = el("div", "say"), row = el("div", "row"), b = btn("btn", "", "dlg-next");
    row.appendChild(b); box.appendChild(who); box.appendChild(sayEl); box.appendChild(row); S.stage.appendChild(box);
    function showLine() { sayEl.textContent = seq[k]; b.textContent = k + 1 < seq.length ? L.next + " ▶" : L.close; say(n.name + ": " + seq[k]); }
    function next() { k++; if (k < seq.length) return showLine(); if (box.parentNode) box.parentNode.removeChild(box); dlg = null; if (after) after(); else focus(); }
    b.addEventListener("click", next);
    dlg = { next: next }; showLine(); send("talk", { npc: n.name });
    setTimeout(function () { try { b.focus({ preventScroll: true }); } catch (e) {} }, 30);
  }
  function action() {
    if (dlg) return dlg.next();
    if (ovEl || moving) return;
    var n = npcAt(px + face.x, py + face.y);
    if (n < 0) { var ds = [[0, 1], [0, -1], [1, 0], [-1, 0]]; for (var d = 0; d < 4 && n < 0; d++) n = npcAt(px + ds[d][0], py + ds[d][1]); }
    if (n >= 0) talk(n); else toast(S.stage, L.talk);
  }
  function focus() { try { S.cv.focus({ preventScroll: true }); } catch (e) {} }
  var DIRS = { ArrowUp: [0, -1], w: [0, -1], W: [0, -1], ArrowDown: [0, 1], s: [0, 1], S: [0, 1], ArrowLeft: [-1, 0], a: [-1, 0], A: [-1, 0], ArrowRight: [1, 0], d: [1, 0], D: [1, 0] };
  window.addEventListener("keydown", function (e) {
    if (isTyping(e)) return;
    // On a button, Space and Enter are the button's own click.
    if (e.key === " " || e.key === "Enter") { if (ovEl || (e.target && e.target.tagName === "BUTTON")) return; e.preventDefault(); if (!e.repeat) action(); return; }
    var d = DIRS[e.key]; if (d && !ovEl) { e.preventDefault(); if (!held || held[0] !== d[0] || held[1] !== d[1]) { held = d; holdT = 0; tryMove(d[0], d[1]); } }
  });
  window.addEventListener("keyup", function (e) { var d = DIRS[e.key]; if (d && held && held[0] === d[0] && held[1] === d[1]) held = null; });
  window.addEventListener("blur", function () { held = null; });
  function hold(d) { return { down: function () { held = d; holdT = 0; tryMove(d[0], d[1]); }, up: function () { if (held === d) held = null; } }; }
  var U = [0, -1], D = [0, 1], Lf = [-1, 0], R = [1, 0];
  function padBtn(id, icon, label, d) { var o = hold(d); return { id: id, icon: icon, label: label, down: o.down, up: o.up }; }
  if (coarse || window.innerWidth < 640 || X.mode === "preview") {
    pad([
      [padBtn("left", "◀", L.left, Lf), padBtn("up", "▲", L.up, U), padBtn("down", "▼", L.down, D), padBtn("right", "▶", L.rightKey, R)],
      [{ id: "talk", icon: "💬", label: L.talk, down: action }],
    ]);
    window.dispatchEvent(new Event("resize"));
  }
  function draw() {
    var v = S.view, T = Math.floor(Math.max(16, Math.min(v.w / Math.min(W, 11), v.h / Math.min(H, 9))));
    var mx = moving ? moving.x0 + (moving.x1 - moving.x0) * moving.k : px, my = moving ? moving.y0 + (moving.y1 - moving.y0) * moving.k : py;
    var vw = v.w / T, vh = v.h / T;
    var cx = W <= vw ? -(vw - W) / 2 : clamp(mx + 0.5 - vw / 2, 0, W - vw), cy = H <= vh ? -(vh - H) / 2 : clamp(my + 0.5 - vh / 2, 0, H - vh);
    ctx.fillStyle = C.theme.bg; ctx.fillRect(0, 0, v.w, v.h);
    ctx.globalAlpha = 0.3; ctx.fillStyle = C.theme.panel; ctx.fillRect(0, 0, v.w, v.h); ctx.globalAlpha = 1;
    for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) {
      var c = rows[y][x], sx = (x - cx) * T, sy = (y - cy) * T;
      if (sx < -T || sy < -T || sx > v.w || sy > v.h) continue;
      ctx.fillStyle = C.theme.bg; ctx.fillRect(sx, sy, T + 0.5, T + 0.5);
      if ((x + y) % 2) { ctx.fillStyle = "rgba(127,127,127,0.07)"; ctx.fillRect(sx, sy, T, T); }
      if (c === "#") { ctx.fillStyle = C.theme.panel; rrect(ctx, sx + 1, sy + 1, T - 2, T - 2, T * 0.15); ctx.fill(); }
      else if (c === "~") { ctx.fillStyle = "#4DABF7"; ctx.fillRect(sx, sy, T + 0.5, T + 0.5); ctx.strokeStyle = "rgba(255,255,255,.6)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(sx + T * 0.15, sy + T * 0.55 + Math.sin(t * 2 + x) * 2); ctx.quadraticCurveTo(sx + T * 0.5, sy + T * 0.35, sx + T * 0.85, sy + T * 0.55 + Math.sin(t * 2 + x) * 2); ctx.stroke(); }
      else if (c === "T") emoji(ctx, "🌳", sx + T / 2, sy + T / 2, T * 0.9);
    }
    items.forEach(function (o) { if (!o.got) emoji(ctx, o.it.emoji, (o.it.x - cx + 0.5) * T, (o.it.y - cy + 0.5) * T + (reduce ? 0 : Math.sin(t * 3 + o.it.x) * T * 0.05), T * 0.7); });
    npcs.forEach(function (n, i) {
      var sx = (n.x - cx + 0.5) * T, sy = (n.y - cy + 0.5) * T;
      emoji(ctx, n.emoji, sx, sy, T * 0.9);
      ctx.font = "bold " + Math.max(10, Math.round(T * 0.26)) + "px system-ui,sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "bottom";
      var tw = ctx.measureText(n.name).width + 8; ctx.fillStyle = "rgba(0,0,0,.55)"; rrect(ctx, sx - tw / 2, sy - T * 0.86, tw, T * 0.3, 4); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.fillText(n.name, sx, sy - T * 0.58);
      if (quest && quest.giver === i && qs < 2 && (qs === 0 || hasQuestItem())) emoji(ctx, qs === 0 ? "❗" : "❓", sx + Math.max(tw / 2, T * 0.3) + T * 0.15, sy - T * 0.72 + (reduce ? 0 : Math.sin(t * 5) * 2), T * 0.38);
    });
    emoji(ctx, C.playerEmoji, (mx - cx + 0.5) * T, (my - cy + 0.5) * T, T * 0.9, face.x < 0);
  }
  var last = performance.now();
  (function loop(now) {
    var dt = Math.min(0.1, (now - last) / 1000); last = now; t += dt;
    if (moving) { moving.k += dt / 0.14; if (moving.k >= 1) { moving = null; arrive(); } }
    else if (held && !dlg && !ovEl) { holdT += dt; if (holdT > 0.16) { holdT = 0; tryMove(held[0], held[1]); } }
    draw(); requestAnimationFrame(loop);
  })(last);
  stats();
  overlay(C.title, L.advHelp, L.start, focus, C.playerEmoji);
}

try {
  if (C.template === "clicker") clicker();
  else if (C.template === "quiz") quiz();
  else if (C.template === "platformer") platformer();
  else if (C.template === "adventure") adventure();
  send("ready", {});
} catch (err) {
  app.textContent = "";
  app.appendChild(el("p", null, "⚠️"));
  send("error", {});
}
})();
`;
