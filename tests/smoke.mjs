// Smoke test: expects `npm run build` to have produced dist/app.js.
// Boots the bundle in jsdom and checks that every screen renders and core logic works.
import { JSDOM } from "jsdom";
import { readFileSync } from "node:fs";

const js = readFileSync("dist/app.js", "utf8");
const dom = new JSDOM(`<!doctype html><html><body><div id="root"></div></body></html>`, {
  url: "https://example.com/", runScripts: "outside-only", pretendToBeVisual: true,
});
const store = {};
dom.window.localStorage = { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } };
dom.window.navigator.vibrate = () => true;
dom.window.scrollTo = () => {};
dom.window.eval(js);

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const body = () => dom.window.document.body.textContent;
const click = (el) => el && el.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
const find = (txt) => [...dom.window.document.querySelectorAll("button")].find((b) => b.textContent.includes(txt));
const setInput = (el, val) => {
  Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, "value").set.call(el, val);
  el.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
};

let failed = 0;
const check = (name, ok) => { console.log(`${ok ? "✓" : "✗"} ${name}`); if (!ok) failed++; };

await wait(300);
check("setup screen mounts", body().includes("Muster the players"));
click(find("3")); await wait(120);
click(find("Begin the war")); await wait(150);

for (const [tab, marker] of [["Turn", "now marching"], ["Battle", "battleground"], ["Lands", "map of holdings"], ["Ring", "journey"], ["Score", "reckoning"], ["Stone", "Palantír"]]) {
  click(find(tab)); await wait(120);
  check(`${tab} tab renders`, body().includes(marker));
}

// Battle math: att 6,4,1 vs def 5,4 + stronghold -> attacker removes 2
click(find("Battle")); await wait(120);
const grids = () => [...dom.window.document.querySelectorAll(".grid-cols-6.gap-1")];
const pick = (g, v) => click([...grids()[g].querySelectorAll("button")][v - 1]);
pick(0, 6); await wait(40); pick(1, 4); await wait(40); pick(2, 1); await wait(40);
pick(3, 5); await wait(40); pick(4, 4); await wait(40);
click(find("Defending a stronghold")); await wait(60);
click(find("Settle the battle")); await wait(150);
check("battle: sorted highest-vs-highest with stronghold bonus", body().includes("Attacker removes 2"));

// Lands: paint all of Rhûn -> region ruled, muster 3+2=5
click(find("Lands")); await wait(150);
for (const t of ["Withered Heath", "Essaroth", "North Rhûn", "South Rhûn"]) {
  click([...dom.window.document.querySelectorAll("button")].find((b) => b.textContent.trim().replace(/^⌂\s*/, "") === t)); await wait(40);
}
await wait(120);
check("lands: region-complete detection", body().includes("Player 1 rules"));
check("lands: live muster", [...dom.window.document.querySelectorAll(".rb-display")].some((e) => e.textContent.trim() === "5"));

// Palantír
click(find("Stone")); await wait(120);
setInput(dom.window.document.querySelector("input[placeholder]"), "who wins a tie"); await wait(150);
check("palantír: answers a rules question", body().includes("defender wins all ties"));

// End turn advances the Ring
click(find("Turn")); await wait(120);
click(find("End turn")); await wait(400);
check("end turn: Fellowship advances and turn passes", body().includes("Buckland") && body().includes("Player 2"));

console.log(failed ? `\n${failed} check(s) FAILED` : "\nAll checks passed");
process.exit(failed ? 1 : 0);
