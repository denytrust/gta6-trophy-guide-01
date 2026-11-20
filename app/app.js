// Leonida Platinum Atlas — the tracker. Loads app/data/trophies.json, renders
// the checklist, the roadmap and the detail panel, and saves progress in
// localStorage (export/import/reset included). No network at run time: the
// only fetch is the local trophies.json, and every source link opens only
// when the reader follows it.

import { renderRoadmap } from "./roadmap.js";

const STORAGE_KEY = "leonida-platinum-atlas-v1";

const $ = (id) => document.getElementById(id);
const cardsEl = $("cards");
const detailEl = $("detailPanel");
const phasesEl = $("phases");

let trophies = [];
let earned = new Set();
let spoilerOn = false;
let selectedId = 1;

const filters = { search: "", grade: "all", kind: "all", status: "all", momentsOnly: false };

function loadSaved() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    earned = new Set(Array.isArray(raw.earned) ? raw.earned : []);
    spoilerOn = raw.spoiler === true;
  } catch {
    earned = new Set();
    spoilerOn = false;
  }
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ earned: [...earned], spoiler: spoilerOn }));
}

function isHidden(trophy) {
  return spoilerOn && trophy.kind === "story" && !earned.has(trophy.id);
}

function gradeLabel(grade) {
  return grade === "platinum" ? "Platinum" : grade[0].toUpperCase() + grade.slice(1);
}

function kindLabel(kind) {
  return kind === "completion" ? "Completion" : kind;
}

function trophyMatches(trophy) {
  if (filters.grade !== "all" && trophy.grade !== filters.grade) return false;
  if (filters.kind !== "all" && trophy.kind !== filters.kind) return false;
  if (filters.status === "earned" && !earned.has(trophy.id)) return false;
  if (filters.status === "missing" && earned.has(trophy.id)) return false;
  if (filters.momentsOnly && !trophy.missable && !trophy.moment) return false;
  if (filters.search) {
    const hay = (trophy.name + " " + trophy.description + " " + trophy.guide).toLowerCase();
    if (!hay.includes(filters.search)) return false;
  }
  return true;
}

function renderProgress() {
  const total = trophies.length;
  const count = earned.size;
  const pct = total === 0 ? 0 : Math.round((count / total) * 100);
  $("progressText").textContent = count + " of " + total + " earned";
  $("progressPct").textContent = pct + "%";
  $("progressFill").style.width = pct + "%";
  const chips = $("gradeChips");
  chips.replaceChildren();
  for (const grade of ["platinum", "gold", "silver", "bronze"]) {
    const inGrade = trophies.filter((t) => t.grade === grade);
    const got = inGrade.filter((t) => earned.has(t.id)).length;
    const chip = document.createElement("span");
    chip.className = "grade-chip";
    const label = document.createElement("b");
    label.textContent = gradeLabel(grade);
    chip.append(label, document.createTextNode(" " + got + "/" + inGrade.length));
    chips.append(chip);
  }
  $("listMeta").textContent =
    "Showing " + trophies.filter(trophyMatches).length + " of " + total + " trophies · " + count + " earned";
}

function tag(text, cls) {
  const el = document.createElement("span");
  el.className = "tag " + cls;
  el.textContent = text;
  return el;
}

