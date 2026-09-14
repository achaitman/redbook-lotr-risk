import { useState, useEffect, useRef } from "react";
import BoardMap from "./BoardMap.jsx";

// ———— Game data: Risk LOTR Trilogy Edition (verified vs. rulebook + gameboard) ————
const REGIONS = [
  { name: "Arnor", territories: 11, bonus: 7 },
  { name: "Gondor", territories: 10, bonus: 7 },
  { name: "Rhovanion", territories: 8, bonus: 5 },
  { name: "Rohan", territories: 7, bonus: 4 },
  { name: "Eriador", territories: 7, bonus: 3 },
  { name: "Mordor", territories: 6, bonus: 2 },
  { name: "Haradwaith", territories: 6, bonus: 2 },
  { name: "Mirkwood", territories: 5, bonus: 4 },
  { name: "Rhûn", territories: 4, bonus: 2 },
];

const CARD_SETS = [
  { label: "3 Elven Archers", value: 4 },
  { label: "3 Dark Riders", value: 6 },
  { label: "3 Eagles", value: 8 },
  { label: "One of each", value: 10 },
];

// All 64 territories, grouped to match the rulebook's verified per-region counts.
// (s = contains a stronghold.) Reconstructed from the gameboard; fully editable in-app.
const DEFAULT_TERRITORIES = [
  // Eriador (7)
  { name: "The Shire", region: "Eriador" },
  { name: "Tower Hills", region: "Eriador" },
  { name: "Evendim Hills", region: "Eriador", s: true },
  { name: "Lune Valley", region: "Eriador" },
  { name: "Forlindon", region: "Eriador" },
  { name: "Mithlond", region: "Eriador" },
  { name: "Harlindon", region: "Eriador" },
  // Arnor (11)
  { name: "Buckland", region: "Arnor" },
  { name: "Old Forest", region: "Arnor" },
  { name: "Fornost", region: "Arnor" },
  { name: "Weather Hills", region: "Arnor" },
  { name: "South Downs", region: "Arnor" },
  { name: "North Downs", region: "Arnor" },
  { name: "Borderlands", region: "Arnor" },
  { name: "Angmar", region: "Arnor" },
  { name: "Eastern Angmar", region: "Arnor" },
  { name: "Carn Dûm", region: "Arnor" },
  { name: "Rhudaur", region: "Arnor", s: true },
  // Rohan (7)
  { name: "Eregion", region: "Rohan" },
  { name: "Dunland", region: "Rohan" },
  { name: "Enedwaith", region: "Rohan" },
  { name: "Minhiriath", region: "Rohan" },
  { name: "Fangorn", region: "Rohan", s: true },
  { name: "Gap of Rohan", region: "Rohan" },
  { name: "West Rohan", region: "Rohan", s: true },
  // Rhovanion (8)
  { name: "Moria", region: "Rhovanion", s: true },
  { name: "Lórien", region: "Rhovanion" },
  { name: "Gladden Fields", region: "Rhovanion" },
  { name: "The Wold", region: "Rhovanion" },
  { name: "Emyn Muil", region: "Rhovanion" },
  { name: "Dead Marshes", region: "Rhovanion" },
  { name: "Brown Lands", region: "Rhovanion" },
  { name: "Rhûn Hills", region: "Rhovanion" },
  // Mirkwood (5)
  { name: "Carrock", region: "Mirkwood" },
  { name: "North Mirkwood", region: "Mirkwood" },
  { name: "Eastern Mirkwood", region: "Mirkwood" },
  { name: "South Mirkwood", region: "Mirkwood", s: true },
  { name: "Anduin Valley", region: "Mirkwood" },
  // Rhûn (4)
  { name: "Withered Heath", region: "Rhûn" },
  { name: "Esgaroth", region: "Rhûn" },
  { name: "North Rhûn", region: "Rhûn" },
  { name: "South Rhûn", region: "Rhûn" },
  // Gondor (10)
  { name: "Minas Tirith", region: "Gondor", s: true },
  { name: "Osgiliath", region: "Gondor" },
  { name: "South Ithilien", region: "Gondor" },
  { name: "Lebennin", region: "Gondor" },
  { name: "Belfalas", region: "Gondor" },
  { name: "Lamedon", region: "Gondor" },
  { name: "Vale of Erech", region: "Gondor" },
  { name: "Anfalas", region: "Gondor" },
  { name: "Dol Amroth", region: "Gondor" },
  { name: "Druwaith Iaur", region: "Gondor" },
  // Mordor (6)
  { name: "Udûn Vale", region: "Mordor", s: true },
  { name: "Mount Doom", region: "Mordor" },
  { name: "Minas Morgul", region: "Mordor", s: true },
  { name: "Gorgoroth", region: "Mordor" },
  { name: "Barad-dûr", region: "Mordor", s: true },
  { name: "Nurn", region: "Mordor" },
  // Haradwaith (6)
  { name: "Umbar", region: "Haradwaith", s: true },
  { name: "Harondor", region: "Haradwaith" },
  { name: "Harad", region: "Haradwaith" },
  { name: "Near Harad", region: "Haradwaith" },
  { name: "Khand", region: "Haradwaith" },
  { name: "Deep Harad", region: "Haradwaith" },
];

// Names that earlier versions of the app used before the board photo settled the spelling.
const RENAMED_TERRITORIES = { Essaroth: "Esgaroth", Andrast: "Dol Amroth", Udun: "Udûn Vale" };
// Printed on the board as a place inside another land, not a territory of its own.
const REMOVED_TERRITORIES = ["Dagorlad"];
const migrateNames = (saved) => {
  const fix = (n) => RENAMED_TERRITORIES[n] || n;
  // Known lands take their region from the board list; lands the board has that the save lacks are added.
  const region = Object.fromEntries(DEFAULT_TERRITORIES.map((t) => [t.name, t.region]));
  const territories = (saved.territories && saved.territories.length ? saved.territories : DEFAULT_TERRITORIES)
    .map((t) => ({ ...t, name: fix(t.name), region: region[fix(t.name)] || t.region }))
    .filter((t) => !REMOVED_TERRITORIES.includes(t.name));
  DEFAULT_TERRITORIES.forEach((t) => { if (!territories.some((x) => x.name === t.name)) territories.push({ ...t }); });
  const owners = {};
  Object.entries(saved.owners || {}).forEach(([k, v]) => { if (!REMOVED_TERRITORIES.includes(fix(k))) owners[fix(k)] = v; });
  return { territories, owners };
};

const FACTIONS = [
  { id: "yellow", label: "Yellow — Free Peoples", side: "good", hex: "#b8923a" },
  { id: "green", label: "Green — Free Peoples", side: "good", hex: "#4a6741" },
  { id: "red", label: "Red — Sauron's Forces", side: "evil", hex: "#8e2f21" },
  { id: "black", label: "Black — Sauron's Forces", side: "evil", hex: "#33291f" },
];

const START_BATTALIONS = { 2: 60, 3: 52, 4: 45 };

// Territory-card sides for the 2-player setup: the Good player starts on the 16 Good-shield lands,
// the Evil player on the 16 Evil-shield lands. Best guess from the board — check against your cards.
const GOOD_TERRITORIES = ["The Shire", "Tower Hills", "Evendim Hills", "Lune Valley", "Forlindon", "Mithlond", "Harlindon",
  "Eregion", "Dunland", "Enedwaith", "Minhiriath", "Fangorn", "Gap of Rohan", "West Rohan", "Lórien", "Rhudaur"];
const EVIL_TERRITORIES = ["Udûn Vale", "Mount Doom", "Minas Morgul", "Gorgoroth", "Barad-dûr", "Nurn",
  "Umbar", "Harondor", "Harad", "Near Harad", "Khand", "Deep Harad", "Withered Heath", "Esgaroth", "North Rhûn", "South Rhûn"];
const startingOwners2p = (players) => {
  const sideOf = (p) => FACTIONS.find((f) => f.id === p.faction)?.side;
  const good = players.findIndex((p) => sideOf(p) === "good");
  const evil = players.findIndex((p) => sideOf(p) === "evil");
  const owners = {};
  if (good >= 0) GOOD_TERRITORIES.forEach((n) => { owners[n] = good; });
  if (evil >= 0) EVIL_TERRITORIES.forEach((n) => { owners[n] = evil; });
  return owners;
};

const DEFAULT_PATH = [
  { name: "The Shire", die: false },
  { name: "Buckland", die: false },
  { name: "Old Forest", die: false },
  { name: "Fornost (Bree)", die: false },
  { name: "Weather Hills", die: false },
  { name: "Rhudaur (Rivendell)", die: false },
  { name: "Eregion", die: false },
  { name: "Moria", die: true },
  { name: "Gladden Fields", die: false },
  { name: "Lórien", die: true },
  { name: "The Wold", die: false },
  { name: "Emyn Muil", die: false },
  { name: "Dead Marshes", die: true },
  { name: "Ithilien", die: false },
  { name: "Minas Morgul", die: true },
  { name: "Gorgoroth", die: true },
  { name: "Mount Doom", die: false },
];
// The rulebook's 7-step turn, written so a young reader can lead the table.
// `kid` is the one-line instruction shown big in the workspace.
const TURN_STEPS = [
  {
    key: "reinforce",
    title: "Reinforcements",
    kid: "Get your new battalions and put them on the board.",
  },
  {
    key: "combat",
    title: "Attack",
    kid: "Roll the dice to attack. Attack as many times as you like — or not at all.",
  },
  {
    key: "fortify",
    title: "Fortify",
    kid: "One move: slide battalions from one of your lands to another, passing only through lands you own. Leave at least 1 behind.",
  },
  {
    key: "territoryCard",
    title: "Territory card",
    kid: "You won a new land this turn — draw 1 Territory card.",
    conditional: "conquered",
    skipText: "No new lands this turn, so no Territory card. Skip this step.",
  },
  {
    key: "adventureCard",
    title: "Adventure card",
    kid: "A Leader took a Site of Power — draw 1 Adventure card.",
    conditional: "siteOfPower",
    skipText: "No Leader took a Site of Power, so no Adventure card. Skip this step.",
  },
  {
    key: "leader",
    title: "Check your Leaders",
    kid: "Look at the board. Do you still have a Leader? If not, put one in any land you own.",
  },
  {
    key: "fellowship",
    title: "Move the Fellowship",
    kid: "Tap End turn. The Ring moves by itself.",
    auto: true,
  },
];

const SETUP_2P = [
  "One player takes a Good army, the other an Evil army. A third, neutral army uses one of the two unused colours. Each player takes 60 battalions and 2 Leaders.",
  "Remove the 2 wild cards. Separate the Territory cards into Good, Evil and Neutral decks; shuffle each.",
  "Deal: Good player takes the 16 Good cards. Evil player takes the 16 Evil cards. The neutral army gets 21 Neutral cards.",
  "Each player places 1 battalion on each territory shown on their cards. Each neutral territory gets 2 neutral battalions (42 neutral battalions total).",
  "Roll a die; the higher roll starts. Take turns placing 1 battalion into an unclaimed territory until every territory on the board is occupied.",
  "Then alternate placing battalions into territories you already control until all 60 of your starting battalions are on the board.",
  "Place Leaders in turn order: each player places 1 Leader, then each places their second (never 2 Leaders in one territory).",
  "Shuffle all Territory cards back into one deck with the wild cards. Deal each player 1 Territory card. Remove the Event cards from the Adventure deck, deal 4 Adventure cards to each player, then shuffle the Events back in.",
  "Place the One Ring in The Shire. Highest die roll goes first.",
  "Neutral army rules: it never attacks or redeploys, never moves the Fellowship, and gets no Leaders or Adventure cards. When you attack it, the other player rolls its black defence dice.",
];

const SETUP_BY_COUNT = {
  3: [
    "Each army starts with 52 battalions.",
    "One player is the Free Peoples; the other two play Sauron's forces.",
    "Deal all 16 Good cards to the Free Peoples player. Each Sauron player gets 8 Evil cards and 8 Neutral cards.",
  ],
  4: [
    "Each army starts with 45 battalions.",
    "Two Free Peoples armies vs. two Sauron armies.",
    "Each Good player gets 8 Good cards; each Evil player gets 8 Evil cards. The remaining territories are claimed during the draft.",
    "Optional: play Alliance Risk or Team Risk (rulebook pages 18–19).",
  ],
};

const SETUP_COMMON = [
  "Remove the 2 wild cards. Sort Territory cards into Good (grey shield), Evil (black shield) and Neutral piles; shuffle each.",
  "Deal Territory cards (see your player count below) and place 1 battalion on each territory you were dealt.",
  "Shuffle all Territory cards back together with the wild cards.",
  "Take turns placing 1 battalion in an empty territory until all 64 are claimed.",
  "Take turns adding 1 battalion at a time to your own territories until everyone is out.",
  "Place Leaders in turn order: each player places 1 Leader, then each places their second (never 2 Leaders in one territory).",
  "Deal each player 1 Territory card. Remove the Event cards from the Adventure deck, deal 4 Adventure cards to each player, then shuffle the Events back into the deck.",
  "Place the One Ring in The Shire. Highest die roll goes first.",
];

