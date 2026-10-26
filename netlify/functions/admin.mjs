import { scryptSync, timingSafeEqual, createHmac, randomBytes } from "node:crypto";
import { loadDB, saveDB, dataStore, mediaStore, statsStore, json, uid, dayKey, getSecret, DEFAULT_SETTINGS } from "../lib/store.mjs";
import { DEFAULT_DOCS } from "../lib/docs.mjs";

const COOKIE = "nostra_admin";
const SESSION_DAYS = 30;
const MAX_UPLOAD = 5.5 * 1024 * 1024;
const IMAGE_TYPES = new Set(["image/webp", "image/jpeg", "image/png"]);

/* ---------- auth ---------- */

async function sign(payload) {
  const secret = await getSecret();
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const mac = createHmac("sha256", secret).update(body).digest("base64url");
  return body + "." + mac;
}

async function verify(token) {
  if (!token || !token.includes(".")) return null;
  const [body, mac] = token.split(".");
  const secret = await getSecret();
  const expected = createHmac("sha256", secret).update(body).digest("base64url");
  const a = Buffer.from(mac), b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  const data = JSON.parse(Buffer.from(body, "base64url").toString());
  if (data.exp < Date.now()) return null;
  const auth = await dataStore().get("auth", { type: "json" });
  if ((auth?.gen || 0) !== (data.gen || 0)) return null; // password changed → old sessions invalid
  return data;
}

