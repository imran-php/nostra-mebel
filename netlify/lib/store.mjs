import { getStore } from "@netlify/blobs";
import { defaultDocs, DEFAULT_DOCS, DOC_ORDER } from "./docs.mjs";

export const dataStore = () => getStore({ name: "nostra-data", consistency: "strong" });
export const mediaStore = () => getStore({ name: "nostra-media", consistency: "strong" });
export const statsStore = () => getStore({ name: "nostra-stats", consistency: "strong" });

export const DEFAULT_CATEGORIES = [
  "Кухни", "Шкафы", "Гардеробные", "Гостиные", "Спальни", "Детские", "Прихожие", "Офисная мебель",
];

export const DEFAULT_SETTINGS = {
  brandName: "NOSTRA",
  tagline: "Мебель на заказ",
  heroEyebrow: "Мебель на заказ · по вашим размерам",
  heroTitle: "Мебель, сделанная под *ваш* интерьер",
  heroText: "Кухни, шкафы, гардеробные и мебель для всего дома — от замера до монтажа.",
  heroImage: "s:kitchen",
  about: "Мебель на заказ. По вашим размерам. Для вашего пространства.",
  aboutImage: "s:living",
  facts: [
    { value: "", label: "" },
    { value: "", label: "" },
    { value: "", label: "" },
  ],
  steps:
    "Замер — Приезжаем, снимаем размеры и обсуждаем задачу\n" +
    "Проект — Готовим проект и подбираем материалы\n" +
    "Производство — Изготавливаем мебель под ваши размеры\n" +
    "Монтаж — Доставляем, собираем и убираем за собой",
  projectTitle: "Обсудить проект",
  projectText: "Менеджер ответит на вопросы, сориентирует по стоимости и срокам, запишет на замер.",
  managerPhone: "+7 938 014-07-08",
  coopTitle: "Сотрудничество",
  coopText: "Дизайнерам, архитекторам, застройщикам и партнёрам — напрямую с владельцем.",
  ownerPhone: "+7 989 901-01-41",
  whatsapp: true,
  messenger: "whatsapp", // whatsapp | telegram | max | none
  managerMsgUrl: "",
  ownerMsgUrl: "",
  instagram: "",
  telegram: "",
  address: "",
  hours: "",
  email: "",
  operatorType: "ip", // ip | org
  operatorName: "",
  regAuthority: "",
  inn: "",
  ogrn: "",
  operatorAddress: "",
  privacyText:
    "Сайт можно просматривать без регистрации и без отправки контактных данных. Форм заказа на сайте нет: связь происходит по телефону или в WhatsApp.\n\n" +
    "Для понимания интереса к разделам сайт ведёт обезличенный подсчёт посещений и нажатий на кнопки связи. Cookies для этого не используются, IP-адреса не сохраняются: из них формируется необратимый суточный код, который нельзя связать с конкретным человеком.\n\n" +
    "Рекламные и сторонние аналитические системы не подключены.",
};

const now = () => new Date().toISOString();

function seed() {
  const categories = DEFAULT_CATEGORIES.map((name, i) => ({ id: "c" + (i + 1), name, cover: null }));
  const demo = (id, kind, title, cat, photo, extra = {}) => ({
    id, kind, title, category: cat, description: "", materials: "", projectType: "", location: "",
    authors: "", year: "", photos: [{ id: photo }], cover: photo, published: true, featured: false,
    demo: true, createdAt: now(), updatedAt: now(), ...extra,
  });
  return {
    version: 1,
    categories,
    items: [
      demo("demo-kitchen", "furniture", "Оливковая кухня", "c1", "s:kitchen", { description: "Оливковые фасады, светлый камень и дерево." }),
      demo("demo-wardrobe", "furniture", "Шкаф в орехе", "c2", "s:wardrobe", { description: "Встроенное хранение в спальне." }),
      demo("demo-living", "furniture", "Светлая гостиная", "c4", "s:living", { description: "Мебель в спокойном светлом интерьере." }),
      demo("demo-project", "project", "Квартира в светлых тонах", "c1", "s:living", {
        projectType: "Квартира", description: "Пример карточки готовой работы. Замените её своими фотографиями.",
        photos: [{ id: "s:living" }, { id: "s:kitchen" }, { id: "s:wardrobe" }],
      }),
    ],
    settings: { ...DEFAULT_SETTINGS },
    docs: defaultDocs(),
  };
}

