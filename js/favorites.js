document.addEventListener("DOMContentLoaded", async () => {
  const list = document.getElementById("favorites-list");
  const empty = document.getElementById("favorites-empty");
  const count = document.getElementById("favorite-count");
  try {
    const places = await loadPlaces();
    function render() {
      const favoriteIds = getFavorites();
      const saved = places.filter(place => favoriteIds.includes(place.id));
      count.textContent = `บันทึกไว้ ${saved.length} สถานที่`;
      list.innerHTML = saved.map(placeCard).join("");
      empty.classList.toggle("hidden", saved.length !== 0);
      list.classList.toggle("hidden", saved.length === 0);
      setupFavoriteButtons(list, render);
    }
    render();
  } catch (error) { showLoadError(list, error); }
});