function renderCards() {
  cardsEl.replaceChildren();
  const shown = trophies.filter(trophyMatches);
  if (shown.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = "No trophies match these filters. Loosen the search or clear a filter.";
    cardsEl.append(empty);
    return;
  }
  for (const trophy of shown) {
    const hidden = isHidden(trophy);
    const card = document.createElement("button");
    card.type = "button";
    card.className = "card grade-" + trophy.grade + (earned.has(trophy.id) ? " earned" : "") + (hidden ? " masked" : "");
    if (trophy.id === selectedId) card.classList.add("selected");
    const box = document.createElement("input");
    box.type = "checkbox";
    box.checked = earned.has(trophy.id);
    box.setAttribute("aria-label", "Mark " + trophy.name + " as earned");
    box.addEventListener("click", (event) => event.stopPropagation());
    box.addEventListener("change", () => {
      if (box.checked) earned.add(trophy.id);
      else earned.delete(trophy.id);
      save();
      renderAll();
    });
    const body = document.createElement("div");
    body.className = "card-body";
    const title = document.createElement("div");
    title.className = "card-title";
    title.textContent = hidden ? "Hidden story trophy" : trophy.name;
    const desc = document.createElement("div");
    desc.className = "card-desc";
    desc.textContent = hidden ? "Spoiler shield is on — earn it to reveal the name and description." : trophy.description;
    body.append(title, desc);
    if (!hidden) {
      const guide = document.createElement("div");
      guide.className = "card-guide";
      guide.textContent = trophy.guide.length > 180 ? trophy.guide.slice(0, 180) + "…" : trophy.guide;
      body.append(guide);
    }
    const tags = document.createElement("div");
    tags.className = "card-tags";
    tags.append(tag(gradeLabel(trophy.grade), "grade-" + trophy.grade));
    tags.append(tag(kindLabel(trophy.kind), "kind"));
    if (trophy.target) tags.append(tag(trophy.target, "kind"));
    if (trophy.missable) tags.append(tag("Missable", "missable"));
    if (trophy.moment) tags.append(tag("One-off moment", "moment"));
    if (earned.has(trophy.id)) tags.append(tag("Earned", "earned"));
    body.append(tags);
    card.append(box, body);
    card.addEventListener("click", () => {
      selectedId = trophy.id;
      renderAll();
    });
    cardsEl.append(card);
  }
}

function renderAll() {
  renderProgress();
  renderRoadmap(phasesEl, trophies, earned);
  renderCards();
  renderDetail();
}

function renderDetail() {
  const trophy = trophies.find((t) => t.id === selectedId) || trophies[0];
  if (!trophy) return;
  detailEl.replaceChildren();
  const hidden = isHidden(trophy);
  if (hidden) {
    const title = document.createElement("h3");
    title.textContent = "Hidden story trophy";
    const note = document.createElement("p");
    note.className = "guide-text";
    note.textContent =
      "Spoiler shield is on: this story trophy stays hidden until you earn it. Mark it earned below to reveal its name, description and guide.";
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "earn-btn primary";
    btn.textContent = "Mark as earned";
    btn.addEventListener("click", () => {
      earned.add(trophy.id);
      save();
      renderAll();
    });
    detailEl.append(title, note, btn);
    return;
  }
  const grades = document.createElement("div");
  grades.className = "detail-grade";
  grades.append(tag(gradeLabel(trophy.grade), "grade-" + trophy.grade));
  grades.append(tag(kindLabel(trophy.kind), "kind"));
  if (trophy.missable) grades.append(tag("Missable", "missable"));
  if (trophy.moment) grades.append(tag("One-off moment", "moment"));
  const title = document.createElement("h3");
  title.textContent = trophy.name;
  const official = document.createElement("p");
  official.className = "official";
  official.textContent = "“" + trophy.description + "” — official description";
  detailEl.append(grades, title, official);
  if (trophy.target) {
    const target = document.createElement("p");
    target.className = "target-line";
    const label = document.createElement("b");
    label.textContent = "Target: ";
    target.append(label, document.createTextNode(trophy.target));
    detailEl.append(target);
  }
  const guide = document.createElement("p");
  guide.className = "guide-text";
  guide.textContent = trophy.guide;
  detailEl.append(guide);
  if (trophy.missable) {
    const warn = document.createElement("p");
    warn.className = "warn";
    const strong = document.createElement("strong");
    strong.textContent = "Possibly missable. ";
    warn.append(
      strong,
      document.createTextNode(
        "Community guides (GTABase, PowerPyx) flag this as the one trophy that can be missed — do the Chapter 1 meditation with Lucia before leaving Chapter 1."
      )
    );
    detailEl.append(warn);
  } else if (trophy.moment) {
    const warn = document.createElement("p");
    warn.className = "warn";
    const strong = document.createElement("strong");
    strong.textContent = "One-off moment. ";
    warn.append(
      strong,
      document.createTextNode(
        "The description ties this to a specific situation, and the game has no mission replay — take the chance when it comes."
      )
    );
    detailEl.append(warn);
  }
  const sourcesTitle = document.createElement("h4");
  sourcesTitle.textContent = "Sources";
  const list = document.createElement("ul");
  for (const source of trophy.sources) {
    const item = document.createElement("li");
    const link = document.createElement("a");
    link.href = source.url;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.textContent = source.name;
    item.append(link);
    list.append(item);
  }
  detailEl.append(sourcesTitle, list);
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "earn-btn" + (earned.has(trophy.id) ? "" : " primary");
  btn.textContent = earned.has(trophy.id) ? "Earned — click to unmark" : "Mark as earned";
  btn.addEventListener("click", () => {
    if (earned.has(trophy.id)) earned.delete(trophy.id);
    else earned.add(trophy.id);
    save();
    renderAll();
  });
  detailEl.append(btn);
}

