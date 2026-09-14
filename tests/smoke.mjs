// Smoke test: expects `npm run build` to have produced dist/app.js.
// Boots the bundle in jsdom and checks that every screen renders and core logic works.
import { JSDOM } from "jsdom";
import { readFileSync } from "node:fs";

const js = readFileSync("dist/app.js", "utf8");
const dom = new JSDOM(`<!doctype html><html><body><div id="root"></div></body></html>`, {
  url: "https://example.com/", runScripts: "outside-only", pretendToBeVisual: true,
});
const store = {};
const fakeStorage = { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } };
Object.defineProperty(dom.window, "localStorage", { value: fakeStorage });
dom.window.navigator.vibrate = () => true;
dom.window.scrollTo = () => {};
dom.window.HTMLElement.prototype.scrollTo = () => {};
dom.window.HTMLElement.prototype.scrollIntoView = () => {};
dom.window.eval(js);

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const doc = () => dom.window.document;
const body = () => doc().body.textContent;
const click = (el) => el && el.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
const find = (txt) => [...doc().querySelectorAll("button")].find((b) => b.textContent.includes(txt));
const modalBtn = (txt) => [...doc().querySelectorAll(".rb-modal button")].find((b) => b.textContent.trim().replace(/^⌂\s*/, "") === txt);
const setInput = (el, val) => {
  Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, "value").set.call(el, val);
  el.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
};
// Tap a turn step row in the left column (jumps the workspace to that step).
const openStep = (i) => click(doc().querySelector(`[data-step="${i}"] button:last-of-type`));
// Tap the board photo at image coordinates (jsdom has no layout, so pretend the map is 1080x1620 at the origin).
const tapBoard = (x, y) => {
  const map = doc().querySelector("[data-boardmap]");
  map.getBoundingClientRect = () => ({ left: 0, top: 0, width: 1080, height: 1620 });
  map.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true, clientX: x, clientY: y }));
};

let failed = 0;
const check = (name, ok) => { console.log(`${ok ? "✓" : "✗"} ${name}`); if (!ok) failed++; };

await wait(300);
check("setup screen mounts", body().includes("Muster the players"));
click(find("3")); await wait(120);
click(find("Begin the war")); await wait(150);

for (const [tab, marker] of [["Turn", "now marching"], ["Lands", "map of holdings"], ["Ring", "journey"], ["Score", "reckoning"], ["Stone", "Palantír"]]) {
  click(find(tab)); await wait(120);
  check(`${tab} tab renders`, body().includes(marker));
}

// Guided turn: step 1 is focused first and asks for the map when nothing is marked
click(find("Turn")); await wait(120);
check("turn: opens on step 1", body().includes("Step 1 of 7"));
check("turn: empty map prompts to mark lands", !!find("Mark my lands"));

// Paint Rhûn for Player 1: three lands by tapping the board photo, one from the fallback list
click(find("Mark my lands")); await wait(120);
check("picker: opens with the board", body().includes("Player 1's lands") && !!doc().querySelector(".rb-modal [data-boardmap] img"));
tapBoard(960, 110); await wait(60);   // Withered Heath
check("picker: board tap names the land", body().includes("Withered Heath is Player 1's."));
tapBoard(915, 300); await wait(60);   // Esgaroth
tapBoard(1038, 47); await wait(60);   // North Rhûn
click(find("Pick from a list")); await wait(80);
click(modalBtn("South Rhûn")); await wait(60);
click(modalBtn("Done")); await wait(120);
check("muster: inline count after painting Rhûn", body().includes("battalions to place") && [...doc().querySelectorAll(".rb-display")].some((e) => e.textContent.trim() === "5"));
check("muster: region bonus explained", body().includes("ruling all of Rhûn"));

// Done ▶ advances to step 2 (Attack) with the battleground inline
click(find("Done ▶")); await wait(120);
check("turn: Done advances to step 2", body().includes("Step 2 of 7") && body().includes("battleground"));

