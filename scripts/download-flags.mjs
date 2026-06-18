// Descarga las banderas de todos los equipos desde flagcdn.com
// Uso: node scripts/download-flags.mjs

import { createWriteStream, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import https from "https";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "public", "images", "flags");

mkdirSync(OUT, { recursive: true });

const TEAMS = {
  MEX: "mx", RSA: "za", KOR: "kr", CZE: "cz",
  CAN: "ca", BIH: "ba", QAT: "qa", SUI: "ch",
  BRA: "br", MAR: "ma", HAI: "ht", SCO: "gb-sct",
  USA: "us", PAR: "py", AUS: "au", TUR: "tr",
  GER: "de", CUW: "cw", CIV: "ci", ECU: "ec",
  NED: "nl", JPN: "jp", SWE: "se", TUN: "tn",
  BEL: "be", EGY: "eg", IRN: "ir", NZL: "nz",
  ESP: "es", CPV: "cv", KSA: "sa", URU: "uy",
  FRA: "fr", SEN: "sn", IRQ: "iq", NOR: "no",
  ARG: "ar", ALG: "dz", AUT: "at", JOR: "jo",
  POR: "pt", COD: "cd", UZB: "uz", COL: "co",
  ENG: "gb-eng", CRO: "hr", GHA: "gh", PAN: "pa",
};

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = createWriteStream(dest);
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        return;
      }
      res.pipe(file);
      file.on("finish", () => file.close(resolve));
    }).on("error", reject);
  });
}

console.log(`\nDescargando ${Object.keys(TEAMS).length} banderas en ${OUT}\n`);

let ok = 0, fail = 0;
for (const [code, iso2] of Object.entries(TEAMS)) {
  const url = `https://flagcdn.com/w40/${iso2}.png`;
  const dest = join(OUT, `${iso2}.png`);
  try {
    await download(url, dest);
    console.log(`  ✓ ${code} (${iso2}.png)`);
    ok++;
  } catch (e) {
    console.warn(`  ✗ ${code}: ${e.message}`);
    fail++;
  }
}

console.log(`\n✅ ${ok} descargadas${fail ? `, ⚠ ${fail} fallaron` : ""}`);
console.log(`   Destino: ${OUT}\n`);
