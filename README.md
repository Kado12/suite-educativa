# Suite Educativa

Mega proyecto educativo que unifica:

- Intranet académica
- Matrículas y pagos
- Generador de horarios
- Asistencia docente
- Reportes
- Importaciones y exportaciones Excel
- Herramientas administrativas

## Stack

- Monorepo con pnpm + Turborepo
- Backend: NestJS
- Frontend: React + Vite + Tailwind
- Base de datos: MySQL + Prisma
- UI: Heroicons + paquete compartido `@suite/ui`

## Estructura
```text
suite-educativa/
├── apps/
│ ├── api/
│ └── web/
├── packages/
│ ├── database/
│ ├── shared/
│ └── ui/
├── docker-compose.yml
├── pnpm-workspace.yaml
└── turbo.json
```


## Requisitos

- Node.js 20+
- pnpm 9+
- Docker

## Instalación

```bash
pnpm install
docker compose up -d
pnpm db:migrate
pnpm db:seed
pnpm dev
```

## URLs locales
- Frontend: http://localhost:5173
- API: http://localhost:4000/api
- Swagger: http://localhost:4000/api/docs
- Health: http://localhost:4000/api/health

## Usuarios Iniciales
```text
ADMIN       -> admin@suite.edu / Admin2026!
INFORMATICO -> informatica@suite.edu / Info2026!
COORDINADOR -> coordinador@suite.edu / Coord2026!
SECRETARIA  -> secretaria@suite.edu / Secre2026!
```

## Roles Iniciales
- ADMIN: acceso total.
- INFORMATICO: acceso técnico total excepto crear, editar o eliminar usuarios.
- COORDINADOR: asistencia, validación académica y reportes.
- SECRETARIA: matrículas, alumnos y pagos.

## Estado
- Fase 0: Instalación base, monorepo, Docker, Prisma, seed inicial y apps mínimas.

## 🚀 Deploy

### Railway (Backend + MySQL)

1. Crear proyecto en [railway.app](https://railway.app) desde GitHub
2. Agregar servicio MySQL (generará `DATABASE_URL`)
3. Configurar variables de entorno de la API:
   - `PORT=4000`
   - `DATABASE_URL` (de Railway)
   - `JWT_SECRET` (genera uno seguro)
   - `JWT_EXPIRATION=7d`
   - `CORS_ORIGIN=https://tu-frontend.vercel.app`
   - `NODE_ENV=production`
4. Build config:
   - Root: `apps/api`
   - Build: `pnpm install && pnpm build`
   - Start: `node dist/main.js`
5. Ejecutar migraciones una vez:
   - pnpm exec prisma migrate deploy --schema=../../packages/database/prisma/schema.prisma
6. Ejecutar seed mínimo:
   - node seed.js

### Vercel (Frontend)

1. Crear proyecto en [vercel.com](https://vercel.com)
2. Framework: Vite
3. Root: `apps/web`
4. Build: `cd ../.. && pnpm install && pnpm --filter web run build`
5. Output: `dist`
6. Variables: `VITE_API_URL=https://tu-api.up.railway.app`
7. Deploy

### Primer acceso

- Login: `admin@suite.edu` / `Admin2026!`