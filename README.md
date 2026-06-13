# Xepelin Mini CRM — Prueba Técnica GE II (Parte 1)

Mini CRM interno para KAMs de una fintech de factoring/confirming B2B. Permite gestionar cartera de clientes con foco en retención, monetización y expansión, priorizando cuentas con señales determinísticas transparentes.

## Stack

| Capa | Tecnología | Deploy |
|------|-----------|--------|
| Backend | NestJS + TypeScript + Prisma + PostgreSQL | Railway / Render |
| Frontend | Next.js 14 (App Router) + Mantine v7 + Recharts | Vercel |
| Auth | NextAuth (Google OAuth) + JWT HS256 compartido | — |

## Requisitos

- Node.js >= 18
- Docker (para PostgreSQL local)
- npm

## Setup local

### 1. Clonar y configurar variables de entorno

```bash
git clone <repo-url> && cd xepelin
cp .env.example api/.env
cp .env.example web/.env.local
```

Edita `api/.env` y `web/.env.local` con tus valores. Para desarrollo rápido, `AUTH_MODE=mock` funciona sin Google OAuth.

### 2. Levantar PostgreSQL

```bash
docker compose up -d
```

### 3. API

```bash
cd api
npm install
npx prisma generate
npx prisma db push        # crea tablas (dev)
npm run seed               # datos sintéticos
npm run start:dev          # http://localhost:4000
```

### 4. Frontend

```bash
cd web
npm install
npm run dev                # http://localhost:3000
```

### 5. Verificar

- `GET http://localhost:4000/health` → `{ "status": "ok" }`
- Abre `http://localhost:3000` → login automático (modo mock) → listado de empresas

## Variables de entorno

| Variable | App | Descripción |
|----------|-----|-------------|
| `DATABASE_URL` | api | Connection string de PostgreSQL |
| `JWT_SECRET` | api, web | Secreto compartido para firmar/verificar JWT |
| `PORT` | api | Puerto del servidor (default: 4000) |
| `CORS_ORIGIN` | api | Origen permitido para CORS |
| `AUTH_MODE` | api, web | `mock` (sin Google) o `google` (OAuth real) |
| `NEXTAUTH_SECRET` | web | Secreto de NextAuth |
| `NEXTAUTH_URL` | web | URL base del frontend |
| `GOOGLE_CLIENT_ID` | web | Client ID de Google OAuth |
| `GOOGLE_CLIENT_SECRET` | web | Client Secret de Google OAuth |
| `NEXT_PUBLIC_API_URL` | web | URL de la API |
| `NEXT_PUBLIC_AUTH_MODE` | web | Modo de auth para el cliente |

## Seed

El seed crea 2 KAMs y 10 empresas con arquetipos de negocio variados:

| Arquetipo | Empresa | Señales esperadas |
|-----------|---------|-------------------|
| Churn evidente | Transportes Andinos SpA | HIGH risk, ALTA prioridad |
| Oportunidad SOW | Alimentos del Pacífico SA | Expansión, SOW bajo |
| Recurrente sana | Servicios Integrales del Norte | LOW risk, BAJA prioridad |
| Enrolado sin activar | Tech Solutions MX | Activación pendiente |
| Línea subutilizada | Distribuidora Central SA | Expansión, línea 20% |
| Mora reciente | Constructora Valparaíso SA | Mora activa, riesgo |
| Mono-producto | Agroindustrias del Sur SpA | Cross-sell candidato |
| Mid con leve caída | Logística Express MX | MEDIA prioridad |

KAM de demo: `maria@xepelin.com` / `maria123` (María González).

## Parte 2 — Enriquecimiento con IA (Gemini)

La IA calcula cuatro columnas por empresa: **`health_score`** (0-100),
**`churn_risk`** (LOW/MEDIUM/HIGH), **`summary`** y **`recommended_actions`**.

Las señales determinísticas (`signals/`) conviven con la IA: siguen ordenando y
filtrando la lista al instante (sin esperar al enriquecimiento) y se le pasan al
modelo como contexto. Una vez enriquecida la empresa, el `churn_risk` de la IA es
el oficial que se muestra en el detalle (con fallback a la señal determinística
hasta la primera corrida).

- **Modelo:** `gemini-2.5-flash` con salida JSON estructurada (`responseSchema`).
- **Módulo:** `api/src/enrichment/` (`GeminiService` + `EnrichmentService`).
- **Disparadores:**
  - **Cron** diario 06:00 (`@nestjs/schedule`) que re-enriquece empresas cuya data
    IA falta o tiene más de 20 h. Procesa secuencial con delay para respetar el
    rate limit del free tier; una empresa que falla no detiene el batch.
  - **Manual:** `POST /companies/:id/enrich` (JWT + ownership por `kamId`), usado
    por el botón "Regenerar" en el detalle de empresa.
- **Persistencia:** columnas `healthScore`, `churnRisk`, `aiSummary`,
  `recommendedActions`, `aiGeneratedAt` (ya existían en el schema desde la Parte 1
  — **sin migración**).
- **Sin API key:** si `GEMINI_API_KEY` está vacía, el enriquecimiento se desactiva
  (cron se omite, el endpoint responde 503) y la UI cae al resumen determinístico.

Probar manualmente:

```bash
TOKEN=$(curl -s -X POST localhost:4000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"maria@xepelin.com","password":"maria123"}' | jq -r .access_token)

curl -s -X POST localhost:4000/companies/<COMPANY_ID>/enrich \
  -H "Authorization: Bearer $TOKEN" | jq
```

## Deploy

### API (Railway / Render)

1. Conecta el repo, apunta a `/api` como root.
2. Build: `npm install && npx prisma generate && npm run build`
3. Start: `npm run start:prod`
4. Env vars: `DATABASE_URL`, `JWT_SECRET`, `PORT`, `CORS_ORIGIN`, `AUTH_MODE`
5. Post-deploy: `npx prisma db push && npm run seed`

### Frontend (Vercel)

1. Conecta el repo, apunta a `/web` como root.
2. Framework preset: Next.js (auto-detected).
3. Env vars: `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `NEXT_PUBLIC_API_URL`, `JWT_SECRET`, `AUTH_MODE`, `NEXT_PUBLIC_AUTH_MODE`, y opcionalmente `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`.
