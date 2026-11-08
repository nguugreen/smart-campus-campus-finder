const GOOGLE_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSfiJndEUJXLTPNvrMDVRH5JHzaUp63joofzS6fLgLgmhdJaQA/viewform";
const GOOGLE_FORM_FIELDS = {
  requestType: "entry.1511172782",
  placeId: "entry.1018210589",
  placeName: "entry.1320662634",
  placeType: "entry.1449525295",
  placeZone: "entry.1629071891",
  details: "entry.757658966"
};
const MAX_URL_LENGTH = 8000;

document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("suggest-form");
  const submit = form.querySelector('button[type="submit"]');
  const message = document.getElementById("form-message");
  const name = document.getElementById("place-name");
  const type = document.getElementById("place-type");
  const zone = document.getElementById("place-zone");
  const existing = document.getElementById("existing-place");
  const existingField = document.getElementById("existing-place-field");
  const newField = document.getElementById("new-place-field");
  const details = document.getElementById("details");
  const confirm = document.getElementById("confirm");
  let places = [];

  function isEditRequest() { return form.elements.requestType.value === "แจ้งแก้ไขข้อมูล"; }

  function updateMode() {
    const edit = isEditRequest();
    existingField.classList.toggle("hidden", !edit);
    newField.classList.toggle("hidden", edit);
  }

  try {
    places = await loadPlaces();
    if (!Array.isArray(places)) throw new Error("รูปแบบข้อมูลใน places.json ไม่ถูกต้อง (ต้องเป็น array)");
    const zones = [...new Set(places.map(place => String(place.zone ?? "").trim()).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, "th", { numeric: true }));
    zone.innerHTML = `<option value="">ไม่ระบุ</option>` +
      zones.map(value => `<option value="${escapeHTML(value)}">${escapeHTML(value)}</option>`).join("");
    existing.innerHTML = `<option value="">เลือกสถานที่</option>` +
      [...places].sort((a, b) => String(a.name).localeCompare(String(b.name), "th", { numeric: true }))
        .map(place => `<option value="${escapeHTML(place.id)}">${escapeHTML(place.name)}${place.zone ? ` (${escapeHTML(place.zone)})` : ""}</option>`).join("");
  } catch (error) {
    places = [];
    existing.disabled = true;
    document.getElementById("place-error").textContent = `โหลดรายชื่อสถานที่ไม่สำเร็จ: ${error.message}`;
  }

  existing.addEventListener("change", () => {
    const place = places.find(item => item.id === existing.value);
    if (!place) return;
    type.value = place.type || "";
    zone.value = String(place.zone ?? "").trim();
  });
  form.querySelectorAll('input[name="requestType"]').forEach(radio => radio.addEventListener("change", updateMode));
  updateMode();

  form.addEventListener("submit", event => {
    event.preventDefault();
    document.querySelectorAll(".field-error").forEach(item => item.textContent = "");
    message.textContent = "";
    message.className = "form-message";

    let valid = true;
    const edit = isEditRequest();
    const selectedPlace = places.find(item => item.id === existing.value);
    if (edit && !selectedPlace) {
      document.getElementById("place-error").textContent = existing.disabled
        ? "โหลดรายชื่อสถานที่ไม่สำเร็จ จึงยังแจ้งแก้ไขข้อมูลไม่ได้"
        : "กรุณาเลือกสถานที่ที่ต้องการแก้ไข";
      valid = false;
    }
    if (!edit && name.value.trim().length < 2) {
      document.getElementById("name-error").textContent = "กรุณากรอกชื่อสถานที่อย่างน้อย 2 ตัวอักษร";
      valid = false;
    }
    if (!type.value) {
      document.getElementById("type-error").textContent = "กรุณาเลือกประเภทสถานที่";
      valid = false;
    }
    if (details.value.trim().length < 10) {
      document.getElementById("details-error").textContent = "กรุณากรอกรายละเอียดอย่างน้อย 10 ตัวอักษร";
      valid = false;
    }
    if (!confirm.checked) {
      document.getElementById("confirm-error").textContent = "กรุณายืนยันการตรวจสอบข้อมูล";
      valid = false;
    }
    if (!valid) {
      message.textContent = "กรุณาตรวจสอบข้อมูลในช่องที่แจ้งข้อผิดพลาด";
      message.classList.add("error");
      return;
    }

    const values = {
      requestType: form.elements.requestType.value,
      placeId: edit ? selectedPlace.id : "",
      placeName: edit ? selectedPlace.name : name.value.trim(),
      placeType: type.value,
      placeZone: zone.value,
      details: details.value.trim()
    };
    const params = new URLSearchParams({ usp: "pp_url" });
    Object.entries(GOOGLE_FORM_FIELDS).forEach(([key, entry]) => {
      if (values[key]) params.append(entry, values[key]);
    });
    const url = `${GOOGLE_FORM_URL}?${params}`;
    if (url.length > MAX_URL_LENGTH) {
      document.getElementById("details-error").textContent = "ข้อความยาวเกินกว่าที่ส่งผ่านลิงก์ได้ กรุณาย่อรายละเอียดให้สั้นลง";
      message.textContent = "กรุณาตรวจสอบข้อมูลในช่องที่แจ้งข้อผิดพลาด";
      message.classList.add("error");
      return;
    }

    submit.disabled = true;
    message.textContent = "กำลังเปิด Google Form...";
    const opened = window.open(url, "_blank");
    if (opened) opened.opener = null;
    message.innerHTML = (opened
      ? "เปิด Google Form ในแท็บใหม่แล้ว — <strong>ข้อมูลยังไม่ถึงแอดมิน</strong> จนกว่าคุณจะกดปุ่ม \"ส่ง\" ในหน้า Google และเห็นข้อความยืนยันของ Google"
      : "เบราว์เซอร์บล็อกการเปิดแท็บใหม่ — กรุณากดลิงก์นี้เพื่อไปกดส่งใน Google Form") +
      ` <a href="${escapeHTML(url)}" target="_blank" rel="noopener">เปิด Google Form อีกครั้ง ↗</a>`;
    if (!opened) message.classList.add("error");

    try {
      const suggestions = JSON.parse(localStorage.getItem(SUGGESTIONS_KEY) || "[]");
      suggestions.push({
        id: `suggest-${Date.now()}`,
        ...values,
        status: "เปิด Google Form แล้ว (ยังไม่ยืนยันว่ากดส่ง)",
        openedAt: new Date().toISOString()
      });
      localStorage.setItem(SUGGESTIONS_KEY, JSON.stringify(suggestions));
    } catch {  }
    setTimeout(() => { submit.disabled = false; }, 3000);
  });
});
