// The board photo (public/board.webp) is a straightened, upright shot of the real gameboard.
// Source: a 1632x1224 Amazon review photo, rotated 90° counter-clockwise (to 1224x1632) and
// perspective-corrected to 1080x1620 from the inner-frame corners tl(110.7,-5.2) tr(1091.3,62.5)
// br(1142.4,1587.2) bl(21.8,1617.3). Nudge points with tools/anchors.html (served by `npm run dev`).
// Each territory gets one or more anchor points in image pixels: the first is where its owner
// badge is drawn, the rest only widen its tap area (a tap goes to the nearest anchor of any land).
export const BOARD = { w: 1080, h: 1620 };

export const MAP_ANCHORS = {
  // Eriador
  "Forlindon": [[57, 285], [78, 205]],
  "Lune Valley": [[225, 215], [290, 135]],
  "Evendim Hills": [[325, 240]],
  "Tower Hills": [[300, 345]],
  "The Shire": [[305, 470]],
  "Mithlond": [[150, 358]],
  "Harlindon": [[119, 518], [140, 575]],
  // Arnor
  "Borderlands": [[470, 205], [505, 265]],
  "North Downs": [[410, 275]],
  "Fornost": [[420, 335]],
  "Weather Hills": [[500, 355]],
  "Buckland": [[374, 436]],
  "Old Forest": [[453, 435]],
  "South Downs": [[480, 507]],
  "Angmar": [[555, 175]],
  "Eastern Angmar": [[690, 110]],
  "Forodwaith": [[555, 68], [760, 42]], // Carn Dûm is a place inside Forodwaith
  "Rhudaur": [[620, 320], [640, 385]],
  // Rohan
  "Minhiriath": [[320, 650], [300, 730]],
  "Dunland": [[470, 665]],
  "Eregion": [[562, 511]],
  "Enedwaith": [[441, 834], [440, 760]],
  "West Rohan": [[420, 990]],
  "Gap of Rohan": [[600, 1000]],
  "Fangorn": [[590, 850]],
  // Rhovanion
  "Moria": [[615, 545]],
  "Lórien": [[670, 690]],
  "Gladden Fields": [[705, 510]],
  "The Wold": [[720, 835]],
  "Emyn Muil": [[800, 720]],
  "Dead Marshes": [[812, 974], [905, 956]], // Dagorlad is a place inside Dead Marshes, not a territory
  "Brown Lands": [[935, 780], [960, 470], [945, 660]],
  "Rhûn Hills": [[1040, 790]],
  // Mirkwood
  "Carrock": [[745, 262]],
  "North Mirkwood": [[838, 255]],
  "Eastern Mirkwood": [[859, 429]],
  "South Mirkwood": [[870, 630]],
  "Anduin Valley": [[794, 494], [745, 400], [750, 580]],
  // Rhûn
  "Withered Heath": [[960, 110]],
  "North Rhûn": [[1038, 47]],
  "Esgaroth": [[915, 300]],
  "South Rhûn": [[1030, 380], [1040, 520]],
  // Gondor
  "Druwaith Iaur": [[300, 1160]],
  "Vale of Erech": [[440, 1190]],
  "Anfalas": [[350, 1290]],
  "Andrast": [[235, 1300]],
  "Lamedon": [[525, 1230]],
  "Belfalas": [[540, 1300], [485, 1345]], // Dol Amroth is a place inside Belfalas
  "Lebennin": [[615, 1250], [600, 1310]],
  "Minas Tirith": [[640, 1165]],
  "Ithilien": [[735, 1250]], // Osgiliath is a place inside Ithilien
  "South Ithilien": [[745, 1335]],
  // Mordor
  "Udûn Vale": [[830, 1140]],
  "Mount Doom": [[900, 1175]],
  "Barad-dûr": [[1005, 1160]],
  "Minas Morgul": [[834, 1253]],
  "Gorgoroth": [[1027, 1261]],
  "Nurn": [[910, 1375]],
  // Haradwaith
  "Harondor": [[700, 1425], [640, 1470]],
  "Umbar": [[610, 1520]],
  "Deep Harad": [[576, 1605], [420, 1600]],
  "Harad": [[800, 1580]],
  "Near Harad": [[940, 1560]],
  "Khand": [[1040, 1520]],
};

// Nearest-anchor lookup. x, y in image pixels. Returns the territory name.
export function territoryAt(x, y, names) {
  let best = null, bestD = Infinity;
  for (const name of names) {
    const pts = MAP_ANCHORS[name];
    if (!pts) continue;
    for (const [px, py] of pts) {
      const d = (px - x) * (px - x) + (py - y) * (py - y);
      if (d < bestD) { bestD = d; best = name; }
    }
  }
  return best;
}