function getCookie(req, name) {
  const raw = req.headers.get("cookie") || "";
  for (const part of raw.split(/;\s*/)) {
    const [k, ...v] = part.split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return null;
}

function cookieHeader(value, maxAge) {
  return `${COOKIE}=${value}; Path=/api/admin; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;
}

function hashPassword(pw) {
  const salt = randomBytes(16).toString("hex");
  return salt + ":" + scryptSync(pw, salt, 32).toString("hex");
}

function checkHash(pw, stored) {
  const [salt, hex] = stored.split(":");
  const a = scryptSync(pw, salt, 32), b = Buffer.from(hex, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

function safeEqualStr(a, b) {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
}

async function checkPassword(pw) {
  const auth = await dataStore().get("auth", { type: "json" });
  if (auth?.hash) return checkHash(pw, auth.hash);
  const envPw = process.env.ADMIN_PASSWORD;
  if (!envPw) return null; // not configured
  return safeEqualStr(pw, envPw);
}

async function rateLimited(ip) {
  const store = dataStore();
  const key = "rl/" + Buffer.from(ip || "x").toString("base64url").slice(0, 40);
  const rec = (await store.get(key, { type: "json" })) || { n: 0, t: Date.now() };
  if (Date.now() - rec.t > 15 * 60 * 1000) { rec.n = 0; rec.t = Date.now(); }
  return { blocked: rec.n >= 8, fail: async () => { rec.n++; await store.setJSON(key, rec); }, reset: () => store.delete(key) };
}

/* ---------- helpers ---------- */

const str = (v, max = 2000) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const bool = (v) => v === true || v === 1 || v === "1";

function cleanItem(input, existing = {}) {
  const kind = input.kind === "project" ? "project" : "furniture";
  const photos = Array.isArray(input.photos)
    ? input.photos.filter((p) => p && typeof p.id === "string").slice(0, 40).map((p) => ({ id: p.id, w: +p.w || undefined, h: +p.h || undefined }))
    : existing.photos || [];
  let cover = str(input.cover, 80);
  if (!photos.some((p) => p.id === cover)) cover = photos[0]?.id || null;
  return {
    ...existing,
    kind,
    title: str(input.title, 140),
    category: str(input.category, 40) || null,
    description: str(input.description, 4000),
    materials: str(input.materials, 600),
    projectType: str(input.projectType, 120),
    location: str(input.location, 160),
    authors: str(input.authors, 300),
    year: str(input.year, 10),
    photos,
    cover,
    published: bool(input.published),
    featured: bool(input.featured),
    demo: false,
    updatedAt: new Date().toISOString(),
  };
}

function usedMedia(db) {
  const set = new Set();
  for (const i of db.items) for (const p of i.photos || []) set.add(p.id);
  for (const c of db.categories) if (c.cover) set.add(c.cover);
  for (const k of ["heroImage", "aboutImage"]) if (db.settings[k]) set.add(db.settings[k]);
  return set;
}

async function deleteMedia(ids) {
  const store = mediaStore();
  await Promise.all(
    [...ids].filter((id) => !id.startsWith("s:")).flatMap((id) => [store.delete(id + "/f"), store.delete(id + "/t")])
  );
}

async function gcMedia(before, db) {
  const after = usedMedia(db);
  const orphans = [...before].filter((id) => !after.has(id));
  if (orphans.length) await deleteMedia(orphans);
}

/* ---------- stats ---------- */

async function stats(days) {
  const store = statsStore();
  const keys = [];
  for (let i = days - 1; i >= 0; i--) keys.push(dayKey(new Date(Date.now() - i * 86400000)));
  const rows = await Promise.all(keys.map((k) => store.get("d/" + k, { type: "json" })));
  const agg = { series: [], totals: { visitors: 0, views: 0 }, ev: {}, items: {}, cats: {}, refs: {}, dev: {} };
  const add = (target, src) => { for (const [k, v] of Object.entries(src || {})) target[k] = (target[k] || 0) + v; };
  rows.forEach((d, i) => {
    d ||= {};
    const visitors = (d.uniq || []).length;
    const ev = d.ev || {};
    agg.series.push({
      day: keys[i], visitors, views: d.views || 0,
      leads: (ev.call_manager || 0) + (ev.call_owner || 0) + (ev.wa_manager || 0) + (ev.wa_owner || 0),
    });
    agg.totals.visitors += visitors;
    agg.totals.views += d.views || 0;
    add(agg.ev, ev); add(agg.items, d.items); add(agg.cats, d.cats); add(agg.refs, d.refs); add(agg.dev, d.dev);
  });
  return agg;
}

/* ---------- router ---------- */

export default async (req, context) => {
  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/api\/admin\/?/, "").replace(/\/$/, "");
  const [section, id] = path.split("/");
  const method = req.method;

  // CSRF: every mutating request must come from our own JS (custom header triggers CORS preflight)
  if (method !== "GET" && req.headers.get("x-nostra") !== "1") return json({ error: "Запрос отклонён" }, 403);

  if (section === "login" && method === "POST") {
    const rl = await rateLimited(context.ip);
    if (rl.blocked) return json({ error: "Слишком много попыток. Подождите 15 минут." }, 429);
    const { password } = await req.json().catch(() => ({}));
    const ok = await checkPassword(String(password || ""));
    if (ok === null) return json({ error: "Пароль не настроен. Добавьте переменную ADMIN_PASSWORD в настройках Netlify." }, 503);
    if (!ok) { await rl.fail(); return json({ error: "Неверный пароль" }, 401); }
    await rl.reset();
    const auth = await dataStore().get("auth", { type: "json" });
    const token = await sign({ exp: Date.now() + SESSION_DAYS * 86400000, gen: auth?.gen || 0 });
    return json({ ok: true }, 200, { "Set-Cookie": cookieHeader(token, SESSION_DAYS * 86400) });
  }

  if (section === "logout") return json({ ok: true }, 200, { "Set-Cookie": cookieHeader("", 0) });

  const session = await verify(getCookie(req, COOKIE)).catch(() => null);
  if (!session) return json({ error: "Требуется вход" }, 401);

  try {
    if (section === "me") return json({ ok: true });

    if (section === "data" && method === "GET") return json(await loadDB());

    if (section === "stats" && method === "GET") {
      const days = Math.min(Math.max(parseInt(url.searchParams.get("days")) || 30, 1), 180);
      return json(await stats(days));
    }

    if (section === "items") {
      const db = await loadDB();
      const before = usedMedia(db);
      if (method === "POST") {
        const body = await req.json();
        const item = cleanItem(body, { id: uid("i"), createdAt: new Date().toISOString() });
        if (!item.title) return json({ error: "Укажите название" }, 400);
        db.items.unshift(item);
        await saveDB(db);
        return json(item);
      }
      const idx = db.items.findIndex((i) => i.id === id);
      if (idx < 0) return json({ error: "Запись не найдена" }, 404);
      if (method === "PUT") {
        const body = await req.json();
        const item = cleanItem(body, db.items[idx]);
        if (!item.title) return json({ error: "Укажите название" }, 400);
        db.items[idx] = item;
        await saveDB(db);
        await gcMedia(before, db);
        return json(item);
      }
      if (method === "PATCH") {
        const body = await req.json();
        if ("published" in body) db.items[idx].published = bool(body.published);
        if ("featured" in body) db.items[idx].featured = bool(body.featured);
        await saveDB(db);
        return json(db.items[idx]);
      }
      if (method === "DELETE") {
        db.items.splice(idx, 1);
        await saveDB(db);
        await gcMedia(before, db);
        return json({ ok: true });
      }
    }

    if (section === "order" && method === "PUT") {
      const { ids } = await req.json();
      const db = await loadDB();
      const pos = new Map((ids || []).map((x, i) => [x, i]));
      db.items.sort((a, b) => (pos.get(a.id) ?? 1e6) - (pos.get(b.id) ?? 1e6));
      await saveDB(db);
      return json({ ok: true });
    }

    if (section === "categories" && method === "PUT") {
      const { categories } = await req.json();
      if (!Array.isArray(categories)) return json({ error: "Неверные данные" }, 400);
      const db = await loadDB();
      const before = usedMedia(db);
      const seen = new Set();
      db.categories = categories
        .map((c) => ({ id: str(c.id, 40) || uid("c"), name: str(c.name, 60), cover: str(c.cover, 80) || null }))
        .filter((c) => c.name && !seen.has(c.id) && seen.add(c.id));
      const ids = new Set(db.categories.map((c) => c.id));
      for (const i of db.items) if (i.category && !ids.has(i.category)) i.category = null;
      await saveDB(db);
      await gcMedia(before, db);
      return json(db.categories);
    }

    if (section === "settings" && method === "PUT") {
      const body = await req.json();
      const db = await loadDB();
      const before = usedMedia(db);
      const next = { ...db.settings };
      for (const key of Object.keys(DEFAULT_SETTINGS)) {
        if (!(key in body)) continue;
        const def = DEFAULT_SETTINGS[key];
        if (typeof def === "boolean") next[key] = bool(body[key]);
        else if (Array.isArray(def))
          next[key] = (Array.isArray(body[key]) ? body[key] : []).slice(0, 4).map((f) => ({ value: str(f?.value, 20), label: str(f?.label, 60) }));
        else next[key] = str(body[key], 8000);
      }
      db.settings = next;
      await saveDB(db);
      await gcMedia(before, db);
      return json(db.settings);
    }

    if (section === "docs" && id) {
      const db = await loadDB();
      const doc = db.docs.find((d) => d.id === id);
      if (!doc) return json({ error: "Документ не найден" }, 404);
      const reset = url.pathname.endsWith("/reset");
      if (method === "POST" && reset) {
        if (!DEFAULT_DOCS[id]) return json({ error: "Для этого документа нет шаблона" }, 400);
        Object.assign(doc, { title: DEFAULT_DOCS[id].title, text: DEFAULT_DOCS[id].text, updatedAt: new Date().toISOString() });
        await saveDB(db);
        return json(doc);
      }
      if (method === "PUT") {
        const body = await req.json();
        const title = str(body.title, 160), text = str(body.text, 60000);
        if (!title || !text) return json({ error: "Название и текст обязательны" }, 400);
        Object.assign(doc, { title, text, published: bool(body.published), updatedAt: new Date().toISOString() });
        await saveDB(db);
        return json(doc);
      }
    }

    if (section === "upload" && method === "POST") {
      const form = await req.formData();
      const full = form.get("full");
      const thumb = form.get("thumb");
      if (!full || typeof full === "string") return json({ error: "Файл не получен" }, 400);
      if (!IMAGE_TYPES.has(full.type)) return json({ error: "Поддерживаются JPG, PNG и WebP" }, 400);
      if (full.size > MAX_UPLOAD) return json({ error: "Файл слишком большой" }, 413);
      const mid = uid("m");
      const store = mediaStore();
      await store.set(mid + "/f", await full.arrayBuffer(), { metadata: { type: full.type } });
      if (thumb && typeof thumb !== "string" && IMAGE_TYPES.has(thumb.type) && thumb.size < MAX_UPLOAD)
        await store.set(mid + "/t", await thumb.arrayBuffer(), { metadata: { type: thumb.type } });
      return json({ id: mid, w: +form.get("w") || undefined, h: +form.get("h") || undefined });
    }

    if (section === "media" && method === "DELETE" && id) {
      const db = await loadDB();
      if (!usedMedia(db).has(id)) await deleteMedia([id]);
      return json({ ok: true });
    }

    if (section === "password" && method === "POST") {
      const { current, next } = await req.json();
      if (!(await checkPassword(String(current || "")))) return json({ error: "Текущий пароль неверный" }, 400);
      if (String(next || "").length < 8) return json({ error: "Новый пароль — минимум 8 символов" }, 400);
      const store = dataStore();
      const auth = (await store.get("auth", { type: "json" })) || {};
      const gen = (auth.gen || 0) + 1;
      await store.setJSON("auth", { hash: hashPassword(String(next)), gen });
      const token = await sign({ exp: Date.now() + SESSION_DAYS * 86400000, gen });
      return json({ ok: true }, 200, { "Set-Cookie": cookieHeader(token, SESSION_DAYS * 86400) });
    }

    if (section === "export" && method === "GET") {
      const db = await loadDB();
      return new Response(JSON.stringify(db, null, 2), {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Content-Disposition": `attachment; filename="nostra-backup-${dayKey()}.json"`,
        },
      });
    }

    return json({ error: "Не найдено" }, 404);
  } catch (e) {
    console.error(e);
    return json({ error: "Ошибка сервера. Попробуйте ещё раз." }, 500);
  }
};

export const config = { path: ["/api/admin", "/api/admin/*"] };