/** One-time import from the previous version of the site (store "nostra-catalog-v1"). */
async function migrateOld(db) {
  let old;
  try { old = await getStore({ name: "nostra-catalog-v1", consistency: "strong" }).get("catalog", { type: "json" }); } catch { return db; }
  if (!old) return db;
  const s = old.settings || {};
  const map = {
    about: s.about, cooperation: s.cooperation, instagram: s.instagram, operatorName: s.operatorName,
    inn: s.inn, ogrn: s.ogrn, operatorAddress: s.operatorAddress, email: s.privacyEmail,
  };
  for (const [k, v] of Object.entries(map)) if (typeof v === "string" && v.trim()) db.settings[k === "cooperation" ? "coopText" : k] = v.trim();
  const products = Array.isArray(old.products) ? old.products : [];
  if (!products.length) return db;
  const oldPhotos = getStore({ name: "nostra-photos-v1", consistency: "strong" });
  const media = mediaStore();
  const catId = (name) => {
    let c = db.categories.find((x) => x.name === name);
    if (!c && name) { c = { id: uid("c"), name, cover: null }; db.categories.push(c); }
    return c?.id || null;
  };
  const items = [];
  for (const p of products) {
    const recs = (old.photos || []).filter((x) => x.productId === p.id);
    const photos = [];
    for (const r of recs) {
      try {
        const bytes = await oldPhotos.get(r.id, { type: "arrayBuffer" });
        if (!bytes) continue;
        const mid = "o" + r.id.replace(/-/g, "").slice(0, 20);
        await media.set(mid + "/f", bytes, { metadata: { type: r.mime || "image/jpeg" } });
        photos.push({ id: mid, old: r.id });
      } catch (e) { console.error("photo migrate", e); }
    }
    const cover = photos.find((x) => x.old === p.cover)?.id || photos[0]?.id || null;
    items.push({
      id: "i" + String(p.id).replace(/-/g, "").slice(0, 16), kind: p.kind === "project" ? "project" : "furniture",
      title: p.title || "Без названия", category: catId(p.category), description: p.description || "", materials: p.material || "",
      projectType: p.project_type || "", location: "", authors: p.designer || "", year: "",
      photos: photos.map(({ id }) => ({ id })), cover, published: !!p.published, featured: false, demo: false,
      createdAt: now(), updatedAt: now(),
    });
  }
  db.items = [...items, ...db.items.filter((i) => !i.demo)];
  return db;
}

export async function loadDB() {
  const store = dataStore();
  let db = await store.get("db", { type: "json" });
  if (!db) {
    db = await migrateOld(seed());
    await store.setJSON("db", db);
  }
  db.settings = { ...DEFAULT_SETTINGS, ...(db.settings || {}) };
  if (db.settings.heroTitle === "Мебель, сделанная под ваш интерьер") db.settings.heroTitle = DEFAULT_SETTINGS.heroTitle;
  db.categories ||= [];
  db.items ||= [];
  if (!Array.isArray(db.docs)) db.docs = [];
  for (const id of DOC_ORDER)
    if (!db.docs.some((d) => d.id === id)) db.docs.push({ id, title: DEFAULT_DOCS[id].title, text: DEFAULT_DOCS[id].text, published: true, updatedAt: new Date().toISOString() });
  return db;
}

export async function saveDB(db) {
  await dataStore().setJSON("db", db);
}

export function uid(prefix = "") {
  return prefix + Date.now().toString(36) + crypto.getRandomValues(new Uint32Array(1))[0].toString(36);
}

export const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...headers },
  });

/** Day key in Moscow time, e.g. 2026-10-18 */
export function dayKey(d = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Moscow", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

export async function getSecret() {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  const store = dataStore();
  let s = await store.get("secret", { type: "text" });
  if (!s) {
    s = Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString("hex");
    await store.set("secret", s);
  }
  return s;
}

/** Fill {{placeholders}} in a document with requisites from settings. */
export function fillDoc(text, settings, host) {
  const s = settings || {};
  const blank = "________";
  const v = (x) => (x && String(x).trim()) || blank;
  const vars = {
    name: v(s.operatorName),
    inn: v(s.inn),
    ogrnLabel: s.operatorType === "org" ? "ОГРН" : "ОГРНИП",
    ogrn: v(s.ogrn),
    address: v(s.operatorAddress || s.address),
    email: v(s.email),
    phone: [s.managerPhone, s.ownerPhone].filter(Boolean).join(", ") || blank,
    site: host || "сайта",
    brand: s.brandName || "NOSTRA",
    hours: v(s.hours),
    regAuthority: v(s.regAuthority),
  };
  return (date) => String(text || "").replace(/\{\{(\w+)\}\}/g, (m, k) => (k === "date" ? date : vars[k] ?? m));
}

export const requisitesMissing = (s) =>
  ["operatorName", "inn", "ogrn", "operatorAddress", "email"].filter((k) => !String(s?.[k] || "").trim());
