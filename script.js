/* ===== Данные: страница рисуется из этих массивов ===== */
const services = [
  { name: "Мужская стрижка",    price: 6000, note: "Машинка и ножницы, мытьё головы, укладка. 45 минут" },
  { name: "Оформление бороды",  price: 4000, note: "Форма, контур, горячее полотенце. 30 минут" },
  { name: "Стрижка и борода",   price: 9000, note: "Полный комплект со скидкой. 75 минут" },
  { name: "Детская стрижка",    price: 4500, note: "До 12 лет. 30 минут" },
  { name: "Королевское бритьё", price: 5500, note: "Опасная бритва, горячие компрессы. 40 минут" }
];
const masters = [
  { name: "Ерлан Сеитов",   role: "Старший барбер", text: "Классические и офисные стрижки. Девять лет у кресла." },
  { name: "Данияр Ахметов", role: "Барбер",         text: "Фейды, текстура, современные формы. Любит сложные задачи." },
  { name: "Артём Волков",   role: "Мастер бороды",  text: "Борода, бритьё, уход. Если борода выглядит сама по себе, это его работа." }
];
const times = [];
for (let h = 10; h <= 20; h++) times.push(String(h).padStart(2, "0") + ":00");

/* ===== Помощники ===== */
const $ = id => document.getElementById(id);
const fmt = n => n.toLocaleString("ru-RU").replace(/\u00a0/g, " ") + " ₸";
const escapeHtml = s => s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/* ===== Рендер страницы ===== */
$("menu").innerHTML = services.map(s => `
  <li>
    <div class="top"><span class="name">${s.name}</span><span class="dots"></span><span class="price">${fmt(s.price)}</span></div>
    <p class="note">${s.note}</p>
  </li>`).join("");

$("masterList").innerHTML = masters.map(m => `
  <article class="master">
    <div class="mono" aria-hidden="true">${m.name.split(" ").map(w => w[0]).join("")}</div>
    <div><h3>${m.name}</h3><div class="role">${m.role}</div><p>${m.text}</p></div>
  </article>`).join("");

services.forEach(s => $("service").add(new Option(`${s.name} — ${fmt(s.price)}`, s.name)));
masters.forEach(m => $("master").add(new Option(m.name, m.name)));
times.forEach(t => $("time").add(new Option(t, t)));

/* ===== Мобильное меню ===== */
const nav = $("nav");
const toggle = $("navToggle");

function setMenu(open) {
  nav.classList.toggle("open", open);
  toggle.setAttribute("aria-expanded", String(open));
  toggle.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
}
toggle.addEventListener("click", () => setMenu(!nav.classList.contains("open")));
nav.querySelectorAll("a").forEach(a => a.addEventListener("click", () => setMenu(false)));
document.addEventListener("keydown", e => { if (e.key === "Escape") setMenu(false); });

/* ===== Тень у шапки при прокрутке ===== */
const header = $("header");
const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 8);
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

/* ===== Подсветка текущего раздела в меню ===== */
const links = [...nav.querySelectorAll('a:not(.btn)')];
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    links.forEach(a => a.removeAttribute("aria-current"));
    const active = links.find(a => a.getAttribute("href") === "#" + entry.target.id);
    if (active) active.setAttribute("aria-current", "true");
  });
}, { rootMargin: "-40% 0px -55% 0px" });
["services", "masters", "contacts"].forEach(id => observer.observe($(id)));

/* ===== Дата: минимум — сегодня (по локальному времени) ===== */
const now = new Date();
const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
$("date").min = today;

/* ===== Маска телефона: +7 XXX XXX XX XX ===== */
function formatPhone(value) {
  let d = value.replace(/\D/g, "");
  if (!d) return "";
  if (d[0] === "8") d = "7" + d.slice(1);
  if (d[0] !== "7") d = "7" + d;
  d = d.slice(0, 11);
  let out = "+7";
  if (d.length > 1) out += " " + d.slice(1, 4);
  if (d.length > 4) out += " " + d.slice(4, 7);
  if (d.length > 7) out += " " + d.slice(7, 9);
  if (d.length > 9) out += " " + d.slice(9, 11);
  return out;
}
$("phone").addEventListener("input", e => { e.target.value = formatPhone(e.target.value); });

/* ===== Запоминаем имя и телефон между визитами (localStorage) ===== */
const STORE_KEY = "northBarberClient";
function loadClient() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch { return {}; }
}
function saveClient(data) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(data)); } catch { /* хранилище недоступно, не критично */ }
}
const saved = loadClient();
if (saved.name) $("name").value = saved.name;
if (saved.phone) $("phone").value = saved.phone;

/* ===== Валидация ===== */
const rules = {
  name:    v => v.trim().length < 2 ? "Введите имя, минимум 2 буквы" : "",
  phone:   v => v.replace(/\D/g, "").length < 11 ? "Введите номер полностью, 11 цифр" : "",
  service: v => !v ? "Выберите услугу" : "",
  date:    v => !v ? "Выберите дату" : (v < today ? "Дата уже прошла, выберите сегодняшнюю или позже" : ""),
  time:    v => !v ? "Выберите время" : ""
};
const fields = Object.keys(rules);

function check(field) {
  const el = $(field);
  const msg = rules[field](el.value);
  $("err-" + field).textContent = msg;
  el.setAttribute("aria-invalid", msg ? "true" : "false");
  return !msg;
}

fields.forEach(f => {
  $(f).addEventListener("blur", () => check(f));
  $(f).addEventListener("input", () => { if ($(f).getAttribute("aria-invalid") === "true") check(f); });
});

/* ===== Отправка ===== */
$("form").addEventListener("submit", e => {
  e.preventDefault();
  const results = fields.map(check);   // проверяем все поля, чтобы показать все ошибки сразу
  if (results.includes(false)) {
    $(fields.find(f => $(f).getAttribute("aria-invalid") === "true")).focus();
    return;
  }

  saveClient({ name: $("name").value.trim(), phone: $("phone").value });

  const d = new Date($("date").value + "T00:00");
  const dateText = d.toLocaleDateString("ru-RU", { day: "numeric", month: "long", weekday: "long" });
  const rows = [
    ["Услуга", $("service").value],
    ["Мастер", $("master").value],
    ["Когда", `${dateText}, ${$("time").value}`],
    ["Телефон", $("phone").value]
  ];
  $("okText").textContent = `${$("name").value.trim()}, ждём вас в North Barber. Подтверждение придёт на указанный номер.`;
  $("okList").innerHTML = rows.map(([k, v]) => `<dt>${k}</dt><dd>${escapeHtml(v)}</dd>`).join("");
  $("form").hidden = true;
  $("ok").hidden = false;
  $("ok").scrollIntoView({ behavior: "smooth", block: "center" });
});

$("again").addEventListener("click", () => {
  $("form").reset();
  document.querySelectorAll("[aria-invalid]").forEach(el => el.removeAttribute("aria-invalid"));
  document.querySelectorAll(".err").forEach(el => { el.textContent = ""; });
  const s = loadClient();                       // имя и телефон подставляем заново
  if (s.name) $("name").value = s.name;
  if (s.phone) $("phone").value = s.phone;
  $("ok").hidden = true;
  $("form").hidden = false;
  $("service").focus();
});
