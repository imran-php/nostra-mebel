import { loadDB, json, fillDoc } from "../lib/store.mjs";

export default async (req, context) => {
  const id = context.params?.id || new URL(req.url).pathname.split("/").pop();
  try {
    const db = await loadDB();
    const doc = db.docs.find((d) => d.id === id && d.published);
    if (!doc) return json({ error: "Документ не найден" }, 404);
    const date = new Date(doc.updatedAt || Date.now()).toLocaleDateString("ru-RU", { timeZone: "Europe/Moscow" });
    const text = fillDoc(doc.text, db.settings, new URL(req.url).host)(date);
    const docs = db.docs.filter((d) => d.published).map(({ id, title }) => ({ id, title }));
    const s = db.settings;
    return json({ id: doc.id, title: doc.title, text, docs, brand: s.brandName, tagline: s.tagline, managerPhone: s.managerPhone }, 200, { "Cache-Control": "no-cache" });
  } catch (e) {
    console.error(e);
    return json({ error: "Ошибка сервера" }, 500);
  }
};

export const config = { path: "/api/doc/:id" };
