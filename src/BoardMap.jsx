import { useRef } from "react";
import { BOARD, MAP_ANCHORS, territoryAt } from "./mapData.js";

// The photographed gameboard with an owner badge on every territory.
// Tap anywhere on a land and the nearest anchor decides which territory was meant.
//   territories: game.territories (name, region, s)
//   ownerOf(name) -> { hex, label } | null      colour and short label for the badge
//   onTap(name)                                  called with the territory tapped
//   highlight: territory name to ring (last tapped)
//   maxHeight: CSS max-height for the image (e.g. "70vh")
//   ring: { path: [{ name }], step, destroyed }   draws the Fellowship's road and where the Ring is now
// Path stops are written the way the rulebook does ("Rhudaur (Rivendell)", "Ithilien"); match them to lands loosely.
const RING_OFFSET = [30, -26]; // keep the road and the Ring clear of the owner badges
function anchorForStop(stopName, names) {
  const clean = (s) => s.toLowerCase().replace(/\s*\(.*\)\s*/g, "").trim();
  const want = clean(stopName);
  const exact = names.find((n) => clean(n) === want);
  const loose = exact || names.find((n) => clean(n).includes(want) || want.includes(clean(n)));
  const a = loose && MAP_ANCHORS[loose];
  return a ? [a[0][0] + RING_OFFSET[0], a[0][1] + RING_OFFSET[1]] : null;
}

export default function BoardMap({ territories, ownerOf, onTap, highlight, maxHeight = "80vh", style = {}, ring }) {
  const box = useRef(null);
  const names = territories.map((t) => t.name);
  const road = ring ? ring.path.map((p) => anchorForStop(p.name, names)) : [];
  const roadPts = road.filter(Boolean);
  const ringAt = ring ? road[Math.min(ring.step, road.length - 1)] : null;

  const handle = (e) => {
    const el = box.current;
    if (!el || !onTap) return;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const x = ((e.clientX - r.left) / r.width) * BOARD.w;
    const y = ((e.clientY - r.top) / r.height) * BOARD.h;
    const name = territoryAt(x, y, names);
    if (name) onTap(name);
  };

  return (
    <div
      ref={box}
      onClick={handle}
      data-boardmap
      style={{ position: "relative", display: "inline-block", maxWidth: "100%", lineHeight: 0, touchAction: "manipulation", cursor: onTap ? "pointer" : "default", ...style }}
    >
      <img
        src="board.webp"
        alt="The gameboard: Middle-earth"
        draggable={false}
        style={{ display: "block", maxWidth: "100%", maxHeight, width: "auto", height: "auto", borderRadius: 3, boxShadow: "0 2px 8px rgba(43,32,20,0.35)", userSelect: "none" }}
      />
      <svg viewBox={`0 0 ${BOARD.w} ${BOARD.h}`} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
        <defs>
          <filter id="rb-halo" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="16" />
          </filter>
        </defs>
        {/* the Fellowship's road and the One Ring */}
        {roadPts.length > 1 && (
          <polyline points={roadPts.map((p) => p.join(",")).join(" ")} fill="none" stroke="#2b2014" strokeWidth={12} strokeOpacity={0.5} strokeDasharray="16 18" strokeLinecap="round" />
        )}
        {roadPts.length > 1 && (
          <polyline points={roadPts.map((p) => p.join(",")).join(" ")} fill="none" stroke="#f7d774" strokeWidth={6} strokeOpacity={0.95} strokeDasharray="16 18" strokeLinecap="round" />
        )}
        {/* soft ownership glow under each owned land */}
        {territories.map((t) => {
          const a = MAP_ANCHORS[t.name];
          const o = ownerOf(t.name);
          if (!a || !o) return null;
          return <circle key={"h" + t.name} cx={a[0][0]} cy={a[0][1]} r={64} fill={o.hex} opacity={0.42} filter="url(#rb-halo)" />;
        })}
        {territories.map((t) => {
          const a = MAP_ANCHORS[t.name];
          if (!a) return null;
          const [x, y] = a[0];
          const o = ownerOf(t.name);
          const hot = highlight === t.name;
          return (
            <g key={t.name}>
              {hot && <circle cx={x} cy={y} r={40} fill="none" stroke="#fff6d5" strokeWidth={6} opacity={0.95} />}
              {o ? (
                <>
                  <circle cx={x} cy={y} r={27} fill={o.hex} stroke="#fff6d5" strokeWidth={4} />
                  <circle cx={x} cy={y} r={27} fill="none" stroke="rgba(43,32,20,0.55)" strokeWidth={1.5} />
                  {t.s && (
                    <text x={x} y={y + 8} textAnchor="middle" fontSize={26} fill="#fff6d5" fontFamily="serif" fontWeight="700">
                      ⌂
                    </text>
                  )}
                </>
              ) : (
                <circle cx={x} cy={y} r={11} fill="rgba(255,250,235,0.55)" stroke="rgba(43,32,20,0.7)" strokeWidth={2.5} strokeDasharray={t.s ? "0" : "4 3"} />
              )}
            </g>
          );
        })}
        {ringAt && (
          <g data-ring className="ring-pulse">
            <circle cx={ringAt[0]} cy={ringAt[1]} r={48} fill={ring.destroyed ? "#ff5a2c" : "#e9c25c"} opacity={0.6} filter="url(#rb-halo)" />
            <circle cx={ringAt[0]} cy={ringAt[1]} r={26} fill="none" stroke="#2b2014" strokeWidth={14} opacity={0.65} />
            <circle cx={ringAt[0]} cy={ringAt[1]} r={26} fill="none" stroke={ring.destroyed ? "#ff5a2c" : "#f7d774"} strokeWidth={9} />
            <circle cx={ringAt[0]} cy={ringAt[1]} r={26} fill="none" stroke="#fff6d5" strokeWidth={2} opacity={0.85} />
            <text x={ringAt[0]} y={ringAt[1] + 54} textAnchor="middle" fontSize={20} fontWeight="700" fill="#fff6d5" stroke="#2b2014" strokeWidth={3} paintOrder="stroke" fontFamily="serif">
              {ring.destroyed ? "destroyed" : "the Ring"}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