// ———— Palantír: offline rules oracle (no network, no AI) ————
const PALANTIR_KB = [
  // Setup
  { category: "Setup", q: "How many battalions do players start with?",
    keywords: ["start", "starting", "battalions", "begin", "armies", "pieces", "many", "60", "52", "45"],
    a: "2 players: 60 each. 3 players: 52 each. 4 players: 45 each. Each player also takes 2 Leaders. (Small figure = 1 battalion, mounted = 3, large creature = 5.)" },
  { category: "Setup", q: "How are Territory cards dealt at setup?",
    keywords: ["deal", "dealt", "cards", "setup", "distribute", "claim", "starting", "territories"],
    a: "4 players: split the Good deck (8 cards to each Good player) and the Evil deck (8 to each Evil player). 3 players: all 16 Good cards to the lone Good player; each Evil player gets 8 Evil + 8 Neutral. Place 1 battalion on each territory shown on your cards, then shuffle every Territory card (with the 2 wilds) back into one deck." },
  { category: "Setup", q: "How do we place Leaders at setup?",
    keywords: ["leader", "leaders", "place", "shield", "setup", "shields"],
    a: "After all battalions are on the board, each player places 1 Leader in a territory they control, in turn order. Then each places their second Leader. You can never have two of your own Leaders in the same territory." },
  { category: "Setup", q: "How many Adventure cards do we start with?",
    keywords: ["adventure", "cards", "deal", "start", "four", "event", "setup"],
    a: "Remove the Event cards ('Play Immediately') from the Adventure deck, deal 4 Adventure cards to each player, then shuffle the Events back in. Also deal each player 1 Territory card face-down." },
  { category: "Setup", q: "Who takes the first turn?",
    keywords: ["first", "start", "goes", "begin", "order", "who"],
    a: "Each player rolls 1 die; highest roll goes first, then play passes to the left. The player who placed their battalions first may or may not be the one who takes the first turn." },
  { category: "Setup", q: "Where does the One Ring start?",
    keywords: ["ring", "start", "shire", "fellowship", "begin", "place"],
    a: "Place the One Ring in the Shire — that's where the Fellowship begins its journey, and it represents the Fellowship from then on." },

  // Combat
  { category: "Combat", q: "How many dice does each side roll?",
    keywords: ["dice", "many", "roll", "attack", "defend", "number"],
    a: "Attacker rolls 1, 2, or 3 dice (one per attacking battalion, max 3 per battle). Defender rolls 1 or 2 dice. You need at least 2 battalions in a territory to attack — one must always stay behind." },
  { category: "Combat", q: "Who wins a tie?",
    keywords: ["tie", "ties", "tied", "equal", "same", "draw", "defender"],
    a: "The defender wins all ties. Sort each side's dice highest to lowest, compare highest vs highest and second vs second; the lower roll loses a battalion, and equal rolls go to the defender." },
  { category: "Combat", q: "How are the dice compared?",
    keywords: ["compare", "highest", "dice", "resolve", "battle", "order", "sort"],
    a: "Order each side's dice highest to lowest. Compare the two highest, then the two second-highest. In each comparison the loser removes 1 battalion. If one side rolled more dice, the extra unmatched dice are ignored." },
  { category: "Combat", q: "What does a Leader do in combat?",
    keywords: ["leader", "bonus", "combat", "attack", "defense", "defence"],
    a: "A Leader adds +1 to its side's single highest die — on attack or defense. It must move with a battalion and is not itself a battalion." },
  { category: "Combat", q: "What does a stronghold do in combat?",
    keywords: ["stronghold", "defend", "bonus", "fortress", "defense", "defence"],
    a: "Defending a territory that contains a stronghold gives +1 to the defender's highest die. With both a Leader AND a stronghold defending, the bonus is +2 to the highest die." },
  { category: "Combat", q: "When I conquer a territory, how many battalions move in?",
    keywords: ["conquer", "move", "capture", "take", "occupy", "win", "invasion", "moving"],
    a: "When you defeat the last defender, move the battalions that fought into the new territory. You may then move additional battalions from the attacking territory — always leaving at least 1 behind. If a Leader fought, it must move in too." },
  { category: "Combat", q: "When is a Leader removed from the board?",
    keywords: ["leader", "killed", "removed", "defeated", "lost", "captured"],
    a: "If the last battalion in a territory containing a Leader is defeated, that Leader is also defeated and removed. If you ever have no Leaders in play, place one in any territory you control at the end of your turn (step 6)." },
  { category: "Combat", q: "What happens when I eliminate a player?",
    keywords: ["eliminate", "eliminated", "defeat", "player", "out", "kill", "destroy"],
    a: "Defeat a player's last battalion and they're out. You take all their Territory cards into your hand. You do NOT get their Adventure cards — those are discarded. If this puts you at 5+ Territory cards, you must immediately trade in sets." },
  { category: "Combat", q: "Can I attack more than once on my turn?",
    keywords: ["multiple", "attacks", "again", "more", "several", "territories", "twice"],
    a: "Yes. You can attack as often as you like, attack multiple territories, and between battles switch which of your territories you attack from. But within a single battle, all attacking battalions must come from one territory." },
  { category: "Combat", q: "Can I attack with more than 3 battalions?",
    keywords: ["three", "max", "maximum", "battalions", "attack", "force", "limit"],
    a: "Your invading force can be larger than 3, but no more than 3 battalions roll in any one battle. Once you win the territory, you can move the rest in." },

  // Reinforcements
  { category: "Reinforcements", q: "How many reinforcements do I get?",
    keywords: ["reinforcements", "many", "territories", "divide", "three", "muster", "receive", "get"],
    a: "Count the territories you control and divide by 3, rounding down — but never fewer than 3. Add region bonuses for any whole regions you control, plus battalions from any Territory card sets you trade in. (The Lands tab counts all of this for you.)" },
  { category: "Reinforcements", q: "What are the region bonuses?",
    keywords: ["region", "bonus", "bonuses", "control", "reinforcement", "regions"],
    a: "Arnor 7, Gondor 7, Rhovanion 5, Rohan 4, Mirkwood 4, Eriador 3, Mordor 2, Haradwaith 2, Rhûn 2. You earn a region bonus only if you control every territory in that region." },
  { category: "Reinforcements", q: "Do strongholds give reinforcements?",
    keywords: ["stronghold", "reinforce", "battalion", "start", "place", "extra"],
    a: "Yes — at the very start of your reinforcement step, place 1 battalion into each stronghold territory you control. This is in addition to your territories-÷-3 count." },
  { category: "Reinforcements", q: "How many battalions for a card set?",
    keywords: ["card", "set", "sets", "trade", "value", "battalions", "cash"],
    a: "3 Elven Archers = 4. 3 Dark Riders = 6. 3 Eagles = 8. One of each = 10. A wild card counts as any symbol. Sets are traded only during your reinforcement step." },
  { category: "Reinforcements", q: "When must I trade in cards?",
    keywords: ["must", "trade", "five", "cards", "force", "hand", "5"],
    a: "If you hold 5 or more Territory cards at the start of your turn, you must trade in a set. With 5+ cards you always have at least one valid set." },

  // Cards
  { category: "Cards", q: "When do I draw a Territory card?",
    keywords: ["territory", "card", "draw", "conquer", "end", "earn"],
    a: "If you conquered at least 1 territory on your turn, draw 1 Territory card at the end (step 4). Just one, however many territories you took. No conquest means no card." },
  { category: "Cards", q: "When do I draw an Adventure card?",
    keywords: ["adventure", "card", "draw", "site", "power", "leader"],
    a: "If one of your Leaders conquered a territory containing a Site of Power, draw 1 Adventure card (step 5). Only 1 per turn no matter how many Sites you took. Hand limit is 4 — discard down if you exceed it." },
  { category: "Cards", q: "What are Event cards?",
    keywords: ["event", "card", "play", "immediately", "draw"],
    a: "Event cards read 'Play Immediately' — resolve them at once, then draw again, continuing until you draw a Mission or Power card. Once a Mission or Power card is drawn, no more cards may be played that turn." },
  { category: "Cards", q: "What are Mission cards?",
    keywords: ["mission", "card", "leader", "site", "power", "reward", "objective"],
    a: "A Mission card is a secret objective: get a Leader to the named Site of Power (by conquering it or moving there), then turn the card in for its reward. Keep completed Missions in front of you — they score points at game end." },
  { category: "Cards", q: "What are Power cards?",
    keywords: ["power", "card", "combat", "help"],
    a: "Power cards help during combat (and sometimes on other players' turns). Keep played Power cards in front of you — they score points at the end of the game." },
  { category: "Cards", q: "What do wild cards do?",
    keywords: ["wild", "card", "joker", "any", "symbol", "wildcard"],
    a: "A wild card shows all 3 battalion symbols and counts as any one of them when forming a set. The 2 wild cards are removed at setup and shuffled back into the Territory deck afterward." },

  // Fellowship
  { category: "Fellowship", q: "How does the Fellowship move?",
    keywords: ["fellowship", "move", "ring", "advance", "path", "turn"],
    a: "At the end of every player's turn, move the One Ring one territory along the dotted path. On a die-symbol territory you must roll first: greater than 3 (4, 5, or 6) moves it on; 3 or less and it stays, and the next player tries again. (The Red Book does this for you when you end your turn.)" },
  { category: "Fellowship", q: "What roll do I need to leave a die territory?",
    keywords: ["die", "roll", "symbol", "territory", "leave", "four", "4"],
    a: "On a territory marked with a die symbol, roll before moving the Fellowship. Greater than 3 (4+) advances it; 3 or lower and it's held until a later turn rolls 4+." },
  { category: "Fellowship", q: "How is the One Ring destroyed?",
    keywords: ["mount", "doom", "destroy", "ring", "win", "end"],
    a: "When the Fellowship reaches Mount Doom, roll one die. Greater than 3 (a 4, 5, or 6) destroys the Ring and ends the game — highest score wins. 3 or less and it isn't destroyed; the next player rolls again at the end of their turn." },
  { category: "Fellowship", q: "When does the game end?",
    keywords: ["end", "game", "over", "finish", "win"],
    a: "The game ends when the One Ring is destroyed at Mount Doom (roll greater than 3). It's also possible — though unlikely — to win first by conquering all of Middle-earth. Then scoring decides the winner." },

  // Scoring
  { category: "Scoring", q: "How is scoring calculated?",
    keywords: ["score", "scoring", "points", "count", "win", "end", "tally"],
    a: "1 point per territory you control, 2 per stronghold, points equal to the bonus of each whole region you hold, plus the points printed on Adventure cards you have PLAYED (cards still in hand don't count). Highest total wins." },
  { category: "Scoring", q: "How are ties broken at the end of the game?",
    keywords: ["tie", "tiebreaker", "breaker", "equal", "scores", "win"],
    a: "Most territories wins; then most strongholds; then most Adventure-card points; and if still tied, roll the red dice — highest wins." },

  // Two-player
  { category: "Two-player", q: "How does the 2-player setup work?",
    keywords: ["two", "player", "setup", "neutral", "deal", "2"],
    a: "One player is Good, one Evil; a third unused colour is the neutral army. Remove the wilds. Deal 16 Good cards to the Good player, 16 Evil to the Evil player, and 21 Neutral to the neutral army. Place 1 battalion on each of your card territories; each neutral territory gets 2 neutral battalions (42 total)." },
  { category: "Two-player", q: "Which territories are unclaimed in the 2-player game?",
    keywords: ["unclaimed", "empty", "leftover", "claim", "two", "remaining", "territories", "2"],
    a: "The deck has 62 territory cards (64 minus the 2 wilds). Dealing 16 + 16 + 21 = 53 of them, so 11 territories have no card dealt — those are the unclaimed ones. After placing battalions, roll for first player and alternate placing 1 battalion into those 11 empties until all 64 are occupied. (One player ends with one extra — the rulebook says that's fine.)" },
  { category: "Two-player", q: "What can the neutral army do?",
    keywords: ["neutral", "army", "defend", "attack", "move", "rules", "two"],
    a: "The neutral army only defends — it never attacks, redeploys, moves the Fellowship, or receives Leaders or Adventure cards. When you attack it, the other (non-attacking) player rolls its black defence dice." },

  // Movement
  { category: "Movement", q: "How does fortifying work?",
    keywords: ["fortify", "move", "redeploy", "position", "free"],
    a: "Once per turn (step 3) you may move as many battalions as you like from one of your territories to another, as long as every territory between them is also yours. You can't pass through enemy territory, and you must leave at least 1 battalion behind." },
  { category: "Movement", q: "What makes two territories adjacent?",
    keywords: ["adjacent", "adjacency", "border", "reach", "connected", "sea", "attack"],
    a: "Territories are adjacent if they share a border or are joined by a sea-line across water. Mountains and rivers are impassable — territories split by a mountain, or by a river with no bridge, are NOT adjacent." },

  // Misc
  { category: "Setup", q: "Which territories have strongholds?",
    keywords: ["stronghold", "strongholds", "list", "where", "which"],
    a: "Strongholds sit in: Evendim Hills (Annúminas), Rhudaur (Rivendell), Moria (Mines of Moria), South Mirkwood (Dol Guldur), Fangorn (Isengard), West Rohan (Helm's Deep), Minas Tirith, Udûn Vale, Minas Morgul, Barad-dûr, and Umbar (City of the Corsairs). On the Lands tab they show a ⌂." },
  { category: "Cards", q: "What are Sites of Power?",
    keywords: ["site", "power", "sites", "leader", "adventure"],
    a: "Sites of Power are special spots inside certain territories. When a Leader conquers a territory containing one, you may draw an Adventure card, and they complete Mission cards. A Site is part of its territory, not a separate space." },
  { category: "Setup", q: "What are the steps of a turn?",
    keywords: ["turn", "steps", "order", "sequence", "phases", "seven"],
    a: "1) Receive & place reinforcements. 2) Combat (optional). 3) Fortify (optional). 4) Collect a Territory card (if you conquered). 5) Collect an Adventure card (if a Leader took a Site of Power). 6) Replace a Leader (if none in play). 7) Move the Fellowship." },
];

const PALANTIR_STOPWORDS = new Set(
  "a an the is are was do does did how what when where which who whom whose my our your you we it its that this these those of to in on for with and or if can could may might must get got at as be been being there here many much some any".split(" ")
);

function palantirTokens(s) {
  return (s || "")
    .toLowerCase()
    .replace(/[^a-z0-9û\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 2 && !PALANTIR_STOPWORDS.has(w));
}

function consultPalantir(query) {
  const qt = palantirTokens(query);
  if (!qt.length) return [];
  return PALANTIR_KB.map((entry) => {
    const qtext = entry.q.toLowerCase();
    let score = 0;
    for (const t of qt) {
      let best = 0;
      for (const k of entry.keywords) {
        if (k === t) best = Math.max(best, 3);
        else if (k.length >= 3 && t.length >= 3 && (k.startsWith(t) || t.startsWith(k))) best = Math.max(best, 2);
        else if (Math.min(k.length, t.length) >= 4 && (k.includes(t) || t.includes(k))) best = Math.max(best, 1.5);
      }
      if (best === 0 && qtext.includes(t)) best = 1;
      score += best;
    }
    return { entry, score };
  })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);
}

// ———— Helpers ————

const STORAGE_KEY = "redbook-lotr-risk-v4";
const rollDie = () => Math.floor(Math.random() * 6) + 1;
const buzz = (pattern) => {
  try {
    if (navigator.vibrate) navigator.vibrate(pattern);
  } catch (e) {}
};
const lerpColor = (a, b, t) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return (
    "#" +
    pa
      .map((v, i) => Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, "0"))
      .join("")
  );
};

const freshGame = () => ({
  screen: "setup",
  playerCount: null,
  players: [],
  currentPlayer: 0,
  round: 1,
  checks: Array(TURN_STEPS.length).fill(false),
  conquered: false,
  siteOfPower: false,
  taken: [], // territory names conquered this turn (display only)
  tradeIns: {}, // card sets cashed in this turn: label -> count
  ringStep: 0,
  ringDestroyed: false,
  path: DEFAULT_PATH.map((p) => ({ ...p })),
  regionBonuses: REGIONS.map((r) => r.bonus),
  huntRule: false,
  lastTurn: null,
  territories: DEFAULT_TERRITORIES.map((t) => ({ ...t })),
  owners: {}, // territory name -> player index (absent = neutral)
});

const normalizePlayers = (players) =>
  (players || []).map((p) => ({ cards: 0, eliminated: false, ...p }));

// ———— Palette ————
const PARCHMENT = "#ece0c4";
const PARCHMENT_DEEP = "#e0d0a8";
const INK = "#2b2014";
const INK_FADE = "#6f5f44";
const WAX = "#8e2f21";
const GOLD = "#a87b1f";
const GOLD_BRIGHT = "#e9c25c";
const EMBER = "#ff5a2c";
const GOOD_GREEN = "#4a6741";
const LINE = "rgba(43,32,20,0.28)";
const PAPER = "rgba(255,250,235,0.7)";

// subtle paper grain as an inline SVG (no network needed)
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E\")";

