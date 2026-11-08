const FEATURED_IDS = ["place19", "place11", "place20"];

document.addEventListener("DOMContentLoaded", async () => {
  const featured = document.getElementById("featured-places");
  const total = document.getElementById("total-places");
  try {
    const places = await loadPlaces();
    total.textContent = places.length;
    let picks = FEATURED_IDS.map(id => places.find(place => place.id === id)).filter(Boolean);
    FEATURED_IDS.filter(id => !places.some(place => place.id === id))
      .forEach(id => console.warn(`ไม่พบสถานที่แนะนำ id "${id}" ใน places.json`));
    if (picks.length === 0) picks = places.slice(0, 3);
    featured.innerHTML = picks.map(placeCard).join("");
    setupFavoriteButtons(featured);
  } catch (error) { showLoadError(featured, error); }

  document.getElementById("home-search").addEventListener("submit", event => {
    event.preventDefault();
    const query = document.getElementById("home-query").value.trim();
    window.location.href = `places.html?q=${encodeURIComponent(query)}`;
  });
});
