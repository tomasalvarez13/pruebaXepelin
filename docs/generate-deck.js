const PptxGenJS = require("pptxgenjs");

const pptx = new PptxGenJS();
pptx.layout = "LAYOUT_WIDE"; // 13.333 x 7.5 in
pptx.author = "Xepelin · CRM KAMs";

// ── Design tokens ──────────────────────────────────────────────
const INK = "16182B";       // near-black (cover bg, headings)
const INDIGO = "4F46E5";    // primary accent
const INDIGO_L = "EEF2FF";  // tint
const ICE = "A5B4FC";       // light indigo (on dark)
const SLATE = "475569";     // body text
const MUTED = "94A3B8";     // captions / footer
const BORDER = "E2E8F0";    // hairlines
const PANEL = "F8FAFC";     // light panel fill
const WHITE = "FFFFFF";

// entity colors (data model)
const NAVY = "4338CA";
const CYAN = "0E7490";
const GREEN = "15803D";
const VIOLET = "7C3AED";
const RED = "DC2626";

const HEAD = "Calibri";
const BODY = "Calibri";
const MONO = "Consolas";

const MX = 0.7;             // left margin
const CW = 11.93;           // content width (13.333 - 2*0.7)

// ── Shared chrome ──────────────────────────────────────────────
function header(slide, num, title) {
  slide.addText(
    [
      { text: num, options: { color: INDIGO, bold: true } },
      { text: "   " + title, options: { color: INK, bold: true } },
    ],
    { x: MX, y: 0.45, w: CW, h: 0.7, fontSize: 28, fontFace: HEAD, margin: 0 }
  );
}

function footer(slide, page) {
  slide.addText("Mini CRM · KAMs", { x: MX, y: 7.02, w: 4, h: 0.3, fontSize: 9, color: MUTED, fontFace: BODY, margin: 0 });
  slide.addText(page + " / 05", { x: 13.333 - MX - 2, y: 7.02, w: 2, h: 0.3, fontSize: 9, color: MUTED, fontFace: BODY, align: "right", margin: 0 });
}

// =================================================================
// Slide 1 · Cover
// =================================================================
const s1 = pptx.addSlide();
s1.background = { color: INK };
// motif: indigo square marker
s1.addShape(pptx.ShapeType.roundRect, { x: MX, y: 2.15, w: 0.4, h: 0.4, fill: { color: INDIGO }, rectRadius: 0.06, line: { type: "none" } });
s1.addText("Mini CRM para KAMs", { x: MX, y: 2.75, w: 11, h: 1.2, fontSize: 46, bold: true, color: WHITE, fontFace: HEAD, margin: 0 });
s1.addText("Arquitectura, Stack y Decisiones de Producto", { x: MX, y: 3.95, w: 11, h: 0.6, fontSize: 21, color: ICE, fontFace: BODY, margin: 0 });
s1.addText("Prueba Técnica GE II — Part 1   ·   Junio 2026", { x: MX, y: 6.6, w: 11, h: 0.4, fontSize: 13, color: MUTED, fontFace: BODY, margin: 0 });

// =================================================================
// Slide 2 · 01 Arquitectura
// =================================================================
const s2 = pptx.addSlide();
s2.background = { color: WHITE };
header(s2, "01", "Diagrama de Arquitectura");

const layers = [
  { color: INDIGO, fill: INDIGO_L, label: "Frontend · Vercel",
    lines: ["Next.js 14 (App Router)", "Mantine v7 · Recharts", "AuthProvider (JWT + localStorage)", "TypeScript strict"] },
  { color: GREEN, fill: "F0FDF4", label: "Backend · Railway",
    lines: ["NestJS + Passport JWT", "Prisma 5 ORM", "Signals Engine (on-read)", "Bcrypt · ValidationPipe"] },
  { color: "C2410C", fill: "FFF7ED", label: "PostgreSQL · Railway",
    lines: ["Kam · Company", "Operation · Interaction", "Índices compuestos", "Decimal(14,2) financiero"] },
];

