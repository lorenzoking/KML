import { mkdirSync, writeFileSync, copyFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { Resvg } = require("@resvg/resvg-js");

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public/stories/eoy");
mkdirSync(outDir, { recursive: true });

const GOLD = "#E8C36A";
const INK = "#F4F1E8";
const MUTED = "#A39B88";
const LINE = "#2A261C";
const BG = "#070707";
const CARD = "#12100C";

function chrome({ title, kicker, footer, width = 1600, height = 900, body }) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0C0B08"/>
      <stop offset="100%" stop-color="#050505"/>
    </linearGradient>
    <linearGradient id="goldbar" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#8A6A22"/>
      <stop offset="50%" stop-color="${GOLD}"/>
      <stop offset="100%" stop-color="#8A6A22"/>
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bg)"/>
  <rect x="0" y="0" width="${width}" height="6" fill="url(#goldbar)"/>
  <rect x="0" y="${height - 56}" width="${width}" height="56" fill="#0A0907"/>
  <rect x="0" y="${height - 58}" width="${width}" height="2" fill="${GOLD}"/>
  <text x="48" y="48" fill="${GOLD}" font-family="Arial Black, Impact, Helvetica, sans-serif" font-size="18" letter-spacing="6">KML REBORN</text>
  <text x="${width - 48}" y="48" text-anchor="end" fill="${GOLD}" font-family="Arial Black, Impact, Helvetica, sans-serif" font-size="16" letter-spacing="4">SEASON 1 · WEEK 17 TAPE</text>
  <text x="48" y="118" fill="${INK}" font-family="Arial Black, Helvetica Neue, Helvetica, sans-serif" font-size="58">${title}</text>
  <text x="52" y="156" fill="${MUTED}" font-family="Helvetica Neue, Arial, sans-serif" font-size="18">${kicker}</text>
  ${body}
  <text x="48" y="${height - 22}" fill="${GOLD}" font-family="Arial, Helvetica, sans-serif" font-size="16" letter-spacing="2">${footer}</text>
  <text x="${width - 48}" y="${height - 22}" text-anchor="end" fill="${MUTED}" font-family="Arial, Helvetica, sans-serif" font-size="16" letter-spacing="2">#KMLREBORN</text>