// ———— Shared game math ————
function regionOwner(game, regionName) {
  // returns the player index that owns EVERY territory in the region, else null
  const terrs = game.territories.filter((t) => t.region === regionName);
  if (!terrs.length) return null;
  const first = game.owners[terrs[0].name];
  if (first === undefined) return null;
  return terrs.every((t) => game.owners[t.name] === first) ? first : null;
}

// Everything the reinforcement step needs for one player, computed from the map.
function musterFor(game, idx, tradeIns) {
  const sets = tradeIns || {};
  const terrs = game.territories.filter((t) => game.owners[t.name] === idx);
  const count = terrs.length;
  const base = count > 0 ? Math.max(3, Math.floor(count / 3)) : 0;
  const strongholds = terrs.filter((t) => t.s);
  const regions = REGIONS.map((r, ri) => ({ name: r.name, bonus: game.regionBonuses[ri] })).filter(
    (r) => regionOwner(game, r.name) === idx
  );
  const regionTotal = regions.reduce((s, r) => s + r.bonus, 0);
  const cardTotal = CARD_SETS.reduce((s, c) => s + (sets[c.label] || 0) * c.value, 0);
  return {
    count,
    base,
    strongholds,
    regions,
    regionTotal,
    cardTotal,
    total: base + regionTotal + cardTotal,
    mapped: Object.keys(game.owners || {}).length > 0,
  };
}

export default function RedBook() {
  const [game, setGame] = useState(freshGame());
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState("turn");
  const saveTimer = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const saved = JSON.parse(raw);
          setGame({
            ...freshGame(),
            ...saved,
            players: normalizePlayers(saved.players),
            ...migrateNames(saved),
            taken: saved.taken || [],
            tradeIns: saved.tradeIns || {},
          });
          if (saved.screen === "play") setTab(saved.tab === "battle" ? "turn" : saved.tab || "turn");
        }
      } catch (e) {}
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...game, tab }));
      } catch (e) {}
    }, 400);
  }, [game, tab, loaded]);

  const update = (patch) => setGame((g) => ({ ...g, ...patch }));

  const newGame = () => {
    if (!window.confirm("Start a new game? The current ledger will be erased.")) return;
    setGame(freshGame());
    setTab("turn");
  };

  if (!loaded)
    return (
      <Shell>
        <p className="text-center py-16" style={{ color: INK_FADE }}>
          Opening the Red Book…
        </p>
      </Shell>
    );

  const playing = game.screen === "play";
  return (
    <Shell onNewGame={playing ? newGame : null} nav={playing ? <TabBar tab={tab} setTab={setTab} /> : null}>
      {!playing ? (
        <SetupScreen game={game} update={update} />
      ) : (
        <>
          {tab === "turn" && <TurnScreen game={game} update={update} setTab={setTab} />}
          {tab === "lands" && <LandsScreen game={game} update={update} />}
          {tab === "ring" && (<div className="max-w-3xl mx-auto w-full"><RingScreen game={game} update={update} setTab={setTab} /></div>)}
          {tab === "score" && <ScoreScreen game={game} />}
          {tab === "palantir" && (<div className="max-w-3xl mx-auto w-full"><PalantirScreen /></div>)}
        </>
      )}
    </Shell>
  );
}

function Shell({ children, onNewGame, nav }) {
  return (
    <div
      className="rb-shell w-full"
      style={{
        background: `${GRAIN}, radial-gradient(ellipse at 50% 0%, ${PARCHMENT} 0%, ${PARCHMENT_DEEP} 75%, #d2bd8e 100%)`,
        color: INK,
        fontFamily: "'EB Garamond', Georgia, serif",
      }}
    >
      <style>{`
        .rb-display { font-family: 'Cinzel', 'EB Garamond', Georgia, serif; }
        .rb-btn { transition: transform 80ms ease, box-shadow 80ms ease; -webkit-tap-highlight-color: transparent; }
        .rb-btn:active { transform: translateY(1px); }
        .rb-btn:focus-visible { outline: 2px solid ${GOLD}; outline-offset: 2px; }

        /* ——— Layout: phone = one scrolling page; tablet (768px+) = fixed shell, scrolling columns ——— */
        .rb-shell { min-height: 100vh; min-height: 100dvh; display: flex; flex-direction: column; }
        .rb-header { padding: 10px 16px 0; }
        .rb-main { flex: 1 1 auto; min-height: 0; width: 100%; max-width: 1480px; margin: 0 auto; padding: 0 16px 28px; }
        .rb-col { min-height: 0; }
        @media (min-width: 768px) {
          html { font-size: 16px; }
          .rb-shell { height: 100vh; height: 100dvh; overflow: hidden; }
          .rb-header { display: flex; align-items: center; gap: 18px; padding: 6px 18px; border-bottom: 1px solid ${LINE};
            background: rgba(43,32,20,0.05); flex: 0 0 auto; }
          .rb-main { display: flex; flex-direction: column; overflow-y: auto; padding: 14px 18px 24px; }
          .rb-fill { flex: 1 1 0%; min-height: 0; }
          .rb-col { overflow-y: auto; overscroll-behavior: contain; -webkit-overflow-scrolling: touch; }
          .rb-def-col { border-top: none !important; border-left: 1px dashed ${LINE}; }
        }
        @media (min-width: 1024px) { html { font-size: 17px; } }
        @media (min-width: 1280px) { html { font-size: 18px; } }
        @media (min-width: 768px) { .rb-stepnav { position: sticky; bottom: 0; padding-top: 10px; margin-bottom: 0; padding-bottom: 4px;
          background: linear-gradient(to bottom, rgba(226,210,170,0) 0%, #e2d2aa 35%); } }

        /* ——— Guided turn ——— */
        .rb-step-row { border-left: 4px solid transparent; border-radius: 2px; }
        .rb-step-row.active { background: rgba(168,123,31,0.16); border-left-color: ${GOLD}; }
        .rb-step-row.done { opacity: 0.75; }

        /* ——— Modal (territory picker, ring roll) ——— */
        .rb-backdrop { position: fixed; inset: 0; background: rgba(20,14,8,0.62); z-index: 50;
          display: flex; align-items: center; justify-content: center; padding: 14px; }
        .rb-modal { background: ${PARCHMENT}; border: 1px solid ${GOLD}; border-radius: 4px; width: 100%; max-width: 1040px;
          max-height: 92vh; max-height: 92dvh; overflow-y: auto; padding: 16px; box-shadow: 0 14px 40px rgba(0,0,0,0.45); }
        .rb-modal-map { --map-max-h: 58vh; }
        .rb-lands { --lands-map-h: 70vh; }
        @media (min-width: 768px) {
          .rb-modal-map { --map-max-h: calc(92dvh - 46px); }
          .rb-lands { --lands-map-h: calc(100dvh - 110px); }
        }

        /* ——— 3D die ——— */
        .die-scene { perspective: 320px; display:inline-block; }
        .die-cube { position: relative; transform-style: preserve-3d; transition: transform 650ms cubic-bezier(.3,1.4,.4,1); }
        .die-cube.rolling { animation: die-tumble 650ms linear infinite; }
        @keyframes die-tumble {
          0% { transform: rotateX(0) rotateY(0) rotateZ(0); }
          50% { transform: rotateX(220deg) rotateY(160deg) rotateZ(40deg); }
          100% { transform: rotateX(360deg) rotateY(360deg) rotateZ(0); }
        }
        .die-face { position:absolute; inset:0;
          background: radial-gradient(circle at 32% 28%, #efe6cf 0%, #ddcca6 55%, #c9b486 100%);
          border:2px solid ${GOLD}; border-radius: 16%;
          display:grid; grid-template: repeat(3,1fr)/repeat(3,1fr); padding:12%; box-sizing:border-box;
          box-shadow: inset 0 0 6px rgba(43,32,20,0.35); }
        .die-pip { width:72%; height:72%; border-radius:50%; place-self:center;
          background: radial-gradient(circle at 35% 30%, ${GOLD_BRIGHT} 0%, ${GOLD} 60%, #7a5916 100%);
          box-shadow: inset 0 1px 1px rgba(255,240,200,0.7), 0 1px 1px rgba(43,32,20,0.5); }
        @media (prefers-reduced-motion: reduce) {
          .die-cube, .die-cube.rolling { animation: none; transition: none; }
          .doom-shake, .ring-pulse { animation: none !important; }
        }

        /* ——— Mount Doom drama ——— */
        @keyframes doom-shake {
          0%,100% { transform: translate(0,0); } 20% { transform: translate(-3px,2px); }
          40% { transform: translate(3px,-2px); } 60% { transform: translate(-2px,-2px); } 80% { transform: translate(2px,2px); }
        }
        .doom-shake { animation: doom-shake 350ms ease-in-out 3; }
        @keyframes ring-pulse { 0%,100% { opacity:.85; } 50% { opacity:1; } }
        .ring-pulse { animation: ring-pulse 1.8s ease-in-out infinite; }
        @keyframes ember-rise {
          0% { transform: translateY(0) scale(1); opacity: 1; }
          100% { transform: translateY(-46px) scale(.4); opacity: 0; }
        }
        .ember { position:absolute; width:5px; height:5px; border-radius:50%; background:${EMBER};
          animation: ember-rise 1.4s ease-out infinite; }

        /* ——— Palantír seeing-stone ——— */
        .palantir-orb { width:104px; height:104px; border-radius:50%; position:relative;
          background: radial-gradient(circle at 38% 30%, #46566f 0%, #232f44 42%, #0b1019 100%);
          box-shadow: 0 6px 18px rgba(0,0,0,0.45), inset 0 -8px 22px rgba(0,0,0,0.75), inset 0 6px 14px rgba(150,180,230,0.25); }
        .palantir-core { position:absolute; inset:0; border-radius:50%;
          background: radial-gradient(circle at 50% 62%, rgba(233,194,92,0.55) 0%, rgba(255,90,44,0.18) 28%, transparent 58%);
          animation: orb-glow 4.5s ease-in-out infinite; }
        .palantir-glint { position:absolute; top:16%; left:26%; width:26%; height:18%; border-radius:50%;
          background: radial-gradient(circle, rgba(255,255,255,0.5) 0%, transparent 70%); }
        @keyframes orb-glow { 0%,100% { opacity:.55; transform:scale(0.92); } 50% { opacity:1; transform:scale(1.04); } }
        @media (prefers-reduced-motion: reduce) { .palantir-core { animation: none; } }
      `}</style>
      <header className="rb-header">
        <div className="text-center md:text-left md:shrink-0">
          <h1 className="rb-display text-2xl md:text-xl font-bold tracking-wide leading-tight" style={{ color: INK }}>
            The Red Book
          </h1>
          <span className="block text-xs italic md:hidden" style={{ color: INK_FADE }}>
            a companion for Risk · Trilogy Edition
          </span>
        </div>
        {nav && <div className="mt-3 md:mt-0 md:flex-1 md:min-w-0">{nav}</div>}
        {onNewGame && (
          <div className="text-center md:text-right md:shrink-0 mt-2 md:mt-0">
            <button onClick={onNewGame} className="rb-btn text-xs underline underline-offset-2" style={{ color: INK_FADE }}>
              start a new game
            </button>
          </div>
        )}
      </header>
      <main className="rb-main">{children}</main>
    </div>
  );
}

