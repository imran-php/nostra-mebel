import { statsStore, dayKey } from "../lib/store.mjs";

const EVENTS = new Set(["view", "item", "call_manager", "call_owner", "wa_manager", "wa_owner", "cat", "insta"]);
const BOT = /bot|crawl|spider|slurp|preview|headless|lighthouse|facebookexternalhit|yandex(?!browser)|curl|wget|python/i;

export default async (req, context) => {
  if (req.method !== "POST") return new Response(null, { status: 405 });
  const ua = req.headers.get("user-agent") || "";
  if (BOT.test(ua)) return new Response(null, { status: 204 });
  let body;
  try { body = JSON.parse(await req.text()); } catch { return new Response(null, { status: 400 }); }
  const t = String(body.t || "");
  if (!EVENTS.has(t)) return new Response(null, { status: 400 });
  const id = typeof body.id === "string" ? body.id.slice(0, 64) : "";

  const day = dayKey();
  // Анонимный суточный идентификатор из браузера (случайный, без IP и cookies)
  const visitor = /^[a-z0-9]{8,24}$/.test(String(body.v || "")) ? String(body.v) : crypto.randomUUID().slice(0, 12);

  const store = statsStore();
  const key = "d/" + day;
  const d = (await store.get(key, { type: "json" })) || { views: 0, uniq: [], ev: {}, items: {}, cats: {}, refs: {}, dev: {} };
  if (t === "view") {
    d.views++;
    if (!d.uniq.includes(visitor)) {
      d.uniq.push(visitor);
      const mobile = /mobi|android|iphone|ipad/i.test(ua) ? "mobile" : "desktop";
      d.dev[mobile] = (d.dev[mobile] || 0) + 1;
      let ref = "Прямой заход";
      try {
        const r = body.ref ? new URL(body.ref) : null;
        const self = new URL(req.url).host;
        if (r && r.host && r.host !== self) ref = r.host.replace(/^www\./, "");
      } catch {}
      if (body.utm) ref = String(body.utm).slice(0, 40);
      d.refs[ref] = (d.refs[ref] || 0) + 1;
    }
  } else {
    d.ev[t] = (d.ev[t] || 0) + 1;
    if (t === "item" && id) d.items[id] = (d.items[id] || 0) + 1;
    if (t === "cat" && id) d.cats[id] = (d.cats[id] || 0) + 1;
  }
  await store.setJSON(key, d);
  return new Response(null, { status: 204 });
};

export const config = { path: "/api/track" };