</svg>`;
}

function card(x, y, w, h, accent, eyebrow, name, meta, stat) {
  return `
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="${CARD}" stroke="${LINE}" />
  <rect x="${x}" y="${y}" width="8" height="${h}" rx="4" fill="${accent}"/>
  <text x="${x + 28}" y="${y + 38}" fill="${GOLD}" font-family="Helvetica Neue, Arial, sans-serif" font-size="15" font-weight="700">${eyebrow}</text>
  <text x="${x + 28}" y="${y + 86}" fill="${INK}" font-family="Helvetica Neue, Arial, sans-serif" font-size="30" font-weight="800">${name}</text>
  <text x="${x + 28}" y="${y + 120}" fill="${MUTED}" font-family="Helvetica Neue, Arial, sans-serif" font-size="17">${meta}</text>
  <text x="${x + 28}" y="${y + 164}" fill="${GOLD}" font-family="Helvetica Neue, Arial, sans-serif" font-size="20" font-weight="700">${stat}</text>`;
}

function row(x, y, w, rank, left, mid, right, accent = GOLD) {
  const midX = w >= 1200 ? x + 520 : x + 318;
  return `
  <rect x="${x}" y="${y}" width="${w}" height="58" rx="8" fill="${CARD}"/>
  <rect x="${x}" y="${y}" width="6" height="58" rx="3" fill="${accent}"/>
  <text x="${x + 26}" y="${y + 37}" fill="${GOLD}" font-family="Helvetica Neue, Arial, sans-serif" font-size="18" font-weight="800">${rank}</text>
  <text x="${x + 68}" y="${y + 37}" fill="${INK}" font-family="Helvetica Neue, Arial, sans-serif" font-size="17" font-weight="700">${left}</text>
  <text x="${midX}" y="${y + 37}" fill="${MUTED}" font-family="Helvetica Neue, Arial, sans-serif" font-size="16">${mid}</text>
  <text x="${x + w - 22}" y="${y + 37}" text-anchor="end" fill="${GOLD}" font-family="Helvetica Neue, Arial, sans-serif" font-size="16" font-weight="700">${right}</text>`;
}

const hardware = chrome({
  title: "THE HARDWARE",
  kicker: "DESK FORMULA · PRODUCTION PLUS WINNING · THROUGH WEEK 17",
  footer: "GIBBS ATE THE BOARD. MAYE STILL OWNS THE AIR. OWEH LED THE RUSH.",
  body: `
    ${card(48, 200, 360, 210, "#0076B6", "MVP", "JAHMYR GIBBS", "HB · DET · 11-5 · Curry", "2,970 SCRIM · 33 TD")}
    ${card(428, 200, 360, 210, "#0076B6", "OPOY", "JAHMYR GIBBS", "2,674 RUSH · 28 TD", "296 REC · 5 TD")}
    ${card(808, 200, 360, 210, "#5A2A2A", "DPOY", "ODAFE OWEH", "LEDG · WAS · Jerm 9-7", "20.5 SACKS · 31 TKL")}
    ${card(1188, 200, 364, 210, "#C5B358", "ROY", "F. MENDOZA", "QB · LV · Da Truth 11-5", "3,852 YDS · 32 TD")}
    ${card(48, 440, 360, 170, "#002244", "PASS KING", "DRAKE MAYE", "QB · NE · Ren 13-3", "4,745 YDS · 51 TD")}
    ${card(428, 440, 360, 170, "#203731", "TD MACHINE", "JORDAN LOVE", "QB · GB · Chance 13-3", "4,232 YDS · 50 / 16")}
    ${card(808, 440, 360, 170, "#002244", "RECEIVING", "JSN", "WR · SEA · Petey 11-5", "103 · 1,680 · 17 TD")}
    ${card(1188, 440, 364, 170, "#003594", "TD WR", "PUKA NACUA", "WR · LAR · J. Stowe 12-4", "91 · 1,445 · 19 TD")}
  `,
});

const standouts = chrome({
  title: "STAND OUTS &amp; LETDOWNS",
  kicker: "TEAM TAPE FROM THE COMMISSIONER BOARD · PF / PA / REP",
  footer: "NEW ENGLAND BUILT THE YEAR. DENVER WAS THE PICK-10 THAT DIED.",
  body: `
    <text x="48" y="210" fill="${GOLD}" font-family="Arial Black, Helvetica, sans-serif" font-size="22" letter-spacing="3">TEAM STANDOUTS</text>
    ${row(48, 230, 730, "1", "PATRIOTS · REN", "13-3 · 590-349 · +241", "ELITE 99", "#002244")}
    ${row(48, 300, 730, "2", "PACKERS · CHANCE", "13-3 · 514-350 · WWWWW", "ELITE 96", "#203731")}
    ${row(48, 370, 730, "3", "COLTS · QUON", "12-3 · 318 PA · game in hand", "STABLE 88", "#002C5F")}
    ${row(48, 440, 730, "4", "STEELERS · BIG AL", "13-3 · last pick of the draft", "ELITE 93", "#FFB612")}
    ${row(48, 510, 730, "5", "RAIDERS · DA TRUTH", "11-5 · Mendoza + WWWWW", "ELITE 93", "#A5ACAF")}
    <text x="822" y="210" fill="#E11D48" font-family="Arial Black, Helvetica, sans-serif" font-size="22" letter-spacing="3">DISAPPOINTMENTS</text>
    ${row(822, 230, 730, "1", "BRONCOS · PUDDIN", "3-13 · pick-10 win-now", "EXTREME 60", "#FB4F14")}
    ${row(822, 300, 730, "2", "JETS · JBONE", "1-15 · 280 PF · 533 PA", "FIRING 66", "#125740")}
    ${row(822, 370, 730, "3", "TITANS · COACH Q", "4-12 · 594 PA after Simmons", "HOT SEAT 70", "#4B92DB")}
    ${row(822, 440, 730, "4", "49ERS · SWIPE", "10-6 · 20-point deadline", "BUBBLE 75", "#AA0000")}
    ${row(822, 510, 730, "5", "COWBOYS · JAVON", "5-11 · 489 PF", "HOT SEAT 73", "#869397")}
    ${row(48, 600, 1504, "—", "LEFTY 12-4 at 82", "LIONS 11-5 · 83 · 44-3 is a scar", "BILLS DESK ALREADY FLIPPED", "#8B1E3F")}
  `,
});

const chair = chrome({
  title: "THE CHAIR",
  kicker: "70-74 HOT SEAT · 65-69 FIRING ELIGIBLE · BELOW 65 EXTREME RISK",
  footer: "PUDDIN AND JBONE ARE IN RANGE. EVERYBODY ELSE IS STILL ON THE CLOCK.",
  body: `
    <text x="48" y="210" fill="#E11D48" font-family="Arial Black, Helvetica, sans-serif" font-size="22" letter-spacing="3">IN RANGE</text>
    ${row(48, 230, 730, "60", "PUDDIN · BRONCOS", "3-13 · pick-10 win-now", "EXTREME RISK", "#E11D48")}
    ${row(48, 300, 730, "66", "JBONE · JETS", "1-15 · one win all year", "FIRING ELIGIBLE", "#E11D48")}
    <text x="822" y="210" fill="#F59E0B" font-family="Arial Black, Helvetica, sans-serif" font-size="22" letter-spacing="3">HOT SEAT</text>
    ${row(822, 230, 730, "70", "COACH Q · TITANS", "4-12 · 594 PA after Simmons", "HOT SEAT", "#F59E0B")}
    ${row(822, 300, 730, "71", "DAWSON · BENGALS", "6-10 · Burrow still ate", "HOT SEAT", "#F59E0B")}
    ${row(822, 370, 730, "73", "JAVON · COWBOYS", "5-11 · 489 PF", "HOT SEAT", "#F59E0B")}
    ${row(822, 440, 730, "74", "CLASSIC · VIKINGS", "4-12 · 313 PF", "HOT SEAT", "#F59E0B")}
    ${row(48, 370, 730, "—", "VACANT", "Atlanta never had a desk", "BILLS DESK FLIPPED", "#A39B88")}
    ${row(48, 530, 1504, "—", "WATCHED", "Swipe 75 · Taylor 75 · Raine 76 · Slap 76 · Konrad 76", "PRESSURED", "#A39B88")}
    ${row(48, 600, 1504, "—", "SAFE", "Ren 99 · Chance 96 · Petey 94 · Big Al 93 · Da Truth 93", "OLIVER 91", "#16A34A")}
  `,
});

const seeds = chrome({
  title: "JANUARY FIELD",
  kicker: "IF WEEK 18 HOLDS · 1-SEED BYE · 2/7 · 3/6 · 4/5",
  footer: "CHI 12-4 WOULD GO ON THE ROAD TO TAMPA. DETROIT IS THE 7.",
  body: `
    <text x="48" y="210" fill="#E11D48" font-family="Arial Black, Helvetica, sans-serif" font-size="24" letter-spacing="4">AFC</text>
    ${row(48, 230, 730, "1", "PATRIOTS · REN", "13-3 · 590-349 · vs MIA", "BYE IF IT HOLDS", "#002244")}
    ${row(48, 300, 730, "2", "CHIEFS · TRENT", "13-3 · vs LV", "2 vs 7 LAC", "#E31837")}
    ${row(48, 370, 730, "3", "STEELERS · BIG AL", "13-3 · at BAL", "NORTH REMATCH", "#FFB612")}
    ${row(48, 440, 730, "4", "COLTS · QUON", "12-3 · vs JAX · 318 PA", "4 vs 5 LV", "#002C5F")}
    ${row(48, 510, 730, "5", "RAIDERS · DA TRUTH", "11-5 · at KC", "WWWWW", "#A5ACAF")}
    ${row(48, 580, 730, "6", "RAVENS · RAINE", "11-5 · vs PIT", "PRESSURED 76", "#241773")}
    ${row(48, 650, 730, "7", "CHARGERS · OLI", "8-8 · at DEN", "CLE 7-9 HUNTING", "#0080C6")}
    <text x="822" y="210" fill="#3B82F6" font-family="Arial Black, Helvetica, sans-serif" font-size="24" letter-spacing="4">NFC</text>
    ${row(822, 230, 730, "1", "PACKERS · CHANCE", "13-3 · vs DET", "BYE IF IT HOLDS", "#203731")}
    ${row(822, 300, 730, "2", "RAMS · J. STOWE", "12-4 · vs SEA", "2 vs 7 DET", "#003594")}
    ${row(822, 370, 730, "3", "EAGLES · LEFTY", "12-4 · at NYG", "3 vs 6 SEA", "#004C54")}
    ${row(822, 440, 730, "4", "BUCS · THA DON", "10-6 · at NO", "4 vs 5 CHI", "#D50A0A")}
    ${row(822, 510, 730, "5", "BEARS · JAYLEN", "12-4 · at MIN", "12-4 ON THE ROAD", "#0B162A")}
    ${row(822, 580, 730, "6", "SEAHAWKS · PETEY", "11-5 · at LAR", "ELITE 94", "#69BE28")}
    ${row(822, 650, 730, "7", "LIONS · CURRY", "11-5 · 83 · at GB", "SF 10-6 BUBBLE", "#0076B6")}
  `,
});

const week18 = chrome({
  title: "WEEK 18 STILL MOVES IT",
  kicker: "16 GAMES OPEN · ZERO FINALS · LAST REGULAR SUNDAY",
  footer: "WIN AND GET IN. LOSE AND TALK ABOUT THE DRAFT.",
  body: `
    ${card(48, 200, 360, 200, "#002244", "1-SEED", "MIA at NE", "Ren can lock 14-3", "IND WATCHING")}
    ${card(428, 200, 360, 200, "#203731", "1-SEED + 7", "DET at GB", "Chance vs Curry", "44-3 REMATCH")}
    ${card(808, 200, 360, 200, "#003594", "2-SEED", "SEA at LAR", "Petey vs Hollywood", "NFC WEST")}
    ${card(1188, 200, 364, 200, "#AA0000", "BUBBLE", "SF at ARI", "Swipe 10-6", "20-POINT WINDOW")}
    ${card(48, 430, 360, 200, "#FFB612", "NORTH", "PIT at BAL", "Big Al vs Raine", "2 / 3 / 6")}
    ${card(428, 430, 360, 200, "#E31837", "AFC 2 + 5", "LV at KC", "Da Truth vs Trent", "FIVE-GAME RAIDERS")}
    ${card(808, 430, 360, 200, "#0080C6", "LAST IN", "LAC at DEN", "Oli vs Puddin", "CLE CAN CRASH")}
    ${card(1188, 430, 364, 200, "#D50A0A", "SOUTH", "TB at NO", "Dre vs Slap", "CHI 12-4 LURKS")}
  `,
});

const boards = {
  "hardware.png": hardware,
  "standouts.png": standouts,
  "chair.png": chair,
  "seeds.png": seeds,
  "week18.png": week18,
};

for (const [name, svg] of Object.entries(boards)) {
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: 1920 },
    font: {
      loadSystemFonts: true,
      fontFiles: [
        "/System/Library/Fonts/Helvetica.ttc",
        "/System/Library/Fonts/HelveticaNeue.ttc",
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
        "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/System/Library/Fonts/Supplemental/Arial Black.ttf",
      ],
    },
  });
  writeFileSync(join(outDir, name), resvg.render().asPng());
  console.log("wrote", name);
}

const assets = join(root, "..", ".cursor/projects/Users-lorenzokingiii-kings-madden-league/assets");
const heroSrc = "/Users/lorenzokingiii/.cursor/projects/Users-lorenzokingiii-kings-madden-league/assets";
for (const [from, to] of [
  ["kml-eoy-hero.png", "year-end-hero.png"],
  ["kml-eoy-chair.png", "chair-hero.png"],
  ["kml-playoff-hero.png", "playoff-hero.png"],
]) {
  const src = join(heroSrc, from);
  if (existsSync(src)) copyFileSync(src, join(outDir, to));
}

console.log("done", outDir);
