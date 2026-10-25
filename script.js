
const grid = document.getElementById("card-grid");
const cards = [...grid.querySelectorAll(".ai-card")];

const searchInput = document.getElementById("search");
const typeFilter = document.getElementById("type-filter");
const priceFilter = document.getElementById("price-filter");
const taskFilter = document.getElementById("task-filter");
const sortFilter = document.getElementById("sort-filter");

const tagButtons = [...document.querySelectorAll(".tag")];
const activeFilters = document.getElementById("active-filters");
const resultCount = document.getElementById("result-count");
const emptyState = document.getElementById("empty-state");

const selectedTags = new Set();

function normalize(value) {
  return String(value || "")
    .toLocaleLowerCase("ru")
    .replaceAll("ё", "е")
    .trim();
}

function matchesSearch(card, query) {
  if (!query) return true;

  const searchableText = normalize([
    card.dataset.name,
    card.dataset.type,
    card.dataset.task,
    card.dataset.tags,
    card.innerText
  ].join(" "));

  return searchableText.includes(query);
}

function matchesType(card, type) {
  if (type === "all") return true;

  return (card.dataset.type || "")
    .split(/\s+/)
    .includes(type);
}

function matchesPrice(card, price) {
  if (price === "all") return true;

  if (price === "free") {
    return ["free", "freemium"].includes(card.dataset.price);
  }

  return card.dataset.price === price;
}

function matchesTask(card, task) {
  if (task === "all") return true;

  return (card.dataset.task || "")
    .split(/\s+/)
    .includes(task);
}

function matchesTags(card) {
  if (selectedTags.size === 0) return true;

  const cardTags = normalize(card.dataset.tags);

  // Сравниваем полные названия тегов, включая фразы с пробелами.
  // Все выбранные теги должны присутствовать в карточке.
  return [...selectedTags].every(tag => {
    const escapedTag = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(
      `(?:^|\\s)${escapedTag}(?=\\s|$)`
    );

    return pattern.test(cardTags);
  });
}

function updateActiveFilters() {
  activeFilters.replaceChildren();

  for (const tag of selectedTags) {
    const chip = document.createElement("span");
    chip.className = "active-filter";
    chip.textContent = `✓ ${tag}`;
    activeFilters.appendChild(chip);
  }
}

function applyFilters() {
  const query = normalize(searchInput.value);
  const type = typeFilter.value;
  const price = priceFilter.value;
  const task = taskFilter.value;

  const visibleCards = cards.filter(card => {
    const matches =
      matchesSearch(card, query) &&
      matchesType(card, type) &&
      matchesPrice(card, price) &&
      matchesTask(card, task) &&
      matchesTags(card);

    card.hidden = !matches;
    return matches;
  });

  const sortedCards = [...visibleCards];

  if (sortFilter.value === "az") {
    sortedCards.sort((a, b) =>
      a.dataset.name.localeCompare(b.dataset.name, "ru")
    );
  } else if (sortFilter.value === "za") {
    sortedCards.sort((a, b) =>
      b.dataset.name.localeCompare(a.dataset.name, "ru")
    );
  }

  sortedCards.forEach(card => grid.appendChild(card));

  resultCount.textContent =
    `${visibleCards.length} из ${cards.length} сервисов`;

  emptyState.hidden = visibleCards.length > 0;
  grid.hidden = visibleCards.length === 0;

  updateActiveFilters();
}

function clearTags() {
  selectedTags.clear();

  tagButtons.forEach(button => {
    button.classList.remove("active");
    button.setAttribute("aria-pressed", "false");
  });

  applyFilters();
}

function resetFilters() {
  searchInput.value = "";
  typeFilter.value = "all";
  priceFilter.value = "all";
  taskFilter.value = "all";
  sortFilter.value = "default";

  clearTags();
}

tagButtons.forEach(button => {
  button.addEventListener("click", () => {
    const tag = normalize(button.dataset.tag);

    if (selectedTags.has(tag)) {
      selectedTags.delete(tag);
      button.classList.remove("active");
      button.setAttribute("aria-pressed", "false");
    } else {
      selectedTags.add(tag);
      button.classList.add("active");
      button.setAttribute("aria-pressed", "true");
    }

    applyFilters();
  });
});

searchInput.addEventListener("input", applyFilters);
typeFilter.addEventListener("change", applyFilters);
priceFilter.addEventListener("change", applyFilters);
taskFilter.addEventListener("change", applyFilters);
sortFilter.addEventListener("change", applyFilters);

document.getElementById("clear-tags")
  .addEventListener("click", clearTags);

document.getElementById("reset-filters")
  .addEventListener("click", resetFilters);

document.getElementById("empty-reset")
  .addEventListener("click", resetFilters);

document.getElementById("copy-example")
  .addEventListener("click", async () => {
    const text = document
      .getElementById("prompt-example")
      .textContent.trim();

    const status = document.getElementById("copy-status");

    try {
      await navigator.clipboard.writeText(text);
      status.textContent = "Пример скопирован!";
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";

      document.body.appendChild(textarea);
      textarea.select();

      try {
        const success = document.execCommand("copy");

        status.textContent = success
          ? "Пример скопирован!"
          : "Скопируй текст вручную.";
      } catch {
        status.textContent = "Скопируй текст вручную.";
      }

      textarea.remove();
    }
  });

document.addEventListener("keydown", event => {
  const target = event.target;

  const isTyping = target instanceof HTMLElement &&
    (target.isContentEditable ||
     ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

  if ((event.ctrlKey || event.metaKey) &&
      event.key.toLowerCase() === "k") {
    event.preventDefault();
    searchInput.focus();
  }

  if (event.key === "Escape" && !isTyping) {
    searchInput.value = "";
    applyFilters();
  }
});

// Проверка количества карточек при запуске.
if (cards.length !== 30) {
  console.warn(
    `В каталоге ${cards.length} карточек вместо 30. Проверь HTML.`
  );
}

applyFilters();