const gap = 0.55;
const cardW = (CW - 2 * gap) / 3;
const cardY = 1.65, cardH = 2.75;
layers.forEach((L, i) => {
  const x = MX + i * (cardW + gap);
  s2.addShape(pptx.ShapeType.roundRect, { x, y: cardY, w: cardW, h: cardH, fill: { color: WHITE }, line: { color: BORDER, width: 1 }, rectRadius: 0.08 });
  // top accent square + label
  s2.addShape(pptx.ShapeType.roundRect, { x: x + 0.3, y: cardY + 0.32, w: 0.24, h: 0.24, fill: { color: L.color }, rectRadius: 0.04, line: { type: "none" } });
  s2.addText(L.label, { x: x + 0.66, y: cardY + 0.26, w: cardW - 0.9, h: 0.4, fontSize: 14, bold: true, color: L.color, fontFace: HEAD, margin: 0 });
  s2.addText(L.lines.map((t) => ({ text: t, options: { bullet: { code: "2022", indent: 14 } } })), {
    x: x + 0.34, y: cardY + 0.95, w: cardW - 0.6, h: 1.6, fontSize: 12, color: SLATE, fontFace: BODY, lineSpacingMultiple: 1.35, margin: 0,
  });
});

// flow arrows
s2.addShape(pptx.ShapeType.rightArrow, { x: MX + cardW + 0.05, y: cardY + cardH / 2 - 0.13, w: gap - 0.1, h: 0.26, fill: { color: MUTED }, line: { type: "none" } });
s2.addShape(pptx.ShapeType.rightArrow, { x: MX + 2 * cardW + gap + 0.05, y: cardY + cardH / 2 - 0.13, w: gap - 0.1, h: 0.26, fill: { color: MUTED }, line: { type: "none" } });

// flow panel
const pY = 4.95;
s2.addShape(pptx.ShapeType.roundRect, { x: MX, y: pY, w: CW, h: 1.55, fill: { color: PANEL }, line: { color: BORDER, width: 1 }, rectRadius: 0.08 });
s2.addText("ENDPOINTS", { x: MX + 0.35, y: pY + 0.22, w: 4, h: 0.3, fontSize: 11, bold: true, color: INDIGO, charSpacing: 2, fontFace: HEAD, margin: 0 });
s2.addText("POST /auth/login → JWT    GET /me    GET /companies    GET /companies/:id    PATCH /companies/:id", {
  x: MX + 0.35, y: pY + 0.55, w: CW - 0.7, h: 0.35, fontSize: 11, color: SLATE, fontFace: MONO, margin: 0,
});
s2.addText("Login → JWT → Bearer → Guard valida → Service filtra por kamId → Signals computan → Response", {
  x: MX + 0.35, y: pY + 1.02, w: CW - 0.7, h: 0.35, fontSize: 11.5, italic: true, color: INDIGO, fontFace: BODY, margin: 0,
});
footer(s2, "01");

// =================================================================
// Slide 3 · 02 Stack
// =================================================================
const s3 = pptx.addSlide();
s3.background = { color: WHITE };
header(s3, "02", "Stack Elegido");

const stackData = [
  ["Frontend", "Next.js 14 (App Router)", "Server components, file-based routing, deploy instantáneo en Vercel"],
  ["UI", "Mantine v7 + CSS custom", "Componentes accesibles, diseño premium estilo Stripe / Linear"],
  ["Charts", "Recharts", "Declarativa y liviana, ideal para el AreaChart de volumen"],
  ["Backend", "NestJS + TypeScript", "Framework opinado: DI, módulos, guards y pipes"],
  ["Auth", "JWT + Passport + bcrypt", "Stateless, hash de passwords, guard protege cada endpoint"],
  ["ORM", "Prisma 5", "Queries type-safe, migraciones declarativas"],
  ["DB", "PostgreSQL", "ACID, Decimal(14,2), enums, índices compuestos"],
  ["Deploy", "Railway + Vercel", "Deploy desde GitHub, zero-config"],
];

