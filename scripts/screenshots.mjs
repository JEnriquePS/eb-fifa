// Script para capturar screenshots de la app para la documentación.
// Uso: node scripts/screenshots.mjs
// Requiere: npm run dev corriendo en localhost:5175

import { chromium } from "@playwright/test";
import { mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const BASE   = "http://localhost:5175/eb-fifa/";
const ADMIN  = { email: "admin@ebconsulting.co", password: "ebadminquinela2026" };
const USER   = { email: "jesus.pena@ebconsulting.co", password: "ebquinela2026" };
const OUT    = join(__dirname, "..", "docs", "img", "screenshots");

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });

function p(name) { return join(OUT, `${name}.png`); }

async function shot(page, name, opts = {}) {
  await page.screenshot({ path: p(name), ...opts });
  console.log(`  ✓ ${name}.png`);
}

async function tryShot(page, name, fn) {
  try {
    await fn();
    await shot(page, name);
  } catch (e) {
    console.warn(`  ⚠ ${name}.png falló: ${e.message}`);
  }
}

async function waitForApp(page) {
  // Wait for main tab nav to appear
  await page.waitForSelector('nav button:has-text("Grupos")', { timeout: 15000 });
  await page.waitForTimeout(2500); // Supabase data load
}

async function login(page, creds) {
  await page.goto(BASE);
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(1500);

  // If code screen is shown, navigate to login
  const codeHeading = await page.locator('h2:has-text("Código de acceso")').count();
  if (codeHeading > 0) {
    await page.getByText("¿Ya tienes cuenta? Iniciar sesión →").click();
    await page.waitForTimeout(300);
  }

  // Ensure "Iniciar sesión" tab is active
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await page.waitForTimeout(200);

  await page.fill('input[type="email"]', creds.email);
  await page.fill('input[type="password"]', creds.password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await waitForApp(page);
}

async function clickMainTab(page, label) {
  await page.locator(`nav button:has-text("${label}")`).click();
  await page.waitForTimeout(1200);
}

// ─────────────────────────────────────────────
// 1. AUTH SCREENS (sin sesión)
// ─────────────────────────────────────────────
console.log("\n1. Pantallas de auth...");
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();

  await page.goto(BASE);
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(1500);

  const onCodeScreen = await page.locator('h2:has-text("Código de acceso")').count() > 0;

  if (onCodeScreen) {
    // Captura pantalla de código
    await shot(page, "auth-code");
    // Ir a login
    await page.getByText("¿Ya tienes cuenta? Iniciar sesión →").click();
    await page.waitForTimeout(300);
  }

  // Asegura que estamos en login screen con "Iniciar sesión" activo
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await page.waitForTimeout(200);
  await shot(page, "auth-login");

  if (!onCodeScreen) {
    // Ir a código para capturarlo
    await page.getByRole("button", { name: "← Cambiar código" }).click();
    await page.waitForTimeout(300);
    await shot(page, "auth-code");
  }

  await ctx.close();
}