// Battle math: att 6,4,1 vs def 5,4 + stronghold -> attacker removes 2
const grids = () => [...doc().querySelectorAll(".grid-cols-6.gap-1")];
const pick = (g, v) => click([...grids()[g].querySelectorAll("button")][v - 1]);
pick(0, 6); await wait(40); pick(1, 4); await wait(40); pick(2, 1); await wait(40);
pick(3, 5); await wait(40); pick(4, 4); await wait(40);
click(find("Defending a stronghold")); await wait(60);
click(find("Settle my dice")); await wait(150);
check("battle: sorted highest-vs-highest with stronghold bonus", body().includes("Attacker removes 2"));

// Fight!: rolls all dice, animates, then the verdict waits for Done and lands in the result panel
click(find("Fight!")); await wait(300);
check("fight: stage opens with tumbling dice", body().includes("The dice are cast"));
await wait(4200);
check("fight: verdict shows with a Done button", body().includes("The battle is decided") && body().includes("removes") && !!doc().querySelector(".rb-backdrop"));
click([...doc().querySelectorAll(".rb-backdrop button")].find((b) => b.textContent.trim() === "Done")); await wait(150);
check("fight: result lands in the panel", !doc().querySelector(".rb-backdrop") && body().includes("off the board"));
click(find("clear")); await wait(80);

// Conquer Moria by tapping it on the board; undo works; then take it again
click(find("I conquered a land")); await wait(120);
tapBoard(615, 545); await wait(80);
check("conquer: board tap records the land", body().includes("Moria is now Player 1's!") && body().includes("Taken this turn: Moria"));
click(modalBtn("Undo")); await wait(80);
check("conquer: undo restores the map", !body().includes("Taken this turn: Moria"));
tapBoard(615, 545); await wait(80);
click(modalBtn("Done")); await wait(120);
openStep(3); await wait(120);
check("conquer: territory-card step unlocked", body().includes("draw 1 Territory card"));

// Lands tab: the board photo, region detection, live muster
click(find("Lands")); await wait(150);
check("lands: board map renders", !!doc().querySelector(".rb-lands [data-boardmap] img"));
check("lands: region-complete detection", body().includes("Player 1 rules"));
check("lands: live muster", [...doc().querySelectorAll(".rb-display")].some((e) => e.textContent.trim() === "5"));
tapBoard(1005, 1160); await wait(80); // Barad-dûr: nobody -> Player 1
check("lands: board tap gives the land to the first player", body().includes("Barad-dûr is Player 1's."));
tapBoard(1005, 1160); await wait(80);
tapBoard(1005, 1160); await wait(80);
check("lands: taps cycle through the players", body().includes("Barad-dûr is Player 3's."));
tapBoard(1005, 1160); await wait(80);
check("lands: after the last player it goes back to nobody", body().includes("Barad-dûr — nobody's."));

// Score prefills from the map: 5 territories + 1 stronghold (Moria) + Rhûn (+2) = 9
click(find("Score")); await wait(150);
check("score: prefilled from map", [...doc().querySelectorAll(".rb-display")].some((e) => e.textContent.trim() === "9"));

// Palantír
click(find("Stone")); await wait(120);
setInput(doc().querySelector("input[placeholder]"), "who wins a tie"); await wait(150);
check("palantír: answers a rules question", body().includes("defender wins all ties"));

// End turn advances the Ring, passes play, and awards the Territory card
click(find("Turn")); await wait(120);
click(find("End turn")); await wait(400);
check("end turn: Fellowship advances and turn passes", body().includes("Buckland") && body().includes("Player 2"));
check("end turn: conqueror drew a card", body().includes("Player 1 drew a Territory card"));

