(() => {
  "use strict";
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // Простая разметка: «## » заголовок, «- » пункт списка, пустая строка — новый абзац
  function render(text) {
    const out = [];
    let list = null;
    const flush = () => { if (list) { out.push("<ul>" + list.join("") + "</ul>"); list = null; } };
    for (const raw of String(text).split("\n")) {
      const line = raw.trim();
      if (!line) { flush(); continue; }
      if (line.startsWith("## ")) { flush(); out.push(`<h2>${esc(line.slice(3))}</h2>`); continue; }
      if (line.startsWith("- ")) { (list ||= []).push(`<li>${esc(line.slice(2))}</li>`); continue; }
      flush();
      out.push(`<p>${esc(line)}</p>`);
    }
    flush();
    return out.join("");
  }

  const id = (new URLSearchParams(location.search).get("id") || "privacy");
  fetch("api/doc/" + encodeURIComponent(id) + ".json")
    .then((r) => r.json().then((d) => ({ ok: r.ok, d })))
    .then(({ ok, d }) => {
      if (!ok) throw new Error(d.error || "Документ не найден");
      document.title = `${d.title} — ${d.brand || "NOSTRA"}`;
      document.querySelectorAll("[data-brand]").forEach((el) => (el.textContent = d.brand || "NOSTRA"));
      document.querySelectorAll("[data-tagline]").forEach((el) => (el.textContent = d.tagline || "Мебель на заказ"));
      $("#copyright").textContent = `© ${new Date().getFullYear()} ${d.brand || "NOSTRA"}`;
      $("#doc").innerHTML = `<p class="eyebrow">Документы</p><h1>${esc(d.title)}</h1><div class="doc-body">${render(d.text)}</div>`;
      $("#docNav").innerHTML = (d.docs || []).map((x) => `<a href="doc.html?id=${encodeURIComponent(x.id)}"${x.id === d.id ? ' aria-current="page"' : ""}>${esc(x.title)}</a>`).join("");
    })
    .catch((e) => {
      $("#doc").innerHTML = `<h1>Документ не найден</h1><p>${esc(e.message)}</p><p><a href="./">Вернуться на главную</a></p>`;
    });
})();
