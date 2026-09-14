import { useState, useEffect, useRef } from "react";

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
  { name: "Dagorlad", region: "Rhovanion" },
  { name: "Brown Lands", region: "Rhovanion" },
  // Mirkwood (5)
  { name: "Carrock", region: "Mirkwood" },
  { name: "North Mirkwood", region: "Mirkwood" },
  { name: "Eastern Mirkwood", region: "Mirkwood" },
  { name: "South Mirkwood", region: "Mirkwood", s: true },
  { name: "Anduin Valley", region: "Mirkwood" },
  // Rhûn (4)
  { name: "Withered Heath", region: "Rhûn" },
  { name: "Essaroth", region: "Rhûn" },
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
  { name: "Andrast", region: "Gondor" },
  { name: "Druwaith Iaur", region: "Gondor" },
  // Mordor (6)
  { name: "Udun", region: "Mordor", s: true },
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

const FACTIONS = [
  { id: "yellow", label: "Yellow — Free Peoples", side: "good", hex: "#b8923a" },
  { id: "green", label: "Green — Free Peoples", side: "good", hex: "#4a6741" },
  { id: "red", label: "Red — Sauron's Forces", side: "evil", hex: "#8e2f21" },
  { id: "black", label: "Black — Sauron's Forces", side: "evil", hex: "#33291f" },
];

const START_BATTALIONS = { 2: 60, 3: 52, 4: 45 };

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

const TURN_STEPS = [
  {
    title: "Reinforcements",
    detail:
      "Place 1 battalion in each stronghold you hold, then place your reinforcements (the Lands page counts them for you).",
  },
  {
    title: "Combat",
    detail:
      "Optional. Roll real dice, then settle each battle on the Battle page — it applies every bonus for you.",
  },
  {
    title: "Fortify",
    detail:
      "One move: shift any number of battalions between two territories connected through your own lands. Never leave a territory empty.",
  },
  {
    title: "Territory card",
    detail: "Conquered at least one territory this turn? Draw 1 Territory card.",
    conditional: "conquered",
  },
  {
    title: "Adventure card",
    detail:
      "Did a Leader conquer a Site of Power this turn? Draw 1 Adventure card (max 1 per turn, hand limit 4). Event cards happen immediately — then draw again.",
    conditional: "siteOfPower",
  },
  {
    title: "Replace a Leader",
    detail: "No Leaders left on the board? Place one in any territory you control.",
  },
  {
    title: "Move the Fellowship",
    detail: "Handled automatically when you end your turn below.",
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
    a: "Strongholds sit in: Evendim Hills (Annúminas), Rhudaur (Rivendell), Moria (Mines of Moria), South Mirkwood (Dol Guldur), Fangorn (Isengard), West Rohan (Helm's Deep), Minas Tirith, Udun, Minas Morgul, Gorgoroth (Barad-dûr), and Umbar (City of the Corsairs). On the Lands tab they show a ⌂." },
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

// subtle paper grain as an inline SVG (no network needed)
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E\")";

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
            territories: saved.territories && saved.territories.length ? saved.territories : DEFAULT_TERRITORIES.map((t) => ({ ...t })),
            owners: saved.owners || {},
          });
          if (saved.screen === "play") setTab(saved.tab || "turn");
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

  return (
    <Shell onNewGame={game.screen === "play" ? newGame : null}>
      {game.screen === "setup" ? (
        <SetupScreen game={game} update={update} />
      ) : (
        <>
          <TabBar tab={tab} setTab={setTab} />
          {tab === "turn" && <TurnScreen game={game} update={update} setTab={setTab} />}
          {tab === "battle" && <BattleScreen />}
          {tab === "lands" && <LandsScreen game={game} update={update} />}
          {tab === "ring" && <RingScreen game={game} update={update} setTab={setTab} />}
          {tab === "score" && <ScoreScreen game={game} />}
          {tab === "palantir" && <PalantirScreen />}
        </>
      )}
    </Shell>
  );
}