function Panel({ children, className = "", style = {} }) {
  return (
    <div
      className={`rounded-sm p-4 mb-4 ${className}`}
      style={{
        background: "rgba(255,250,235,0.55)",
        border: `1px solid ${LINE}`,
        boxShadow: "0 1px 3px rgba(43,32,20,0.12)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function PanelTitle({ children, sub }) {
  return (
    <div className="mb-3">
      <h2 className="rb-display text-base font-bold tracking-widest uppercase" style={{ color: INK }}>
        {children}
      </h2>
      {sub && (
        <p className="text-sm italic mt-0.5" style={{ color: INK_FADE }}>
          {sub}
        </p>
      )}
    </div>
  );
}

function BigButton({ children, onClick, tone = "gold", disabled, small }) {
  const bg = tone === "wax" ? WAX : tone === "ink" ? INK : GOLD;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rb-btn rb-display w-full rounded-sm font-bold tracking-widest uppercase ${
        small ? "py-2 text-xs" : "py-3 md:py-3.5 text-sm md:text-base"
      } ${disabled ? "opacity-40" : ""}`}
      style={{
        background: disabled ? INK_FADE : bg,
        color: "#f6ecd4",
        boxShadow: disabled ? "none" : "0 2px 0 rgba(43,32,20,0.45)",
      }}
    >
      {children}
    </button>
  );
}

function Stepper({ value, onChange, min = 0, max = 99, warn }) {
  const btn = "rb-btn rb-display w-11 h-11 text-2xl font-bold rounded-sm";
  return (
    <div className="flex items-center gap-2">
      <button
        className={btn}
        style={{ border: `1px solid ${LINE}`, color: INK, background: PAPER }}
        onClick={() => onChange(Math.max(min, value - 1))}
        aria-label="decrease"
      >
        −
      </button>
      <div
        className="rb-display w-14 h-11 flex items-center justify-center text-2xl font-bold rounded-sm"
        style={{
          border: `1px solid ${warn ? WAX : LINE}`,
          background: warn ? "rgba(142,47,33,0.12)" : "rgba(255,250,235,0.9)",
          color: warn ? WAX : INK,
        }}
      >
        {value}
      </div>
      <button
        className={btn}
        style={{ border: `1px solid ${LINE}`, color: INK, background: PAPER }}
        onClick={() => onChange(Math.min(max, value + 1))}
        aria-label="increase"
      >
        +
      </button>
    </div>
  );
}

function Disclosure({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-sm mb-4" style={{ border: `1px solid ${LINE}`, background: "rgba(255,250,235,0.4)" }}>
      <button onClick={() => setOpen(!open)} className="rb-btn w-full flex items-center justify-between px-4 py-3 text-left">
        <span className="rb-display text-sm font-bold tracking-widest uppercase" style={{ color: INK }}>
          {title}
        </span>
        <span className="text-sm" style={{ color: INK_FADE }}>
          {open ? "▾" : "▸"}
        </span>
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

// ———— 3D die ————
const FACE_ROT = {
  1: "rotateX(0deg) rotateY(0deg)",
  6: "rotateY(180deg)",
  2: "rotateX(-90deg)",
  5: "rotateX(90deg)",
  3: "rotateY(-90deg)",
  4: "rotateY(90deg)",
};
const PIPS = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};
const FACE_TRANSFORM = {
  1: "translateZ(VAR)",
  6: "rotateY(180deg) translateZ(VAR)",
  2: "rotateX(90deg) translateZ(VAR)",
  5: "rotateX(-90deg) translateZ(VAR)",
  3: "rotateY(90deg) translateZ(VAR)",
  4: "rotateY(-90deg) translateZ(VAR)",
};

const ROLL_FLAVOR = {
  high: ["The dice favor you.", "Fortune rides with you.", "A herald's roll!"],
  mid: ["A fair throw.", "The bones land true.", "Steady fortune."],
  low: ["The shadow lengthens…", "Ill luck this throw.", "The dice betray you."],
};

function DiceRoller({ bare }) {
  const [n, setN] = useState(1);
  const [dice, setDice] = useState([1]);
  const [rolling, setRolling] = useState(false);
  const [flavor, setFlavor] = useState("");

  const cast = () => {
    if (rolling) return;
    setRolling(true);
    setFlavor("");
    buzz([15, 30, 15, 30, 15]);
    setTimeout(() => {
      const results = [...Array(n)].map(() => rollDie());
      setDice(results);
      setRolling(false);
      const sum = results.reduce((a, b) => a + b, 0);
      const avg = sum / n;
      buzz(avg >= 4 ? [10, 40, 60] : 50);
      const band = avg >= 5 ? "high" : avg >= 3 ? "mid" : "low";
      const opts = ROLL_FLAVOR[band];
      setFlavor(opts[Math.floor(Math.random() * opts.length)]);
    }, 650);
  };

  const body = (
    <>
      <div className="flex items-center justify-between">
        {bare ? (
          <span className="text-sm italic" style={{ color: INK_FADE }}>
            For setup rolls, Hunt checks, or who goes first.
          </span>
        ) : (
          <PanelTitle sub="For setup rolls, Hunt checks, or settling who goes first.">Cast the dice</PanelTitle>
        )}
        <div className="flex items-center gap-1 shrink-0">
          {[1, 2].map((c) => (
            <button
              key={c}
              onClick={() => {
                setN(c);
                setDice([...Array(c)].map((_, i) => dice[i] || 1));
                setFlavor("");
              }}
              className="rb-btn rb-display w-9 h-9 rounded-sm text-sm font-bold"
              style={{
                background: n === c ? INK : PAPER,
                color: n === c ? GOLD_BRIGHT : INK,
                border: `1px solid ${LINE}`,
              }}
              title={`${c} die${c > 1 ? "s" : ""}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-center gap-4 py-3">
        {[...Array(n)].map((_, i) => (
          <Die key={i} value={dice[i] || 1} rolling={rolling} size={56} />
        ))}
      </div>
      <div className="text-center mb-3 h-5">
        {!rolling && flavor && (
          <span className="text-sm italic" style={{ color: INK_FADE }}>
            {n > 1 ? `${dice.reduce((a, b) => a + b, 0)} — ` : ""}
            {flavor}
          </span>
        )}
      </div>
      <BigButton onClick={cast} disabled={rolling}>
        {rolling ? "The bones tumble…" : "Cast"}
      </BigButton>
    </>
  );
  return bare ? body : <Panel>{body}</Panel>;
}

function Die({ value = 1, rolling = false, size = 48 }) {
  const half = size / 2;
  return (
    <span className="die-scene" style={{ width: size, height: size }}>
      <span
        className={`die-cube block ${rolling ? "rolling" : ""}`}
        style={{ width: size, height: size, transform: rolling ? undefined : FACE_ROT[value] }}
      >
        {[1, 2, 3, 4, 5, 6].map((f) => (
          <span key={f} className="die-face" style={{ transform: FACE_TRANSFORM[f].replace("VAR", half + "px") }}>
            {[...Array(9)].map((_, i) => (
              <span key={i} className="die-pip" style={{ opacity: PIPS[f].includes(i) ? 1 : 0 }} />
            ))}
          </span>
        ))}
      </span>
    </span>
  );
}

// ———— Setup ————
function SetupScreen({ game, update }) {
  const count = game.playerCount;

  const setCount = (n) => {
    const defaults =
      n === 2 ? ["yellow", "red"] : n === 3 ? ["yellow", "red", "black"] : ["yellow", "green", "red", "black"];
    update({
      playerCount: n,
      players: defaults.map((f, i) => ({ name: `Player ${i + 1}`, faction: f, cards: 0, eliminated: false })),
    });
  };

  const setPlayer = (i, patch) => {
    update({ players: game.players.map((p, idx) => (idx === i ? { ...p, ...patch } : p)) });
  };

  return (
    <div className="max-w-5xl mx-auto w-full">
      <div className="text-center mb-4 hidden md:block">
        <div className="rb-display text-[11px] tracking-[0.35em] uppercase" style={{ color: WAX }}>
          The War of the Ring
        </div>
        <span className="text-sm italic" style={{ color: INK_FADE }}>
          a companion for Risk · Trilogy Edition
        </span>
      </div>
      <div className="md:grid md:grid-cols-2 md:gap-4">
        <div>
          <Panel>
            <PanelTitle sub="How many armies march to war?">Muster the players</PanelTitle>
            <div className="grid grid-cols-3 gap-2">
              {[2, 3, 4].map((n) => (
                <button
                  key={n}
                  onClick={() => setCount(n)}
                  className="rb-btn rb-display py-3 rounded-sm text-xl font-bold"
                  style={{
                    background: count === n ? INK : PAPER,
                    color: count === n ? GOLD_BRIGHT : INK,
                    border: `1px solid ${LINE}`,
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
            {count && (
              <p className="text-sm mt-3" style={{ color: INK_FADE }}>
                Each army musters <b style={{ color: INK }}>{START_BATTALIONS[count]} battalions</b> (small figure = 1,
                mounted = 3, large creature = 5) and <b style={{ color: INK }}>2 Leaders</b>.
              </p>
            )}
          </Panel>

          {count && (
            <Panel>
              <PanelTitle sub="Name each commander and choose their banner.">The armies</PanelTitle>
              <div className="space-y-3">
                {game.players.map((p, i) => {
                  const fac = FACTIONS.find((f) => f.id === p.faction);
                  return (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full shrink-0" style={{ background: fac.hex, border: "1px solid rgba(0,0,0,0.3)" }} />
                      <input
                        value={p.name}
                        onChange={(e) => setPlayer(i, { name: e.target.value })}
                        className="flex-1 min-w-0 px-2 py-2 rounded-sm text-base"
                        style={{ background: "rgba(255,250,235,0.9)", border: `1px solid ${LINE}`, color: INK }}
                      />
                      <select
                        value={p.faction}
                        onChange={(e) => setPlayer(i, { faction: e.target.value })}
                        className="px-1 py-2 rounded-sm text-sm max-w-[40%]"
                        style={{ background: "rgba(255,250,235,0.9)", border: `1px solid ${LINE}`, color: INK }}
                      >
                        {FACTIONS.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
              {count === 3 && (
                <p className="text-sm mt-3 italic" style={{ color: WAX }}>
                  In a 3-player game, one army is the Free Peoples and two serve Sauron.
                </p>
              )}
            </Panel>
          )}
          {count && <DiceRoller />}
        </div>

        <div>
          {count && (
            <Panel>
              <PanelTitle sub="Tick each as the table is prepared.">Setting the board</PanelTitle>
              <SetupChecklist items={count === 2 ? SETUP_2P : [...SETUP_BY_COUNT[count], ...SETUP_COMMON]} />
            </Panel>
          )}
        </div>
      </div>
      {count === 2 && (
        <p className="text-sm mb-3 px-1" style={{ color: INK_FADE }}>
          When the war begins, the Free Peoples' 16 Good lands and Sauron's 16 Evil lands are marked on the map for you. Mark the
          unclaimed lands you draft afterwards (Lands tab, or "Mark my lands" in step 1).
        </p>
      )}
      {count && (
        <BigButton onClick={() => update({ screen: "play", ...(count === 2 && !Object.keys(game.owners || {}).length ? { owners: startingOwners2p(game.players) } : {}) })}>
          Begin the war
        </BigButton>
      )}
    </div>
  );
}

function SetupChecklist({ items }) {
  const [done, setDone] = useState({});
  return (
    <ol className="space-y-2">
      {items.map((t, i) => (
        <li key={i}>
          <button onClick={() => setDone((d) => ({ ...d, [i]: !d[i] }))} className="rb-btn w-full text-left flex gap-3 items-start">
            <CheckBox checked={!!done[i]} />
            <span
              className="text-base leading-snug"
              style={{ color: done[i] ? INK_FADE : INK, textDecoration: done[i] ? "line-through" : "none" }}
            >
              {t}
            </span>
          </button>
        </li>
      ))}
    </ol>
  );
}

function CheckBox({ checked }) {
  return (
    <span
      className="rb-display shrink-0 w-7 h-7 rounded-sm flex items-center justify-center text-base font-bold"
      style={{
        border: `1.5px solid ${checked ? GOLD : LINE}`,
        background: checked ? GOLD : "rgba(255,250,235,0.8)",
        color: "#f6ecd4",
      }}
    >
      {checked ? "✓" : ""}
    </span>
  );
}

// ———— Tabs ————
const TABS = [
  { id: "turn", label: "Turn" },
  { id: "lands", label: "Lands" },
  { id: "ring", label: "Ring" },
  { id: "score", label: "Score" },
  { id: "palantir", label: "Stone" },
];

function TabBar({ tab, setTab }) {
  return (
    <nav className="grid grid-cols-5 md:flex md:justify-center rounded-sm overflow-hidden" style={{ border: `1px solid ${LINE}` }}>
      {TABS.map((t) => (
        <button
          key={t.id}
          onClick={() => setTab(t.id)}
          className="rb-btn rb-display py-2.5 md:py-2 md:px-6 text-[11px] md:text-xs font-bold tracking-wider uppercase"
          style={{
            background: tab === t.id ? INK : "rgba(255,250,235,0.6)",
            color: tab === t.id ? GOLD_BRIGHT : INK,
          }}
        >
          {t.label}
        </button>
      ))}
    </nav>
  );
}

function FlagToggle({ label, value, onChange }) {
  return (
    <button onClick={() => onChange(!value)} className="rb-btn flex items-center gap-3 text-left py-1">
      <span
        className="w-12 h-7 rounded-full relative shrink-0"
        style={{ background: value ? GOLD : "rgba(43,32,20,0.25)", transition: "background 120ms" }}
      >
        <span
          className="absolute top-0.5 w-6 h-6 rounded-full"
          style={{ left: value ? 22 : 2, background: "#f6ecd4", transition: "left 120ms", boxShadow: "0 1px 2px rgba(0,0,0,0.3)" }}
        />
      </span>
      <span className="text-base" style={{ color: INK }}>
        {label}
      </span>
    </button>
  );
}

// ———— Territory picker (modal): tap the board to mark lands without leaving the turn ————
function ownerLookup(game) {
  return (name) => {
    const i = game.owners[name];
    if (i === undefined || i < 0) return null;
    const p = game.players[i];
    const fac = p ? FACTIONS.find((f) => f.id === p.faction) : null;
    return fac ? { hex: fac.hex, label: p.name } : null;
  };
}

function PlayerLegend({ game }) {
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm" style={{ color: INK_FADE }}>
      {game.players.map((p, i) => {
        const fac = FACTIONS.find((f) => f.id === p.faction);
        return (
          <span key={i} className="flex items-center gap-1">
            <span className="inline-block w-3.5 h-3.5 rounded-full" style={{ background: fac.hex, border: "1.5px solid #fff6d5", boxShadow: "0 0 0 1px rgba(43,32,20,0.5)" }} />
            {p.name}
          </span>
        );
      })}
      <span className="flex items-center gap-1">
        <span className="inline-block w-3 h-3 rounded-full" style={{ border: "2px dashed rgba(43,32,20,0.6)" }} /> nobody yet · ⌂ stronghold
      </span>
    </div>
  );
}

// Region-by-region chips: the fallback when a land is hard to hit on the photo.
function RegionChipList({ game, playerIdx, onTap }) {
  const facOf = (i) => (i === undefined || i < 0 ? null : FACTIONS.find((f) => f.id === game.players[i]?.faction));
  return (
    <div className="md:grid md:grid-cols-2 md:gap-2">
      {REGIONS.map((r) => {
        const terrs = game.territories.filter((t) => t.region === r.name);
        return (
          <div key={r.name} className="mb-2 md:mb-0">
            <div className="rb-display text-xs font-bold tracking-wide mb-1" style={{ color: INK_FADE }}>
              {r.name}
            </div>
            <div className="flex flex-wrap gap-1">
              {terrs.map((t) => {
                const o = game.owners[t.name];
                const hex = facOf(o)?.hex;
                const mine = o === playerIdx;
                return (
                  <button
                    key={t.name}
                    onClick={() => onTap(t.name)}
                    className="rb-btn text-sm px-2 py-1.5 rounded-sm flex items-center gap-1"
                    style={{ background: hex || PAPER, color: hex ? "#f6ecd4" : INK, border: `1px solid ${hex || LINE}`, outline: mine ? `2px solid ${GOLD_BRIGHT}` : "none", outlineOffset: -2 }}
                  >
                    {t.s && <span style={{ opacity: 0.85 }}>⌂</span>}
                    {t.name}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TerritoryPicker({ game, update, playerIdx, mode, onClose }) {
  const player = game.players[playerIdx];
  const [toast, setToast] = useState(null); // { text, undo? }
  const [hot, setHot] = useState(null);
  const [showList, setShowList] = useState(false);

  const tap = (name) => {
    const before = { owners: game.owners, taken: game.taken || [], conquered: game.conquered };
    const owners = { ...game.owners };
    const mine = owners[name] === playerIdx;
    buzz(8);
    setHot(name);
    if (mode === "conquer") {
      if (mine) {
        setToast({ text: `${name} is already ${player.name}'s.` });
        return;
      }
      owners[name] = playerIdx;
      update({ owners, conquered: true, taken: [...before.taken, name] });
      setToast({ text: `${name} is now ${player.name}'s!`, undo: () => { update(before); setToast(null); setHot(null); } });
      return;
    }
    if (mine) delete owners[name];
    else owners[name] = playerIdx;
    update({ owners });
    setToast({ text: mine ? `${name} — cleared.` : `${name} is ${player.name}'s.` });
  };

  return (
    <div className="rb-backdrop" onClick={onClose}>
      <div className="rb-modal rb-modal-map" onClick={(e) => e.stopPropagation()}>
        <div className="md:flex md:gap-4 md:items-start">
          <div className="text-center md:flex-1 md:min-w-0">
            <BoardMap territories={game.territories} ownerOf={ownerLookup(game)} onTap={tap} highlight={hot} maxHeight="var(--map-max-h)" />
          </div>
          <div className="md:w-72 shrink-0 mt-3 md:mt-0 md:sticky md:top-0">
            <div className="rb-display text-lg font-bold tracking-wide leading-tight" style={{ color: INK }}>
              {mode === "conquer" ? "Which land did you take?" : `${player.name}'s lands`}
            </div>
            <div className="text-sm italic mt-0.5" style={{ color: INK_FADE }}>
              {mode === "conquer" ? "Tap the land on the board. Tap Done when you're finished." : "Tap a land to make it yours. Tap it again to clear it."}
            </div>

            <div className="mt-3 rounded-sm px-3 py-2 min-h-[3.5rem]" style={{ background: toast ? "rgba(43,32,20,0.92)" : "rgba(43,32,20,0.06)", border: `1px solid ${toast ? GOLD : LINE}` }}>
              {toast ? (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-base font-semibold" style={{ color: GOLD_BRIGHT }}>{toast.text}</span>
                  {toast.undo && (
                    <button onClick={toast.undo} className="rb-btn rb-display text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-sm shrink-0" style={{ background: "rgba(255,250,235,0.15)", color: "#f6ecd4", border: "1px solid rgba(233,194,92,0.5)" }}>
                      Undo
                    </button>
                  )}
                </div>
              ) : (
                <span className="text-sm" style={{ color: INK_FADE }}>Nothing tapped yet.</span>
              )}
            </div>

            <div className="mt-3">
              <BigButton tone="ink" onClick={onClose}>Done</BigButton>
            </div>
            <div className="mt-3"><PlayerLegend game={game} /></div>
            <button onClick={() => setShowList(!showList)} className="rb-btn mt-3 text-sm underline underline-offset-2" style={{ color: GOLD }}>
              {showList ? "Hide the list" : "Can't find it? Pick from a list"}
            </button>
          </div>
        </div>
        {showList && (
          <div className="mt-3 pt-3" style={{ borderTop: `1px dashed ${LINE}` }}>
            <RegionChipList game={game} playerIdx={playerIdx} onTap={tap} />
          </div>
        )}
      </div>
    </div>
  );
}

// ———— Turn screen: a guided, step-by-step turn ————
function TurnScreen({ game, update, setTab }) {
  const [ending, setEnding] = useState(false);
  const [endRoll, setEndRoll] = useState(null);
  const [picker, setPicker] = useState(null); // null | "conquer" | "paint"
  const workspaceRef = useRef(null);

  const firstOpen = game.checks.findIndex((c, i) => !c && !TURN_STEPS[i].auto);
  const defaultFocus = firstOpen === -1 ? TURN_STEPS.length - 1 : firstOpen;
  const [focus, setFocusRaw] = useState(defaultFocus);
  const setFocus = (i) => {
    setFocusRaw(i);
    const el = workspaceRef.current;
    if (!el) return;
    if (window.innerWidth >= 768) el.scrollTo({ top: 0, behavior: "smooth" });
    else el.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  useEffect(() => {
    setFocusRaw(defaultFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.currentPlayer, game.round]);

  const player = game.players[game.currentPlayer];
  const fac = FACTIONS.find((f) => f.id === player.faction);
  const active = game.players.filter((p) => !p.eliminated);
  const muster = musterFor(game, game.currentPlayer, game.tradeIns);

  const setPlayer = (i, patch) =>
    update({ players: game.players.map((p, idx) => (idx === i ? { ...p, ...patch } : p)) });

  const setCheck = (i, val) => {
    const checks = game.checks.slice();
    checks[i] = val;
    update({ checks });
  };

  // Cashing in a set takes 3 cards out of the hand automatically.
  const setTradeIn = (label, v) => {
    const prev = (game.tradeIns || {})[label] || 0;
    const diff = v - prev;
    const cards = Math.max(0, Math.min(99, (player.cards || 0) - diff * 3));
    update({
      tradeIns: { ...(game.tradeIns || {}), [label]: v },
      players: game.players.map((p, idx) => (idx === game.currentPlayer ? { ...p, cards } : p)),
    });
  };

  const nextIdx = (from) => {
    let i = from;
    for (let k = 0; k < game.players.length; k++) {
      i = (i + 1) % game.players.length;
      if (!game.players[i].eliminated) return i;
    }
    return from;
  };

  const step = TURN_STEPS[focus];
  const isSkipped = (s) =>
    (s.conditional === "conquered" && !game.conquered) || (s.conditional === "siteOfPower" && !game.siteOfPower);

  const goNext = () => {
    buzz(10);
    setCheck(focus, true);
    setFocus(Math.min(focus + 1, TURN_STEPS.length - 1));
  };
  const goBack = () => {
    if (focus === 0) return;
    setCheck(focus - 1, false);
    setFocus(focus - 1);
  };

  // One-tap end of turn: handles the Fellowship, card draw, and pass
  const current = game.path[game.ringStep];
  const atDoom = game.ringStep === game.path.length - 1;
  const needsRoll = !game.ringDestroyed && (atDoom || current.die);
  const nextStop = game.path[game.ringStep + 1];

  const finishTurn = (ringPatch, summary) => {
    const ni = nextIdx(game.currentPlayer);
    const players = game.players.map((p, idx) =>
      idx === game.currentPlayer && game.conquered ? { ...p, cards: Math.min(99, (p.cards || 0) + 1) } : p
    );
    update({
      ...ringPatch,
      players,
      currentPlayer: ni,
      round: ni <= game.currentPlayer ? game.round + 1 : game.round,
      checks: Array(TURN_STEPS.length).fill(false),
      conquered: false,
      siteOfPower: false,
      taken: [],
      tradeIns: {},
      lastTurn: { by: player.name, summary, drewCard: game.conquered },
    });
    setFocusRaw(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const endTurn = () => {
    if (ending) return;
    buzz(20);
    if (game.ringDestroyed) {
      finishTurn({}, "The Ring is already destroyed — count the spoils on the Score page.");
      return;
    }
    if (!needsRoll) {
      finishTurn({ ringStep: game.ringStep + 1 }, `The Fellowship marched on to ${nextStop.name}.`);
      return;
    }
    // a roll is required — tumble the die, then hold the result on screen until Done
    setEnding(true);
    setEndRoll({ rolling: true, value: 1 });
    buzz([15, 30, 15, 30, 15]);
    setTimeout(() => {
      const r = rollDie();
      const ok = r >= 4;
      buzz(ok ? [10, 40, 60] : 80);
      let outcome;
      if (atDoom) {
        outcome = ok
          ? { title: "The Ring is destroyed!", detail: `${player.name} rolled a ${r}. The war is over — time to count the scores.`, destroyed: true,
              summary: `${player.name} rolled a ${r} at Mount Doom — THE RING IS DESTROYED!` }
          : { title: "The Ring endures…", detail: `${player.name} rolled a ${r}. It takes a 4, 5 or 6. The next player tries again at the end of their turn.`,
              patch: {}, summary: `${player.name} rolled a ${r} at Mount Doom — the Ring endures. Next player rolls again.` };
      } else {
        outcome = ok
          ? { title: "The Fellowship presses on!", detail: `${player.name} rolled a ${r}. The Fellowship leaves ${current.name} and reaches ${nextStop.name}.`,
              patch: { ringStep: game.ringStep + 1 }, summary: `Rolled a ${r} — the Fellowship escaped ${current.name} and reached ${nextStop.name}.` }
          : { title: "Held fast…", detail: `${player.name} rolled a ${r}. It takes a 4, 5 or 6 to leave ${current.name}. The next player tries again.`,
              patch: {}, summary: `Rolled a ${r} — the Fellowship is held at ${current.name}.` };
      }
      setEndRoll({ rolling: false, value: r, ok, ...outcome });
    }, 900);
  };

  const closeRoll = () => {
    const o = endRoll;
    if (!o || o.rolling) return;
    setEnding(false);
    setEndRoll(null);
    if (o.destroyed) {
      update({ ringDestroyed: true, lastTurn: { by: player.name, summary: o.summary, drewCard: false } });
      if (setTab) setTab("score");
      return;
    }
    finishTurn(o.patch, o.summary);
  };

  const ringLine = game.ringDestroyed
    ? "The Ring is destroyed — the war is over."
    : atDoom
    ? "Roll 4 or more to destroy the Ring!"
    : needsRoll
    ? `Roll 4 or more to leave ${current.name}.`
    : `The Fellowship will walk to ${nextStop.name}.`;

  const endTurnBlock = (
    <div>
      <BigButton tone={focus === TURN_STEPS.length - 1 ? "gold" : "ink"} onClick={endTurn} disabled={ending}>
        {ending ? "The dice tumble…" : "End turn"}
      </BigButton>
      <div className="text-center text-sm mt-1.5" style={{ color: INK_FADE }}>
        {needsRoll && !game.ringDestroyed ? "⚂ " : ""}
        {ringLine}
      </div>
    </div>
  );

  return (
    <div className="rb-fill md:grid md:grid-cols-[minmax(300px,2fr)_minmax(0,3fr)] md:grid-rows-[minmax(0,1fr)] md:gap-5">
      {/* ——— Left: who's up, the steps, end turn ——— */}
      <div className="rb-col md:pr-1">
        <Panel style={{ borderLeft: `6px solid ${fac.hex}`, marginBottom: 12 }}>
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-xs uppercase tracking-widest" style={{ color: INK_FADE }}>
                Round {game.round} · now marching
              </div>
              <div className="rb-display text-2xl md:text-3xl font-bold leading-tight truncate">{player.name}</div>
            </div>
            <span
              className="rb-display text-[10px] font-bold tracking-widest uppercase px-2 py-1 rounded-sm shrink-0"
              style={{ background: fac.side === "good" ? GOOD_GREEN : WAX, color: "#f6ecd4" }}
            >
              {fac.side === "good" ? "Free Peoples" : "Sauron"}
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-3" style={{ borderTop: `1px dashed ${LINE}` }}>
            <div className="min-w-0">
              <div className="rb-display text-sm font-bold tracking-wide">Territory cards in hand</div>
              {(player.cards || 0) >= 5 && (
                <div className="text-sm font-semibold leading-tight" style={{ color: WAX }}>
                  5 or more — trade a set in step 1!
                </div>
              )}
            </div>
            <Stepper
              value={player.cards || 0}
              onChange={(v) => setPlayer(game.currentPlayer, { cards: v })}
              max={12}
              warn={(player.cards || 0) >= 5}
            />
          </div>
        </Panel>

        {game.lastTurn && (
          <div className="text-sm px-1 mb-3" style={{ color: INK_FADE }}>
            <span className="rb-display text-[10px] font-bold uppercase tracking-widest" style={{ color: GOLD }}>
              Last turn ·{" "}
            </span>
            {game.lastTurn.summary}
            {game.lastTurn.drewCard && <span> {game.lastTurn.by} drew a Territory card.</span>}
          </div>
        )}

        <Panel style={{ padding: 8, marginBottom: 12 }}>
          <ol>
            {TURN_STEPS.map((s, i) => {
              const done = game.checks[i];
              const skipped = isSkipped(s);
              const isFocus = focus === i;
              const status = isFocus
                ? "◀ now"
                : done
                ? "done"
                : skipped
                ? "skip"
                : s.key === "combat" && game.taken?.length
                ? `won ${game.taken.length}`
                : "";
              return (
                <li key={i} data-step={i} className={`rb-step-row flex items-center gap-2 ${isFocus ? "active" : ""} ${done && !isFocus ? "done" : ""}`}>
                  {s.auto ? (
                    <span className="rb-display shrink-0 w-7 h-7 ml-2 rounded-sm flex items-center justify-center text-sm" style={{ border: `1.5px dashed ${GOLD}`, color: GOLD }}>
                      ⚂
                    </span>
                  ) : (
                    <button onClick={() => setCheck(i, !done)} className="rb-btn shrink-0 ml-2 py-2" aria-label={`mark step ${i + 1} ${done ? "not done" : "done"}`}>
                      <CheckBox checked={done} />
                    </button>
                  )}
                  <button onClick={() => setFocus(i)} className="rb-btn flex-1 min-w-0 text-left py-2.5 pr-2 flex items-center justify-between gap-2">
                    <span
                      className="rb-display text-base font-bold tracking-wide truncate"
                      style={{ color: done && !isFocus ? INK_FADE : INK, textDecoration: done && !isFocus ? "line-through" : "none" }}
                    >
                      {i + 1}. {s.title}
                    </span>
                    <span className="text-xs italic shrink-0" style={{ color: isFocus ? GOLD : INK_FADE }}>
                      {status}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </Panel>

        <div className="mb-4">{endTurnBlock}</div>

        <Disclosure title="Cast the dice">
          <DiceRoller bare />
        </Disclosure>

        {game.players.length > 2 && (
          <Disclosure title="A player was knocked out?">
            <p className="text-sm mb-2" style={{ color: INK_FADE }}>
              When an army's last battalion falls, mark them here — the turn order skips them.
            </p>
            <div className="space-y-1">
              {game.players.map((p, i) => (
                <FlagToggle
                  key={i}
                  label={`${p.name}${p.eliminated ? " — eliminated" : ""}`}
                  value={!!p.eliminated}
                  onChange={(v) => {
                    if (v && !window.confirm(`Mark ${p.name} as eliminated? Their conqueror takes their Territory cards (Adventure cards are discarded). If that puts the victor at 5+ cards, they must trade sets immediately.`)) return;
                    setPlayer(i, { eliminated: v });
                  }}
                />
              ))}
            </div>
            {active.length === 1 && (
              <p className="rb-display text-sm font-bold mt-3" style={{ color: GOLD }}>
                Only {active[0].name} still stands — Middle-earth is conquered!
              </p>
            )}
          </Disclosure>
        )}
      </div>

      {/* ——— Right: the workspace for the current step ——— */}
      <div className="rb-col md:pl-1" ref={workspaceRef}>
        <Panel style={{ borderTop: `4px solid ${GOLD}` }}>
          <div className="rb-display text-[11px] tracking-[0.3em] uppercase" style={{ color: GOLD }}>
            Step {focus + 1} of {TURN_STEPS.length}
          </div>
          <h2 className="rb-display text-2xl md:text-3xl font-bold tracking-wide leading-tight mt-0.5" style={{ color: INK }}>
            {step.title}
          </h2>
          <p className="text-lg md:text-xl leading-snug mt-2" style={{ color: isSkipped(step) ? INK_FADE : INK }}>
            {isSkipped(step) ? step.skipText : step.kid}
          </p>
        </Panel>

        {step.key === "reinforce" && (
          <ReinforceWorkspace game={game} player={player} muster={muster} setTradeIn={setTradeIn} openPicker={() => setPicker("paint")} />
        )}
        {step.key === "combat" && (
          <CombatWorkspace game={game} update={update} openPicker={() => setPicker("conquer")} />
        )}
        {step.key === "fortify" && (
          <Panel>
            <ul className="text-base space-y-2" style={{ color: INK }}>
              <li>• Pick one land to move from and one to move to.</li>
              <li>• Every land between them must be yours.</li>
              <li>• Move as many battalions as you like, but leave at least 1 behind.</li>
              <li>• Only one move. You can also skip this step.</li>
            </ul>
          </Panel>
        )}
        {step.key === "territoryCard" && game.conquered && (
          <Panel>
            <p className="text-base" style={{ color: INK }}>
              Just one card, even if you won more than one land.
              {game.taken?.length > 0 && (
                <>
                  {" "}
                  Lands you took this turn: <b>{game.taken.join(", ")}</b>.
                </>
              )}
            </p>
            <p className="text-sm mt-2" style={{ color: INK_FADE }}>
              The Red Book adds the card to your hand count when you end your turn.
            </p>
          </Panel>
        )}
        {step.key === "adventureCard" && game.siteOfPower && (
          <Panel>
            <ul className="text-base space-y-2" style={{ color: INK }}>
              <li>• Only 1 Adventure card per turn.</li>
              <li>• Got an Event card? Do what it says right now, then draw again.</li>
              <li>• You can only hold 4 Adventure cards. Too many? Discard down to 4.</li>
            </ul>
          </Panel>
        )}
        {step.key === "leader" && (
          <Panel>
            <ul className="text-base space-y-2" style={{ color: INK }}>
              <li>• You start with 2 Leaders. A Leader is lost when the last battalion with it is defeated.</li>
              <li>• If you have zero Leaders on the board, put one back in any land you own.</li>
              <li>• Still have a Leader? Nothing to do — tap Done.</li>
            </ul>
          </Panel>
        )}
        {step.key === "fellowship" && (
          <Panel style={{ background: "rgba(43,32,20,0.92)", border: `1px solid ${GOLD}` }}>
            <div className="rb-display text-[11px] tracking-[0.3em] uppercase" style={{ color: GOLD_BRIGHT }}>
              The Ring now lies in
            </div>
            <div className="rb-display text-2xl font-bold" style={{ color: "#f6ecd4" }}>
              {game.ringDestroyed ? "the fires of Mount Doom" : current.name}
            </div>
            <div className="text-base mt-1" style={{ color: "#cdbf9d" }}>
              {ringLine}
            </div>
            {game.conquered && (
              <div className="text-sm mt-2 pt-2" style={{ color: GOLD_BRIGHT, borderTop: "1px solid rgba(233,194,92,0.3)" }}>
                +1 Territory card goes into {player.name}'s hand when the turn ends.
              </div>
            )}
          </Panel>
        )}

        {/* Step navigation */}
        <div className="rb-stepnav grid grid-cols-3 gap-2 mb-4">
          <button
            onClick={goBack}
            disabled={focus === 0}
            className="rb-btn rb-display rounded-sm font-bold tracking-widest uppercase text-sm py-3 md:py-3.5"
            style={{ border: `1px solid ${LINE}`, color: INK, background: PAPER, opacity: focus === 0 ? 0.35 : 1 }}
          >
            ◀ Back
          </button>
          <div className="col-span-2">
            {step.auto ? (
              endTurnBlock
            ) : (
              <BigButton onClick={goNext}>{isSkipped(step) ? "Skip ▶" : "Done ▶ next step"}</BigButton>
            )}
          </div>
        </div>
      </div>

      {picker && (
        <TerritoryPicker game={game} update={update} playerIdx={game.currentPlayer} mode={picker} onClose={() => setPicker(null)} />
      )}

      {ending && endRoll && (
        <div className="rb-backdrop">
          <div className="text-center rounded-sm px-6 py-6" style={{ background: "rgba(43,32,20,0.96)", border: `1px solid ${GOLD}`, maxWidth: 460, width: "100%" }}>
            <div className="rb-display text-xs tracking-[0.3em] uppercase mb-3" style={{ color: GOLD_BRIGHT }}>
              {atDoom ? "At the Crack of Doom" : `The Fellowship tries to leave ${current.name}`}
            </div>
            <Die value={endRoll.value} rolling={endRoll.rolling} size={96} />
            {endRoll.rolling ? (
              <div className="text-base mt-4" style={{ color: "#cdbf9d" }}>The die tumbles… a 4, 5 or 6 moves it on.</div>
            ) : (
              <>
                <div className="rb-display text-2xl font-bold mt-4 leading-tight" style={{ color: endRoll.ok ? GOLD_BRIGHT : "#cdbf9d" }}>{endRoll.title}</div>
                <div className="text-base mt-2 leading-snug" style={{ color: "#f6ecd4" }}>{endRoll.detail}</div>
                <div className="mt-5">
                  <BigButton onClick={closeRoll}>Done</BigButton>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ReinforceWorkspace({ game, player, muster, setTradeIn, openPicker }) {
  const mustTrade = (player.cards || 0) >= 5;
  if (!muster.mapped || muster.count === 0) {
    return (
      <Panel style={{ background: "rgba(142,47,33,0.08)", border: `1px dashed ${WAX}` }}>
        <p className="text-base" style={{ color: INK }}>
          The map doesn't show any lands for <b>{player.name}</b> yet, so the Red Book can't count your reinforcements.
        </p>
        <p className="text-sm mt-1 mb-3" style={{ color: INK_FADE }}>
          Mark the lands you own once. After that, use "I conquered a land" in the Attack step to keep it up to date.
        </p>
        <BigButton tone="wax" onClick={openPicker}>
          Mark my lands
        </BigButton>
        <p className="text-sm mt-3" style={{ color: INK_FADE }}>
          Or count by hand: lands ÷ 3 (at least 3), plus bonuses for whole regions, plus card sets.
        </p>
      </Panel>
    );
  }
  return (
    <>
      <Panel style={{ background: "rgba(43,32,20,0.92)", border: `1px solid ${GOLD}` }}>
        {muster.strongholds.length > 0 && (
          <div className="pb-3 mb-3" style={{ borderBottom: "1px solid rgba(233,194,92,0.3)" }}>
            <div className="rb-display text-[11px] tracking-[0.25em] uppercase" style={{ color: GOLD_BRIGHT }}>
              First
            </div>
            <div className="text-lg leading-snug" style={{ color: "#f6ecd4" }}>
              Put <b style={{ color: GOLD_BRIGHT }}>1 battalion</b> in each of your{" "}
              <b style={{ color: GOLD_BRIGHT }}>
                {muster.strongholds.length} stronghold{muster.strongholds.length === 1 ? "" : "s"}
              </b>
              :
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {muster.strongholds.map((t) => (
                <span key={t.name} className="text-sm px-2 py-1 rounded-sm" style={{ background: "rgba(233,194,92,0.18)", color: "#f6ecd4", border: "1px solid rgba(233,194,92,0.4)" }}>
                  ⌂ {t.name}
                </span>
              ))}
            </div>
          </div>
        )}
        <div className="rb-display text-[11px] tracking-[0.25em] uppercase" style={{ color: GOLD_BRIGHT }}>
          {muster.strongholds.length > 0 ? "Then" : "Now"}
        </div>
        <div className="flex items-center gap-4">
          <div className="rb-display text-6xl md:text-7xl font-black leading-none" style={{ color: GOLD_BRIGHT }}>
            {muster.total}
          </div>
          <div className="text-lg leading-snug" style={{ color: "#f6ecd4" }}>
            battalions to place
            <div className="text-sm" style={{ color: "#cdbf9d" }}>
              anywhere you own
            </div>
          </div>
        </div>
        <ul className="text-sm mt-3 space-y-1" style={{ color: "#cdbf9d" }}>
          <li>
            <b style={{ color: "#f6ecd4" }}>{muster.base}</b> for your {muster.count} land{muster.count === 1 ? "" : "s"} (÷ 3, at least 3)
          </li>
          {muster.regions.length > 0 && (
            <li>
              <b style={{ color: "#f6ecd4" }}>+{muster.regionTotal}</b> for ruling all of {muster.regions.map((r) => `${r.name} (+${r.bonus})`).join(", ")}
            </li>
          )}
          {muster.cardTotal > 0 && (
            <li>
              <b style={{ color: "#f6ecd4" }}>+{muster.cardTotal}</b> for card sets
            </li>
          )}
        </ul>
      </Panel>

      <Panel style={mustTrade ? { border: `1.5px solid ${WAX}` } : {}}>
        <PanelTitle sub="Trading a set takes 3 cards out of your hand and adds battalions above.">
          {mustTrade ? "You MUST trade a set now" : "Trade in card sets"}
        </PanelTitle>
        <div className="space-y-2 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-6 md:gap-y-2">
          {CARD_SETS.map((c) => (
            <div key={c.label} className="flex items-center justify-between gap-3">
              <span className="text-base">
                {c.label}{" "}
                <span className="rb-display text-sm font-bold" style={{ color: GOLD }}>
                  = {c.value}
                </span>
              </span>
              <Stepper value={(game.tradeIns || {})[c.label] || 0} onChange={(v) => setTradeIn(c.label, v)} max={4} />
            </div>
          ))}
        </div>
      </Panel>

      <button onClick={openPicker} className="rb-btn text-sm underline underline-offset-2 mb-4 px-1" style={{ color: GOLD }}>
        Map looks wrong? Fix {player.name}'s lands
      </button>
    </>
  );
}

function CombatWorkspace({ game, update, openPicker }) {
  return (
    <>
      <BattlePanel />
      <Panel style={{ borderLeft: `4px solid ${GOLD}` }}>
        <div className="md:flex md:items-center md:justify-between md:gap-4">
          <div className="mb-2 md:mb-0">
            <div className="rb-display text-base font-bold tracking-wide">Won a land?</div>
            <div className="text-sm" style={{ color: INK_FADE }}>
              Beat the last defender? Tap this and pick the land on the board. It updates the map and your card.
            </div>
            {game.taken?.length > 0 && (
              <div className="text-sm mt-1" style={{ color: GOLD }}>
                Taken this turn: <b>{game.taken.join(", ")}</b>
              </div>
            )}
          </div>
          <div className="md:w-64 shrink-0">
            <BigButton onClick={openPicker}>⚑ I conquered a land</BigButton>
          </div>
        </div>
        <div className="mt-3 pt-3" style={{ borderTop: `1px dashed ${LINE}` }}>
          <FlagToggle label="A Leader took a Site of Power" value={game.siteOfPower} onChange={(v) => update({ siteOfPower: v })} />
          {!game.taken?.length && (
            <div className="mt-1">
              <FlagToggle label="Conquered a land (mark by hand)" value={game.conquered} onChange={(v) => update({ conquered: v })} />
            </div>
          )}
        </div>
      </Panel>
      <Disclosure title="Combat at a glance">
        <ul className="text-base space-y-1.5" style={{ color: INK }}>
          <li>• You need at least 2 battalions to attack — 1 always stays home.</li>
          <li>• Attacker rolls up to 3 dice, defender up to 2. Ties go to the defender.</li>
          <li>• Conquered the territory? Battalions that fought must move in; Leaders move with them.</li>
          <li>• If a defender's last battalion falls, any Leader there is removed too.</li>
          <li>• Eliminate a player: take their Territory cards (Adventure cards are discarded).</li>
        </ul>
      </Disclosure>
    </>
  );
}

// ———— Battle adjudicator ————
function resolveBattle({ att, def, attLeader, defLeader, defStronghold }) {
  const a = att.filter((v) => v > 0).sort((x, y) => y - x);
  const d = def.filter((v) => v > 0).sort((x, y) => y - x);
  if (!a.length || !d.length) return null;
  const aMod = a.map((v, i) => (i === 0 && attLeader ? v + 1 : v));
  const dBonus = (defLeader ? 1 : 0) + (defStronghold ? 1 : 0);
  const dMod = d.map((v, i) => (i === 0 ? v + dBonus : v));
  const pairs = [];
  let attLoss = 0,
    defLoss = 0;
  for (let i = 0; i < Math.min(aMod.length, dMod.length); i++) {
    const attWins = aMod[i] > dMod[i]; // defender wins ties
    if (attWins) defLoss++;
    else attLoss++;
    pairs.push({ a: a[i], aMod: aMod[i], d: d[i], dMod: dMod[i], attWins });
  }
  return { pairs, attLoss, defLoss };
}

function DiceEntry({ count, values, onPick, tone }) {
  return (
    <div className="space-y-2">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <button
            onClick={() => onPick(i, rollDie())}
            className="rb-btn rb-display text-2xl w-10 shrink-0 text-center rounded-sm self-stretch"
            style={{ color: tone, border: `1px dashed ${LINE}`, background: "rgba(255,250,235,0.4)" }}
            title="No dice handy? Tap to roll this one"
            aria-label="roll this die"
          >
            ⚄
          </button>
          <div className="grid grid-cols-6 gap-1 flex-1">
            {[1, 2, 3, 4, 5, 6].map((v) => (
              <button
                key={v}
                onClick={() => onPick(i, v)}
                className="rb-btn rb-display py-2.5 md:py-3 rounded-sm text-lg font-bold"
                style={{
                  background: values[i] === v ? tone : PAPER,
                  color: values[i] === v ? "#f6ecd4" : INK,
                  border: `1px solid ${LINE}`,
                }}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function BattlePanel() {
  const [attCount, setAttCount] = useState(3);
  const [defCount, setDefCount] = useState(2);
  const [att, setAtt] = useState([0, 0, 0]);
  const [def, setDef] = useState([0, 0]);
  const [attLeader, setAttLeader] = useState(false);
  const [defLeader, setDefLeader] = useState(false);
  const [defStronghold, setDefStronghold] = useState(false);
  const [result, setResult] = useState(null);

  const ready = att.slice(0, attCount).every((v) => v > 0) && def.slice(0, defCount).every((v) => v > 0);

  const settle = () => {
    const r = resolveBattle({
      att: att.slice(0, attCount),
      def: def.slice(0, defCount),
      attLeader,
      defLeader,
      defStronghold,
    });
    setResult(r);
    buzz(r && r.defLoss > r.attLoss ? [10, 30, 10] : 60);
  };

  const clear = () => {
    setAtt([0, 0, 0]);
    setDef([0, 0]);
    setResult(null);
  };

  const countBtn = (n, on, onClick, bg, fg) => (
    <button
      key={n}
      onClick={onClick}
      className="rb-btn rb-display w-11 h-11 rounded-sm text-lg font-bold"
      style={{ background: on ? bg : PAPER, color: on ? fg : INK, border: `1px solid ${LINE}` }}
    >
      {n}
    </button>
  );

  return (
    <>
      <Panel>
        <PanelTitle sub="Roll your real dice, then tap what they show. The book sorts them, adds every bonus, and gives ties to the defender.">
          The battleground
        </PanelTitle>

        <div className="md:grid md:grid-cols-2 md:gap-5">
          <div className="mb-4 md:mb-0">
            <div className="rb-display text-base font-bold tracking-wide mb-1" style={{ color: WAX }}>
              ⚔ Attacker
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm" style={{ color: INK_FADE }}>
                Dice:
              </span>
              {[1, 2, 3].map((n) =>
                countBtn(
                  n,
                  attCount === n,
                  () => {
                    setAttCount(n);
                    setResult(null);
                  },
                  WAX,
                  "#f6ecd4"
                )
              )}
            </div>
            <DiceEntry count={attCount} values={att} tone={WAX} onPick={(i, v) => { const n = att.slice(); n[i] = v; setAtt(n); setResult(null); buzz(8); }} />
            <div className="mt-2">
              <FlagToggle label="Leader attacking (+1 to highest die)" value={attLeader} onChange={(v) => { setAttLeader(v); setResult(null); }} />
            </div>
          </div>

          <div className="rb-def-col pt-4 md:pt-0 md:pl-5" style={{ borderTop: `1px dashed ${LINE}` }}>
            <div className="rb-display text-base font-bold tracking-wide mb-1" style={{ color: INK }}>
              🛡 Defender
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm" style={{ color: INK_FADE }}>
                Dice:
              </span>
              {[1, 2].map((n) =>
                countBtn(
                  n,
                  defCount === n,
                  () => {
                    setDefCount(n);
                    setResult(null);
                  },
                  INK,
                  GOLD_BRIGHT
                )
              )}
            </div>
            <DiceEntry count={defCount} values={def} tone={INK} onPick={(i, v) => { const n = def.slice(); n[i] = v; setDef(n); setResult(null); buzz(8); }} />
            <div className="mt-2 space-y-1">
              <FlagToggle label="Leader defending (+1 to highest die)" value={defLeader} onChange={(v) => { setDefLeader(v); setResult(null); }} />
              <FlagToggle label="Defending a stronghold ⌂ (+1 to highest die)" value={defStronghold} onChange={(v) => { setDefStronghold(v); setResult(null); }} />
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="col-span-2">
            <BigButton tone="wax" onClick={settle} disabled={!ready}>
              Settle the battle
            </BigButton>
          </div>
          <BigButton tone="ink" onClick={clear}>
            Clear
          </BigButton>
        </div>
      </Panel>

      {result && (
        <Panel style={{ background: "rgba(43,32,20,0.92)", border: `1px solid ${GOLD}` }}>
          <div className="text-center pb-3 mb-3" style={{ borderBottom: "1px solid rgba(233,194,92,0.3)" }}>
            <div className="rb-display text-2xl md:text-3xl font-black leading-tight" style={{ color: GOLD_BRIGHT }}>
              {result.attLoss > 0 && `Attacker removes ${result.attLoss}`}
              {result.attLoss > 0 && result.defLoss > 0 && " · "}
              {result.defLoss > 0 && `Defender removes ${result.defLoss}`}
            </div>
            <div className="text-sm mt-1" style={{ color: "#cdbf9d" }}>
              battalion{result.attLoss + result.defLoss === 1 ? "" : "s"} off the board
            </div>
          </div>
          <div className="space-y-1.5">
            {result.pairs.map((p, i) => (
              <div key={i} className="flex items-center justify-between text-base" style={{ color: "#cdbf9d" }}>
                <span>
                  <span className="rb-display text-[10px] uppercase tracking-wider mr-2" style={{ color: "#9a8a66" }}>
                    {i === 0 ? "highest" : i === 1 ? "second" : "third"}
                  </span>
                  ⚔ {p.a}
                  {p.aMod !== p.a && <b style={{ color: GOLD_BRIGHT }}>→{p.aMod}</b>} vs 🛡 {p.d}
                  {p.dMod !== p.d && <b style={{ color: GOLD_BRIGHT }}>→{p.dMod}</b>}
                </span>
                <span className="rb-display text-xs font-bold uppercase tracking-wider" style={{ color: p.attWins ? GOLD_BRIGHT : "#cdbf9d" }}>
                  {p.attWins ? "attacker wins" : p.aMod === p.dMod ? "tie — defender wins" : "defender wins"}
                </span>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </>
  );
}

// ———— Lands: the board photo + live reinforcement muster ————
function LandsScreen({ game, update }) {
  const [edit, setEdit] = useState(false);
  const [collapsed, setCollapsed] = useState({});
  const [toast, setToast] = useState(null);
  const [hot, setHot] = useState(null);

  const facOf = (i) => {
    if (i === undefined || i === null || i < 0 || i >= game.players.length) return null;
    const p = game.players[i];
    return p ? FACTIONS.find((f) => f.id === p.faction) : null;
  };
  const ownerHex = (i) => (i === undefined || i < 0 ? null : facOf(i)?.hex);

  // Each tap steps the land through nobody -> each player (skipping the fallen) -> nobody.
  const paint = (name) => {
    const owners = { ...game.owners };
    const order = game.players.map((p, i) => (p.eliminated ? -1 : i)).filter((i) => i >= 0);
    const was = owners[name];
    const at = was === undefined ? -1 : order.indexOf(was);
    const next = at + 1 < order.length ? order[at + 1] : undefined;
    if (next === undefined) {
      delete owners[name];
      setToast(`${name} — nobody's.`);
    } else {
      owners[name] = next;
      setToast(`${name} is ${game.players[next].name}'s.`);
    }
    setHot(name);
    buzz(6);
    update({ owners });
  };

  const me = game.currentPlayer;
  const muster = musterFor(game, me, game.tradeIns);

  // editing helpers
  const setTerr = (idx, patch) =>
    update({ territories: game.territories.map((t, i) => (i === idx ? { ...t, ...patch } : t)) });
  const renameTerr = (idx, newName) => {
    const old = game.territories[idx].name;
    const owners = { ...game.owners };
    if (old in owners) {
      owners[newName] = owners[old];
      delete owners[old];
    }
    update({
      territories: game.territories.map((t, i) => (i === idx ? { ...t, name: newName } : t)),
      owners,
    });
  };
  const removeTerr = (idx) => {
    const name = game.territories[idx].name;
    const owners = { ...game.owners };
    delete owners[name];
    update({ territories: game.territories.filter((_, i) => i !== idx), owners });
  };
  const addTerr = (region) =>
    update({ territories: [...game.territories, { name: "New territory", region }] });

  const mePlayer = game.players[me];
  const meFac = facOf(me);

  return (
    <div className="rb-lands w-full md:flex md:gap-4 md:items-start">
      <div className="text-center md:shrink-0">
        <BoardMap territories={game.territories} ownerOf={ownerLookup(game)} onTap={paint} highlight={hot} maxHeight="var(--lands-map-h)" />
        <div className="text-sm mt-1 mb-3 h-5" style={{ color: INK_FADE }}>
          {toast || "Tap a land to pass it to the next player."}
        </div>
      </div>

      <div className="md:flex-1 md:min-w-0">
        <Panel>
          <PanelTitle sub="Tap a land on the board. Each tap passes it to the next player; after the last player it goes back to nobody.">The map of holdings</PanelTitle>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-base" style={{ color: INK }}>
            <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full" style={{ border: `2px dashed ${INK_FADE}` }} /> nobody</span>
            {game.players.filter((p) => !p.eliminated).map((p, i) => {
              const fac = FACTIONS.find((f) => f.id === p.faction);
              return (
                <span key={i} className="flex items-center gap-1">
                  <span style={{ color: INK_FADE }}>→</span>
                  <span className="inline-block w-3.5 h-3.5 rounded-full" style={{ background: fac.hex, border: "1.5px solid #fff6d5", boxShadow: "0 0 0 1px rgba(43,32,20,0.5)" }} />
                  {p.name}
                </span>
              );
            })}
            <span style={{ color: INK_FADE }}>→ nobody</span>
          </div>
        </Panel>

        {/* Live muster for the current player */}
        <Panel style={{ background: "rgba(43,32,20,0.92)", border: `1px solid ${GOLD}` }}>
          <div className="flex items-center justify-between mb-1">
            <span className="rb-display text-[11px] tracking-[0.25em] uppercase" style={{ color: GOLD_BRIGHT }}>
              {mePlayer?.name}'s muster
            </span>
            <span className="w-3 h-3 rounded-full" style={{ background: meFac?.hex }} />
          </div>
          <div className="flex items-baseline gap-3">
            <div className="rb-display text-5xl font-black" style={{ color: GOLD_BRIGHT }}>
              {muster.total}
            </div>
            <div className="text-sm" style={{ color: "#cdbf9d" }}>
              battalions
              <div className="text-xs">
                {muster.base} land ({muster.count} terr.) · {muster.regionTotal} regions · {muster.cardTotal} cards
              </div>
            </div>
          </div>
          {muster.strongholds.length > 0 && (
            <div className="mt-2 pt-2 text-base" style={{ borderTop: "1px solid rgba(233,194,92,0.3)", color: GOLD_BRIGHT }}>
              ⌂ + 1 battalion in each of <b>{muster.strongholds.length} strongholds</b>
            </div>
          )}
          {muster.regions.length > 0 && (
            <div className="mt-1 text-sm" style={{ color: "#cdbf9d" }}>
              Whole regions ruled: {muster.regions.map((r) => r.name).join(", ")}
            </div>
          )}
          <div className="text-xs mt-2" style={{ color: "#9a8a66" }}>
            Card sets are traded in on the Turn page, step 1.
          </div>
        </Panel>

        <div className="rounded-sm mb-4" style={{ border: `1px solid ${LINE}`, background: "rgba(255,250,235,0.4)" }}>
          <div className="flex items-center justify-between px-4 py-3">
            <button onClick={() => setCollapsed((c) => ({ ...c, __all: !c.__all }))} className="rb-btn flex-1 text-left rb-display text-sm font-bold tracking-widest uppercase" style={{ color: INK }}>
              The nine regions {collapsed.__all ? "▸" : "▾"}
            </button>
            <button onClick={() => { setEdit(!edit); setCollapsed((c) => ({ ...c, __all: false })); }} className="rb-btn text-xs underline underline-offset-2" style={{ color: INK_FADE }}>
              {edit ? "done editing" : "edit lands"}
            </button>
          </div>
          {!collapsed.__all && (
            <div className="px-4 pb-4">
              {REGIONS.map((r, ri) => {
                const terrs = game.territories.map((t, idx) => ({ ...t, idx })).filter((t) => t.region === r.name);
                const owner = regionOwner(game, r.name);
                const ownerFac = facOf(owner);
                const isOpen = !collapsed[r.name];
                return (
                  <div key={r.name} className="mb-3 pl-2" style={{ borderLeft: ownerFac ? `4px solid ${ownerFac.hex}` : `2px solid ${LINE}` }}>
                    <button onClick={() => setCollapsed((c) => ({ ...c, [r.name]: !c[r.name] }))} className="rb-btn w-full flex items-center justify-between text-left">
                      <span className="rb-display text-sm font-bold tracking-wide">
                        {r.name}{" "}
                        <span className="text-xs font-normal" style={{ color: INK_FADE }}>
                          ({terrs.length}) · +{game.regionBonuses[ri]}
                        </span>
                      </span>
                      {ownerFac ? (
                        <span className="rb-display text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm" style={{ background: ownerFac.hex, color: "#f6ecd4" }}>
                          {game.players[owner].name} rules
                        </span>
                      ) : (
                        <span className="text-xs" style={{ color: INK_FADE }}>
                          {isOpen ? "▾" : "▸"}
                        </span>
                      )}
                    </button>

                    {isOpen && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {terrs.map((t) => {
                          const o = game.owners[t.name];
                          const hex = ownerHex(o);
                          if (edit) {
                            return (
                              <div key={t.idx} className="flex items-center gap-1 w-full">
                                <input
                                  value={t.name}
                                  onChange={(e) => renameTerr(t.idx, e.target.value)}
                                  className="flex-1 min-w-0 px-2 py-1 rounded-sm text-sm"
                                  style={{ border: `1px solid ${LINE}`, background: "rgba(255,250,235,0.9)" }}
                                />
                                <button onClick={() => setTerr(t.idx, { s: !t.s })} className="rb-btn w-8 shrink-0 text-base" style={{ opacity: t.s ? 1 : 0.3 }} title="stronghold">
                                  ⌂
                                </button>
                                <select
                                  value={t.region}
                                  onChange={(e) => setTerr(t.idx, { region: e.target.value })}
                                  className="px-1 py-1 rounded-sm text-xs shrink-0"
                                  style={{ border: `1px solid ${LINE}`, background: "rgba(255,250,235,0.9)", maxWidth: 90 }}
                                >
                                  {REGIONS.map((rr) => (
                                    <option key={rr.name} value={rr.name}>{rr.name}</option>
                                  ))}
                                </select>
                                <button onClick={() => removeTerr(t.idx)} className="rb-btn w-6 shrink-0 text-sm" style={{ color: WAX }}>
                                  ✕
                                </button>
                              </div>
                            );
                          }
                          return (
                            <button
                              key={t.idx}
                              onClick={() => paint(t.name)}
                              className="rb-btn text-sm px-2.5 py-1.5 rounded-sm flex items-center gap-1"
                              style={{
                                background: hex || PAPER,
                                color: hex ? "#f6ecd4" : INK,
                                border: `1px solid ${hex || LINE}`,
                              }}
                            >
                              {t.s && <span title="stronghold" style={{ opacity: 0.85 }}>⌂</span>}
                              {t.name}
                            </button>
                          );
                        })}
                        {edit && (
                          <button onClick={() => addTerr(r.name)} className="rb-btn text-xs underline underline-offset-2 mt-1" style={{ color: GOLD }}>
                            + add territory
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              <p className="text-xs" style={{ color: INK_FADE }}>
                Names match the board. A renamed or added land has no spot on the photo until it's given one, but still works from these lists.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ———— Ring screen ————
function RingScreen({ game, update, setTab }) {
  const [editPath, setEditPath] = useState(false);
  const { path, ringStep, ringDestroyed } = game;
  const current = path[ringStep];
  const atDoom = ringStep === path.length - 1;
  const progress = path.length > 1 ? ringStep / (path.length - 1) : 0;
  const ringColor = lerpColor(GOLD_BRIGHT, EMBER, progress);

  const setStep = (i, patch) => update({ path: path.map((p, idx) => (idx === i ? { ...p, ...patch } : p)) });
  const addStep = () =>
    update({ path: [...path.slice(0, -1), { name: "New territory", die: false }, path[path.length - 1]] });
  const removeStep = (i) => {
    if (path.length <= 2) return;
    const newPath = path.filter((_, idx) => idx !== i);
    update({ path: newPath, ringStep: Math.min(ringStep, newPath.length - 1) });
  };

  return (
    <>
      <Panel className={ringDestroyed ? "doom-shake" : ""}>
        <PanelTitle sub="The Fellowship's road, from the Shire to the Fire. It moves when each turn ends.">
          The journey
        </PanelTitle>
        <RingTrail path={path} ringStep={ringStep} destroyed={ringDestroyed} ringColor={ringColor} />
        <div className="text-center mt-3">
          <div className="text-xs uppercase tracking-widest" style={{ color: INK_FADE }}>
            the Ring now lies in
          </div>
          <div className="rb-display text-2xl font-bold" style={{ color: ringDestroyed ? WAX : INK }}>
            {ringDestroyed ? "the fires of Mount Doom" : current.name}
          </div>
          <div className="text-sm mt-0.5" style={{ color: INK_FADE }}>
            step {ringStep + 1} of {path.length}
            {current.die && !atDoom && !ringDestroyed && " · ⚂ roll 4+ to move on"}
            {atDoom && !ringDestroyed && " · roll 4+ to destroy the Ring"}
          </div>
        </div>
      </Panel>

      {ringDestroyed ? (
        <Panel style={{ borderColor: WAX, background: "rgba(142,47,33,0.08)", position: "relative", overflow: "hidden" }}>
          {[...Array(7)].map((_, i) => (
            <span key={i} className="ember" style={{ left: `${12 + i * 12}%`, bottom: 6, animationDelay: `${i * 0.18}s` }} />
          ))}
          <p className="rb-display text-center text-lg font-bold" style={{ color: WAX }}>
            The Ring is destroyed. The war is ended.
          </p>
          <div className="mt-3">
            <BigButton tone="wax" onClick={() => setTab("score")}>
              Tally the scores
            </BigButton>
          </div>
        </Panel>
      ) : (
        <Panel>
          <p className="text-base" style={{ color: INK }}>
            The Fellowship moves automatically when the current player taps <b>End turn</b>. Need to correct the
            board?{" "}
          </p>
          <div className="mt-2 flex gap-4">
            <button
              onClick={() => ringStep > 0 && update({ ringStep: ringStep - 1 })}
              className="rb-btn text-sm underline underline-offset-2"
              style={{ color: INK_FADE }}
            >
              ← move back one
            </button>
            <button
              onClick={() => ringStep < path.length - 1 && update({ ringStep: ringStep + 1 })}
              className="rb-btn text-sm underline underline-offset-2"
              style={{ color: INK_FADE }}
            >
              move forward one →
            </button>
          </div>
        </Panel>
      )}

      <Panel>
        <div className="flex items-baseline justify-between">
          <PanelTitle sub="Read from your gameboard. ⚂ marks die territories.">The path</PanelTitle>
          <button onClick={() => setEditPath(!editPath)} className="rb-btn text-xs underline underline-offset-2 shrink-0" style={{ color: INK_FADE }}>
            {editPath ? "done" : "edit path"}
          </button>
        </div>
        <ol className="space-y-1">
          {path.map((p, i) => (
            <li key={i} className="flex items-center gap-2 text-base">
              <span className="rb-display w-6 text-right text-xs font-bold shrink-0" style={{ color: i === ringStep ? GOLD : INK_FADE }}>
                {i + 1}.
              </span>
              {editPath ? (
                <>
                  <input
                    value={p.name}
                    onChange={(e) => setStep(i, { name: e.target.value })}
                    className="flex-1 min-w-0 px-2 py-1 rounded-sm text-sm"
                    style={{ border: `1px solid ${LINE}`, background: "rgba(255,250,235,0.9)" }}
                  />
                  <button onClick={() => setStep(i, { die: !p.die })} className="rb-btn text-lg w-8 shrink-0" style={{ opacity: p.die ? 1 : 0.3 }} title="toggle die symbol">
                    ⚂
                  </button>
                  <button onClick={() => removeStep(i)} className="rb-btn w-6 shrink-0 text-sm" style={{ color: WAX }} aria-label="remove step">
                    ✕
                  </button>
                </>
              ) : (
                <span style={{ color: i === ringStep ? INK : INK_FADE, fontWeight: i === ringStep ? 600 : 400 }}>
                  {p.name} {p.die && <span title="die territory">⚂</span>}
                  {i === ringStep && !ringDestroyed && (
                    <span className="rb-display text-xs font-bold ml-1" style={{ color: GOLD }}>
                      ● the Ring
                    </span>
                  )}
                </span>
              )}
            </li>
          ))}
        </ol>
        {editPath && (
          <button onClick={addStep} className="rb-btn mt-2 text-sm underline underline-offset-2" style={{ color: GOLD }}>
            + add a territory before Mount Doom
          </button>
        )}
      </Panel>

      <Panel>
        <FlagToggle label="Hunt for the Ring (Team Risk variant)" value={game.huntRule} onChange={(v) => update({ huntRule: v })} />
        {game.huntRule && (
          <p className="text-base mt-2 leading-snug" style={{ color: INK }}>
            When the Ring sits in an <b>evil-held territory</b> at the end of a turn, that player rolls 2 dice:{" "}
            <b>+1</b> with a Leader there, <b>+1</b> if evil rules the whole region. A total of <b>12 or more</b> means
            the Ring is found — <b>Sauron wins at once.</b>
          </p>
        )}
      </Panel>
    </>
  );
}

function RingTrail({ path, ringStep, destroyed, ringColor }) {
  const n = path.length;
  const pct = (i) => (n <= 1 ? 0 : (i / (n - 1)) * 100);
  return (
    <div className="relative h-16 mx-1" aria-label={`Fellowship progress: step ${ringStep + 1} of ${n}`}>
      <div className="absolute left-0 right-0 top-1/2" style={{ borderTop: `2px dashed ${WAX}`, opacity: 0.65 }} />
      <div className="absolute left-0 top-1/2" style={{ width: `${pct(ringStep)}%`, borderTop: `2px solid ${GOLD}` }} />
      {path.map((p, i) => (
        <div key={i} className="absolute top-1/2" style={{ left: `${pct(i)}%`, transform: "translate(-50%, -50%)" }}>
          {i === n - 1 ? (
            <span className="block text-xl" style={{ transform: "translateY(-4px)", color: destroyed ? EMBER : INK }} title="Mount Doom">
              ▲
            </span>
          ) : (
            <span
              className="block rounded-full"
              style={{
                width: p.die ? 9 : 6,
                height: p.die ? 9 : 6,
                background: i <= ringStep ? GOLD : "rgba(43,32,20,0.4)",
                border: p.die ? `1.5px solid ${INK}` : "none",
              }}
            />
          )}
        </div>
      ))}
      {!destroyed && (
        <div
          className="absolute top-1/2"
          style={{ left: `${pct(ringStep)}%`, transform: "translate(-50%, -50%)", transition: "left 500ms ease" }}
        >
          <div
            className="rounded-full ring-pulse"
            style={{
              width: 22,
              height: 22,
              border: `4px solid ${GOLD}`,
              boxShadow: `0 0 12px 3px ${ringColor}, inset 0 0 5px ${ringColor}`,
            }}
            title="The One Ring"
          />
        </div>
      )}
    </div>
  );
}

// ———— Palantír: the seeing-stone oracle ————
function PalantirScreen() {
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState(null);
  const [cat, setCat] = useState(null);

  const query = q.trim();
  const matches = query.length >= 2 ? consultPalantir(query) : [];
  const cats = [];
  PALANTIR_KB.forEach((e) => {
    if (!cats.includes(e.category)) cats.push(e.category);
  });
  const browseList = cat ? PALANTIR_KB.filter((e) => e.category === cat) : [];

  const AnswerCard = ({ entry }) => (
    <Panel>
      <div className="rb-display text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: GOLD }}>
        {entry.category}
      </div>
      <div className="rb-display text-base font-bold tracking-wide mb-1" style={{ color: INK }}>
        {entry.q}
      </div>
      <p className="text-base leading-snug" style={{ color: INK }}>
        {entry.a}
      </p>
    </Panel>
  );

  return (
    <>
      <Panel style={{ background: "rgba(20,24,34,0.94)", border: `1px solid ${GOLD}` }}>
        <div className="flex flex-col items-center text-center">
          <div className="palantir-orb mb-3">
            <div className="palantir-core" />
            <div className="palantir-glint" />
          </div>
          <div className="rb-display text-lg font-bold tracking-widest uppercase" style={{ color: GOLD_BRIGHT }}>
            The Palantír
          </div>
          <p className="text-sm italic mt-0.5 mb-3" style={{ color: "#aeb8cc" }}>
            Ask the stone a question of the rules; it answers from the Red Book itself.
          </p>
          <div className="w-full flex gap-2">
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setCat(null);
              }}
              placeholder="e.g. who wins a tie? how do strongholds work?"
              className="flex-1 min-w-0 px-3 py-2 rounded-sm text-base"
              style={{ background: "rgba(255,250,235,0.95)", border: `1px solid ${GOLD}`, color: INK }}
            />
            {q && (
              <button
                onClick={() => {
                  setQ("");
                  setCat(null);
                }}
                className="rb-btn rb-display px-3 rounded-sm text-sm font-bold"
                style={{ background: "rgba(255,250,235,0.15)", color: GOLD_BRIGHT, border: `1px solid ${GOLD}` }}
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </Panel>

      {query.length >= 2 ? (
        matches.length ? (
          <>
            <div className="rb-display text-xs uppercase tracking-widest mb-2 px-1" style={{ color: INK_FADE }}>
              The stone reveals
            </div>
            {matches.map((m, i) => (
              <AnswerCard key={i} entry={m.entry} />
            ))}
          </>
        ) : (
          <Panel style={{ background: "rgba(43,32,20,0.05)", borderStyle: "dashed" }}>
            <p className="text-base italic" style={{ color: INK_FADE }}>
              The stone is clouded — try different words, or browse the lore below by topic.
            </p>
          </Panel>
        )
      ) : (
        <>
          <div className="rb-display text-xs uppercase tracking-widest mb-2 px-1" style={{ color: INK_FADE }}>
            Or browse the lore
          </div>
          <Panel>
            <div className="flex flex-wrap gap-1.5">
              {cats.map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    setCat(cat === c ? null : c);
                    setOpenId(null);
                  }}
                  className="rb-btn text-xs px-2 py-1.5 rounded-sm"
                  style={{
                    background: cat === c ? GOLD : "rgba(255,250,235,0.7)",
                    color: cat === c ? "#f6ecd4" : INK,
                    border: `1px solid ${cat === c ? GOLD : LINE}`,
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
          </Panel>

          {cat &&
            browseList.map((e) => {
              const id = e.q;
              const open = openId === id;
              return (
                <Panel key={id}>
                  <button onClick={() => setOpenId(open ? null : id)} className="rb-btn w-full flex items-start gap-2 text-left">
                    <span className="rb-display text-sm shrink-0" style={{ color: GOLD }}>
                      {open ? "▾" : "▸"}
                    </span>
                    <span className="rb-display text-base font-bold tracking-wide" style={{ color: INK }}>
                      {e.q}
                    </span>
                  </button>
                  {open && (
                    <p className="text-base leading-snug mt-2 pl-6" style={{ color: INK }}>
                      {e.a}
                    </p>
                  )}
                </Panel>
              );
            })}
        </>
      )}

      <Panel style={{ background: "rgba(43,32,20,0.05)", borderStyle: "dashed" }}>
        <p className="text-xs italic" style={{ color: INK_FADE }}>
          The Palantír answers from your rulebook offline — no signal needed at the table. It covers the rules we've
          confirmed; for anything truly unusual, the rulebook itself is the final word.
        </p>
      </Panel>
    </>
  );
}


// ———— Scoring ————
// Rows start filled in from the map; only Adventure-card points need typing.
function scoreRowFromMap(game, i) {
  const mine = game.territories.filter((t) => game.owners[t.name] === i);
  const regions = {};
  REGIONS.forEach((reg) => {
    if (regionOwner(game, reg.name) === i) regions[reg.name] = true;
  });
  return { territories: mine.length, strongholds: mine.filter((t) => t.s).length, regions, adventure: 0 };
}

function ScoreScreen({ game }) {
  const [rows, setRows] = useState(() => game.players.map((_, i) => scoreRowFromMap(game, i)));

  const setRow = (i, patch) => setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const recount = () => setRows((rs) => rs.map((r, i) => ({ ...scoreRowFromMap(game, i), adventure: r.adventure })));

  const scoreOf = (r) =>
    r.territories +
    r.strongholds * 2 +
    REGIONS.reduce((s, reg, ri) => s + (r.regions[reg.name] ? game.regionBonuses[ri] : 0), 0) +
    r.adventure;

  const scores = rows.map(scoreOf);
  const best = Math.max(...scores);

  return (
    <div className="max-w-5xl mx-auto w-full">
      {game.ringDestroyed && (
        <Panel className="doom-shake" style={{ background: "rgba(43,32,20,0.94)", border: `1px solid ${GOLD}`, position: "relative", overflow: "hidden" }}>
          {[...Array(9)].map((_, i) => (
            <span key={i} className="ember" style={{ left: `${8 + i * 10.5}%`, bottom: 8, animationDelay: `${i * 0.16}s` }} />
          ))}
          <div className="text-center py-2">
            <div className="rb-display text-xs tracking-[0.35em] uppercase" style={{ color: EMBER }}>Mount Doom</div>
            <div className="rb-display text-3xl md:text-4xl font-black mt-1 leading-tight" style={{ color: GOLD_BRIGHT }}>The Ring Has Been Destroyed!</div>
            <div className="text-base mt-2" style={{ color: "#f6ecd4" }}>The war is over. Count the spoils — the highest score rules Middle-earth.</div>
          </div>
        </Panel>
      )}
      <Panel>
        <div className="md:flex md:items-start md:justify-between md:gap-4">
          <div>
            <PanelTitle sub="When the Ring is destroyed, count the spoils.">The reckoning</PanelTitle>
            <ul className="text-base space-y-1" style={{ color: INK }}>
              <li>• 1 point per territory held</li>
              <li>• 2 points per stronghold held</li>
              <li>• Each fully-ruled region: points equal to its battalion bonus</li>
              <li>
                • Points printed on Adventure cards you have <b>played</b> (not cards in hand)
              </li>
            </ul>
          </div>
          <div className="mt-3 md:mt-0 md:w-64 shrink-0">
            <BigButton tone="ink" small onClick={recount}>
              Recount from the map
            </BigButton>
            <p className="text-xs mt-1 text-center" style={{ color: INK_FADE }}>
              Territories, strongholds and regions come from the Lands map. Type in Adventure points.
            </p>
          </div>
        </div>
      </Panel>

      <div className="md:grid md:grid-cols-2 md:gap-4 md:items-start">
        {game.players.map((p, i) => {
          const fac = FACTIONS.find((f) => f.id === p.faction);
          const r = rows[i];
          const regionPts = REGIONS.reduce((s, reg, ri) => s + (r.regions[reg.name] ? game.regionBonuses[ri] : 0), 0);
          return (
            <Panel key={i} style={{ borderLeft: `4px solid ${fac.hex}`, opacity: p.eliminated ? 0.55 : 1 }}>
              <div className="flex items-baseline justify-between mb-3">
                <span className="rb-display text-lg font-bold">
                  {p.name}
                  {p.eliminated && (
                    <em className="text-sm font-normal ml-2" style={{ color: WAX, fontFamily: "'EB Garamond', serif" }}>
                      fallen
                    </em>
                  )}
                </span>
                <span className="rb-display text-3xl font-black" style={{ color: scores[i] === best && best > 0 ? GOLD : INK }}>
                  {scores[i]}
                </span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-base">Territories (×1)</span>
                  <Stepper value={r.territories} onChange={(v) => setRow(i, { territories: v })} max={64} />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-base">Strongholds (×2)</span>
                  <Stepper value={r.strongholds} onChange={(v) => setRow(i, { strongholds: v })} max={20} />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-base">Adventure card points</span>
                  <Stepper value={r.adventure} onChange={(v) => setRow(i, { adventure: v })} max={50} />
                </div>
                <div>
                  <div className="text-base mb-1">
                    Whole regions ruled{" "}
                    <span className="rb-display text-sm font-bold" style={{ color: GOLD }}>
                      (+{regionPts})
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {REGIONS.map((reg, ri) => {
                      const on = !!r.regions[reg.name];
                      return (
                        <button
                          key={reg.name}
                          onClick={() => setRow(i, { regions: { ...r.regions, [reg.name]: !on } })}
                          className="rb-btn text-xs px-2 py-1.5 rounded-sm"
                          style={{
                            background: on ? GOLD : PAPER,
                            color: on ? "#f6ecd4" : INK,
                            border: `1px solid ${on ? GOLD : LINE}`,
                          }}
                        >
                          {reg.name} +{game.regionBonuses[ri]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </Panel>
          );
        })}
      </div>

      {best > 0 && (
        <Panel style={{ background: "rgba(43,32,20,0.92)", border: `1px solid ${GOLD}` }}>
          <p className="rb-display text-center text-lg font-bold" style={{ color: GOLD_BRIGHT }}>
            {game.players.filter((_, i) => scores[i] === best).map((p) => p.name).join(" & ")} rules Middle-earth
          </p>
        </Panel>
      )}
    </div>
  );
}
