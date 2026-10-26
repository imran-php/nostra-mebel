(() => {
  "use strict";

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const app = $("#app");

  const I = {
    stats: '<svg viewBox="0 0 24 24"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
    sofa: '<svg viewBox="0 0 24 24"><path d="M4 11V8a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v3"/><path d="M2 13a2 2 0 0 1 4 0v2h12v-2a2 2 0 0 1 4 0v5H2z"/><path d="M5 18v2M19 18v2"/></svg>',
    works: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3-3a2 2 0 0 0-3 0l-9 9"/></svg>',
    cats: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>',
    gear: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
    plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
    x: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    back: '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>',
    up: '<svg viewBox="0 0 24 24"><path d="m6 15 6-6 6 6"/></svg>',
    down: '<svg viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>',
    left: '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>',
    right: '<svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>',
    trash: '<svg viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
    star: '<svg viewBox="0 0 24 24"><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z"/></svg>',
    camera: '<svg viewBox="0 0 24 24"><path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13.5" r="3.5"/></svg>',
    ext: '<svg viewBox="0 0 24 24"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>',
    out: '<svg viewBox="0 0 24 24"><path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 16l-4-4 4-4M6 12h10"/></svg>',
    img: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3-3a2 2 0 0 0-3 0l-9 9"/></svg>',
  };

  const state = { db: null, view: "stats", days: 30, stats: null, q: "", showTable: false };

  /* ---------- api ---------- */
  async function api(path, opts = {}) {
    const headers = { "x-nostra": "1", ...(opts.body && !(opts.body instanceof FormData) ? { "Content-Type": "application/json" } : {}) };
    const r = await fetch("/api/admin/" + path, {
      method: opts.method || "GET",
      headers,
      credentials: "same-origin",
      body: opts.body instanceof FormData ? opts.body : opts.body ? JSON.stringify(opts.body) : undefined,
    });
    let data = null;
    try { data = await r.json(); } catch {}
    if (r.status === 401 && path !== "login") { renderLogin(); throw new Error("Требуется вход"); }
    if (!r.ok) throw new Error(data?.error || "Ошибка " + r.status);
    return data;
  }

  /* ---------- toast & dialogs ---------- */
  let toastT;
  function toast(msg, bad = false) {
    const t = $("#toast");
    t.textContent = msg; t.classList.toggle("bad", bad); t.classList.add("on");
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("on"), 2600);
  }
  function confirmDlg(title, text, okLabel = "Удалить", danger = true) {
    return new Promise((resolve) => {
      const d = document.createElement("div");
      d.className = "dlg";
      d.innerHTML = `<div class="dlg-card" role="alertdialog" aria-modal="true"><h3>${esc(title)}</h3>${text ? `<p>${esc(text)}</p>` : ""}<div class="dlg-actions"><button class="btn ${danger ? "btn-danger" : "btn-primary"}" data-ok>${esc(okLabel)}</button><button class="btn btn-outline" data-no>Отмена</button></div></div>`;
      document.body.append(d);
      const done = (v) => { d.remove(); resolve(v); };
      d.addEventListener("click", (e) => { if (e.target === d || e.target.closest("[data-no]")) done(false); if (e.target.closest("[data-ok]")) done(true); });
      $("[data-ok]", d).focus();
    });
  }

  /* ---------- media ---------- */
  function src(id, size = "t") {
    if (!id) return "";
    if (id.startsWith("s:")) return `/nostra-mebel/images/${id.slice(2)}-${size === "t" ? 800 : 1600}.webp`;
    return `/api/media/${encodeURIComponent(id)}${size === "t" ? "?s=t" : ""}`;
  }

  async function encode(canvas) {
    const tryType = (type, q) => new Promise((res) => canvas.toBlob(res, type, q));
    let b = await tryType("image/webp", 0.82);
    if (!b || b.type !== "image/webp") b = await tryType("image/jpeg", 0.85);
    return b;
  }
  async function resize(file, max) {
    let bmp;
    try { bmp = await createImageBitmap(file, { imageOrientation: "from-image" }); }
    catch {
      bmp = await new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => rej(new Error("Не удалось прочитать фото")); im.src = URL.createObjectURL(file); });
    }
    const w0 = bmp.width, h0 = bmp.height;
    const k = Math.min(1, max / Math.max(w0, h0));
    const c = document.createElement("canvas");
    c.width = Math.round(w0 * k); c.height = Math.round(h0 * k);
    const ctx = c.getContext("2d");
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bmp, 0, 0, c.width, c.height);
    return { blob: await encode(c), w: c.width, h: c.height };
  }
  async function upload(file) {
    if (!file.type.startsWith("image/") && !/\.(heic|heif|jpe?g|png|webp)$/i.test(file.name)) throw new Error("Это не изображение");
    const full = await resize(file, 2000);
    const thumb = await resize(file, 800);
    const fd = new FormData();
    const ext = full.blob.type === "image/webp" ? "webp" : "jpg";
    fd.append("full", full.blob, "f." + ext);
    fd.append("thumb", thumb.blob, "t." + ext);
    fd.append("w", full.w); fd.append("h", full.h);
    return api("upload", { method: "POST", body: fd });
  }
  function pickFiles(multiple = true) {
    return new Promise((resolve) => {
      const inp = document.createElement("input");
      inp.type = "file"; inp.accept = "image/*"; inp.multiple = multiple;
      inp.onchange = () => resolve([...inp.files]);
      inp.click();
    });
  }

  /* ---------- login ---------- */
  function renderLogin() {
    document.body.classList.remove("lock");
    app.innerHTML = `
      <main class="login">
        <form class="login-card" id="loginForm">
          <div class="login-logo">NOSTRA</div>
          <p>Управление сайтом</p>
          <label class="field"><span>Пароль</span><input class="input" type="password" name="password" autocomplete="current-password" required autofocus /></label>
          <div class="err" id="loginErr"></div>
          <button class="btn btn-primary btn-block" type="submit">Войти</button>
          <a class="btn btn-ghost btn-block" href="/">Вернуться на сайт</a>
        </form>
      </main>`;
    $("#loginForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = $("button[type=submit]", e.target);
      btn.disabled = true; btn.textContent = "Вход…";
      try {
        await api("login", { method: "POST", body: { password: e.target.password.value } });
        await start();
      } catch (err) {
        $("#loginErr").textContent = err.message;
        btn.disabled = false; btn.textContent = "Войти";
      }
    });
  }

  /* ---------- shell ---------- */
  const TABS = [
    ["stats", "Статистика", I.stats],
    ["furniture", "Каталог", I.sofa],
    ["works", "Работы", I.works],
    ["categories", "Категории", I.cats],
    ["settings", "Настройки", I.gear],
  ];
  const TITLES = { stats: "Статистика", furniture: "Каталог мебели", works: "Готовые работы", categories: "Категории", settings: "Настройки сайта" };

  function renderShell() {
    app.innerHTML = `
      <div class="shell">
        <header class="top">
                    <h1 id="viewTitle"></h1>
          <div class="top-actions">
            <a class="icon-btn" href="/" target="_blank" rel="noopener" aria-label="Открыть сайт" title="Открыть сайт">${I.ext}</a>
            <button class="icon-btn" id="logout" aria-label="Выйти" title="Выйти">${I.out}</button>
          </div>
        </header>
        <main class="main" id="view"></main>
        <nav class="tabbar" aria-label="Разделы">
          ${TABS.map(([id, label, icon]) => `<button class="tab" data-tab="${id}">${icon}<span>${label}</span></button>`).join("")}
        </nav>
      </div>`;
    $$(".tab").forEach((b) => b.addEventListener("click", () => go(b.dataset.tab)));
    $("#logout").addEventListener("click", async () => { await api("logout", { method: "POST" }).catch(() => {}); renderLogin(); });
  }

  function go(view) {
    state.view = view;
    try { history.replaceState(null, "", "/nostra-mebel/admin#" + view); } catch {}
    $$(".tab").forEach((b) => (b.getAttribute("aria-current") === "page" && b.removeAttribute("aria-current"), b.dataset.tab === view && b.setAttribute("aria-current", "page")));
    $("#viewTitle").textContent = TITLES[view];
    scrollTo(0, 0);
    render();
  }

  function render() {
    const v = $("#view");
    if (!v) return;
    ({ stats: viewStats, furniture: () => viewItems("furniture"), works: () => viewItems("project"), categories: viewCategories, settings: viewSettings })[state.view](v);
  }

  /* ---------- stats ---------- */
  const plural = (n, a, b, c) => { const m = n % 10, h = n % 100; return m === 1 && h !== 11 ? a : m >= 2 && m <= 4 && (h < 10 || h >= 20) ? b : c; };
  const fmt = (n) => new Intl.NumberFormat("ru-RU").format(n || 0);
  const dayLabel = (d) => { const [, m, dd] = d.split("-"); return `${+dd}.${m}`; };
  const dayLong = (d) => new Date(d + "T12:00:00").toLocaleDateString("ru-RU", { weekday: "short", day: "numeric", month: "long" });

  async function viewStats(v) {
    v.innerHTML = `
      <div class="row wrap"><div class="seg" id="period">
        ${[[7, "7 дней"], [30, "30 дней"], [90, "90 дней"]].map(([d, l]) => `<button data-d="${d}" aria-pressed="${state.days === d}">${l}</button>`).join("")}
      </div></div>
      <div id="statsBody"><div class="empty">Загрузка…</div></div>`;
    $("#period").addEventListener("click", (e) => {
      const b = e.target.closest("[data-d]");
      if (!b) return;
      state.days = +b.dataset.d; viewStats(v);
    });
    try {
      state.stats = await api("stats?days=" + state.days);
    } catch (e) { $("#statsBody").innerHTML = `<div class="empty">${esc(e.message)}</div>`; return; }
    if (state.view !== "stats") return;
    const s = state.stats, ev = s.ev;
    const callsM = (ev.call_manager || 0), callsO = (ev.call_owner || 0);
    const waM = ev.wa_manager || 0, waO = ev.wa_owner || 0;
    const leads = callsM + callsO + waM + waO;
    const conv = s.totals.visitors ? Math.round((leads / s.totals.visitors) * 1000) / 10 : 0;
    const itemsById = Object.fromEntries(state.db.items.map((i) => [i.id, i]));
    const catsById = Object.fromEntries(state.db.categories.map((c) => [c.id, c]));

    const top = Object.entries(s.items).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const cats = Object.entries(s.cats).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const refs = Object.entries(s.refs).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const dev = s.dev;
    const devTotal = (dev.mobile || 0) + (dev.desktop || 0);

    const blist = (rows, label) => {
      if (!rows.length) return `<div class="empty">Пока нет данных</div>`;
      const max = Math.max(...rows.map((r) => r[1]));
      return `<div class="blist">${rows.map(([k, n]) => {
        const l = label(k);
        return `<div class="bl"><span class="name">${l.img ? `<img src="${src(l.img)}" alt=""/>` : ""}${esc(l.name)}</span><b>${fmt(n)}</b><span class="track"><i style="width:${n ? Math.max(3, (n / max) * 100) : 0}%"></i></span></div>`;
      }).join("")}</div>`;
    };

    const missStats = missingReq(state.db.settings);
    $("#statsBody").innerHTML = (missStats.length ? `<div class="warn" style="margin-top:12px">Для соответствия закону заполните реквизиты продавца (${missStats.join(", ")}). <a href="#" data-goreq>Перейти в настройки</a></div>` : "") + `
      <div class="kpis">
        <div class="kpi"><span>Посетители</span><strong>${fmt(s.totals.visitors)}</strong><small>${fmt(s.totals.views)} ${plural(s.totals.views, "просмотр", "просмотра", "просмотров")}</small></div>
        <div class="kpi accent"><span>Обращения</span><strong>${fmt(leads)}</strong><small>${conv}% посетителей</small></div>
        <div class="kpi"><span>Звонки менеджеру</span><strong>${fmt(callsM)}</strong><small>+ ${fmt(waM)} в мессенджере · проекты</small></div>
        <div class="kpi"><span>Звонки владельцу</span><strong>${fmt(callsO)}</strong><small>+ ${fmt(waO)} в мессенджере · сотрудничество</small></div>
      </div>
      <section class="panel">
        <div class="row"><h2>Посетители по дням</h2><span class="spacer"></span><button class="btn btn-ghost btn-sm" id="tblBtn">${state.showTable ? "График" : "Таблица"}</button></div>
        <p class="hint">Уникальные посетители за день. Нажмите на столбец, чтобы увидеть детали.</p>
        <div id="chartBox"></div>
      </section>
      <div class="stats-grid" style="margin-top:12px">
        <section class="panel"><h2>Популярные модели и работы</h2><p class="hint">Сколько раз открывали карточку</p>
          ${blist(top, (id) => ({ name: itemsById[id]?.title || "Удалённая запись", img: itemsById[id]?.cover }))}</section>
        <section class="panel"><h2>Интерес к категориям</h2><p class="hint">Нажатия на категорию в каталоге</p>
          ${blist(cats, (id) => ({ name: catsById[id]?.name || "Удалённая категория" }))}</section>
        <section class="panel"><h2>Откуда приходят</h2><p class="hint">Первый заход посетителя за день</p>
          ${blist(refs, (k) => ({ name: k }))}</section>
        <section class="panel"><h2>Устройства</h2><p class="hint">С чего смотрят сайт</p>
          ${devTotal ? blist([["Телефон", dev.mobile || 0], ["Компьютер", dev.desktop || 0]], (k) => ({ name: k })) : '<div class="empty">Пока нет данных</div>'}</section>
      </div>
      <p class="hint" style="margin:14px 4px">Статистика обезличена: без cookies и без IP-адресов. Поисковые роботы не учитываются.</p>`;

    const draw = () => {
      const box = $("#chartBox");
      if (state.showTable) {
        box.innerHTML = `<table class="data"><thead><tr><th>День</th><th>Посетители</th><th>Просмотры</th><th>Обращения</th></tr></thead><tbody>${[...s.series].reverse().map((d) => `<tr><td>${dayLong(d.day)}</td><td>${d.visitors}</td><td>${d.views}</td><td>${d.leads}</td></tr>`).join("")}</tbody></table>`;
      } else box.innerHTML = chart(s.series, Math.max(280, box.clientWidth));
      bindChart(box, s.series);
    };
    draw();
    $("[data-goreq]")?.addEventListener("click", (e) => { e.preventDefault(); go("settings"); setTimeout(() => $("#requisites")?.scrollIntoView({ behavior: "smooth" }), 50); });
    $("#tblBtn").addEventListener("click", (e) => { state.showTable = !state.showTable; e.target.textContent = state.showTable ? "График" : "Таблица"; draw(); });
  }

  function chart(series, W = 600) {
    const H = 180, pl = 28, pb = 20, pt = 8;
    const max = Math.max(4, ...series.map((d) => d.visitors));
    const nice = Math.ceil(max / 4) * 4;
    const n = series.length, step = (W - pl) / n, gap = n > 40 ? 1 : 2;
    const bw = Math.max(2, step - gap);
    const y = (v) => pt + (H - pt - pb) * (1 - v / nice);
    const grid = [0, 0.5, 1].map((k) => { const v = Math.round(nice * k); return `<line class="grid" x1="${pl}" x2="${W}" y1="${y(v)}" y2="${y(v)}"/><text class="axis" x="${pl - 6}" y="${y(v) + 3.5}" text-anchor="end">${v}</text>`; }).join("");
    const r = Math.min(4, bw / 2);
    const bars = series.map((d, i) => {
      const x = pl + i * step + gap / 2, top = y(d.visitors), h = H - pb - top;
      const path = h <= 0 ? "" : h < r ? `<rect class="bar" x="${x}" y="${top}" width="${bw}" height="${h}"/>`
        : `<path class="bar" d="M${x},${H - pb} V${top + r} q0,-${r} ${r},-${r} h${bw - 2 * r} q${r},0 ${r},${r} V${H - pb} Z"/>`;
      return `${path}<rect class="hit" data-i="${i}" x="${pl + i * step}" y="${pt}" width="${step}" height="${H - pt}"/>`;
    }).join("");
    const every = Math.ceil(n / 6);
    const labels = series.map((d, i) => (i % every === (n - 1) % every ? `<text class="axis" x="${pl + i * step + step / 2}" y="${H - 4}" text-anchor="middle">${dayLabel(d.day)}</text>` : "")).join("");
    return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Посетители по дням">${grid}${bars}${labels}</svg><div class="tip" id="tip"></div></div>`;
  }
  function bindChart(box, series) {
    const svg = $("svg", box), tip = $("#tip", box);
    if (!svg) return;
    const show = (e) => {
      const hit = e.target.closest(".hit");
      if (!hit) return;
      const d = series[+hit.dataset.i];
      const rb = box.getBoundingClientRect(), rh = hit.getBoundingClientRect();
      tip.innerHTML = `${dayLong(d.day)}<br><b>${d.visitors}</b> посетит. · ${d.views} просм. · <b>${d.leads}</b> обращ.`;
      const x = Math.min(Math.max(rh.left - rb.left + rh.width / 2, 90), rb.width - 90);
      tip.style.left = x + "px"; tip.style.top = "0px"; tip.classList.add("on");
      $$(".bar", svg).forEach((b, i) => b.classList.toggle("dim", false));
    };
    svg.addEventListener("pointermove", show);
    svg.addEventListener("pointerdown", show);
    svg.addEventListener("pointerleave", () => tip.classList.remove("on"));
  }

  /* ---------- items list ---------- */
  const catName = (id) => state.db.categories.find((c) => c.id === id)?.name || "Без категории";

  function viewItems(kind, v = $("#view")) {
    const isWork = kind === "project";
    const all = state.db.items.filter((i) => (i.kind || "furniture") === kind);
    const q = state.q.toLowerCase();
    const list = all.filter((i) => !q || (i.title + " " + catName(i.category) + " " + (i.projectType || "")).toLowerCase().includes(q));
    v.innerHTML = `
      <div class="toolbar">
        ${all.length > 6 ? `<input class="input search" id="q" type="search" placeholder="Поиск" value="${esc(state.q)}"/>` : `<span class="spacer"></span>`}
        <button class="btn btn-primary" id="add">${I.plus}${isWork ? "Добавить работу" : "Добавить мебель"}</button>
      </div>
      ${all.length ? `<div class="items" id="items">${list.map((i, idx) => `
        <div class="item" data-id="${esc(i.id)}" role="button" tabindex="0">
          <div class="th">${i.cover ? `<img src="${src(i.cover)}" alt="" loading="lazy"/>` : I.img}</div>
          <div class="meta">
            <div class="t">${esc(i.title)}</div>
            <div class="s">${esc(isWork ? [i.projectType, i.location].filter(Boolean).join(" · ") || catName(i.category) : catName(i.category))} · ${(i.photos || []).length} фото</div>
            <div class="row" style="gap:6px;margin-top:4px">
              ${i.published ? '<span class="badge">На сайте</span>' : '<span class="badge off">Скрыто</span>'}
              ${i.demo ? '<span class="badge demo">Пример</span>' : ""}
              ${i.featured ? '<span class="badge star">В начале</span>' : ""}
            </div>
          </div>
          <div class="side">
            ${!q ? `<div style="display:grid;gap:4px">
              <button class="icon-btn sm" data-move="-1" aria-label="Выше" ${idx === 0 ? "disabled" : ""}>${I.up}</button>
              <button class="icon-btn sm" data-move="1" aria-label="Ниже" ${idx === list.length - 1 ? "disabled" : ""}>${I.down}</button>
            </div>` : ""}
          </div>
        </div>`).join("")}</div>`
      : `<div class="empty-big"><strong>${isWork ? "Пока нет готовых работ" : "Каталог пуст"}</strong>${isWork ? "Добавьте фотографии реализованного проекта — они появятся в разделе «Готовые работы»." : "Добавьте первую модель: название, категория и фотографии."}<br><button class="btn btn-primary" id="add2">${I.plus}Добавить</button></div>`}`;

    const add = () => openEditor({ kind, title: "", category: isWork ? null : state.db.categories[0]?.id || null, photos: [], published: true });
    $("#add")?.addEventListener("click", add);
    $("#add2")?.addEventListener("click", add);
    $("#q")?.addEventListener("input", (e) => { state.q = e.target.value; const pos = e.target.selectionStart; viewItems(kind, v); const n = $("#q"); n.focus(); n.setSelectionRange(pos, pos); });
    $("#items")?.addEventListener("click", async (e) => {
      const row = e.target.closest(".item");
      if (!row) return;
      const mv = e.target.closest("[data-move]");
      if (mv) {
        e.stopPropagation();
        await moveItem(row.dataset.id, +mv.dataset.move, kind);
        return;
      }
      openEditor(state.db.items.find((i) => i.id === row.dataset.id));
    });
    $("#items")?.addEventListener("keydown", (e) => { if (e.key === "Enter" && e.target.classList.contains("item")) e.target.click(); });
  }

  async function moveItem(id, dir, kind) {
    const items = state.db.items;
    const same = items.filter((i) => (i.kind || "furniture") === kind);
    const idx = same.findIndex((i) => i.id === id);
    const j = idx + dir;
    if (j < 0 || j >= same.length) return;
    [same[idx], same[j]] = [same[j], same[idx]];
    const others = items.filter((i) => (i.kind || "furniture") !== kind);
    state.db.items = [...same, ...others];
    render();
    try { await api("order", { method: "PUT", body: { ids: state.db.items.map((i) => i.id) } }); }
    catch (e) { toast(e.message, true); }
  }

  /* ---------- editor ---------- */
  function openEditor(item) {
    const isNew = !item.id;
    const isWork = item.kind === "project";
    const draft = structuredClone(item);
    draft.photos ||= [];
    const uploadedNow = new Set();
    let dirty = false;

    const ed = document.createElement("div");
    ed.className = "editor";
    ed.setAttribute("role", "dialog");
    ed.setAttribute("aria-modal", "true");
    document.body.append(ed);
    document.body.classList.add("lock");

    const catOptions = () => `<option value="">— Без категории —</option>` + state.db.categories.map((c) => `<option value="${esc(c.id)}" ${draft.category === c.id ? "selected" : ""}>${esc(c.name)}</option>`).join("") + `<option value="__new">+ Новая категория…</option>`;

    ed.innerHTML = `
      <div class="editor-head">
        <button class="icon-btn" data-close aria-label="Закрыть">${I.back}</button>
        <h2>${isNew ? (isWork ? "Новая работа" : "Новая мебель") : esc(draft.title)}</h2>
        ${!isNew ? `<button class="icon-btn" data-del aria-label="Удалить" title="Удалить" style="color:var(--danger)">${I.trash}</button>` : ""}
      </div>
      <div class="editor-body">
        <section class="panel">
          <div class="row" style="margin-bottom:10px"><h2>Фотографии</h2><span class="spacer"></span><span class="hint" id="phCount"></span></div>
          <div class="photos" id="photos"></div>
          <p class="hint" style="margin-top:10px">Первое фото со значком «Обложка» показывается в каталоге. Фото автоматически уменьшаются перед загрузкой.</p>
        </section>
        <section class="panel">
          <label class="field"><span>Название *</span><input class="input" name="title" value="${esc(draft.title)}" placeholder="${isWork ? "Например, Квартира на Красной" : "Например, Кухня в оливковом цвете"}" maxlength="140" required/></label>
          <label class="field"><span>Категория</span><select class="input" name="category">${catOptions()}</select></label>
          ${isWork ? `
          <div class="two">
            <label class="field"><span>Тип объекта</span><input class="input" name="projectType" value="${esc(draft.projectType)}" placeholder="Квартира, дом, офис…"/></label>
            <label class="field"><span>Где</span><input class="input" name="location" value="${esc(draft.location)}" placeholder="Город, район, ЖК"/></label>
            <label class="field"><span>Год</span><input class="input" name="year" value="${esc(draft.year)}" inputmode="numeric" maxlength="4" placeholder="2026"/></label>
            <label class="field"><span>Авторы проекта</span><input class="input" name="authors" value="${esc(draft.authors)}" placeholder="Через запятую"/></label>
          </div>` : ""}
          <label class="field"><span>Описание</span><textarea class="input" name="description" rows="4" placeholder="Пара предложений о проекте: что сделали, для кого, особенности">${esc(draft.description)}</textarea></label>
          <label class="field"><span>Материалы</span><input class="input" name="materials" value="${esc(draft.materials)}" placeholder="МДФ эмаль, шпон ореха, кварцевый камень"/></label>
          ${!isWork ? `<label class="field"><span>Тип объекта</span><input class="input" name="projectType" value="${esc(draft.projectType)}" placeholder="Необязательно — например, квартира"/></label>` : ""}
        </section>
        <section class="panel">
          <label class="switch"><div><b>Показывать на сайте</b><small>Выключите, чтобы скрыть без удаления</small></div><input type="checkbox" name="published" ${draft.published ? "checked" : ""}/></label>
          ${isWork ? `<label class="switch"><div><b>Показывать первой</b><small>Работа будет в начале раздела</small></div><input type="checkbox" name="featured" ${draft.featured ? "checked" : ""}/></label>` : ""}
        </section>
      </div>
      <div class="editor-foot">
        <button class="btn btn-outline" data-close>Отмена</button>
        <button class="btn btn-primary" data-save>Сохранить</button>
      </div>`;

    const form = ed;
    form.addEventListener("input", () => (dirty = true));

    const drawPhotos = () => {
      const box = $("#photos", ed);
      if (!draft.cover || !draft.photos.some((p) => p.id === draft.cover)) draft.cover = draft.photos[0]?.id || null;
      box.innerHTML = draft.photos.map((p, i) => `
        <div class="ph ${p.id === draft.cover ? "cover" : ""} ${p.loading ? "loading" : ""}" data-i="${i}">
          ${p.preview || p.id ? `<img src="${p.preview || src(p.id)}" alt=""/>` : ""}
          ${p.id === draft.cover ? '<span class="cover-tag">Обложка</span>' : ""}
          ${p.loading ? "" : `<div class="ph-actions">
            <button data-ph="left" aria-label="Левее">${I.left}</button>
            ${p.id !== draft.cover ? `<button data-ph="cover" aria-label="Сделать обложкой" title="Сделать обложкой">${I.star}</button>` : ""}
            <button data-ph="del" aria-label="Удалить фото">${I.trash}</button>
          </div>`}
        </div>`).join("") + `<button class="ph-add" id="phAdd" type="button">${I.camera}<span>Добавить фото</span></button>`;
      $("#phCount", ed).textContent = draft.photos.length ? `${draft.photos.length} шт.` : "";
    };
    drawPhotos();

    async function addFiles(files) {
      if (!files.length) return;
      dirty = true;
      const slots = files.map((f) => ({ loading: true, preview: URL.createObjectURL(f), _f: f }));
      draft.photos.push(...slots);
      drawPhotos();
      let fails = 0;
      // по 2 файла параллельно
      const queue = [...slots];
      const worker = async () => {
        while (queue.length) {
          const s = queue.shift();
          try {
            const r = await upload(s._f);
            Object.assign(s, { id: r.id, w: r.w, h: r.h, loading: false });
            uploadedNow.add(r.id);
          } catch (e) {
            fails++; draft.photos.splice(draft.photos.indexOf(s), 1);
            toast(e.message || "Не удалось загрузить фото", true);
          }
          URL.revokeObjectURL(s.preview); delete s.preview; delete s._f;
          drawPhotos();
        }
      };
      await Promise.all([worker(), worker()]);
      if (!fails) toast(files.length > 1 ? `Загружено фото: ${files.length}` : "Фото загружено");
    }

    ed.addEventListener("click", async (e) => {
      if (e.target.closest("#phAdd")) { addFiles(await pickFiles(true)); return; }
      const act = e.target.closest("[data-ph]");
      if (act) {
        const i = +act.closest(".ph").dataset.i;
        const p = draft.photos[i];
        dirty = true;
        if (act.dataset.ph === "cover") { draft.cover = p.id; draft.photos.splice(i, 1); draft.photos.unshift(p); }
        if (act.dataset.ph === "left" && i > 0) [draft.photos[i - 1], draft.photos[i]] = [draft.photos[i], draft.photos[i - 1]];
        if (act.dataset.ph === "del") { draft.photos.splice(i, 1); if (uploadedNow.has(p.id)) { uploadedNow.delete(p.id); api("media/" + encodeURIComponent(p.id), { method: "DELETE" }).catch(() => {}); } }
        drawPhotos();
        return;
      }
      if (e.target.closest("[data-close]")) { close(); return; }
      if (e.target.closest("[data-del]")) {
        if (!(await confirmDlg("Удалить запись?", `«${draft.title}» и её фотографии будут удалены безвозвратно.`))) return;
        try {
          await api("items/" + encodeURIComponent(draft.id), { method: "DELETE" });
          state.db.items = state.db.items.filter((i) => i.id !== draft.id);
          toast("Удалено"); destroy(); render();
        } catch (err) { toast(err.message, true); }
        return;
      }
      if (e.target.closest("[data-save]")) save(e.target.closest("[data-save]"));
    });

    // drag & drop on desktop
    ed.addEventListener("dragover", (e) => { e.preventDefault(); $("#phAdd", ed)?.classList.add("drag"); });
    ed.addEventListener("dragleave", () => $("#phAdd", ed)?.classList.remove("drag"));
    ed.addEventListener("drop", (e) => { e.preventDefault(); $("#phAdd", ed)?.classList.remove("drag"); addFiles([...e.dataTransfer.files].filter((f) => f.type.startsWith("image/"))); });

    $("select[name=category]", ed).addEventListener("change", async (e) => {
      if (e.target.value !== "__new") return;
      const name = prompt("Название новой категории");
      if (name && name.trim()) {
        const c = { id: "c" + Date.now().toString(36), name: name.trim(), cover: null };
        try {
          state.db.categories = await api("categories", { method: "PUT", body: { categories: [...state.db.categories, c] } });
          draft.category = c.id;
          toast("Категория добавлена");
        } catch (err) { toast(err.message, true); }
      }
      e.target.innerHTML = catOptions();
    });

    const onKey = (e) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);

    function collect() {
      const val = (n) => $(`[name=${n}]`, ed)?.value ?? draft[n] ?? "";
      const chk = (n) => $(`[name=${n}]`, ed)?.checked ?? !!draft[n];
      return {
        kind: draft.kind, title: val("title").trim(), category: val("category") === "__new" ? null : val("category") || null,
        description: val("description"), materials: val("materials"), projectType: val("projectType"), location: val("location"),
        authors: val("authors"), year: val("year"), published: chk("published"), featured: chk("featured"),
        photos: draft.photos.filter((p) => p.id && !p.loading).map(({ id, w, h }) => ({ id, w, h })), cover: draft.cover,
      };
    }

    async function save(btn) {
      if (draft.photos.some((p) => p.loading)) { toast("Дождитесь загрузки фото", true); return; }
      const body = collect();
      if (!body.title) { toast("Укажите название", true); $("[name=title]", ed).focus(); return; }
      if (!body.photos.length && body.published && !(await confirmDlg("Нет фотографий", "Запись без фото будет выглядеть пусто. Сохранить всё равно?", "Сохранить", false))) return;
      btn.disabled = true; btn.textContent = "Сохранение…";
      try {
        const saved = isNew ? await api("items", { method: "POST", body }) : await api("items/" + encodeURIComponent(draft.id), { method: "PUT", body });
        if (isNew) state.db.items.unshift(saved);
        else state.db.items[state.db.items.findIndex((i) => i.id === saved.id)] = saved;
        uploadedNow.clear();
        toast(saved.published ? "Сохранено и опубликовано" : "Сохранено (скрыто)");
        destroy(); render();
      } catch (err) {
        toast(err.message, true);
        btn.disabled = false; btn.textContent = "Сохранить";
      }
    }

    async function close() {
      if (dirty && !(await confirmDlg("Закрыть без сохранения?", "Изменения будут потеряны.", "Закрыть"))) return;
      for (const id of uploadedNow) api("media/" + encodeURIComponent(id), { method: "DELETE" }).catch(() => {});
      destroy();
    }
    function destroy() {
      document.removeEventListener("keydown", onKey);
      ed.remove();
      if (!$(".editor")) document.body.classList.remove("lock");
    }
    if (isNew) setTimeout(() => $("[name=title]", ed).focus({ preventScroll: true }), 300);
  }

  /* ---------- categories ---------- */
  function viewCategories(v) {
    const cats = state.db.categories;
    const count = (id) => state.db.items.filter((i) => i.category === id).length;
    v.innerHTML = `
      <p class="hint" style="margin:0 4px 12px">Категории показываются на сайте плитками и фильтрами каталога. Плитка без своей обложки берёт фото первой модели.</p>
      <div id="catList">${cats.map((c, i) => `
        <div class="cat-row" data-id="${esc(c.id)}">
          <div class="ph" data-cover role="button" aria-label="Обложка категории" title="Обложка">${c.cover ? `<img src="${src(c.cover)}" alt=""/>` : I.camera}</div>
          <div><input class="input" data-name value="${esc(c.name)}" maxlength="60" aria-label="Название категории"/><div class="cat-count">${count(c.id)} ${plural(count(c.id), "запись", "записи", "записей")}${c.cover ? ' · <button class="link" data-uncover style="border:0;background:none;padding:0;color:var(--danger);cursor:pointer;font-size:12px">убрать обложку</button>' : ""}</div></div>
          <div class="acts">
            <button class="icon-btn sm" data-mv="-1" aria-label="Выше" ${i === 0 ? "disabled" : ""}>${I.up}</button>
            <button class="icon-btn sm" data-mv="1" aria-label="Ниже" ${i === cats.length - 1 ? "disabled" : ""}>${I.down}</button>
            <button class="icon-btn sm" data-rm aria-label="Удалить" style="color:var(--danger)">${I.trash}</button>
          </div>
        </div>`).join("")}</div>
      <form class="row" id="newCat" style="margin-top:14px">
        <input class="input" name="name" placeholder="Новая категория, например «Ванные»" maxlength="60" required/>
        <button class="btn btn-primary" type="submit">${I.plus}<span>Добавить</span></button>
      </form>`;

    const saveCats = async (next, msg = "Сохранено") => {
      try {
        state.db.categories = await api("categories", { method: "PUT", body: { categories: next } });
        const ids = new Set(state.db.categories.map((c) => c.id));
        state.db.items.forEach((i) => { if (i.category && !ids.has(i.category)) i.category = null; });
        toast(msg); viewCategories(v);
      } catch (e) { toast(e.message, true); }
    };

    $("#newCat").addEventListener("submit", (e) => {
      e.preventDefault();
      const name = e.target.name.value.trim();
      if (!name) return;
      if (cats.some((c) => c.name.toLowerCase() === name.toLowerCase())) { toast("Такая категория уже есть", true); return; }
      saveCats([...cats, { id: "c" + Date.now().toString(36), name, cover: null }], "Категория добавлена");
    });

    $("#catList").addEventListener("change", (e) => {
      const inp = e.target.closest("[data-name]");
      if (!inp) return;
      const id = inp.closest(".cat-row").dataset.id;
      const name = inp.value.trim();
      if (!name) { inp.value = cats.find((c) => c.id === id).name; return; }
      saveCats(cats.map((c) => (c.id === id ? { ...c, name } : c)), "Название сохранено");
    });

    $("#catList").addEventListener("click", async (e) => {
      const row = e.target.closest(".cat-row");
      if (!row) return;
      const id = row.dataset.id, idx = cats.findIndex((c) => c.id === id);
      const mv = e.target.closest("[data-mv]");
      if (mv) {
        const j = idx + +mv.dataset.mv, next = [...cats];
        [next[idx], next[j]] = [next[j], next[idx]];
        saveCats(next, "Порядок сохранён");
      }
      if (e.target.closest("[data-rm]")) {
        const n = count(id);
        if (!(await confirmDlg(`Удалить категорию «${cats[idx].name}»?`, n ? `${n} записей останутся без категории — их можно будет перенести в другую.` : ""))) return;
        saveCats(cats.filter((c) => c.id !== id), "Категория удалена");
      }
      if (e.target.closest("[data-uncover]")) saveCats(cats.map((c) => (c.id === id ? { ...c, cover: null } : c)), "Обложка убрана");
      if (e.target.closest("[data-cover]")) {
        const [f] = await pickFiles(false);
        if (!f) return;
        const ph = $("[data-cover]", row); ph.classList.add("loading");
        try {
          const r = await upload(f);
          saveCats(cats.map((c) => (c.id === id ? { ...c, cover: r.id } : c)), "Обложка обновлена");
        } catch (err) { toast(err.message, true); ph.classList.remove("loading"); }
      }
    });
  }

  /* ---------- settings ---------- */
  function viewSettings(v) {
    const s = state.db.settings;
    const f = (name, label, opts = {}) => {
      const val = esc(s[name] ?? "");
      const input = opts.area
        ? `<textarea class="input" name="${name}" rows="${opts.rows || 4}" placeholder="${esc(opts.ph || "")}">${val}</textarea>`
        : `<input class="input" name="${name}" value="${val}" placeholder="${esc(opts.ph || "")}" ${opts.type ? `type="${opts.type}"` : ""} ${opts.mode ? `inputmode="${opts.mode}"` : ""}/>`;
      return `<label class="field"><span>${label}</span>${input}${opts.hint ? `<small>${opts.hint}</small>` : ""}</label>`;
    };
    const imgField = (name, label) => `
      <div class="field"><span>${label}</span><div class="single-photo" data-img="${name}">
        <div class="ph">${s[name] ? `<img src="${src(s[name])}" alt=""/>` : ""}</div>
        <div class="row wrap"><button class="btn btn-outline btn-sm" type="button" data-pick="${name}">${I.camera}Заменить фото</button></div>
      </div></div>`;
    const facts = s.facts?.length ? s.facts : [{}, {}, {}];

    v.innerHTML = `
      <form id="settingsForm" class="stack">
        <p class="section-title">Контакты для связи</p>
        <section class="panel">
          ${f("managerPhone", "Телефон менеджера — кнопки «Обсудить проект»", { type: "tel", mode: "tel", hint: "На этот номер звонят клиенты по проектам" })}
          ${f("ownerPhone", "Телефон владельца — кнопки «Сотрудничество»", { type: "tel", mode: "tel", hint: "На этот номер звонят партнёры и дизайнеры" })}
        </section>
        <section class="panel">
          <h2>Кнопка мессенджера</h2>
          <p class="hint" style="margin-bottom:12px">Показывается рядом с кнопкой звонка. WhatsApp в России с февраля 2026 года заблокирован, поэтому у большинства посетителей он не откроется — лучше выбрать MAX или Telegram.</p>
          <label class="field"><span>Мессенджер</span>
            <select class="input" name="messenger">
              ${[["whatsapp", "WhatsApp"], ["telegram", "Telegram"], ["max", "MAX"], ["none", "Не показывать"]].map(([v, l]) => `<option value="${v}" ${(s.messenger || (s.whatsapp === false ? "none" : "whatsapp")) === v ? "selected" : ""}>${l}</option>`).join("")}
            </select></label>
          ${f("managerMsgUrl", "Ссылка на мессенджер менеджера", { ph: "@username или https://…", hint: "Для Telegram можно оставить пустым — откроется чат по номеру телефона. Для MAX нужна ссылка на профиль (в MAX: Профиль → Поделиться)." })}
          ${f("ownerMsgUrl", "Ссылка на мессенджер владельца", { ph: "@username или https://…" })}
        </section>
        <section class="panel">
          <div class="two">
            ${f("instagram", "Instagram", { ph: "@nostra или ссылка" })}
            ${f("telegram", "Telegram", { ph: "@nostra" })}
            ${f("address", "Адрес / шоурум", { ph: "Город, улица, дом" })}
            ${f("hours", "Часы работы", { ph: "Пн–Сб, 10:00–19:00" })}
          </div>
          ${f("email", "Почта", { type: "email", ph: "info@…" })}
        </section>

        <p class="section-title">Главный экран</p>
        <section class="panel">
          ${imgField("heroImage", "Фото на главном экране")}
          ${f("heroEyebrow", "Надпись над заголовком")}
          ${f("heroTitle", "Заголовок", { hint: "Слово в *звёздочках* будет выделено курсивом" })}
          ${f("heroText", "Подзаголовок", { area: true, rows: 2 })}
        </section>

        <p class="section-title">Блоки связи</p>
        <section class="panel">
          ${f("projectTitle", "Заголовок блока менеджера")}
          ${f("projectText", "Текст блока менеджера", { area: true, rows: 2 })}
          ${f("coopTitle", "Заголовок блока сотрудничества")}
          ${f("coopText", "Текст блока сотрудничества", { area: true, rows: 2 })}
        </section>

        <p class="section-title">О компании</p>
        <section class="panel">
          ${imgField("aboutImage", "Фото в блоке «О нас»")}
          ${f("about", "Текст «О нас»", { area: true, rows: 5, hint: "Каждый абзац — с новой строки" })}
          <div class="field"><span>Цифры (необязательно)</span><small>Показываются, только если заполнены оба поля. Например: «12 лет» — «на рынке».</small>
            ${facts.map((x, i) => `<div class="row" style="margin-top:6px"><input class="input" data-fact-v="${i}" value="${esc(x.value || "")}" placeholder="350+" style="max-width:110px"/><input class="input" data-fact-l="${i}" value="${esc(x.label || "")}" placeholder="проектов"/></div>`).join("")}
          </div>
          ${f("steps", "Как мы работаем", { area: true, rows: 5, hint: "Один этап на строку в формате «Название — описание». Пустое поле скроет блок." })}
        </section>

        <p class="section-title">Бренд и реквизиты</p>
        <section class="panel">
          <div class="two">
            ${f("brandName", "Название бренда")}
            ${f("tagline", "Подпись под логотипом")}
          </div>
        </section>
        <p class="section-title" id="requisites">Реквизиты продавца</p>
        <section class="panel">
          <p class="hint" style="margin-bottom:12px">Обязательны по закону «О защите прав потребителей» и 152-ФЗ. Подставляются в подвал и во все документы автоматически.</p>
          <label class="field"><span>Форма</span>
            <select class="input" name="operatorType">
              <option value="ip" ${s.operatorType !== "org" ? "selected" : ""}>Индивидуальный предприниматель</option>
              <option value="org" ${s.operatorType === "org" ? "selected" : ""}>Организация (ООО и др.)</option>
            </select></label>
          ${f("operatorName", "Полное наименование *", { ph: "ИП Иванов Иван Иванович или ООО «Ностра»" })}
          <div class="two">
            ${f("inn", "ИНН *", { mode: "numeric" })}
            ${f("ogrn", "ОГРНИП / ОГРН *", { mode: "numeric" })}
          </div>
          ${f("regAuthority", "Сведения о регистрации", { ph: "Зарегистрирован Межрайонной ИФНС России № … 01.02.2020", hint: "Кто и когда зарегистрировал ИП или организацию — есть в листе записи ЕГРИП/ЕГРЮЛ" })}
          ${f("operatorAddress", "Адрес (юридический / место нахождения) *", { ph: "350000, г. Краснодар, ул. …, д. …" })}
          <p class="hint">Почту для обращений по персональным данным и часы работы заполните в блоке «Контакты» выше — они тоже обязательны.</p>
        </section>

        <div class="row" style="position:sticky;bottom:calc(var(--tabbar-h) + var(--safe-b) + 8px);margin-top:16px">
          <button class="btn btn-primary btn-block" type="submit" id="saveSettings" style="box-shadow:0 6px 20px rgba(42,47,30,.25)">Сохранить настройки</button>
        </div>
      </form>

      <p class="section-title">Документы в подвале сайта</p>
      <section class="panel" id="docsPanel">
        <p class="hint" style="margin-bottom:12px">Тексты подготовлены по шаблону и сами подставляют реквизиты. Перед запуском проверьте их — при необходимости покажите юристу.</p>
        <div class="items" id="docsList">${(state.db.docs || []).map((d) => `
          <div class="item" data-doc="${esc(d.id)}" role="button" tabindex="0" style="grid-template-columns:1fr auto">
            <div class="meta"><div class="t">${esc(d.title)}</div>
              <div class="row" style="gap:6px;margin-top:4px">${d.published ? '<span class="badge">На сайте</span>' : '<span class="badge off">Скрыт</span>'}<span class="s">изм. ${new Date(d.updatedAt).toLocaleDateString("ru-RU")}</span></div></div>
            <a class="icon-btn sm" href="/docs/${esc(d.id)}" target="_blank" rel="noopener" aria-label="Открыть на сайте" title="Открыть на сайте" data-open-doc>${I.ext}</a>
          </div>`).join("")}</div>
      </section>

      <p class="section-title">Безопасность</p>
      <form class="panel" id="pwForm">
        <h2>Сменить пароль</h2>
        <p class="hint" style="margin-bottom:12px">После смены все другие устройства выйдут из админки.</p>
        <label class="field"><span>Текущий пароль</span><input class="input" type="password" name="current" autocomplete="current-password" required/></label>
        <label class="field"><span>Новый пароль</span><input class="input" type="password" name="next" autocomplete="new-password" minlength="8" required/><small>Минимум 8 символов</small></label>
        <button class="btn btn-outline btn-block" type="submit">Сменить пароль</button>
      </form>
      <section class="panel">
        <h2>Резервная копия</h2>
        <p class="hint" style="margin-bottom:12px">Файл со всеми текстами, категориями и списком фото.</p>
        <a class="btn btn-outline btn-block" href="/api/admin/export" download>Скачать копию данных</a>
      </section>`;

    const form = $("#settingsForm");
    const pending = {};
    const miss = missingReq(s);
    if (miss.length) form.insertAdjacentHTML("afterbegin", `<div class="warn">Не заполнены реквизиты: ${miss.join(", ")}. Без них документы на сайте показывают пустые места и не соответствуют требованиям закона. <a href="#requisites">Заполнить</a></div>`);
    $("#docsList").addEventListener("click", (e) => {
      if (e.target.closest("[data-open-doc]")) return;
      const row = e.target.closest("[data-doc]");
      if (row) openDocEditor(state.db.docs.find((d) => d.id === row.dataset.doc));
    });
    form.addEventListener("click", async (e) => {
      const b = e.target.closest("[data-pick]");
      if (!b) return;
      const key = b.dataset.pick;
      const [file] = await pickFiles(false);
      if (!file) return;
      const box = $(`[data-img="${key}"] .ph`, form);
      box.classList.add("loading");
      try {
        const r = await upload(file);
        pending[key] = r.id;
        box.innerHTML = `<img src="${src(r.id)}" alt=""/>`;
        toast("Фото загружено — нажмите «Сохранить настройки»");
      } catch (err) { toast(err.message, true); }
      box.classList.remove("loading");
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = $("#saveSettings");
      const body = {};
      $$("input[name], textarea[name], select[name]", form).forEach((el) => (body[el.name] = el.type === "checkbox" ? el.checked : el.value));
      body.facts = facts.map((_, i) => ({ value: $(`[data-fact-v="${i}"]`, form).value, label: $(`[data-fact-l="${i}"]`, form).value }));
      Object.assign(body, pending);
      btn.disabled = true; btn.textContent = "Сохранение…";
      try {
        state.db.settings = await api("settings", { method: "PUT", body });
        toast("Настройки сохранены");
      } catch (err) { toast(err.message, true); }
      btn.disabled = false; btn.textContent = "Сохранить настройки";
    });

    $("#pwForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      try {
        await api("password", { method: "POST", body: { current: e.target.current.value, next: e.target.next.value } });
        e.target.reset(); toast("Пароль изменён");
      } catch (err) { toast(err.message, true); }
    });
  }

  /* ---------- documents ---------- */
  const REQ_LABELS = { operatorName: "наименование", inn: "ИНН", ogrn: "ОГРН/ОГРНИП", operatorAddress: "адрес", email: "почта" };
  const missingReq = (s) => Object.keys(REQ_LABELS).filter((k) => !String(s?.[k] || "").trim()).map((k) => REQ_LABELS[k]);

  function openDocEditor(doc) {
    const ed = document.createElement("div");
    ed.className = "editor";
    ed.setAttribute("role", "dialog");
    ed.setAttribute("aria-modal", "true");
    ed.innerHTML = `
      <div class="editor-head">
        <button class="icon-btn" data-close aria-label="Закрыть">${I.back}</button>
        <h2>${esc(doc.title)}</h2>
        <a class="icon-btn" href="/docs/${esc(doc.id)}" target="_blank" rel="noopener" aria-label="Открыть на сайте" title="Открыть на сайте">${I.ext}</a>
      </div>
      <div class="editor-body">
        <section class="panel">
          <label class="field"><span>Название</span><input class="input" name="title" value="${esc(doc.title)}" maxlength="160"/></label>
          <label class="field"><span>Текст</span><textarea class="input doc-text" name="text" rows="22">${esc(doc.text)}</textarea>
            <small>«## » в начале строки — заголовок, «- » — пункт списка, пустая строка — новый абзац. Подстановки из реквизитов: {{name}}, {{inn}}, {{ogrn}}, {{ogrnLabel}}, {{address}}, {{email}}, {{phone}}, {{hours}}, {{regAuthority}}, {{site}}, {{brand}}, {{date}} — дата последнего изменения.</small></label>
          <label class="switch"><div><b>Показывать на сайте</b><small>Ссылка появится в подвале</small></div><input type="checkbox" name="published" ${doc.published ? "checked" : ""}/></label>
        </section>
        <section class="panel"><button class="btn btn-ghost btn-block" data-reset type="button">Вернуть исходный шаблон</button></section>
      </div>
      <div class="editor-foot">
        <button class="btn btn-outline" data-close>Отмена</button>
        <button class="btn btn-primary" data-save>Сохранить</button>
      </div>`;
    document.body.append(ed);
    document.body.classList.add("lock");
    let dirty = false;
    ed.addEventListener("input", () => (dirty = true));
    const destroy = () => { ed.remove(); if (!$(".editor")) document.body.classList.remove("lock"); };
    const replace = (saved) => { state.db.docs[state.db.docs.findIndex((d) => d.id === saved.id)] = saved; destroy(); render(); };
    ed.addEventListener("click", async (e) => {
      if (e.target.closest("[data-close]")) { if (!dirty || (await confirmDlg("Закрыть без сохранения?", "Изменения будут потеряны.", "Закрыть"))) destroy(); return; }
      if (e.target.closest("[data-reset]")) {
        if (!(await confirmDlg("Вернуть исходный шаблон?", "Ваши правки в этом документе будут заменены исходным текстом.", "Вернуть"))) return;
        try { replace(await api(`docs/${encodeURIComponent(doc.id)}/reset`, { method: "POST" })); toast("Шаблон восстановлен"); } catch (err) { toast(err.message, true); }
        return;
      }
      const b = e.target.closest("[data-save]");
      if (b) {
        b.disabled = true; b.textContent = "Сохранение…";
        try {
          replace(await api(`docs/${encodeURIComponent(doc.id)}`, { method: "PUT", body: { title: $("[name=title]", ed).value, text: $("[name=text]", ed).value, published: $("[name=published]", ed).checked } }));
          toast("Документ сохранён");
        } catch (err) { toast(err.message, true); b.disabled = false; b.textContent = "Сохранить"; }
      }
    });
  }

  /* ---------- start ---------- */
  async function start() {
    state.db = await api("data");
    renderShell();
    const h = location.hash.slice(1);
    go(TITLES[h] ? h : "stats");
  }

  (async () => {
    try { await api("me"); await start(); }
    catch { if (!$(".login")) renderLogin(); }
  })();
})();
