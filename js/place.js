document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("place-detail");
  const id = new URLSearchParams(window.location.search).get("id");
  if (!id) {
    container.innerHTML = '<div class="not-found"><h1>ไม่พบสถานที่</h1><p>กรุณาเลือกสถานที่จากหน้ารายการ</p><a class="button button-primary" href="places.html">กลับไปหน้าสถานที่</a></div>';
    return;
  }
  try {
    const places = await loadPlaces();
    const place = places.find(item => item.id === id);
    if (!place) {
      container.innerHTML = '<div class="not-found"><h1>ไม่พบข้อมูลสถานที่นี้</h1><p>สถานที่อาจถูกนำออกจากรายการ</p><a class="button button-primary" href="places.html">กลับไปหน้าสถานที่</a></div>';
      return;
    }
    document.title = `${place.name} | Campus Finder`;
    const facilities = (place.facilities || []).map(item => `<span class="facility-chip">${escapeHTML(item)}</span>`).join("") || '<span class="facility-chip">ไม่มีข้อมูล</span>';
    const favorite = getFavorites().includes(place.id);
    const mapLink = place.mapUrl ? `<a class="button button-ghost" href="${escapeHTML(place.mapUrl)}" target="_blank" rel="noopener noreferrer">เปิด Google Maps ↗</a>` : "";
    const image = placeImageMarkup(place, { eager: true });
    container.innerHTML = `<div class="detail-layout">
      <div class="detail-visual${image ? " has-image" : ""}">
        ${image}
        <span class="visual-zone">โซน ${escapeHTML(place.zone || "-")}</span>
        <span class="visual-icon" aria-hidden="true">${iconForType(place.type)}</span>
      </div>
      <div class="detail-content"><span class="eyebrow blue">PLACE INFORMATION</span><div class="card-meta"><span class="type-tag">${escapeHTML(place.type)}</span>${statusMarkup(place)}</div>
      <h1>${escapeHTML(place.name)}</h1><div class="place-code">${escapeHTML(place.code || "ไม่มีรหัสสถานที่")}</div>
      <p class="detail-description">${escapeHTML(place.description || "ไม่มีรายละเอียดเพิ่มเติม")}</p>
      <div class="detail-actions"><button class="button button-primary" id="detail-favorite" type="button">${favorite ? "♥ อยู่ในรายการโปรด" : "♡ เพิ่มในรายการโปรด"}</button>${mapLink}</div>
      <div class="info-grid"><div class="info-item"><small>เวลาเปิด</small><strong>${escapeHTML(place.open || "ไม่ระบุ")}</strong></div><div class="info-item"><small>เวลาปิด</small><strong>${escapeHTML(place.close || "ไม่ระบุ")}</strong></div><div class="info-item"><small>โซน</small><strong>${escapeHTML(place.zone || "ไม่ระบุ")}</strong></div><div class="info-item"><small>จำนวนชั้น</small><strong>${place.floors ? `${escapeHTML(place.floors)} ชั้น` : "ไม่ระบุ"}</strong></div></div>
      <h2 class="detail-section-title">สิ่งอำนวยความสะดวก</h2><div class="facility-list">${facilities}</div>
      ${place.rooms?.length ? `<h2 class="detail-section-title">ตัวอย่างห้องภายในสถานที่</h2><div class="facility-list">${place.rooms.map(room => `<span class="facility-chip">${escapeHTML(room)}</span>`).join("")}</div>` : ""}
      </div></div>`;
    document.getElementById("detail-favorite").addEventListener("click", event => {
      const active = toggleFavorite(place.id);
      event.currentTarget.textContent = active ? "♥ อยู่ในรายการโปรด" : "♡ เพิ่มในรายการโปรด";
    });
  } catch (error) { showLoadError(container, error); }
});