// Saved games from before the board photo get their territory names migrated (let the first app flush its debounced save first)
await wait(600);
store["redbook-lotr-risk-v4"] = JSON.stringify({ screen: "play", playerCount: 2, players: [{ name: "A", faction: "yellow" }, { name: "B", faction: "red" }],
  territories: [{ name: "Essaroth", region: "Rhûn" }, { name: "Udun", region: "Mordor", s: true }, { name: "Dagorlad", region: "Rhovanion" }], owners: { Essaroth: 0, Udun: 1, Dagorlad: 0 }, tab: "lands" });
const dom2 = new JSDOM(`<!doctype html><html><body><div id="root"></div></body></html>`, { url: "https://example.com/", runScripts: "outside-only", pretendToBeVisual: true });
Object.defineProperty(dom2.window, "localStorage", { value: fakeStorage }); dom2.window.scrollTo = () => {}; dom2.window.HTMLElement.prototype.scrollTo = () => {};
dom2.window.eval(js); await wait(300);
const chips = [...dom2.window.document.querySelectorAll("button")].map((b) => b.textContent.trim().replace(/^⌂\s*/, ""));
check("migration: old names become board names", chips.includes("Esgaroth") && chips.includes("Udûn Vale") && !chips.includes("Essaroth"));
check("migration: Dagorlad is dropped", !chips.includes("Dagorlad"));
check("migration: lands missing from an old save are added", chips.includes("North Rhûn") && chips.includes("Rhûn Hills"));

// 2-player start: Good lands to the Free Peoples player, Evil lands to Sauron
const store3 = {};
const fakeStorage3 = { getItem: (k) => (k in store3 ? store3[k] : null), setItem: (k, v) => { store3[k] = String(v); }, removeItem: (k) => { delete store3[k]; } };
const boot = (storage, rig) => {
  const d = new JSDOM(`<!doctype html><html><body><div id="root"></div></body></html>`, { url: "https://example.com/", runScripts: "outside-only", pretendToBeVisual: true });
  Object.defineProperty(d.window, "localStorage", { value: storage }); d.window.scrollTo = () => {}; d.window.HTMLElement.prototype.scrollTo = () => {}; d.window.HTMLElement.prototype.scrollIntoView = () => {};
  if (rig) rig(d.window);
  d.window.eval(js);
  return { d, find: (txt) => [...d.window.document.querySelectorAll("button")].find((b) => b.textContent.includes(txt)), exact: (txt) => [...d.window.document.querySelectorAll("button")].find((b) => b.textContent.trim() === txt), body: () => d.window.document.body.textContent };
};
const g3 = boot(fakeStorage3); await wait(300);
click(g3.find("2")); await wait(120);
click(g3.find("Begin the war")); await wait(200);
check("2-player: Free Peoples start on 16 Good lands", g3.body().includes("for your 16 lands") && g3.body().includes("Eriador (+3)") && g3.body().includes("Rohan (+4)"));

// Ring at Mount Doom: the roll stays on screen until Done, then a destroyed Ring goes to the scores
await wait(600);
store3["redbook-lotr-risk-v4"] = JSON.stringify({ screen: "play", playerCount: 2, players: [{ name: "A", faction: "yellow" }, { name: "B", faction: "red" }], ringStep: 16, tab: "turn" });
const g4 = boot(fakeStorage3, (w) => { w.Math.random = () => 0.99; }); await wait(300); // every roll is a 6
click(g4.find("End turn")); await wait(1200);
check("doom roll: result waits on screen with a Done button", g4.body().includes("The Ring is destroyed!") && !!g4.exact("Done"));
await wait(1500);
check("doom roll: still on screen after a pause", g4.body().includes("The Ring is destroyed!"));
click(g4.exact("Done")); await wait(200);
check("doom roll: Done opens the Score tab with the banner", g4.body().includes("The Ring Has Been Destroyed!") && g4.body().includes("reckoning"));

console.log(failed ? `\n${failed} check(s) FAILED` : "\nAll checks passed");
process.exit(failed ? 1 : 0);