function download(filename, text) {
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function wireControls() {
  $("search").addEventListener("input", (event) => {
    filters.search = event.target.value.trim().toLowerCase();
    renderCards();
    renderProgress();
  });
  $("grade").addEventListener("change", (event) => {
    filters.grade = event.target.value;
    renderCards();
    renderProgress();
  });
  $("kind").addEventListener("change", (event) => {
    filters.kind = event.target.value;
    renderCards();
    renderProgress();
  });
  $("status").addEventListener("change", (event) => {
    filters.status = event.target.value;
    renderCards();
    renderProgress();
  });
  $("missableOnly").addEventListener("change", (event) => {
    filters.momentsOnly = event.target.checked;
    renderCards();
    renderProgress();
  });
  const spoilerBox = $("spoiler");
  spoilerBox.checked = spoilerOn;
  spoilerBox.addEventListener("change", () => {
    spoilerOn = spoilerBox.checked;
    save();
    renderAll();
  });
  $("exportBtn").addEventListener("click", () => {
    download("gta6-trophy-progress.json", JSON.stringify({ earned: [...earned], spoiler: spoilerOn }, null, 2));
  });
  $("importBtn").addEventListener("click", () => $("importFile").click());
  $("importFile").addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      const ids = new Set(trophies.map((t) => t.id));
      earned = new Set((Array.isArray(data.earned) ? data.earned : []).filter((id) => ids.has(id)));
      spoilerOn = data.spoiler === true;
      $("spoiler").checked = spoilerOn;
      save();
      renderAll();
    } catch {
      alert("That file is not a valid progress export.");
    }
    event.target.value = "";
  });
  $("resetBtn").addEventListener("click", () => {
    if (!confirm("Clear all earned trophies and the spoiler setting?")) return;
    earned = new Set();
    spoilerOn = false;
    $("spoiler").checked = false;
    save();
    renderAll();
  });
}

async function init() {
  loadSaved();
  const response = await fetch("data/trophies.json");
  const data = await response.json();
  trophies = data.trophies;
  wireControls();
  // The page reads the URL hash once at load: #trophy-<id> opens that
  // trophy's detail, #roadmap jumps to the roadmap. There is no hashchange
  // listener — a fresh load reads the hash.
  const hash = window.location.hash;
  const match = hash.match(/^#trophy-(\d+)$/);
  if (match) {
    const id = Number(match[1]);
    if (trophies.some((t) => t.id === id)) selectedId = id;
  }
  renderAll();
  if (hash === "#roadmap") {
    $("roadmapSection").scrollIntoView();
  } else if (match) {
    $("trackerSection").scrollIntoView();
  }
}

init();