// ─────────────────────────────────────────────
// 2. VISTA PARTICIPANTE
// ─────────────────────────────────────────────
console.log("\n2. Vistas de participante...");
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();

  await login(page, USER);

  // Grupos – Por Fecha: aprovechar el auto-scroll que ya ocurrió al cargar
  await clickMainTab(page, "Grupos");
  await page.waitForTimeout(1500); // auto-scroll a fecha de hoy
  await shot(page, "grupos-by-date");

  // Match row con "✓ guardado" — busca ese texto mientras sigue scrolleado a hoy
  await tryShot(page, "grupos-match-saved", async () => {
    const guardadoEl = page.locator('text=/guardado/i').first();
    await guardadoEl.waitFor({ timeout: 5000 });
    await guardadoEl.scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
    const box = await guardadoEl.boundingBox();
    if (!box) throw new Error("sin bbox guardado");
    const y = Math.max(0, box.y - 55);
    const h = Math.min(95, 800 - y);
    await page.screenshot({
      path: p("grupos-match-saved"),
      clip: { x: 0, y, width: 1280, height: h },
    });
    console.log("  ✓ grupos-match-saved.png");
    throw new Error("skip");
  });

  // Header con barra de progreso – scroll al top después de capturar los partidos
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);
  await shot(page, "header-progress", {
    clip: { x: 0, y: 0, width: 1280, height: 170 },
  });

  // Selector de zona horaria – scroll al top para que el select sea visible
  await tryShot(page, "grupos-timezone", async () => {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(400);
    const sel = page.locator("select").first();
    await sel.scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
    const box = await sel.boundingBox();
    if (!box) throw new Error("select no visible");
    await page.screenshot({
      path: p("grupos-timezone"),
      clip: { x: 0, y: Math.max(0, box.y - 10), width: 1280, height: box.height + 20 },
    });
    console.log("  ✓ grupos-timezone.png");
    throw new Error("skip");
  });

  // Grupos – Por Grupo
  await tryShot(page, "grupos-by-group", async () => {
    await page.getByRole("button", { name: "Por Grupo" }).click();
    await page.waitForTimeout(1000);
    await shot(page, "grupos-by-group");
    throw new Error("skip");
  });

  // Leaderboard
  await clickMainTab(page, "Tabla");
  await shot(page, "leaderboard");

  // Modal de compartir tabla
  await tryShot(page, "leaderboard-share", async () => {
    const btn = page.getByRole("button", { name: /compartir tabla/i });
    await btn.waitFor({ timeout: 3000 });
    await btn.click();
    await page.waitForTimeout(2000); // html-to-image tarda un poco
    await shot(page, "leaderboard-share");
    throw new Error("skip");
  });

  await ctx.close();
}

// ─────────────────────────────────────────────
// 3. VISTA ADMIN
// ─────────────────────────────────────────────
console.log("\n3. Vistas de admin...");
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();

  await login(page, ADMIN);

  // Tab Resultados – Ingresar Resultados (sub-tab por defecto)
  await clickMainTab(page, "Resultados");
  await shot(page, "results-enter");

  // Botón Sincronizar – scroll al top para que sea visible
  await tryShot(page, "results-sync", async () => {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(300);
    const btn = page.getByRole("button", { name: /sincronizar/i });
    await btn.scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
    const box = await btn.boundingBox();
    if (!box) throw new Error("sin bbox");
    await page.screenshot({
      path: p("results-sync"),
      clip: { x: 0, y: Math.max(0, box.y - 12), width: 1280, height: box.height + 24 },
    });
    console.log("  ✓ results-sync.png");
    throw new Error("skip");
  });

  // Modal de compartir un partido
  await tryShot(page, "results-share-modal", async () => {
    // Botón Compartir (Share2 icon) en la primera fila de partido
    const shareBtns = page.locator("button[title*='ompartir'], button[aria-label*='ompartir']");
    const count = await shareBtns.count();
    if (count === 0) throw new Error("no hay botones de compartir");
    await shareBtns.first().click();
    await page.waitForTimeout(2500); // html-to-image genera imagen
    await shot(page, "results-share-modal");
    // Cerrar modal
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
    throw new Error("skip");
  });

  // Cerrar el modal de compartir (click en backdrop o botón X)
  const modal = page.locator('.fixed.inset-0.z-50');
  if (await modal.isVisible().catch(() => false)) {
    // Intentar botón X (último botón en el modal)
    const xBtn = modal.locator('button').last();
    await xBtn.click().catch(() => {});
    await page.waitForTimeout(600);
  }
  // Si sigue abierto, forzar click en el overlay
  if (await modal.isVisible().catch(() => false)) {
    await page.mouse.click(10, 10); // click fuera del panel
    await page.waitForTimeout(600);
  }

  // Sub-tab Pronósticos
  await tryShot(page, "results-predictions", async () => {
    await page.getByRole("button", { name: "Pronósticos" }).click();
    await page.waitForTimeout(800);
    // Seleccionar primer jugador en el dropdown
    const sel = page.locator("select");
    await sel.waitFor({ timeout: 3000 });
    await sel.selectOption({ index: 1 });
    await page.waitForTimeout(1000);
    await shot(page, "results-predictions");
    throw new Error("skip");
  });

  await ctx.close();
}

await browser.close();
console.log("\n✅ Capturas guardadas en docs/img/screenshots/");
console.log("   Archivos:", join(OUT, "*.png"), "\n");
