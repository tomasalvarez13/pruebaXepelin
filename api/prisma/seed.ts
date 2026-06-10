import { PrismaClient, Country, Segment, Lifecycle, OperationType, OperationStatus, InteractionChannel } from '@prisma/client';

const prisma = new PrismaClient();

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(12, 0, 0, 0);
  return d;
}

async function main() {
  await prisma.interaction.deleteMany();
  await prisma.operation.deleteMany();
  await prisma.company.deleteMany();
  await prisma.kam.deleteMany();

  const kam1 = await prisma.kam.create({
    data: { name: 'María González', email: 'demo@xepelin.com' },
  });
  const kam2 = await prisma.kam.create({
    data: { name: 'Carlos Mendoza', email: 'carlos@xepelin.com' },
  });

  // 1. Churn evidente — Kam1
  const c1 = await prisma.company.create({
    data: {
      kamId: kam1.id,
      legalName: 'Transportes Andinos SpA',
      taxId: '76.123.456-7',
      industry: 'Transporte',
      country: Country.CL,
      segment: Segment.MIDMARKET,
      lifecycleStage: Lifecycle.RECURRENTE,
      onboardedAt: daysAgo(365),
      creditLineApproved: 500_000,
      creditLineUsed: 380_000,
      monthlyBilling: 2_000_000,
    },
  });
  await prisma.operation.createMany({
    data: [
      { companyId: c1.id, type: OperationType.FACTORING, amount: 120_000, date: daysAgo(150), status: OperationStatus.PAGADA, daysPastDue: 0 },
      { companyId: c1.id, type: OperationType.FACTORING, amount: 135_000, date: daysAgo(130), status: OperationStatus.PAGADA, daysPastDue: 0 },
      { companyId: c1.id, type: OperationType.FACTORING, amount: 110_000, date: daysAgo(110), status: OperationStatus.PAGADA, daysPastDue: 0 },
      { companyId: c1.id, type: OperationType.FACTORING, amount: 60_000, date: daysAgo(80), status: OperationStatus.PAGADA, daysPastDue: 0 },
      { companyId: c1.id, type: OperationType.FACTORING, amount: 50_000, date: daysAgo(60), status: OperationStatus.PAGADA, daysPastDue: 0 },
      { companyId: c1.id, type: OperationType.FACTORING, amount: 25_000, date: daysAgo(48), status: OperationStatus.VENCIDA, daysPastDue: 15 },
    ],
  });
  await prisma.interaction.createMany({
    data: [
      { companyId: c1.id, channel: InteractionChannel.CALL, date: daysAgo(90), summary: 'Cliente mencionó problemas de flujo de caja por baja en contratos.' },
      { companyId: c1.id, channel: InteractionChannel.EMAIL, date: daysAgo(60), summary: 'Se envió propuesta de reestructuración de línea, sin respuesta.' },
      { companyId: c1.id, channel: InteractionChannel.WHATSAPP, date: daysAgo(45), summary: 'Mensaje leído pero no respondido.' },
    ],
  });

  // 2. Oportunidad SOW — Kam1
  const c2 = await prisma.company.create({
    data: {
      kamId: kam1.id,
      legalName: 'Alimentos del Pacífico SA',
      taxId: '77.654.321-0',
      industry: 'Alimentos',
      country: Country.CL,
      segment: Segment.CORPORATE,
      lifecycleStage: Lifecycle.ACTIVO,
      onboardedAt: daysAgo(200),
      creditLineApproved: 2_000_000,
      creditLineUsed: 600_000,
      monthlyBilling: 8_000_000,
    },
  });
  await prisma.operation.createMany({
    data: [
      { companyId: c2.id, type: OperationType.FACTORING, amount: 180_000, date: daysAgo(160), status: OperationStatus.PAGADA, daysPastDue: 0 },
      { companyId: c2.id, type: OperationType.FACTORING, amount: 200_000, date: daysAgo(130), status: OperationStatus.PAGADA, daysPastDue: 0 },
      { companyId: c2.id, type: OperationType.FACTORING, amount: 190_000, date: daysAgo(70), status: OperationStatus.PAGADA, daysPastDue: 0 },
      { companyId: c2.id, type: OperationType.FACTORING, amount: 210_000, date: daysAgo(50), status: OperationStatus.PAGADA, daysPastDue: 0 },
      { companyId: c2.id, type: OperationType.FACTORING, amount: 195_000, date: daysAgo(30), status: OperationStatus.PAGADA, daysPastDue: 0 },
      { companyId: c2.id, type: OperationType.FACTORING, amount: 220_000, date: daysAgo(10), status: OperationStatus.PENDIENTE, daysPastDue: 0 },
    ],
  });
  await prisma.interaction.createMany({
    data: [
      { companyId: c2.id, channel: InteractionChannel.MEETING, date: daysAgo(30), summary: 'Reunión trimestral. Cliente satisfecho, preguntó por confirming.' },
      { companyId: c2.id, channel: InteractionChannel.EMAIL, date: daysAgo(15), summary: 'Envío de información sobre producto confirming.' },
      { companyId: c2.id, channel: InteractionChannel.CALL, date: daysAgo(5), summary: 'Seguimiento confirming, cliente evaluando internamente.' },
    ],
  });

  // 3. Recurrente sana — Kam1
  const c3 = await prisma.company.create({
    data: {
      kamId: kam1.id,
      legalName: 'Servicios Integrales del Norte Ltda',
      taxId: '78.111.222-3',
      industry: 'Servicios profesionales',
      country: Country.CL,
      segment: Segment.PYME,
      lifecycleStage: Lifecycle.RECURRENTE,
      onboardedAt: daysAgo(540),
      creditLineApproved: 200_000,
      creditLineUsed: 140_000,
      monthlyBilling: 600_000,
    },
  });
  await prisma.operation.createMany({
    data: [
      { companyId: c3.id, type: OperationType.FACTORING, amount: 45_000, date: daysAgo(150), status: OperationStatus.PAGADA, daysPastDue: 0 },
      { companyId: c3.id, type: OperationType.CONFIRMING, amount: 30_000, date: daysAgo(120), status: OperationStatus.PAGADA, daysPastDue: 0 },
      { companyId: c3.id, type: OperationType.FACTORING, amount: 50_000, date: daysAgo(80), status: OperationStatus.PAGADA, daysPastDue: 0 },
      { companyId: c3.id, type: OperationType.CONFIRMING, amount: 35_000, date: daysAgo(50), status: OperationStatus.PAGADA, daysPastDue: 0 },
      { companyId: c3.id, type: OperationType.FACTORING, amount: 48_000, date: daysAgo(25), status: OperationStatus.PAGADA, daysPastDue: 0 },
      { companyId: c3.id, type: OperationType.CONFIRMING, amount: 32_000, date: daysAgo(8), status: OperationStatus.PENDIENTE, daysPastDue: 0 },
    ],
  });
  await prisma.interaction.createMany({
    data: [
      { companyId: c3.id, channel: InteractionChannel.WHATSAPP, date: daysAgo(25), summary: 'Consulta sobre fechas de próximo giro.' },
      { companyId: c3.id, channel: InteractionChannel.CALL, date: daysAgo(10), summary: 'Revisión de condiciones, cliente conforme.' },
      { companyId: c3.id, channel: InteractionChannel.EMAIL, date: daysAgo(3), summary: 'Confirmación de documentos para nueva operación.' },
    ],
  });

  // 4. Enrolado sin activar — Kam1
  const c4 = await prisma.company.create({
    data: {
      kamId: kam1.id,
      legalName: 'Tech Solutions MX SA de CV',
      taxId: 'TSM200315AB1',
      industry: 'Tecnología',
      country: Country.MX,
      segment: Segment.PYME,
      lifecycleStage: Lifecycle.ENROLADO,
      onboardedAt: daysAgo(20),
      creditLineApproved: 300_000,
      creditLineUsed: 0,
      monthlyBilling: 1_200_000,
    },
  });
  await prisma.interaction.createMany({
    data: [
      { companyId: c4.id, channel: InteractionChannel.MEETING, date: daysAgo(20), summary: 'Reunión de onboarding. Se explicaron productos.' },
      { companyId: c4.id, channel: InteractionChannel.EMAIL, date: daysAgo(15), summary: 'Envío de documentación para primera operación.' },
      { companyId: c4.id, channel: InteractionChannel.WHATSAPP, date: daysAgo(7), summary: 'Seguimiento, cliente dice que está revisando internamente.' },
    ],
  });

  // 5. Línea subutilizada — Kam1
  const c5 = await prisma.company.create({
    data: {
      kamId: kam1.id,
      legalName: 'Distribuidora Central SA',
      taxId: '79.333.444-5',
      industry: 'Distribución',
      country: Country.CL,
      segment: Segment.MIDMARKET,
      lifecycleStage: Lifecycle.ACTIVO,
      onboardedAt: daysAgo(300),
      creditLineApproved: 1_000_000,
      creditLineUsed: 200_000,
      monthlyBilling: 3_000_000,
    },
  });
  await prisma.operation.createMany({
    data: [
      { companyId: c5.id, type: OperationType.FACTORING, amount: 80_000, date: daysAgo(140), status: OperationStatus.PAGADA, daysPastDue: 0 },
      { companyId: c5.id, type: OperationType.FACTORING, amount: 90_000, date: daysAgo(100), status: OperationStatus.PAGADA, daysPastDue: 0 },
      { companyId: c5.id, type: OperationType.FACTORING, amount: 85_000, date: daysAgo(70), status: OperationStatus.PAGADA, daysPastDue: 0 },
      { companyId: c5.id, type: OperationType.FACTORING, amount: 95_000, date: daysAgo(45), status: OperationStatus.PAGADA, daysPastDue: 0 },
      { companyId: c5.id, type: OperationType.FACTORING, amount: 100_000, date: daysAgo(20), status: OperationStatus.PAGADA, daysPastDue: 0 },
      { companyId: c5.id, type: OperationType.FACTORING, amount: 88_000, date: daysAgo(5), status: OperationStatus.PENDIENTE, daysPastDue: 0 },
    ],
  });
  await prisma.interaction.createMany({
    data: [
      { companyId: c5.id, channel: InteractionChannel.CALL, date: daysAgo(45), summary: 'Revisión de utilización de línea. Cliente usa solo factoring.' },
      { companyId: c5.id, channel: InteractionChannel.EMAIL, date: daysAgo(20), summary: 'Propuesta de incremento de uso de línea.' },
      { companyId: c5.id, channel: InteractionChannel.MEETING, date: daysAgo(5), summary: 'Reunión para explorar confirming como complemento.' },
    ],
  });

  // 6. Mora reciente — Kam1
  const c6 = await prisma.company.create({
    data: {
      kamId: kam1.id,
      legalName: 'Constructora Valparaíso SA',
      taxId: '80.555.666-7',
      industry: 'Construcción',
      country: Country.CL,
      segment: Segment.MIDMARKET,
      lifecycleStage: Lifecycle.RECURRENTE,
      onboardedAt: daysAgo(400),
      creditLineApproved: 800_000,
      creditLineUsed: 650_000,
      monthlyBilling: 4_000_000,
    },
  });
  await prisma.operation.createMany({
    data: [
      { companyId: c6.id, type: OperationType.FACTORING, amount: 150_000, date: daysAgo(140), status: OperationStatus.PAGADA, daysPastDue: 0 },
      { companyId: c6.id, type: OperationType.CONFIRMING, amount: 100_000, date: daysAgo(110), status: OperationStatus.PAGADA, daysPastDue: 0 },
      { companyId: c6.id, type: OperationType.FACTORING, amount: 160_000, date: daysAgo(75), status: OperationStatus.PAGADA, daysPastDue: 0 },
      { companyId: c6.id, type: OperationType.FACTORING, amount: 140_000, date: daysAgo(50), status: OperationStatus.PAGADA, daysPastDue: 0 },
      { companyId: c6.id, type: OperationType.CONFIRMING, amount: 120_000, date: daysAgo(30), status: OperationStatus.VENCIDA, daysPastDue: 22 },
      { companyId: c6.id, type: OperationType.FACTORING, amount: 95_000, date: daysAgo(15), status: OperationStatus.VENCIDA, daysPastDue: 8 },
    ],
  });
  await prisma.interaction.createMany({
    data: [
      { companyId: c6.id, channel: InteractionChannel.CALL, date: daysAgo(30), summary: 'Alerta de mora, cliente pidió plazo extra.' },
      { companyId: c6.id, channel: InteractionChannel.WHATSAPP, date: daysAgo(15), summary: 'Recordatorio de pago pendiente.' },
      { companyId: c6.id, channel: InteractionChannel.CALL, date: daysAgo(5), summary: 'Cliente comprometió pago parcial para esta semana.' },
    ],
  });

  // 7. Mono-producto — Kam2
  const c7 = await prisma.company.create({
    data: {
      kamId: kam2.id,
      legalName: 'Agroindustrias del Sur SpA',
      taxId: '81.777.888-9',
      industry: 'Agroindustria',
      country: Country.CL,
      segment: Segment.PYME,
      lifecycleStage: Lifecycle.ACTIVO,
      onboardedAt: daysAgo(250),
      creditLineApproved: 400_000,
      creditLineUsed: 280_000,
      monthlyBilling: 1_500_000,
    },
  });
  await prisma.operation.createMany({
    data: [
      { companyId: c7.id, type: OperationType.FACTORING, amount: 70_000, date: daysAgo(160), status: OperationStatus.PAGADA, daysPastDue: 0 },
      { companyId: c7.id, type: OperationType.FACTORING, amount: 75_000, date: daysAgo(120), status: OperationStatus.PAGADA, daysPastDue: 0 },
      { companyId: c7.id, type: OperationType.FACTORING, amount: 80_000, date: daysAgo(80), status: OperationStatus.PAGADA, daysPastDue: 0 },
      { companyId: c7.id, type: OperationType.FACTORING, amount: 72_000, date: daysAgo(50), status: OperationStatus.PAGADA, daysPastDue: 0 },
      { companyId: c7.id, type: OperationType.FACTORING, amount: 85_000, date: daysAgo(25), status: OperationStatus.PAGADA, daysPastDue: 0 },
      { companyId: c7.id, type: OperationType.FACTORING, amount: 78_000, date: daysAgo(7), status: OperationStatus.PENDIENTE, daysPastDue: 0 },
    ],
  });
  await prisma.interaction.createMany({
    data: [
      { companyId: c7.id, channel: InteractionChannel.CALL, date: daysAgo(50), summary: 'Revisión de cuenta, cliente solo usa factoring.' },
      { companyId: c7.id, channel: InteractionChannel.EMAIL, date: daysAgo(25), summary: 'Material informativo sobre confirming y pago a proveedores.' },
      { companyId: c7.id, channel: InteractionChannel.WHATSAPP, date: daysAgo(7), summary: 'Confirmación de operación nueva.' },
    ],
  });

  // 8. Mid sano con leve caída — Kam2
  const c8 = await prisma.company.create({
    data: {
      kamId: kam2.id,
      legalName: 'Logística Express MX SA de CV',
      taxId: 'LEM180921CD3',
      industry: 'Logística',
      country: Country.MX,
      segment: Segment.MIDMARKET,
      lifecycleStage: Lifecycle.RECURRENTE,
      onboardedAt: daysAgo(450),
      creditLineApproved: 600_000,
      creditLineUsed: 350_000,
      monthlyBilling: 2_500_000,
    },
  });
  await prisma.operation.createMany({
    data: [
      { companyId: c8.id, type: OperationType.FACTORING, amount: 130_000, date: daysAgo(160), status: OperationStatus.PAGADA, daysPastDue: 0 },
      { companyId: c8.id, type: OperationType.CONFIRMING, amount: 90_000, date: daysAgo(130), status: OperationStatus.PAGADA, daysPastDue: 0 },
      { companyId: c8.id, type: OperationType.FACTORING, amount: 120_000, date: daysAgo(100), status: OperationStatus.PAGADA, daysPastDue: 0 },
      { companyId: c8.id, type: OperationType.FACTORING, amount: 100_000, date: daysAgo(65), status: OperationStatus.PAGADA, daysPastDue: 0 },
      { companyId: c8.id, type: OperationType.CONFIRMING, amount: 80_000, date: daysAgo(40), status: OperationStatus.PAGADA, daysPastDue: 0 },
      { companyId: c8.id, type: OperationType.FACTORING, amount: 95_000, date: daysAgo(12), status: OperationStatus.PENDIENTE, daysPastDue: 0 },
    ],
  });
  await prisma.interaction.createMany({
    data: [
      { companyId: c8.id, channel: InteractionChannel.MEETING, date: daysAgo(60), summary: 'QBR. Mencionaron reducción temporal de operaciones por reestructuración.' },
      { companyId: c8.id, channel: InteractionChannel.CALL, date: daysAgo(30), summary: 'Seguimiento post-QBR, reestructuración en curso.' },
      { companyId: c8.id, channel: InteractionChannel.EMAIL, date: daysAgo(10), summary: 'Nueva operación programada, retomando volumen.' },
    ],
  });

  // 9. Extra: Buena cuenta MX — Kam2
  const c9 = await prisma.company.create({
    data: {
      kamId: kam2.id,
      legalName: 'Manufacturas Industriales MX SA de CV',
      taxId: 'MIM190507EF2',
      industry: 'Manufactura',
      country: Country.MX,
      segment: Segment.CORPORATE,
      lifecycleStage: Lifecycle.RECURRENTE,
      onboardedAt: daysAgo(600),
      creditLineApproved: 1_500_000,
      creditLineUsed: 900_000,
      monthlyBilling: 5_000_000,
    },
  });
  await prisma.operation.createMany({
    data: [
      { companyId: c9.id, type: OperationType.FACTORING, amount: 200_000, date: daysAgo(150), status: OperationStatus.PAGADA, daysPastDue: 0 },
      { companyId: c9.id, type: OperationType.CONFIRMING, amount: 150_000, date: daysAgo(120), status: OperationStatus.PAGADA, daysPastDue: 0 },
      { companyId: c9.id, type: OperationType.FACTORING, amount: 220_000, date: daysAgo(80), status: OperationStatus.PAGADA, daysPastDue: 0 },
      { companyId: c9.id, type: OperationType.CONFIRMING, amount: 180_000, date: daysAgo(55), status: OperationStatus.PAGADA, daysPastDue: 0 },
      { companyId: c9.id, type: OperationType.FACTORING, amount: 240_000, date: daysAgo(30), status: OperationStatus.PAGADA, daysPastDue: 0 },
      { companyId: c9.id, type: OperationType.PAGO, amount: 50_000, date: daysAgo(20), status: OperationStatus.PAGADA, daysPastDue: 0 },
      { companyId: c9.id, type: OperationType.FACTORING, amount: 210_000, date: daysAgo(8), status: OperationStatus.PENDIENTE, daysPastDue: 0 },
    ],
  });
  await prisma.interaction.createMany({
    data: [
      { companyId: c9.id, channel: InteractionChannel.MEETING, date: daysAgo(55), summary: 'Reunión ejecutiva, se amplió línea de crédito.' },
      { companyId: c9.id, channel: InteractionChannel.CALL, date: daysAgo(30), summary: 'Activación de producto pago a proveedores.' },
      { companyId: c9.id, channel: InteractionChannel.EMAIL, date: daysAgo(8), summary: 'Confirmación nueva operación factoring.' },
    ],
  });

  // 10. Enrolado MX con actividad mínima — Kam2
  const c10 = await prisma.company.create({
    data: {
      kamId: kam2.id,
      legalName: 'Comercializadora Norteña SA de CV',
      taxId: 'CNO210812GH4',
      industry: 'Comercio',
      country: Country.MX,
      segment: Segment.PYME,
      lifecycleStage: Lifecycle.ENROLADO,
      onboardedAt: daysAgo(15),
      creditLineApproved: 250_000,
      creditLineUsed: 0,
      monthlyBilling: 800_000,
    },
  });
  await prisma.interaction.createMany({
    data: [
      { companyId: c10.id, channel: InteractionChannel.MEETING, date: daysAgo(15), summary: 'Reunión de bienvenida, se explicaron beneficios de factoring.' },
      { companyId: c10.id, channel: InteractionChannel.WHATSAPP, date: daysAgo(8), summary: 'Envío de tutorial para primera operación.' },
      { companyId: c10.id, channel: InteractionChannel.CALL, date: daysAgo(3), summary: 'Seguimiento, cliente planea primera operación próxima semana.' },
    ],
  });

  console.log('Seed completed: 2 KAMs, 10 companies with operations and interactions.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
