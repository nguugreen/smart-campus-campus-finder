document.addEventListener("DOMContentLoaded", async () => {
  const list = document.getElementById("places-list");
  const search = document.getElementById("place-search");
  const type = document.getElementById("type-filter");
  const zone = document.getElementById("zone-filter");
  const sort = document.getElementById("sort-filter");
  const count = document.getElementById("result-count");
  const empty = document.getElementById("empty-state");
  let places = [];

  const params = new URLSearchParams(window.location.search);
  search.value = params.get("q") || "";
  type.value = params.get("type") || "";

  function zoneOf(place) { return String(place.zone ?? "").trim(); }

  function populateZones() {
    const zones = [...new Set(places.map(zoneOf).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, "th", { numeric: true }));
    zone.innerHTML = `<option value="">ทุกอาคาร</option>` +
      zones.map(value => `<option value="${escapeHTML(value)}">${escapeHTML(value)}</option>`).join("");
  }

  function render() {
    const query = search.value.trim().toLocaleLowerCase();
    let filtered = places.filter(place => {
      const searchable = [place.name, place.code, place.description, ...(place.rooms || [])].join(" ").toLocaleLowerCase();
      return searchable.includes(query) && (!type.value || place.type === type.value) && (!zone.value || zoneOf(place) === zone.value);
    });
    filtered.sort((a, b) => sort.value === "zone"
      ? String(a.zone).localeCompare(String(b.zone), "th") || a.name.localeCompare(b.name, "th")
      : a.name.localeCompare(b.name, "th"));
    count.textContent = `พบ ${filtered.length} จาก ${places.length} สถานที่`;
    list.innerHTML = filtered.map(placeCard).join("");
    empty.classList.toggle("hidden", filtered.length !== 0);
    list.classList.toggle("hidden", filtered.length === 0);
    setupFavoriteButtons(list);
  }

  function reset() { search.value = ""; type.value = ""; zone.value = ""; sort.value = "name"; render(); }

  try {
    places = await loadPlaces();
    if (!Array.isArray(places)) throw new Error("รูปแบบข้อมูลใน places.json ไม่ถูกต้อง (ต้องเป็น array)");
    populateZones();
    [search, type, zone, sort].forEach(control => control.addEventListener(control === search ? "input" : "change", render));
    document.getElementById("reset-filters").addEventListener("click", reset);
    document.getElementById("empty-reset").addEventListener("click", reset);
    render();
  } catch (error) {
    count.textContent = "โหลดข้อมูลไม่สำเร็จ";
    zone.disabled = true;
    showLoadError(list, error);
  }
});
