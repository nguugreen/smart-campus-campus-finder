const DATA_URL = "data/places.json";
const FAVORITES_KEY = "campusFinderFavorites";
const SUGGESTIONS_KEY = "campusFinderSuggestions";

const IMAGE_FOLDER = "image/";
const IMAGE_EXTENSIONS = /\.(jpe?g|png|webp|gif|avif|svg)$/i;

function getImageUrl(fileName) {
  const name = String(fileName || "").trim().replace(/^\.?\/?image\//i, "");
  if (!name) return "";

  if (/[\\/]/.test(name) || name.includes("..") || !IMAGE_EXTENSIONS.test(name)) {
    console.warn(`ชื่อไฟล์รูปไม่ถูกต้อง: "${fileName}" — ให้ใส่เฉพาะชื่อไฟล์ เช่น "building11.jpg"`);
    return "";
  }

  return IMAGE_FOLDER + encodeURIComponent(name);
}

function placeImageMarkup(place, { eager = false } = {}) {
  const src = getImageUrl(place.image);
  if (!src) return "";
  return `<img class="place-image" src="${escapeHTML(src)}" alt="รูปภาพ ${escapeHTML(place.name)}" loading="${eager ? "eager" : "lazy"}" decoding="async">`;
}

document.addEventListener("error", event => {
  const img = event.target;
  if (!(img instanceof HTMLImageElement) || !img.classList.contains("place-image")) return;
  console.warn(`ไม่พบไฟล์รูป: ${img.getAttribute("src")} — ตรวจสอบชื่อไฟล์ในโฟลเดอร์ image/`);
  img.parentElement?.classList.remove("has-image");
  img.remove();
}, true);

async function loadPlaces() {
  const response = await fetch(DATA_URL);
  if (!response.ok) throw new Error(`โหลดข้อมูลไม่สำเร็จ (${response.status})`);
  return response.json();
}

function getFavorites() {
  try { return JSON.parse(localStorage.getItem(FAVORITES_KEY)) || []; }
  catch { return []; }
}

function saveFavorites(ids) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify([...new Set(ids)]));
}

function toggleFavorite(id) {
  const favorites = getFavorites();
  const updated = favorites.includes(id) ? favorites.filter(item => item !== id) : [...favorites, id];
  saveFavorites(updated);
  return updated.includes(id);
}

function isOpenNow(place) {
  if (!place.open || !place.close) return null;
  const now = new Date();
  const current = now.getHours() * 60 + now.getMinutes();
  const [openHour, openMinute] = place.open.split(":").map(Number);
  const [closeHour, closeMinute] = place.close.split(":").map(Number);
  const opening = openHour * 60 + openMinute;
  const closing = closeHour * 60 + closeMinute;
  return closing < opening ? (current >= opening || current < closing) : (current >= opening && current < closing);
}

function statusMarkup(place) {
  const open = isOpenNow(place);
  if (open === null) return '<span class="status">ไม่ระบุเวลา</span>';
  return open ? '<span class="status open">เปิดอยู่</span>' : '<span class="status closed">ปิดแล้ว</span>';
}

function iconForType(type) {
  return ({ "อาคารเรียน": "▦", "สำนักงาน": "▤", "จุดบริการ": "＋", "ร้านอาหาร": "⌁" })[type] || "⌖";
}

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

function placeCard(place) {
  const favorite = getFavorites().includes(place.id);
  const image = placeImageMarkup(place);

  return `
    <article class="place-card">
      <div class="place-visual${image ? " has-image" : ""}">
        ${image}
        <span class="visual-zone">โซน ${escapeHTML(place.zone || "-")}</span>
        <span class="visual-icon" aria-hidden="true">${iconForType(place.type)}</span>
        <button class="favorite-btn ${favorite ? "is-favorite" : ""}" type="button"
                data-favorite="${escapeHTML(place.id)}"
                aria-label="${favorite ? "นำออกจากรายการโปรด" : "เพิ่มในรายการโปรด"}"
                aria-pressed="${favorite}">${favorite ? "♥" : "♡"}</button>
      </div>

      <div class="card-body">
        <div class="card-meta">
          <span class="type-tag">${escapeHTML(place.type)}</span>
          ${statusMarkup(place)}
        </div>
        <h3>${escapeHTML(place.name)}</h3>
        <div class="place-code">${escapeHTML(place.code || "ไม่มีรหัส")}</div>
        <p class="card-description">${escapeHTML(place.description || "ไม่มีรายละเอียดเพิ่มเติม")}</p>
        <div class="card-footer">
          <span>◷ ${escapeHTML(place.open || "--:--")} – ${escapeHTML(place.close || "--:--")}</span>
          <a href="place.html?id=${encodeURIComponent(place.id)}">ดูรายละเอียด →</a>
        </div>
      </div>
    </article>`;
}

function setupFavoriteButtons(container, onChange) {
  container.querySelectorAll("[data-favorite]").forEach(button => {
    button.addEventListener("click", () => {
      toggleFavorite(button.dataset.favorite);
      if (onChange) onChange();
      else {
        const active = getFavorites().includes(button.dataset.favorite);
        button.classList.toggle("is-favorite", active);
        button.setAttribute("aria-pressed", String(active));
        button.setAttribute("aria-label", active ? "นำออกจากรายการโปรด" : "เพิ่มในรายการโปรด");
        button.textContent = active ? "♥" : "♡";
      }
    });
  });
}

function showLoadError(container, error) {
  container.innerHTML = `<div class="loading-state">ไม่สามารถโหลดข้อมูลได้ กรุณาตรวจสอบไฟล์ data/places.json และเปิดเว็บผ่าน Live Server<br><small>${escapeHTML(error.message)}</small></div>`;
}

document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.querySelector(".menu-toggle");
  const links = document.querySelector(".nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", () => {
      const opened = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(opened));
      toggle.textContent = opened ? "×" : "☰";
    });
  }
});
