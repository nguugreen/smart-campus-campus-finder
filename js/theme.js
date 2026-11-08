const THEME_KEY = "campusFinderTheme";
const THEME_CHOICES = ["system", "light", "dark"];

const systemDarkQuery = window.matchMedia("(prefers-color-scheme: dark)");

function getSavedTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    return THEME_CHOICES.includes(saved) ? saved : "system";
  } catch {
    return "system";
  }
}

function saveTheme(choice) {
  try { localStorage.setItem(THEME_KEY, choice); }
  catch {  }
}

function resolveTheme(choice) {
  if (choice === "system") return systemDarkQuery.matches ? "dark" : "light";
  return choice;
}

function applyTheme(choice) {
  document.documentElement.dataset.theme = resolveTheme(choice);
}

applyTheme(getSavedTheme());

systemDarkQuery.addEventListener("change", () => {
  if (getSavedTheme() === "system") applyTheme("system");
});

document.addEventListener("DOMContentLoaded", () => {
  const select = document.getElementById("theme-select");
  if (!select) return;

  select.value = getSavedTheme();

  select.addEventListener("change", () => {
    saveTheme(select.value);
    applyTheme(select.value);
  });

  window.addEventListener("storage", event => {
    if (event.key !== THEME_KEY) return;
    select.value = getSavedTheme();
    applyTheme(select.value);
  });
});