const headOpts = { fill: { color: INDIGO }, color: WHITE, bold: true, fontSize: 13, fontFace: HEAD, valign: "middle", margin: [4, 8, 4, 8] };
const rows = [[
  { text: "Capa", options: headOpts },
  { text: "Tecnología", options: headOpts },
  { text: "Por qué", options: headOpts },
]];
stackData.forEach((r, i) => {
  const fill = i % 2 === 0 ? WHITE : PANEL;
  rows.push([
    { text: r[0], options: { fill: { color: fill }, color: INK, bold: true, fontSize: 12.5, fontFace: HEAD, valign: "middle", margin: [4, 8, 4, 8] } },
    { text: r[1], options: { fill: { color: fill }, color: INDIGO, fontSize: 12, fontFace: BODY, valign: "middle", margin: [4, 8, 4, 8] } },
    { text: r[2], options: { fill: { color: fill }, color: SLATE, fontSize: 12, fontFace: BODY, valign: "middle", margin: [4, 8, 4, 8] } },
  ]);
});

s3.addTable(rows, {
  x: MX, y: 1.65, w: CW,
  colW: [1.7, 3.4, CW - 5.1],
  rowH: [0.5, ...Array(8).fill(0.55)],
  border: { type: "solid", pt: 0.5, color: BORDER },
  autoPage: false,
});
footer(s3, "02");

// =================================================================
// Slide 4 · 03 Modelo de Datos (ER diagram)
// =================================================================
const s4 = pptx.addSlide();
s4.background = { color: WHITE };
header(s4, "03", "Modelo de Datos");

function entity(slide, x, y, w, headerColor, title, fields) {
  const rowH = 0.275;
  const h = 0.5 + fields.length * rowH + 0.12;
  slide.addShape(pptx.ShapeType.roundRect, { x, y, w, h, fill: { color: WHITE }, line: { color: headerColor, width: 1.25 }, rectRadius: 0.06 });
  slide.addShape(pptx.ShapeType.roundRect, { x, y, w, h: 0.46, fill: { color: headerColor }, rectRadius: 0.06, line: { type: "none" } });
  slide.addShape(pptx.ShapeType.rect, { x, y: y + 0.23, w, h: 0.23, fill: { color: headerColor }, line: { type: "none" } });
  slide.addText(title, { x: x + 0.16, y: y + 0.04, w: w - 0.3, h: 0.4, fontSize: 14, bold: true, color: WHITE, fontFace: HEAD, valign: "middle", margin: 0 });
  let fy = y + 0.56;
  for (const [name, type, kind] of fields) {
    let nameColor = "334155", bold = false;
    if (kind === "pk") { nameColor = headerColor; bold = true; }
    if (kind === "fk") { nameColor = RED; bold = true; }
    if (kind === "rel") { nameColor = MUTED; }
    slide.addText(name, { x: x + 0.16, y: fy, w: w * 0.52, h: rowH, fontSize: 9.5, bold, italic: kind === "rel", color: nameColor, fontFace: BODY, valign: "middle", margin: 0 });
    if (type) slide.addText(type, { x: x + w * 0.52, y: fy, w: w * 0.46, h: rowH, fontSize: 9.5, color: MUTED, fontFace: BODY, valign: "middle", margin: 0 });
    fy += rowH;
  }
  return { x, y, w, h, cy: y + h / 2 };
}

const kam = entity(s4, MX, 1.95, 2.45, NAVY, "Kam", [
  ["id", "cuid PK", "pk"],
  ["name", "String", ""],
  ["email", "String unique", ""],
  ["password", "String (bcrypt)", ""],
  ["createdAt", "DateTime", ""],
  ["→ companies[]", "", "rel"],
]);

