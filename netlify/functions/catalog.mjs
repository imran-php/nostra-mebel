import { loadDB, json } from "../lib/store.mjs";

const PUBLIC_SETTINGS_EXCLUDE = new Set([]);

export default async () => {
  try {
    const db = await loadDB();
    const items = db.items
      .filter((i) => i.published)
      .map(({ createdAt, updatedAt, ...rest }) => rest);
    const settings = Object.fromEntries(Object.entries(db.settings).filter(([k]) => !PUBLIC_SETTINGS_EXCLUDE.has(k)));
    const docs = db.docs.filter((d) => d.published).map(({ id, title }) => ({ id, title }));
    return json({ categories: db.categories, items, settings, docs }, 200, { "Cache-Control": "no-cache" });
  } catch (e) {
    console.error(e);
    return json({ error: "Каталог временно недоступен" }, 500);
  }
};

export const config = { path: "/api/catalog" };
