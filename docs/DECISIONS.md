# Registro de Decisiones Arquitectónicas (ADR)

## ADR-001: Back y front separados vs monolito

**Contexto:** Se necesitan dos aplicaciones desplegables de forma independiente.
**Decisión:** Monorepo con `/api` (NestJS) y `/web` (Next.js) como apps separadas.
**Trade-off:** Más configuración inicial, pero permite escalar y desplegar cada pieza por separado. Un solo repo mantiene la simplicidad de entrega.

## ADR-002: NestJS vs Fastify

**Contexto:** Se requiere un framework backend con TypeScript.
**Decisión:** NestJS sobre Express. Módulos, inyección de dependencias y guards de auth vienen integrados.
**Trade-off:** Más boilerplate que Fastify puro, pero la estructura modular paga cuando se agrega la Parte 2 (servicio IA).

## ADR-003: Prisma vs Drizzle

**Contexto:** ORM para PostgreSQL con TypeScript.
**Decisión:** Prisma. Schema declarativo, migraciones automáticas, tipos generados.
**Trade-off:** Drizzle es más ligero y SQL-first, pero Prisma tiene mejor DX para prototipos rápidos y su schema sirve como documentación del modelo.

## ADR-004: PostgreSQL vs SQLite

**Contexto:** Base de datos para desarrollo y producción.
**Decisión:** PostgreSQL. Tipos `Decimal`, enums nativos, JSON, y es lo que correrá en producción (Railway/Render).
**Trade-off:** SQLite sería zero-config pero no soporta enums ni Decimal nativo, lo que forzaría workarounds.

## ADR-005: Señales determinísticas on-read vs materializadas

**Contexto:** Las señales de negocio (churn, expansión, prioridad) deben estar disponibles en el listado.
**Decisión:** Cálculo on-read en un módulo de dominio puro (`signals/`). No se persisten.
**Trade-off:** Con 40-80 empresas por KAM el cálculo es instantáneo. Materializar agregaría complejidad (jobs, invalidación) sin beneficio medible a esta escala.

## ADR-006: Columnas IA nullable desde el día 1

**Contexto:** La Parte 2 agregará health score, churn risk IA, summary y acciones recomendadas.
**Decisión:** Las columnas nacen NULL en el schema desde la Parte 1. La UI muestra un placeholder.
**Trade-off:** Schema ligeramente más ancho, pero evita una migración de schema al integrar la Parte 2. El costo es mínimo.