const compX = 3.85, compW = 3.55, compY = 1.45;
const comp = entity(s4, compX, compY, compW, CYAN, "Company", [
  ["id", "cuid PK", "pk"],
  ["kamId", "FK → Kam", "fk"],
  ["legalName", "String", ""],
  ["taxId", "String unique", ""],
  ["industry / country", "String · CL|MX", ""],
  ["segment", "PYME|MID|CORP", ""],
  ["lifecycleStage", "Enum", ""],
  ["status", "String", ""],
  ["creditLineApproved", "Decimal", ""],
  ["creditLineUsed", "Decimal", ""],
  ["monthlyBilling", "Decimal", ""],
  ["notes", "Text?", ""],
  ["onboardedAt", "DateTime", ""],
  ["→ operations[] · interactions[]", "", "rel"],
]);

const opX = 8.85, opW = 3.05;
const op = entity(s4, opX, 1.55, opW, GREEN, "Operation", [
  ["id", "cuid PK", "pk"],
  ["companyId", "FK → Company", "fk"],
  ["type", "FACT|CONF|PAGO", ""],
  ["amount", "Decimal(14,2)", ""],
  ["date / status", "DateTime / Enum", ""],
  ["daysPastDue", "Int", ""],
]);

const intr = entity(s4, opX, 4.05, opW, VIOLET, "Interaction", [
  ["id", "cuid PK", "pk"],
  ["companyId", "FK → Company", "fk"],
  ["channel", "WA|CALL|EMAIL", ""],
  ["date", "DateTime", ""],
  ["summary", "Text", ""],
]);

// connectors with 1:N labels
function connect(slide, ax, ay, bx, color) {
  slide.addShape(pptx.ShapeType.line, { x: ax, y: ay, w: bx - ax, h: 0, line: { color: MUTED, width: 1.75, endArrowType: "triangle" } });
  slide.addText("1:N", { x: ax + (bx - ax) / 2 - 0.25, y: ay - 0.32, w: 0.5, h: 0.28, fontSize: 9.5, bold: true, color, fontFace: HEAD, align: "center", margin: 0 });
}
connect(s4, kam.x + kam.w, kam.cy, compX, INDIGO);
connect(s4, compX + compW, op.cy, opX, GREEN);
connect(s4, compX + compW, intr.cy, opX, VIOLET);

// index note
s4.addShape(pptx.ShapeType.roundRect, { x: MX, y: 6.55, w: CW, h: 0.4, fill: { color: PANEL }, line: { color: BORDER, width: 0.75 }, rectRadius: 0.05 });
s4.addText("@@index([kamId])   ·   @@index([companyId, date])   ·   Decimal(14,2) para todos los montos financieros", {
  x: MX + 0.25, y: 6.55, w: CW - 0.5, h: 0.4, fontSize: 10, color: SLATE, fontFace: MONO, valign: "middle", margin: 0,
});

// =================================================================
// Slide 5 · 04 Decisiones de Producto
// =================================================================
const s5 = pptx.addSlide();
s5.background = { color: WHITE };
header(s5, "04", "Decisiones de Producto");

const decisions = [
  ["Dashboard con KPIs + tabla", "Visión rápida de toda la cartera del KAM en una pantalla"],
  ["Señales determinísticas on-read", "Churn, expansión y prioridad: auditables y reproducibles"],
  ["AI Summary por reglas", "Simula un LLM de forma determinística, sin costos de API"],
  ["Aislamiento por KAM con JWT", "Cada KAM solo ve sus empresas; guard en cada endpoint"],
  ["Gráfico de volumen 12 meses", "Tendencias visuales para detectar caídas de actividad"],
  ["Notas + timeline de interacciones", "CRM accionable, no solo un dashboard de métricas"],
  ["Diseño premium CSS-first", "Stripe / Linear / Mercury como referencia visual"],
];

