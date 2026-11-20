// The road to the platinum, in five phases. Each phase names the trophies it
// covers by id, so the tracker can count how many of each phase is earned.

export const ROADMAP_PHASES = [
  {
    number: 1,
    title: "Play the story",
    text: "Chapters 1 to 5 and the final mission, plus the named story missions. Just play — every one of these pops on its own.",
    ids: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
  },
  {
    number: 2,
    title: "Strangers of Leonida",
    text: "Six stranger strands — Andy, Kenton, Billy, Randy, Tyrone and Bret, plus three more. Finish eight strands for the silver.",
    ids: [22, 23, 24, 25, 26, 27],
  },
  {
    number: 3,
    title: "Moments to catch",
    text: "The one trophy flagged possibly missable, plus eleven one-off moments. No mission replay, so take each chance when it comes.",
    ids: [28, 33, 34, 37, 44, 45, 46, 47, 48, 49, 50, 51],
  },
  {
    number: 4,
    title: "Activities & collections",
    text: "Ranges, races, fishing, arcade, bowling, cards, WAiNK, vehicles, areas, vaults, gangs and garages. Sample them all, then finish them region by region.",
    ids: [16, 17, 18, 19, 20, 21, 29, 30, 31, 35, 36, 38, 39, 40, 41, 42, 43, 54, 55],
  },
  {
    number: 5,
    title: "The long grind",
    text: "The counters that take the whole game: 250 stunts, 50 challenges, $250,000 laundered, $100,000 spent — then the 100% checklist and the platinum.",
    ids: [1, 14, 15, 32, 52, 53],
  },
];

// Render the five phases into a container. `trophies` is the trophy list
// (for names) and `earned` is a Set of earned trophy ids.
export function renderRoadmap(container, trophies, earned) {
  container.replaceChildren();
  const byId = new Map(trophies.map((t) => [t.id, t]));
  for (const phase of ROADMAP_PHASES) {
    const done = phase.ids.filter((id) => earned.has(id)).length;
    const card = document.createElement("article");
    card.className = "phase";
    const no = document.createElement("p");
    no.className = "phase-no";
    no.textContent = "Phase " + phase.number;
    const title = document.createElement("h3");
    title.textContent = phase.title;
    const text = document.createElement("p");
    text.textContent = phase.text;
    const count = document.createElement("p");
    count.className = "phase-count";
    count.textContent = done + " of " + phase.ids.length + " earned";
    const names = document.createElement("div");
    names.className = "trophy-names";
    for (const id of phase.ids) {
      const trophy = byId.get(id);
      if (!trophy) continue;
      const chip = document.createElement("span");
      if (earned.has(id)) chip.className = "done";
      chip.textContent = trophy.name;
      names.append(chip);
    }
    card.append(no, title, text, count, names);
    container.append(card);
  }
}
