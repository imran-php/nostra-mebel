(() => {
  "use strict";

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const paras = (t) => String(t || "").split(/\n{2,}|\n/).filter(Boolean).map((p) => `<p>${esc(p)}</p>`).join("");

  const DEFAULT_PHONES = { manager: "+7 938 014-07-08", owner: "+7 989 901-01-41" };
  const ALL = "all";

  const state = { categories: [], items: [], settings: {}, cat: ALL, sub: ALL, current: null, photo: 0 };

  /* ---------- тексты (меняются в админке: раздел «Тексты») ---------- */
  const DEF = {};
  (window.NOSTRA_TEXTS || []).forEach(([, list]) => list.forEach(([k, , d]) => (DEF[k] = d)));
  const T = (k) => { const v = state.settings.texts?.[k]; return v && String(v).trim() ? v : DEF[k] ?? ""; };
  const rich = (t) => esc(t).replace(/\*([^*]+)\*/g, "<em>$1</em>");

  /* ---------- media ---------- */
  function src(id, size = "f") {
    if (!id) return "";
    if (id.startsWith("s:")) return `images/${id.slice(2)}-${size === "t" ? 800 : 1600}.webp`;
    return `/api/media/${encodeURIComponent(id)}${size === "t" ? "?s=t" : ""}`;
  }
  function img(id, alt = "", { size = "t", eager = false, sizes } = {}) {
    if (!id) return "";
    const lazy = eager ? 'fetchpriority="high"' : 'loading="lazy" decoding="async"';
    const set = `srcset="${src(id, "t")} 800w, ${src(id, "f")} 1600w" sizes="${sizes || "50vw"}"`;
    return `<img src="${src(id, size)}" ${set} alt="${esc(alt)}" ${lazy} />`;
  }

  /* ---------- tracking (обезличенно, без cookies и IP) ---------- */
  // Случайный идентификатор, который меняется каждый день: нужен только чтобы не считать посетителя дважды
  let vidCache;
  function visitorId() {
    if (vidCache) return vidCache;
    const day = new Date().toISOString().slice(0, 10);
    try {
      const saved = JSON.parse(localStorage.getItem("nostra-v") || "null");
      if (saved && saved.d === day && /^[a-z0-9]{8,24}$/.test(saved.id)) return (vidCache = saved.id);
    } catch {}
    vidCache = Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
    try { localStorage.setItem("nostra-v", JSON.stringify({ d: day, id: vidCache })); } catch {}
    return vidCache;
  }
  function track(t, id) {
    try {
      const body = JSON.stringify({ t, id, v: visitorId(), ref: t === "view" ? document.referrer : undefined, utm: t === "view" ? new URLSearchParams(location.search).get("utm_source") || undefined : undefined });
      /* статистика на GitHub Pages не собирается */
    } catch {}
  }

  /* ---------- phones ---------- */
  const digits = (p) => String(p || "").replace(/\D/g, "").replace(/^8(?=\d{10}$)/, "7");
  const phone = (who) => state.settings[who === "owner" ? "ownerPhone" : "managerPhone"] || DEFAULT_PHONES[who];

  function bindContacts() {
    const s = state.settings;
    $$("[data-call]").forEach((a) => {
      const who = a.dataset.call;
      a.href = "tel:+" + digits(phone(who));
    });
    $$("[data-phone]").forEach((el) => (el.textContent = phone(el.dataset.phone)));
    $$("[data-wa]").forEach((a) => {
      const who = a.dataset.wa;
      const text = who === "owner" ? T("msgTextOwner") : T("msgTextMgr");
      const href = msgLink(who, a.dataset.text || text);
      a.hidden = !href;
      if (!href) return;
      a.href = href;
      if (!a.classList.contains("icon-btn")) a.textContent = T("msgPrefix") + " " + MSG[msgKind()];
    });
  }

  /* ---------- мессенджер (WhatsApp / Telegram / MAX) ---------- */
  const MSG = { whatsapp: "WhatsApp", telegram: "Telegram", max: "MAX" };
  const msgKind = () => { const s = state.settings; const k = s.messenger || (s.whatsapp === false ? "none" : "whatsapp"); return MSG[k] ? k : "none"; };
  function msgLink(who, text) {
    const s = state.settings, kind = msgKind();
    const custom = String((who === "owner" ? s.ownerMsgUrl : s.managerMsgUrl) || "").trim();
    if (kind === "whatsapp") return custom || `https://wa.me/${digits(phone(who))}?text=${encodeURIComponent(text)}`;
    if (kind === "telegram") return custom ? (/^https?:/.test(custom) ? custom : `https://t.me/${custom.replace(/^@/, "")}`) : `https://t.me/+${digits(phone(who))}`;
    if (kind === "max") return custom ? (/^https?:/.test(custom) ? custom : `https://max.ru/${custom.replace(/^@/, "")}`) : null;
    return null;
  }

  // На компьютере вместо попытки звонка показываем номер крупно
  const desktopMQ = matchMedia("(hover: hover) and (pointer: fine) and (min-width: 1024px)");
  const callDlg = $("#callDlg");
  function openCall(who) {
    const isOwner = who === "owner", s = state.settings, num = phone(who);
    $("#callKicker").textContent = isOwner ? T("callOwnerKicker") : T("callMgrKicker");
    $("#callTitle").textContent = isOwner ? (s.coopTitle || "Сотрудничество") : (s.projectTitle || "Обсудить проект");
    $("#callText").textContent = isOwner ? (s.coopText || "") : (s.projectText || "");
    const a = $("#callNum"); a.textContent = num; a.href = "tel:+" + digits(num);
    const wa = $("#callWa");
    const href = msgLink(who, isOwner ? T("msgTextOwner") : state.current ? `Здравствуйте! Интересует: «${state.current.title}».` : T("msgTextMgr"));
    wa.hidden = !href;
    if (href) { wa.href = href; wa.textContent = T("msgPrefix") + " " + MSG[msgKind()]; }
    $("#callHint").textContent = T("callHint");
    wa.onclick = () => track("wa_" + who, state.current?.id);
    $("#callCopy").textContent = T("callCopy");
    $("#callCopy").onclick = async () => {
      try { await navigator.clipboard.writeText(num); $("#callCopy").textContent = T("callCopied"); }
      catch { const r = document.createRange(); r.selectNodeContents(a); getSelection().removeAllRanges(); getSelection().addRange(r); }
    };
    callDlg.hidden = false;
    setTimeout(() => $("#callCopy").focus(), 30);
  }
  const closeCall = () => (callDlg.hidden = true);
  $$("[data-close-call]").forEach((b) => b.addEventListener("click", closeCall));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !callDlg.hidden) { e.stopImmediatePropagation(); closeCall(); } }, true);

  document.addEventListener("click", (e) => {
    const call = e.target.closest("[data-call]");
    if (call) {
      track("call_" + call.dataset.call, state.current?.id);
      if (desktopMQ.matches) { e.preventDefault(); openCall(call.dataset.call); }
      return;
    }
    const wa = e.target.closest("[data-wa]");
    if (wa) { track("wa_" + wa.dataset.wa, state.current?.id); return; }
    const insta = e.target.closest("[data-insta]");
    if (insta) track("insta");
  });

  /* ---------- render ---------- */
  function applySettings() {
    const s = state.settings;
    // шрифты
    const font = ["original", "classic", "warm", "minimal"].includes(s.fontPreset) ? s.fontPreset : "warm";
    document.documentElement.dataset.font = font;
    try { localStorage.setItem("nostra-font", font); } catch {}
    // все надписи
    $$("[data-t]").forEach((el) => { const v = T(el.dataset.t); if (v) el.innerHTML = rich(v); });
    $("#metaDesc")?.setAttribute("content", T("seoDescription"));
    $$("[data-s]").forEach((el) => { const v = s[el.dataset.s]; if (v) el.textContent = v; });
    // заголовок: слова в *звёздочках* выделяются курсивом
    if (s.heroTitle) $("#heroTitle").innerHTML = esc(s.heroTitle).replace(/\*([^*]+)\*/g, "<em>$1</em>");
    $$("[data-brand]").forEach((el) => {
      if (s.logoImage) el.innerHTML = `<img src="${src(s.logoImage, "t")}" alt="${esc(s.brandName || "NOSTRA")}" />`;
      else el.textContent = s.brandName || "NOSTRA";
    });
    $$("[data-tagline]").forEach((el) => (el.textContent = s.tagline || "Мебель на заказ"));
    $("[data-brand-about]").innerHTML = rich(T("aboutTitle") || "О " + (s.brandName || "NOSTRA"));
    document.title = T("seoTitle") || `${s.brandName || "NOSTRA"} — ${(s.tagline || "мебель на заказ").toLowerCase()}`;

    if (s.heroImage) {
      const h = $("#heroImg");
      const want = src(s.heroImage, "t");
      if (!h.src.endsWith(want)) { h.src = want; h.srcset = `${src(s.heroImage, "t")} 800w, ${src(s.heroImage, "f")} 1600w`; }
    }
    if (s.aboutImage) $("#aboutImg").src = src(s.aboutImage, "t");
    $("#aboutText").innerHTML = paras(s.about);

    const facts = (s.facts || []).filter((f) => f.value && f.label);
    $("#facts").innerHTML = facts.map((f) => `<div><dt>${esc(f.value)}</dt><dd>${esc(f.label)}</dd></div>`).join("");

    const steps = (s.stepItems?.length ? s.stepItems : String(s.steps || "").split("\n").map((l) => l.trim()).filter(Boolean).map((l) => {
      const [title, ...rest] = l.split(/\s+[—–-]\s+/);
      return { title, text: rest.join(" — ") };
    })).filter((x) => x.title);
    $("#stepsList").innerHTML = steps.map((x) => `<li class="step${x.photo ? " has-photo" : ""}">${x.photo ? `<figure class="step-photo">${img(x.photo, x.title, { sizes: "(min-width:1024px) 25vw, 90vw" })}</figure>` : ""}<div><strong>${esc(x.title)}</strong>${x.text ? `<span>${esc(x.text)}</span>` : ""}</div></li>`).join("");
    $("#steps").hidden = !steps.length;

    const extra = [];
    if (s.address) extra.push(`<li><span>${esc(T("labelAddress"))}</span><b>${esc(s.address)}</b></li>`);
    if (s.hours) extra.push(`<li><span>${esc(T("labelHours"))}</span><b>${esc(s.hours)}</b></li>`);
    if (s.email) extra.push(`<li><span>${esc(T("labelEmail"))}</span><a href="mailto:${esc(s.email)}">${esc(s.email)}</a></li>`);
    if (s.instagram) {
      const url = /^https?:/.test(s.instagram) ? s.instagram : `https://instagram.com/${s.instagram.replace(/^@/, "")}`;
      extra.push(`<li><span>Instagram*</span><a data-insta href="${esc(url)}" target="_blank" rel="noopener">${esc(s.instagram.replace(/^https?:\/\/(www\.)?instagram\.com\//, "@").replace(/\/$/, ""))}</a></li>`);
    }
    if (s.telegram) {
      const url = /^https?:/.test(s.telegram) ? s.telegram : `https://t.me/${s.telegram.replace(/^@/, "")}`;
      extra.push(`<li><span>Telegram</span><a href="${esc(url)}" target="_blank" rel="noopener">${esc(s.telegram)}</a></li>`);
    }
    $("#contactExtra").innerHTML = extra.join("");

    const ogrnLabel = s.operatorType === "org" ? "ОГРН" : "ОГРНИП";
    const legal = [s.operatorName, s.inn && `ИНН ${s.inn}`, s.ogrn && `${ogrnLabel} ${s.ogrn}`, s.operatorAddress].filter(Boolean);
    $("#legal").textContent = legal.join(" · ");
    $("#copyright").textContent = `© ${new Date().getFullYear()} ${s.brandName || "NOSTRA"}`;
    $("#metaNote").hidden = !s.instagram;
    if (state.docs?.length)
      $("#footerDocs").innerHTML = `<span class="footer-h">${esc(T("footerDocsTitle"))}</span>` + state.docs.map((d) => `<a href="doc.html?id=${encodeURIComponent(d.id)}">${esc(d.title)}</a>`).join("");
    bindContacts();
  }

  const furniture = () => state.items.filter((i) => i.kind !== "project");
  const works = () => state.items.filter((i) => i.kind === "project").sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
  const catName = (id) => state.categories.find((c) => c.id === id)?.name || "";
  const tops = () => state.categories.filter((c) => !c.parent || !state.categories.some((p) => p.id === c.parent));
  const subsOf = (id) => state.categories.filter((c) => c.parent === id);
  const topOf = (id) => { const c = state.categories.find((x) => x.id === id); return c?.parent && state.categories.some((p) => p.id === c.parent) ? c.parent : id; };
  const inCat = (item, id) => item.category === id || topOf(item.category) === id;

  function renderCats() {
    const f = furniture();
    const counts = {};
    f.forEach((i) => { counts[i.category] = (counts[i.category] || 0) + 1; const t = topOf(i.category); if (t !== i.category) counts[t] = (counts[t] || 0) + 1; });
    const cats = tops().filter((c) => counts[c.id] || c.cover);
    const list = cats.length ? cats : tops();

    $("#catTiles").innerHTML = list.map((c) => {
      const cover = c.cover || f.find((i) => inCat(i, c.id))?.cover;
      const n = counts[c.id] || 0;
      return `<button class="cat-tile ${cover ? "" : "empty"}" data-cat="${esc(c.id)}">${cover ? img(cover, c.name, { sizes: "45vw" }) : ""}<span>${esc(c.name)}${n ? `<small>${n} ${plural(n, "модель", "модели", "моделей")}</small>` : ""}</span></button>`;
    }).join("");

    state.counts = counts;
    const chips = [{ id: ALL, name: T("allChip"), n: f.length }, ...tops().filter((c) => counts[c.id]).map((c) => ({ id: c.id, name: c.name, n: counts[c.id] }))];
    $("#chips").innerHTML = chips.map((c) => `<button class="chip" role="tab" data-chip="${esc(c.id)}" aria-selected="${state.cat === c.id}">${esc(c.name)}<sup>${c.n}</sup></button>`).join("");
  }

  function renderSubchips() {
    const box = $("#subchips"), counts = state.counts || {};
    const subs = state.cat === ALL ? [] : subsOf(state.cat).filter((c) => counts[c.id]);
    box.hidden = !subs.length;
    if (!subs.length) { box.innerHTML = ""; return; }
    box.innerHTML = [{ id: ALL, name: T("subAllChip"), n: counts[state.cat] || 0 }, ...subs.map((c) => ({ id: c.id, name: c.name, n: counts[c.id] }))]
      .map((c) => `<button class="subchip" role="tab" data-sub="${esc(c.id)}" aria-selected="${state.sub === c.id}">${esc(c.name)}<sup>${c.n}</sup></button>`).join("");
  }

  function plural(n, a, b, c) {
    const m10 = n % 10, m100 = n % 100;
    return m10 === 1 && m100 !== 11 ? a : m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20) ? b : c;
  }

  function renderGrid() {
    const sel = state.sub !== ALL ? state.sub : state.cat;
    const list = furniture().filter((i) => sel === ALL || (state.sub !== ALL ? i.category === sel : inCat(i, sel)));
    $$("#chips .chip").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.chip === state.cat)));
    renderSubchips();
    $("#catalogMeta").textContent = list.length ? `${list.length} ${plural(list.length, "модель", "модели", "моделей")}${sel === ALL ? "" : " · " + catName(sel)}` : "";
    if (!list.length) {
      $("#grid").innerHTML = state.cat === ALL
        ? `<div class="empty-state"><strong>${esc(T("emptyAllTitle"))}</strong>${esc(T("emptyAllText"))}<br><a class="btn btn-primary" data-call="manager" href="tel:+${digits(phone("manager"))}">${esc(T("heroBtnMain"))}</a></div>`
        : `<div class="empty-state"><strong>${esc(T("emptyCatTitle"))}</strong>${esc(T("emptyCatText"))}<br><button class="btn btn-outline" data-chip="${ALL}">${esc(T("emptyCatBtn"))}</button></div>`;
      return;
    }
    $("#grid").innerHTML = list.map((i) => `
      <button class="card" data-open="${esc(i.id)}">
        <div class="card-img">${img(i.cover, i.title, { sizes: "(min-width:1024px) 25vw, (min-width:720px) 33vw, 50vw" })}${(i.photos?.length || 0) > 1 ? `<span class="card-badge">${i.photos.length} ${esc(T("worksPhotos"))}</span>` : ""}</div>
        <div><div class="card-cat">${esc(catName(i.category))}</div><div class="card-title">${esc(i.title)}</div></div>
      </button>`).join("");
    observe();
  }

  function renderWorks() {
    const list = works();
    $("#works").hidden = !list.length;
    $("#works-list").innerHTML = list.map((w) => `
      <button class="work" data-open="${esc(w.id)}">
        ${img(w.cover, w.title, { sizes: "(min-width:1024px) 42vw, 86vw" })}
        ${(w.photos?.length || 0) > 1 ? `<span class="work-photos">${w.photos.length} ${esc(T("worksPhotos"))}</span>` : ""}
        <div class="work-info">
          <p class="eyebrow">${esc([w.projectType || catName(w.category), w.location, w.year].filter(Boolean).join(" · "))}</p>
          <h3>${esc(w.title)}</h3>
          ${w.authors ? `<p>${esc(T("worksAuthors"))}: ${esc(w.authors)}</p>` : ""}
        </div>
      </button>`).join("");
    let dots = $(".works-dots");
    if (list.length > 1) {
      if (!dots) { dots = document.createElement("div"); dots.className = "works-dots"; $("#works-list").after(dots); }
      dots.innerHTML = list.map((_, i) => `<i class="${i ? "" : "on"}"></i>`).join("");
    } else dots?.remove();
  }

  $("#works-list").addEventListener("scroll", (e) => {
    const el = e.currentTarget, card = el.firstElementChild;
    if (!card) return;
    const i = Math.round(el.scrollLeft / (card.offsetWidth + 12));
    $$(".works-dots i").forEach((d, k) => d.classList.toggle("on", k === i));
  }, { passive: true });

  /* ---------- filtering ---------- */
  document.addEventListener("click", (e) => {
    const chip = e.target.closest("[data-chip]");
    if (chip) { state.cat = chip.dataset.chip; state.sub = ALL; renderGrid(); if (state.cat !== ALL) track("cat", state.cat); return; }
    const sub = e.target.closest("[data-sub]");
    if (sub) { state.sub = sub.dataset.sub; renderGrid(); if (state.sub !== ALL) track("cat", state.sub); return; }
    const tile = e.target.closest("[data-cat]");
    if (tile) {
      state.cat = tile.dataset.cat; state.sub = ALL; renderGrid(); track("cat", state.cat);
      $("#catalog").scrollIntoView({ behavior: "smooth" });
      const chipEl = $(`[data-chip="${CSS.escape(state.cat)}"]`);
      chipEl?.scrollIntoView({ inline: "center", block: "nearest" });
      return;
    }
    const open = e.target.closest("[data-open]");
    if (open) openItem(open.dataset.open);
  });

  /* ---------- detail sheet ---------- */
  const sheet = $("#sheet");
  const track_ = $("#galleryTrack");

  function openItem(id, push = true) {
    const it = state.items.find((i) => i.id === id);
    if (!it) return;
    state.current = it; state.photo = 0;
    const photos = [...(it.photos || [])].sort((a, b) => (b.id === it.cover) - (a.id === it.cover));
    track_.innerHTML = photos.map((p, k) => img(p.id, `${it.title} — фото ${k + 1}`, { size: k ? "t" : "f", eager: k === 0, sizes: "(min-width:1024px) 60vw, 100vw" })).join("");
    $("#thumbs").innerHTML = photos.length > 1 ? photos.map((p, k) => `<button class="${k ? "" : "on"}" data-thumb="${k}" aria-label="Фото ${k + 1}"><img src="${src(p.id, "t")}" alt="" loading="lazy"/></button>`).join("") : "";
    $("#galleryCount").textContent = photos.length > 1 ? `1 / ${photos.length}` : "";
    $("#gPrev").hidden = $("#gNext").hidden = photos.length < 2;

    const isWork = it.kind === "project";
    $("#sheetKicker").textContent = isWork ? (it.projectType || T("workKicker")) : [catName(topOf(it.category)), topOf(it.category) !== it.category ? catName(it.category) : ""].filter(Boolean).join(" · ") || state.settings.tagline || "Мебель на заказ";
    $("#sheetTitle").textContent = it.title;
    $("#sheetDesc").innerHTML = paras(it.description || T("sheetDefaultDesc"));
    const specs = [
      [T("specCategory"), isWork ? catName(it.category) : ""],
      [T("specMaterials"), it.materials],
      [T("specType"), isWork ? "" : it.projectType],
      [T("specWhere"), it.location],
      [T("specYear"), it.year],
      [T("specAuthors"), it.authors],
    ].filter(([, v]) => v);
    $("#sheetSpecs").innerHTML = specs.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("");
    $("#sheetWa").dataset.text = `Здравствуйте! Интересует: «${it.title}». Хочу обсудить похожий проект.`;
    bindContacts();

    showSheet(sheet);
    track("item", it.id);
    if (push) history.pushState({ item: id }, "", "#item-" + id);
  }

  function showSheet(el) {
    el.hidden = false; el.classList.remove("closing");
    document.body.classList.add("lock");
    $(".sheet-scroll", el).scrollTop = 0;
    if (el === sheet) track_.scrollLeft = 0;
    setTimeout(() => $(".sheet-close", el).focus({ preventScroll: true }), 50);
  }
  function hideSheet(el) {
    if (el.hidden) return;
    el.classList.add("closing");
    setTimeout(() => { el.hidden = true; el.classList.remove("closing"); if (!$$(".sheet:not([hidden])").length) document.body.classList.remove("lock"); }, 230);
    if (el === sheet) state.current = null;
  }
  function closeTop() {
    if (history.state?.item) history.back();
    else hideSheet(sheet);
  }

  $$(".sheet [data-close]").forEach((b) => b.addEventListener("click", closeTop));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && document.body.classList.contains("lock")) closeTop();
    if (!sheet.hidden && e.key === "ArrowRight") go(1);
    if (!sheet.hidden && e.key === "ArrowLeft") go(-1);
  });
  window.addEventListener("popstate", (e) => {
    if (e.state?.item) openItem(e.state.item, false);
    else hideSheet(sheet);
  });

  function go(d) {
    const n = track_.children.length;
    if (n < 2) return;
    const i = (Math.round(track_.scrollLeft / track_.clientWidth) + d + n) % n;
    track_.scrollTo({ left: i * track_.clientWidth, behavior: "smooth" });
  }
  $("#gPrev").addEventListener("click", () => go(-1));
  $("#gNext").addEventListener("click", () => go(1));
  $("#thumbs").addEventListener("click", (e) => {
    const b = e.target.closest("[data-thumb]");
    if (b) track_.scrollTo({ left: +b.dataset.thumb * track_.clientWidth, behavior: "smooth" });
  });
  track_.addEventListener("scroll", () => {
    const n = track_.children.length;
    const i = Math.round(track_.scrollLeft / track_.clientWidth);
    if (n > 1) $("#galleryCount").textContent = `${i + 1} / ${n}`;
    $$("#thumbs button").forEach((b, k) => b.classList.toggle("on", k === i));
  }, { passive: true });


  /* ---------- menu ---------- */
  const menu = $("#menu"), menuBtn = $("#menuBtn");
  function setMenu(open) {
    menu.hidden = !open; menuBtn.setAttribute("aria-expanded", String(open));
    header.classList.toggle("menu-open", open);
    document.body.classList.toggle("lock", open);
    menuBtn.innerHTML = open ? '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>' : '<svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h10"/></svg>';
  }
  menuBtn.addEventListener("click", () => setMenu(menu.hidden));
  menu.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });

  /* ---------- scroll effects ---------- */
  const header = $(".header"), bar = $("#actionbar"), hero = $(".hero"), contacts = $("#contacts");
  let contactsVisible = false;
  new IntersectionObserver(([e]) => { contactsVisible = e.isIntersecting; onScroll(); }, { threshold: 0.15 }).observe(contacts);
  function onScroll() {
    const y = scrollY;
    header.classList.toggle("scrolled", y > 10);
    header.classList.toggle("on-hero", y < hero.offsetHeight - header.offsetHeight);
    const show = y > hero.offsetHeight * 0.7 && !contactsVisible;
    bar.classList.toggle("show", show);
    bar.setAttribute("aria-hidden", String(!show));
  }
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", onScroll, { passive: true });
  onScroll();

  let io;
  function observe() {
    if (!("IntersectionObserver" in window)) { $$(".reveal").forEach((el) => el.classList.add("in")); return; }
    io ||= new IntersectionObserver((entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px" });
    $$(".reveal:not(.in)").forEach((el) => io.observe(el));
  }

  /* ---------- load ---------- */
  async function load() {
    try {
      const r = await fetch("api/catalog.json");
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Ошибка");
      Object.assign(state, { categories: data.categories || [], items: data.items || [], settings: data.settings || {}, docs: data.docs || [] });
    } catch (e) {
      console.warn("catalog", e);
    }
    applySettings();
    renderCats();
    renderGrid();
    renderWorks();
    observe();
    const m = location.hash.match(/^#item-(.+)$/);
    if (m) { history.replaceState(null, "", location.pathname); openItem(decodeURIComponent(m[1])); }
  }

  bindContacts();
  load();
  track("view");
})();