function Shell({ children, onNewGame }) {
  return (
    <div
      className="min-h-screen w-full"
      style={{
        background: `${GRAIN}, radial-gradient(ellipse at 50% 0%, ${PARCHMENT} 0%, ${PARCHMENT_DEEP} 75%, #d2bd8e 100%)`,
        color: INK,
        fontFamily: "'EB Garamond', Georgia, serif",
      }}
    >
      <style>{`
        .rb-display { font-family: 'Cinzel', 'EB Garamond', Georgia, serif; }
        .rb-btn { transition: transform 80ms ease, box-shadow 80ms ease; }
        .rb-btn:active { transform: translateY(1px); }
        .rb-btn:focus-visible { outline: 2px solid ${GOLD}; outline-offset: 2px; }

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
      <div className="max-w-md mx-auto px-4 pb-24 pt-6">
        <header className="text-center mb-5">
          <div className="rb-display text-[11px] tracking-[0.35em] uppercase mb-1" style={{ color: WAX }}>
            The War of the Ring
          </div>
          <h1 className="rb-display text-3xl font-bold tracking-wide" style={{ color: INK }}>
            The Red Book
          </h1>
          <div className="flex items-center justify-center gap-2 mt-1">
            <Rule w={44} />
            <span className="rb-display text-xs" style={{ color: GOLD }}>✦</span>
            <span className="text-sm italic" style={{ color: INK_FADE }}>
              a companion for Risk · Trilogy Edition
            </span>
            <span className="rb-display text-xs" style={{ color: GOLD }}>✦</span>
            <Rule w={44} />
          </div>
          {onNewGame && (
            <button onClick={onNewGame} className="rb-btn mt-2 text-xs underline underline-offset-2" style={{ color: INK_FADE }}>
              start a new game
            </button>
          )}
        </header>
        {children}
      </div>
    </div>
  );
}

const Rule = ({ w = 40 }) => (
  <span style={{ display: "inline-block", width: w, height: 1, background: LINE }} />
);

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
        small ? "py-2 text-xs" : "py-3 text-sm"
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
  const btn = "rb-btn rb-display w-10 h-10 text-xl font-bold rounded-sm";
  return (
    <div className="flex items-center gap-2">
      <button
        className={btn}
        style={{ border: `1px solid ${LINE}`, color: INK, background: "rgba(255,250,235,0.7)" }}
        onClick={() => onChange(Math.max(min, value - 1))}
        aria-label="decrease"
      >
        −
      </button>
      <div
        className="rb-display w-14 h-10 flex items-center justify-center text-xl font-bold rounded-sm"
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
        style={{ border: `1px solid ${LINE}`, color: INK, background: "rgba(255,250,235,0.7)" }}
        onClick={() => onChange(Math.min(max, value + 1))}
        aria-label="increase"
      >
        +
      </button>
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

function DiceRoller() {
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

  return (
    <Panel>
      <div className="flex items-center justify-between">
        <PanelTitle sub="For setup rolls, Hunt checks, or settling who goes first.">Cast the dice</PanelTitle>
        <div className="flex items-center gap-1 shrink-0">
          {[1, 2].map((c) => (
            <button
              key={c}
              onClick={() => {
                setN(c);
                setDice([...Array(c)].map((_, i) => dice[i] || 1));
                setFlavor("");
              }}
              className="rb-btn rb-display w-8 h-8 rounded-sm text-sm font-bold"
              style={{
                background: n === c ? INK : "rgba(255,250,235,0.7)",
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
          <Die key={i} value={dice[i] || 1} rolling={rolling} size={52} />
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
    </Panel>
  );
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
    <>
      <Panel>
        <PanelTitle sub="How many armies march to war?">Muster the players</PanelTitle>
        <div className="grid grid-cols-3 gap-2">
          {[2, 3, 4].map((n) => (
            <button
              key={n}
              onClick={() => setCount(n)}
              className="rb-btn rb-display py-3 rounded-sm text-lg font-bold"
              style={{
                background: count === n ? INK : "rgba(255,250,235,0.7)",
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

      {count && (
        <Panel>
          <PanelTitle sub="Tick each as the table is prepared.">Setting the board</PanelTitle>
          <SetupChecklist items={count === 2 ? SETUP_2P : [...SETUP_BY_COUNT[count], ...SETUP_COMMON]} />
        </Panel>
      )}

      {count && <BigButton onClick={() => update({ screen: "play" })}>Begin the war</BigButton>}
    </>
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
              className="text-[15px] leading-snug"
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
      className="rb-display shrink-0 w-6 h-6 mt-0.5 rounded-sm flex items-center justify-center text-sm font-bold"
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
function TabBar({ tab, setTab }) {
  const tabs = [
    { id: "turn", label: "Turn" },
    { id: "battle", label: "Battle" },
    { id: "lands", label: "Lands" },
    { id: "ring", label: "Ring" },
    { id: "score", label: "Score" },
    { id: "palantir", label: "Stone" },
  ];
  return (
    <nav className="grid grid-cols-6 mb-4 rounded-sm overflow-hidden" style={{ border: `1px solid ${LINE}` }}>
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => setTab(t.id)}
          className="rb-btn rb-display py-2.5 text-[9px] font-bold tracking-wide uppercase"
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
    <button onClick={() => onChange(!value)} className="rb-btn flex items-center gap-3 text-left">
      <span
        className="w-10 h-6 rounded-full relative shrink-0"
        style={{ background: value ? GOLD : "rgba(43,32,20,0.25)", transition: "background 120ms" }}
      >
        <span
          className="absolute top-0.5 w-5 h-5 rounded-full"
          style={{ left: value ? 18 : 2, background: "#f6ecd4", transition: "left 120ms", boxShadow: "0 1px 2px rgba(0,0,0,0.3)" }}
        />
      </span>
      <span className="text-[15px]" style={{ color: INK }}>
        {label}
      </span>
    </button>
  );
}

// ———— Turn screen ————
function TurnScreen({ game, update, setTab }) {
  const [ending, setEnding] = useState(false);
  const [endRoll, setEndRoll] = useState(null);
  const player = game.players[game.currentPlayer];
  const fac = FACTIONS.find((f) => f.id === player.faction);
  const active = game.players.filter((p) => !p.eliminated);

  const toggle = (i) => {
    const checks = game.checks.slice();
    checks[i] = !checks[i];
    update({ checks });
  };

  const setPlayer = (i, patch) =>
    update({ players: game.players.map((p, idx) => (idx === i ? { ...p, ...patch } : p)) });

  const nextIdx = (from) => {
    let i = from;
    for (let k = 0; k < game.players.length; k++) {
      i = (i + 1) % game.players.length;
      if (!game.players[i].eliminated) return i;
    }
    return from;
  };

  // One-tap end of turn: handles the Fellowship, card draw, and pass
  const current = game.path[game.ringStep];
  const atDoom = game.ringStep === game.path.length - 1;
  const needsRoll = !game.ringDestroyed && (atDoom || current.die);

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
      lastTurn: { by: player.name, summary, drewCard: game.conquered },
    });
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
      const next = game.path[game.ringStep + 1];
      finishTurn({ ringStep: game.ringStep + 1 }, `The Fellowship marched on to ${next.name}.`);
      return;
    }
    // a roll is required — tumble the die first
    setEnding(true);
    setEndRoll({ rolling: true, value: 1 });
    buzz([15, 30, 15, 30, 15]);
    setTimeout(() => {
      const r = rollDie();
      setEndRoll({ rolling: false, value: r });
      buzz(r >= 4 ? [10, 40, 60] : 80);
      setTimeout(() => {
        setEnding(false);
        setEndRoll(null);
        if (atDoom) {
          if (r >= 4) {
            update({ ringDestroyed: true });
            finishTurn(
              { ringDestroyed: true },
              `${player.name} rolled a ${r} — THE RING IS DESTROYED! The war is over; tally the Score page.`
            );
          } else {
            finishTurn({}, `${player.name} rolled a ${r} at Mount Doom — the Ring endures. Next player rolls again.`);
          }
        } else {
          if (r >= 4) {
            const next = game.path[game.ringStep + 1];
            finishTurn({ ringStep: game.ringStep + 1 }, `Rolled a ${r} — the Fellowship escaped ${current.name} and reached ${next.name}.`);
          } else {
            finishTurn({}, `Rolled a ${r} — the Fellowship is held at ${current.name}.`);
          }
        }
      }, 900);
    }, 700);
  };

  const allDone = game.checks.slice(0, 6).every(Boolean);

  return (
    <>
      {game.lastTurn && (
        <Panel style={{ background: "rgba(43,32,20,0.06)", borderStyle: "dashed" }}>
          <p className="text-[15px]" style={{ color: INK }}>
            <span className="rb-display text-xs font-bold uppercase tracking-widest" style={{ color: GOLD }}>
              Last turn ·{" "}
            </span>
            {game.lastTurn.summary}
            {game.lastTurn.drewCard && (
              <span style={{ color: INK_FADE }}> {game.lastTurn.by} drew a Territory card.</span>
            )}
          </p>
        </Panel>
      )}

      <Panel style={{ borderLeft: `4px solid ${fac.hex}` }}>
        <div className="flex items-baseline justify-between">
          <div>
            <div className="text-xs uppercase tracking-widest" style={{ color: INK_FADE }}>
              Round {game.round} · now marching
            </div>
            <div className="rb-display text-2xl font-bold">{player.name}</div>
          </div>
          <span
            className="rb-display text-[10px] font-bold tracking-widest uppercase px-2 py-1 rounded-sm"
            style={{ background: fac.side === "good" ? GOOD_GREEN : WAX, color: "#f6ecd4" }}
          >
            {fac.side === "good" ? "Free Peoples" : "Sauron"}
          </span>
        </div>
        <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: `1px dashed ${LINE}` }}>
          <div>
            <div className="rb-display text-sm font-bold tracking-wide">Territory cards in hand</div>
            {(player.cards || 0) >= 5 && (
              <div className="text-sm font-semibold" style={{ color: WAX }}>
                5 or more — you MUST trade a set this turn!
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

      <Panel>
        <PanelTitle sub="Seven deeds, in order. Tick each as it is done.">The turn</PanelTitle>

        <div
          className="flex flex-col gap-2 mb-4 p-3 rounded-sm"
          style={{ background: "rgba(43,32,20,0.05)", border: `1px dashed ${LINE}` }}
        >
          <FlagToggle label="Conquered a territory this turn" value={game.conquered} onChange={(v) => update({ conquered: v })} />
          <FlagToggle label="A Leader took a Site of Power" value={game.siteOfPower} onChange={(v) => update({ siteOfPower: v })} />
        </div>

        <ol className="space-y-1">
          {TURN_STEPS.map((s, i) => {
            const skipped =
              (s.conditional === "conquered" && !game.conquered) ||
              (s.conditional === "siteOfPower" && !game.siteOfPower);
            const isAuto = !!s.auto;
            return (
              <li key={i}>
                <button
                  onClick={() => !isAuto && toggle(i)}
                  className="rb-btn w-full text-left flex gap-3 items-start py-2"
                  style={{ opacity: (skipped && !game.checks[i]) || isAuto ? 0.55 : 1 }}
                >
                  {isAuto ? (
                    <span className="rb-display shrink-0 w-6 h-6 mt-0.5 rounded-sm flex items-center justify-center text-xs" style={{ border: `1.5px dashed ${GOLD}`, color: GOLD }}>
                      ⚂
                    </span>
                  ) : (
                    <CheckBox checked={game.checks[i]} />
                  )}
                  <span className="flex-1">
                    <span
                      className="rb-display text-sm font-bold tracking-wide block"
                      style={{
                        textDecoration: game.checks[i] ? "line-through" : "none",
                        color: game.checks[i] ? INK_FADE : INK,
                      }}
                    >
                      {i + 1}. {s.title}
                      {skipped && (
                        <em className="ml-2 font-normal normal-case tracking-normal" style={{ color: INK_FADE, fontFamily: "'EB Garamond', serif" }}>
                          — skip
                        </em>
                      )}
                    </span>
                    {!game.checks[i] && (
                      <span className="text-sm leading-snug block mt-0.5" style={{ color: INK_FADE }}>
                        {s.detail}
                      </span>
                    )}
                  </span>
                </button>
                {i === 0 && !game.checks[0] && (
                  <button onClick={() => setTab("lands")} className="rb-btn ml-9 mb-1 text-sm underline underline-offset-2" style={{ color: GOLD }}>
                    → open your lands & muster
                  </button>
                )}
                {i === 1 && !game.checks[1] && (
                  <button onClick={() => setTab("battle")} className="rb-btn ml-9 mb-1 text-sm underline underline-offset-2" style={{ color: GOLD }}>
                    → open the battleground
                  </button>
                )}
              </li>
            );
          })}
        </ol>
      </Panel>

      {ending && endRoll && (
        <Panel className="text-center" style={{ background: "rgba(43,32,20,0.92)", border: `1px solid ${GOLD}` }}>
          <div className="rb-display text-[11px] tracking-[0.3em] uppercase mb-2" style={{ color: GOLD_BRIGHT }}>
            {atDoom ? "At the Crack of Doom" : `Leaving ${current.name}`}
          </div>
          <Die value={endRoll.value} rolling={endRoll.rolling} size={56} />
          {!endRoll.rolling && (
            <div className="rb-display text-lg font-bold mt-2" style={{ color: endRoll.value >= 4 ? GOLD_BRIGHT : "#cdbf9d" }}>
              {endRoll.value >= 4 ? (atDoom ? "It is done!" : "The Fellowship presses on!") : atDoom ? "The Ring endures…" : "Held fast…"}
            </div>
          )}
        </Panel>
      )}

      <BigButton tone={allDone ? "gold" : "ink"} onClick={endTurn} disabled={ending}>
        {ending
          ? "The dice tumble…"
          : game.ringDestroyed
          ? "End turn"
          : atDoom
          ? "End turn — roll to destroy the Ring"
          : needsRoll
          ? `End turn — roll to leave ${current.name}`
          : "End turn — the Fellowship moves"}
      </BigButton>

      <div className="mt-4">
        <DiceRoller />
      </div>

      {game.players.length > 2 && (
        <Panel className="mt-4">
          <PanelTitle sub="When an army's last battalion falls, mark them here — the turn order skips them.">
            The fallen
          </PanelTitle>
          <div className="space-y-2">
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
        </Panel>
      )}
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
          <span className="rb-display text-base w-10 shrink-0 text-center" style={{ color: tone }} title="a die">
            ⚄
          </span>
          <div className="grid grid-cols-6 gap-1 flex-1">
            {[1, 2, 3, 4, 5, 6].map((v) => (
              <button
                key={v}
                onClick={() => onPick(i, v)}
                className="rb-btn rb-display py-2 rounded-sm text-base font-bold"
                style={{
                  background: values[i] === v ? tone : "rgba(255,250,235,0.7)",
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

function BattleScreen() {
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

  return (
    <>
      <Panel>
        <PanelTitle sub="Roll your real dice, tap in what they show (order doesn't matter), and the ledger settles it — highest vs highest, every bonus applied, ties to the defender.">
          The battleground
        </PanelTitle>

        <div className="mb-4">
          <div className="rb-display text-sm font-bold tracking-wide mb-1" style={{ color: WAX }}>
            ⚔ Attacker
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm" style={{ color: INK_FADE }}>
              Battalions sent (dice):
            </span>
            {[1, 2, 3].map((n) => (
              <button
                key={n}
                onClick={() => {
                  setAttCount(n);
                  setResult(null);
                }}
                className="rb-btn rb-display w-9 h-9 rounded-sm font-bold"
                style={{
                  background: attCount === n ? WAX : "rgba(255,250,235,0.7)",
                  color: attCount === n ? "#f6ecd4" : INK,
                  border: `1px solid ${LINE}`,
                }}
              >
                {n}
              </button>
            ))}
          </div>
          <DiceEntry count={attCount} values={att} tone={WAX} onPick={(i, v) => { const n = att.slice(); n[i] = v; setAtt(n); setResult(null); buzz(8); }} />
          <div className="mt-2">
            <FlagToggle label="Leader fights with the attackers (+1 highest die)" value={attLeader} onChange={(v) => { setAttLeader(v); setResult(null); }} />
          </div>
        </div>

        <div className="pt-4" style={{ borderTop: `1px dashed ${LINE}` }}>
          <div className="rb-display text-sm font-bold tracking-wide mb-1" style={{ color: INK }}>
            🛡 Defender
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm" style={{ color: INK_FADE }}>
              Battalions defending (dice):
            </span>
            {[1, 2].map((n) => (
              <button
                key={n}
                onClick={() => {
                  setDefCount(n);
                  setResult(null);
                }}
                className="rb-btn rb-display w-9 h-9 rounded-sm font-bold"
                style={{
                  background: defCount === n ? INK : "rgba(255,250,235,0.7)",
                  color: defCount === n ? GOLD_BRIGHT : INK,
                  border: `1px solid ${LINE}`,
                }}
              >
                {n}
              </button>
            ))}
          </div>
          <DiceEntry count={defCount} values={def} tone={INK} onPick={(i, v) => { const n = def.slice(); n[i] = v; setDef(n); setResult(null); buzz(8); }} />
          <div className="mt-2 space-y-2">
            <FlagToggle label="Leader defends (+1 highest die)" value={defLeader} onChange={(v) => { setDefLeader(v); setResult(null); }} />
            <FlagToggle label="Defending a stronghold (+1 highest die)" value={defStronghold} onChange={(v) => { setDefStronghold(v); setResult(null); }} />
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
          <div className="space-y-2 mb-3">
            {result.pairs.map((p, i) => (
              <div key={i} className="flex items-center justify-between text-[15px]" style={{ color: "#cdbf9d" }}>
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
          <div className="text-center pt-3" style={{ borderTop: "1px solid rgba(233,194,92,0.3)" }}>
            <div className="rb-display text-xl font-black" style={{ color: GOLD_BRIGHT }}>
              {result.attLoss > 0 && `Attacker removes ${result.attLoss}`}
              {result.attLoss > 0 && result.defLoss > 0 && " · "}
              {result.defLoss > 0 && `Defender removes ${result.defLoss}`}
            </div>
            <div className="text-sm mt-1" style={{ color: "#cdbf9d" }}>
              battalion{result.attLoss + result.defLoss === 1 ? "" : "s"} from the battleground
            </div>
          </div>
        </Panel>
      )}

      <Panel>
        <PanelTitle>Combat at a glance</PanelTitle>
        <ul className="text-[15px] space-y-1.5" style={{ color: INK }}>
          <li>• You need at least 2 battalions to attack — 1 always stays home.</li>
          <li>• Conquered the territory? Battalions that fought must move in; Leaders move with them.</li>
          <li>• If a defender's last battalion falls, any Leader there is removed too.</li>
          <li>• Eliminate a player: take their Territory cards (Adventure cards are discarded).</li>
        </ul>
      </Panel>
    </>
  );
}

// ———— Lands: ownership map + live reinforcement muster ————
function regionOwner(game, regionName) {
  // returns the player index that owns EVERY territory in the region, else null
  const terrs = game.territories.filter((t) => t.region === regionName);
  if (!terrs.length) return null;
  const first = game.owners[terrs[0].name];
  if (first === undefined) return null;
  return terrs.every((t) => game.owners[t.name] === first) ? first : null;
}

function LandsScreen({ game, update }) {
  const [brush, setBrush] = useState(game.currentPlayer);
  const [sets, setSets] = useState({});
  const [edit, setEdit] = useState(false);
  const [collapsed, setCollapsed] = useState({});

  const facOf = (i) => {
    if (i === undefined || i === null || i < 0 || i >= game.players.length) return null;
    const p = game.players[i];
    return p ? FACTIONS.find((f) => f.id === p.faction) : null;
  };
  const ownerHex = (i) => (i === undefined || i < 0 ? null : facOf(i)?.hex);

  const paint = (name) => {
    const owners = { ...game.owners };
    if (brush === -1) delete owners[name];
    else owners[name] = brush;
    buzz(6);
    update({ owners });
  };

  // current player's live muster
  const me = game.currentPlayer;
  const myTerrs = game.territories.filter((t) => game.owners[t.name] === me);
  const myCount = myTerrs.length;
  const base = myCount > 0 ? Math.max(3, Math.floor(myCount / 3)) : 0;
  const myStrongholds = myTerrs.filter((t) => t.s).length;
  const myRegions = REGIONS.filter((r) => regionOwner(game, r.name) === me);
  const regionTotal = myRegions.reduce((sum, r) => {
    const idx = REGIONS.findIndex((x) => x.name === r.name);
    return sum + game.regionBonuses[idx];
  }, 0);
  const cardTotal = CARD_SETS.reduce((sum, c) => sum + (sets[c.label] || 0) * c.value, 0);
  const total = base + regionTotal + cardTotal;

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
    <>
      <Panel>
        <PanelTitle sub="Tap a territory to mark its owner. Pick a banner below first — it defaults to whoever's turn it is.">
          The map of holdings
        </PanelTitle>
        <div className="flex flex-wrap gap-1.5">
          {game.players.map((p, i) => {
            const fac = facOf(i);
            return (
              <button
                key={i}
                onClick={() => setBrush(i)}
                className="rb-btn text-xs px-2 py-1.5 rounded-sm flex items-center gap-1.5"
                style={{
                  background: brush === i ? fac.hex : "rgba(255,250,235,0.7)",
                  color: brush === i ? "#f6ecd4" : INK,
                  border: `1px solid ${brush === i ? fac.hex : LINE}`,
                  opacity: p.eliminated ? 0.5 : 1,
                }}
              >
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: fac.hex, border: "1px solid rgba(0,0,0,0.3)" }} />
                {p.name}
              </button>
            );
          })}
          <button
            onClick={() => setBrush(-1)}
            className="rb-btn text-xs px-2 py-1.5 rounded-sm"
            style={{
              background: brush === -1 ? INK : "rgba(255,250,235,0.7)",
              color: brush === -1 ? GOLD_BRIGHT : INK,
              border: `1px solid ${LINE}`,
            }}
          >
            ◌ neutral / clear
          </button>
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
            {total}
          </div>
          <div className="text-sm" style={{ color: "#cdbf9d" }}>
            battalions
            <div className="text-xs">
              {base} land ({myCount} terr.) · {regionTotal} regions · {cardTotal} cards
            </div>
          </div>
        </div>
        {myStrongholds > 0 && (
          <div className="mt-2 pt-2 text-[15px]" style={{ borderTop: "1px solid rgba(233,194,92,0.3)", color: GOLD_BRIGHT }}>
            ⌂ + place 1 battalion in each of your <b>{myStrongholds} strongholds</b>
          </div>
        )}
        {myRegions.length > 0 && (
          <div className="mt-1 text-sm" style={{ color: "#cdbf9d" }}>
            Whole regions ruled: {myRegions.map((r) => r.name).join(", ")}
          </div>
        )}
      </Panel>

      {/* Territory card trade-ins */}
      <Panel>
        <PanelTitle sub="Add any sets you're cashing in. Lower your hand count on the Turn page by 3 per set.">
          Card trade-ins
        </PanelTitle>
        <div className="space-y-2">
          {CARD_SETS.map((c) => (
            <div key={c.label} className="flex items-center justify-between gap-3">
              <span className="text-[15px]">
                {c.label} <span className="rb-display text-sm font-bold" style={{ color: GOLD }}>= {c.value}</span>
              </span>
              <Stepper value={sets[c.label] || 0} onChange={(v) => setSets((x) => ({ ...x, [c.label]: v }))} max={4} />
            </div>
          ))}
        </div>
      </Panel>

      {/* The regions */}
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="rb-display text-sm font-bold tracking-widest uppercase" style={{ color: INK }}>
          The nine regions
        </span>
        <button onClick={() => setEdit(!edit)} className="rb-btn text-xs underline underline-offset-2" style={{ color: INK_FADE }}>
          {edit ? "done editing" : "edit lands"}
        </button>
      </div>

      {REGIONS.map((r, ri) => {
        const terrs = game.territories.map((t, idx) => ({ ...t, idx })).filter((t) => t.region === r.name);
        const owner = regionOwner(game, r.name);
        const ownerFac = facOf(owner);
        const isOpen = !collapsed[r.name];
        return (
          <Panel key={r.name} style={{ borderLeft: ownerFac ? `4px solid ${ownerFac.hex}` : `1px solid ${LINE}`, paddingBottom: isOpen ? undefined : 12 }}>
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
              <div className="flex flex-wrap gap-1.5 mt-3">
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
                      className="rb-btn text-xs px-2 py-1.5 rounded-sm flex items-center gap-1"
                      style={{
                        background: hex || "rgba(255,250,235,0.7)",
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
          </Panel>
        );
      })}

      <Panel style={{ background: "rgba(43,32,20,0.05)", borderStyle: "dashed" }}>
        <p className="text-sm" style={{ color: INK_FADE }}>
          These 64 territories and their regions were reconstructed from your gameboard — the per-region counts match
          the rulebook exactly, but a few names or groupings may need a tweak. Tap <b>edit lands</b> to rename, move a
          territory to another region, mark strongholds, or add/remove. Your changes are saved.
        </p>
      </Panel>
    </>
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
          <p className="text-[15px]" style={{ color: INK }}>
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
            <li key={i} className="flex items-center gap-2 text-[15px]">
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
          <p className="text-[15px] mt-2 leading-snug" style={{ color: INK }}>
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
      <p className="text-[15px] leading-snug" style={{ color: INK }}>
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
            <p className="text-[15px] italic" style={{ color: INK_FADE }}>
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
                    <span className="rb-display text-[15px] font-bold tracking-wide" style={{ color: INK }}>
                      {e.q}
                    </span>
                  </button>
                  {open && (
                    <p className="text-[15px] leading-snug mt-2 pl-6" style={{ color: INK }}>
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
function ScoreScreen({ game }) {
  const [rows, setRows] = useState(game.players.map(() => ({ territories: 0, strongholds: 0, regions: {}, adventure: 0 })));

  const setRow = (i, patch) => setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const scoreOf = (r) =>
    r.territories +
    r.strongholds * 2 +
    REGIONS.reduce((s, reg, ri) => s + (r.regions[reg.name] ? game.regionBonuses[ri] : 0), 0) +
    r.adventure;

  const scores = rows.map(scoreOf);
  const best = Math.max(...scores);

  return (
    <>
      <Panel>
        <PanelTitle sub="When the Ring is destroyed, count the spoils.">The reckoning</PanelTitle>
        <ul className="text-[15px] space-y-1" style={{ color: INK }}>
          <li>• 1 point per territory held</li>
          <li>• 2 points per stronghold held</li>
          <li>• Each fully-ruled region: points equal to its battalion bonus</li>
          <li>
            • Points printed on Adventure cards you have <b>played</b> (not cards in hand)
          </li>
        </ul>
      </Panel>

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
                <span className="text-[15px]">Territories (×1)</span>
                <Stepper value={r.territories} onChange={(v) => setRow(i, { territories: v })} max={64} />
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[15px]">Strongholds (×2)</span>
                <Stepper value={r.strongholds} onChange={(v) => setRow(i, { strongholds: v })} max={20} />
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[15px]">Adventure card points</span>
                <Stepper value={r.adventure} onChange={(v) => setRow(i, { adventure: v })} max={50} />
              </div>
              <div>
                <div className="text-[15px] mb-1">
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
                        className="rb-btn text-xs px-2 py-1 rounded-sm"
                        style={{
                          background: on ? GOLD : "rgba(255,250,235,0.7)",
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

      {best > 0 && (
        <Panel style={{ background: "rgba(43,32,20,0.92)", border: `1px solid ${GOLD}` }}>
          <p className="rb-display text-center text-lg font-bold" style={{ color: GOLD_BRIGHT }}>
            {game.players.filter((_, i) => scores[i] === best).map((p) => p.name).join(" & ")} rules Middle-earth
          </p>
        </Panel>
      )}
    </>
  );
}