let dy = 1.7;
const dRowH = 0.72;
decisions.forEach(([t, d]) => {
  s5.addShape(pptx.ShapeType.roundRect, { x: MX, y: dy + 0.06, w: 0.26, h: 0.26, fill: { color: INDIGO }, rectRadius: 0.04, line: { type: "none" } });
  s5.addText(t, { x: MX + 0.5, y: dy, w: 4.9, h: 0.4, fontSize: 14, bold: true, color: INK, fontFace: HEAD, margin: 0 });
  s5.addText(d, { x: MX + 5.5, y: dy, w: CW - 5.5, h: 0.4, fontSize: 12.5, color: SLATE, fontFace: BODY, margin: 0 });
  if (dy + dRowH < 6.4) {
    s5.addShape(pptx.ShapeType.line, { x: MX, y: dy + dRowH - 0.16, w: CW, h: 0, line: { color: BORDER, width: 0.5 } });
  }
  dy += dRowH;
});
footer(s5, "04");

// =================================================================
// Slide 6 · 05 Qué Dejamos Fuera
// =================================================================
const s6 = pptx.addSlide();
s6.background = { color: WHITE };
header(s6, "05", "Qué Dejamos Fuera y Por Qué");

const stateColor = {
  "Part 2": INDIGO, "Deliberado": SLATE, "Simplificado": "B45309",
  "Fuera": RED, "Innecesario": MUTED, "Parcial": CYAN,
};
const leftOut = [
  ["Resumen con LLM real", "Part 2", "Schema ya listo con campos aiSummary / recommendedActions"],
  ["CRUD de interacciones", "Deliberado", "Se priorizó el motor de señales y el pulido visual"],
  ["Refresh token", "Simplificado", "Token de 8h es suficiente para una prueba técnica"],
  ["Tests unitarios / e2e", "Fuera", "Se priorizó feature-completeness sobre cobertura"],
  ["Paginación", "Innecesario", "~5-6 empresas por KAM, no hace falta"],
  ["Búsqueda por texto", "Deliberado", "Los filtros existentes cubren carteras de ~10 empresas"],
  ["Responsive mobile", "Parcial", "El KAM trabaja principalmente desde laptop"],
];

const hOpt = { fill: { color: INK }, color: WHITE, bold: true, fontSize: 12.5, fontFace: HEAD, valign: "middle", margin: [4, 8, 4, 8] };
const loRows = [[
  { text: "Feature", options: hOpt },
  { text: "Estado", options: hOpt },
  { text: "Razón", options: hOpt },
]];
leftOut.forEach((r, i) => {
  const fill = i % 2 === 0 ? WHITE : PANEL;
  loRows.push([
    { text: r[0], options: { fill: { color: fill }, color: INK, bold: true, fontSize: 12, fontFace: HEAD, valign: "middle", margin: [4, 8, 4, 8] } },
    { text: r[1], options: { fill: { color: fill }, color: stateColor[r[1]] || SLATE, bold: true, fontSize: 12, fontFace: BODY, valign: "middle", margin: [4, 8, 4, 8] } },
    { text: r[2], options: { fill: { color: fill }, color: SLATE, fontSize: 12, fontFace: BODY, valign: "middle", margin: [4, 8, 4, 8] } },
  ]);
});

s6.addTable(loRows, {
  x: MX, y: 1.65, w: CW,
  colW: [3.1, 2.0, CW - 5.1],
  rowH: [0.5, ...Array(7).fill(0.55)],
  border: { type: "solid", pt: 0.5, color: BORDER },
  autoPage: false,
});

s6.addShape(pptx.ShapeType.roundRect, { x: MX, y: 6.35, w: CW, h: 0.55, fill: { color: INDIGO_L }, rectRadius: 0.06, line: { type: "none" } });
s6.addText("Se priorizó lo que demuestra criterio de producto por sobre la completitud técnica.", {
  x: MX, y: 6.35, w: CW, h: 0.55, fontSize: 12.5, italic: true, bold: true, color: INDIGO, fontFace: BODY, align: "center", valign: "middle", margin: 0,
});
footer(s6, "05");

// ── Save ───────────────────────────────────────────────────────
const outPath = "/Users/pilarlioi/Desktop/xepelin/docs/xepelin-crm-deck.pptx";
pptx.writeFile({ fileName: outPath }).then(() => console.log("OK: " + outPath));
