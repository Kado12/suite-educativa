<div align="center">

# 🎓 Suite Educativa

### Plataforma integral de gestión académica

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)]()
[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=flat&logo=nestjs&logoColor=white)]()
[![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)]()
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat&logo=prisma&logoColor=white)]()
[![MySQL](https://img.shields.io/badge/MySQL-005C84?style=flat&logo=mysql&logoColor=white)]()

Sistema completo para instituciones educativas: matrículas, pagos, horarios, asistencia y reportes.

[Características](#-características) • [Instalación](#-instalación) • [Documentación](#-documentación) • [Deploy](#-deploy)

</div>

---

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Stack Tecnológico](#-stack-tecnológico)
- [Arquitectura](#-arquitectura)
- [Módulos](#-módulos)
- [Seguridad](#-seguridad)
- [Instalación](#-instalación)
- [Variables de Entorno](#-variables-de-entorno)
- [Desarrollo](#-desarrollo)
- [API](#-api)
- [Deploy](#-deploy)
- [Troubleshooting](#-troubleshooting)
- [Roadmap](#-roadmap)
- [Contribución](#-contribución)

---

## ✨ Características

### 👥 Gestión de Personas
- Registro de alumnos y docentes con DNI/Carnet de Extranjería
- Fotografías gestionadas con Cloudinary
- Importación masiva desde Excel
- Validación de documentos duplicados

### 📚 Gestión Académica
- Sedes, salones y turnos configurables
- Áreas y cursos con jerarquía
- Períodos académicos con bloques
- Secciones con cupos y prioridades

### 🎓 Matrículas
- Asistente (wizard) para matrículas completas
- Generación automática de cuotas según plan de pago
- Cambio de plan y sección
- Control de rematrículas pendientes

### 💰 Pagos
- Planes de pago configurables (cuotas)
- Registro de pagos con referencia y fecha
- Control de estados: pendiente, pagado, vencido
- Generación de recibos PDF

### 📅 Horarios Inteligente
- Generador automático con algoritmo de backtracking
- Resolución de conflictos (cruces de docentes/secciones)
- Validación de disponibilidad docente
- Editor manual de sesiones
- Importación desde Excel

### ✅ Asistencia Docente
- Registro diario con snapshots de docente/curso
- Vista semanal por docente
- Validación semanal por coordinadores
- Control de tardanzas en minutos

### 📊 Reportes
- Consolidados por docente, curso, sede o área
- Reportes semanales, mensuales, por bloque o período
- Asistencia física imprimible por sección
- Exportación a Excel formateado

### 🛠️ Herramientas
- Comparación de listas por DNI
- Transformación de horarios
- Cruce de información con matching fuzzy
- Generación de producto cartesiano de secciones×cursos

### 🎨 UI/UX Avanzada
- **Dark Mode** con detección de preferencia del sistema
- Diseño responsivo completo
- Toasts con feedback inmediato
- Modales con animaciones suaves
- Skeletons loaders
- Badges de notificaciones en tiempo real

### 🔒 Seguridad Avanzada
- Autenticación JWT con refresh de perfil
- Sistema de recuperación de contraseña con notificaciones en tiempo real
- DTOs con validación estricta en todos los endpoints
- Rate limiting (Throttler)
- Helmet para headers HTTP seguros
- CORS restrictivo con whitelist
- Auditoría completa de acciones
- Roles y permisos granulares

---

## 🏗️ Stack Tecnológico

### Frontend
- **React 18** con TypeScript
- **Vite** como bundler
- **Tailwind CSS** para estilos
- **Recharts** para gráficos
- **Socket.io Client** para WebSocket
- **Heroicons** para iconografía

### Backend
- **NestJS 11** framework
- **TypeScript** estricto
- **Prisma** como ORM
- **MySQL** como base de datos
- **Socket.io** para tiempo real
- **Resend** para emails
- **Cloudinary** para imágenes
- **PDFKit** para PDFs
- **ExcelJS** para Excel

### Infraestructura
- **pnpm** + workspaces (monorepo)
- **Turborepo** para builds paralelos
- **Docker** para desarrollo
- **Swagger** para documentación API

---

## 🏛️ Arquitectura

```mermaid
graph TD
    %% Definición de Estilos Globales
    classDef frontend fill:#23272F,stroke:#00D8FF,stroke-width:2px,color:#fff;
    classDef backend fill:#E0234E,stroke:#fff,stroke-width:1px,color:#fff;
    classDef servicio fill:#111,stroke:#64748B,stroke-width:1px,color:#E2E8F0;

    %% Bloque Frontend
    subgraph Frontend [Frontend - Vite]
        A["React + Tailwind <br> Socket.io Client + Recharts"]
    end
    class A frontend;

    %% Bloque Backend
    subgraph Backend [Backend - NestJS]
        B["Controllers ➔ Services ➔ Prisma ➔ MySQL"]
        C["WebSocket Gateway • Rate Limit • Guards • Audit"]
    end
    class B,C backend;

    %% Bloque Servicios Externos / BD
    D[("MySQL <br> (Docker)")]
    E["Cloudinary <br> (Images)"]
    F["Resend <br> (Emails)"]
    class D,E,F servicio;

    %% Conexiones y Flujos
    A <-->|HTTP / WebSocket| B
    B --> D
    B --> E
    B --> F

    %% Ajustes visuales de las subgráficas
    style Frontend fill:#1A1D24,stroke:#00D8FF,stroke-width:1px,color:#00D8FF
    style Backend fill:#1F1115,stroke:#E0234E,stroke-width:1px,color:#E0234E
```


### Estructura del Monorepo
```
suite-educativa/
├── apps/
│ ├── api/ # Backend NestJS
│ │ ├── src/
│ │ │ ├── modules/ # Módulos de negocio
│ │ │ ├── auth/ # Autenticación JWT
│ │ │ ├── common/ # Servicios compartidos
│ │ │ └── main.ts # Entry point
│ │ └── package.json
│ └── web/ # Frontend React
│ ├── src/
│ │ ├── api/ # Services HTTP
│ │ ├── components/ # UI compartido
│ │ ├── context/ # Contextos (Auth, Theme, etc)
│ │ ├── pages/ # Páginas de la app
│ │ └── styles/ # CSS organizado
│ └── package.json
├── packages/
│ ├── database/ # Prisma schema + client
│ ├── shared/ # Tipos y utilidades compartidas
│ └── ui/ # Componentes UI (@suite/ui)
├── docker-compose.yml
├── pnpm-workspace.yaml
└── turbo.json
```


---

## 📦 Módulos

| Módulo | Descripción | Permisos |
|--------|-------------|----------|
| **Auth** | Login, perfil, cambio de contraseña, recuperación | Público/Usuario |
| **Users** | Gestión de usuarios del sistema | `users.view/create/update/delete` |
| **Academic** | Sedes, turnos, salones, secciones, áreas, cursos, períodos | `academic.view/manage` |
| **People** | Alumnos y docentes | `enrollment.view/manage`, `academic.view/manage` |
| **Enrollment** | Matrículas y planes de pago | `enrollment.view/manage` |
| **Payments** | Registro y control de pagos | `payments.view/manage` |
| **Scheduling** | Horarios y sesiones | `scheduling.view/manage` |
| **Attendance** | Asistencia diaria y validaciones | `attendance.view/manage/validate` |
| **Reports** | Reportes consolidados | `reports.view` |
| **Tools** | Herramientas de Excel | `tools.view` |
| **Settings** | Configuración del sistema | `academic.manage` |
| **Imports** | Importación masiva | `academic.manage` |
| **Upload** | Subida de archivos | Autenticado |
| **PDF** | Generación de documentos | Autenticado |
| **Audit** | Logs de auditoría | `users.view` |

---

## 🔒 Seguridad

### Autenticación y Autorización
- **JWT** con expiración configurable
- **Guards** por roles y permisos granulares
- **4 roles predefinidos**: ADMIN, INFORMATICO, COORDINADOR, SECRETARIA
- **Rate limiting** en endpoints críticos (login, reset password)

### Validación de Datos
- **DTOs** con `class-validator` en todos los endpoints
- `whitelist: true` y `forbidNonWhitelisted: true` globales
- Transformación automática de tipos
- Validación de enums, rangos, formatos (DNI, email, fecha)

### Protección HTTP
- **Helmet** con CSP configurada
- **CORS** restrictivo con whitelist de dominios
- **Headers** de seguridad adicionales

### Recuperación de Contraseña
- Sistema de solicitudes con **WebSocket** en tiempo real
- Notificaciones a admins/informáticos
- Generación de contraseñas seguras
- Envío por email vía **Resend**
- Auditoría completa de acciones

### Auditoría
- Registro de todas las acciones críticas (CREATE, UPDATE, DELETE)
- Captura de IP del usuario
- Logs con usuario, entidad, acción y detalles

---

## 🚀 Instalación

### Requisitos Previos

- **Node.js** 20+ 
- **pnpm** 9+ (`npm install -g pnpm`)
- **Docker** y Docker Compose
- **Git**

### Pasos de Instalación

```bash
# 1. Clonar el repositorio
git clone <tu-repo>
cd suite-educativa

# 2. Instalar dependencias
pnpm install

# 3. Configurar variables de entorno
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# 4. Levantar base de datos con Docker
docker compose up -d

# 5. Ejecutar migraciones
pnpm db:migrate

# 6. Ejecutar seed (datos iniciales)
pnpm db:seed

# 7. Iniciar en desarrollo
pnpm dev
```

### Acceso
- Frontend: http://localhost:5173
- API: http://localhost:4000/api
- Swagger: http://localhost:4000/api/docs
- MySQL: localhost:3310 (usuario: `root`, contraseña: `root`)

## 🔐 Variables de Entorno

### Backend (`apps/api/.env`)

```bash
# Servidor
PORT=4000
NODE_ENV=development

# Base de datos
DATABASE_URL="mysql://root:root@localhost:3310/suite_educativa"

# JWT
JWT_SECRET="tu-secret-muy-largo-y-seguro-minimo-32-caracteres"
JWT_EXPIRATION="7d"

# CORS
CORS_ORIGIN="http://localhost:5173"

# Cloudinary (imágenes)
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret

# Resend (emails)
RESEND_API_KEY=re_tu_api_key
RESEND_FROM_EMAIL="Suite Educativa <noreply@tudominio.com>"

# Frontend URL (para links en emails)
FRONTEND_URL=http://localhost:5173

# Password Reset
PASSWORD_RESET_EXPIRY_HOURS=24
PASSWORD_RESET_RATE_LIMIT=15

# Institución (valores por defecto)
INSTITUTION_NAME=Nombre Institución
INSTITUTION_SHORT_NAME=Institución
INSTITUTION_TAGLINE=Tu eslogan
INSTITUTION_LEGAL_NAME=Razón Social
INSTITUTION_DOC_NUMBER=12345678901
INSTITUTION_ADDRESS=Dirección
INSTITUTION_PHONE=(01) 123-4567
INSTITUTION_EMAIL=contacto@institucion.edu
INSTITUTION_WEBSITE=institucion.edu
APP_NAME=Suite Educativa

# Logos en Cloudinary
LOGO_MAIN_PUBLIC_ID=logo-main
LOGO_SECOND_PUBLIC_ID=logo-second
```

### Frontend (`apps/web/.env`)

```bash
VITE_API_URL=http://localhost:4000
```

## 💻 Desarrollo

### Scripts Disponibles

```bash
# Desarrollo (inicia API + Web en paralelo)
pnpm dev

# Build de producción
pnpm build

# Linting
pnpm lint

# Formateo de código
pnpm format

# Base de datos
pnpm db:migrate       # Ejecutar migraciones
pnpm db:seed          # Ejecutar seed
pnpm db:reset         # Reset completo (migrate + seed)
pnpm db:studio        # Abrir Prisma Studio
pnpm db:generate      # Regenerar cliente Prisma
```

### Comandos Específicos por App

```bash
# Solo API
pnpm --filter api run start:dev
pnpm --filter api run test

# Solo Web
pnpm --filter web run dev
pnpm --filter web run build

# Solo Database
pnpm --filter @suite/database run generate
pnpm --filter @suite/database run migrate:dev
```

### Flujo de Trabajo
1. **Crear rama** desde `main` para cada feature
2. **Desarrollar** con `pnpm dev`
3. **Probar** cambios localmente
4. **Commit** con mensajes descriptivos
5. **Pull Request** a `main`

## 🔌 API

### Documentación Swagger

Cuando la API está corriendo en desarrollo, visita:

```bash
http://localhost:4000/api/docs
```

Todos los endpoints están documentados con:
- Parámetros de entrada
- Schemas de respuesta
- Códigos de error
- Ejemplos de uso

### Endpoints Principales

| Método | Endpoint | Descripción |
|--------|-------------|----------|
| **POST** | `/api/auth/login` | Inicio de sesión |
| **POST** | `/api/auth/forgot-password` | Solicitar reset |
| **POST** | `/api/auth/reset-password` | Confirmar reset |
| **GET** | `/api/auth/students` | Listar alumnos |
| **POST** | `/api/enrollments` | Crear matrícula |
| **POST** | `/api/enrollments/wizard` | Matrícula completa |
| **POST** | `/api/attendance/daily` | Guardar asistencia |
| **POST** | `/api/scheduling/generate/:blockId` | Generar horario |
| **GET** | `/api/reports/consolidated` | Reportes consolidados |
| **GET** | `/api/pdf/payment-receipt/:id` | Descargar recibo |

## 🚢 Deploy

### Railway (Backend + MySQL)
1. Configurar Base de Datos
   1. Crear proyecto en [railway.app](https://railway.com/dashboard)
   2. Agregar servicio **MySQL** desde el marketplace
   3. Railway generará automáticamente `DATABASE_URL`
2. Deploy del API
   1. Conectar repositorio GitHub
   2. Crear servicio desde GitHub
   3. Configurar:
      - Root Directory: `apps/api`
      - Build Command: `pnpm install && pnpm build`
      - Start Command: `node dist/main.js`
   4. Agregar variables de entorno (ver [.env.production](#-variables-de-entorno))
3. Ejecutar Migraciones
```bash
# Via Railway CLI
railway run npx prisma migrate deploy --schema=../../packages/database/prisma/schema.prisma

# O via shell
npx prisma migrate deploy --schema=packages/database/prisma/schema.prisma
```
4. Crear Usuario Inicial
   - Ejecutar el seed o crear manualmente un usuario ADMIN.

### Vercel (Frontend)
1. Crear Proyecto
   1. Ir a [vercel.com](https://vercel.com)
   2. Importar repositorio
   3. Framework Preset: Vite
2. Configuración
   - Root Directory: apps/web
   - Build Command: cd ../.. && pnpm install && pnpm --filter web build
   - Output Directory: dist
   - Install Command: pnpm install
3. Variables de Entorno
```bash
VITE_API_URL=https://tu-api.railway.app
```
4. Deploy
   - Vercel detectará cambios en main y hará deploy automático
### Checklist Pre-Producción
   - Variables de entorno configuradas (todas las marcadas como requeridas)
   - JWT_SECRET es una cadena segura (32+ caracteres)
   - DATABASE_URL apunta a la BD de producción
   - CORS_ORIGIN incluye el dominio del frontend
   - Cloudinary configurado con credenciales válidas
   - Resend configurado con dominio verificado
   - Migraciones ejecutadas en producción
   - Seed ejecutado o usuario ADMIN creado
   - HTTPS habilitado
   - Backup de base de datos configurado
   - Monitoreo de logs activo

## 🐛 Troubleshooting
### Problemas Comunes
Error: Puerto 4000 ya en uso
```bash
# Linux/Mac
lsof -i :4000
kill -9 <PID>

# Windows
netstat -ano | findstr :4000
taskkill /PID <PID> /F
```
Error: Módulo Prisma no encontrado
```bash
pnpm --filter @suite/database run generate
pnpm install
```
Error: Migraciones pendientes
```bash
pnpm db:migrate
```
Frontend no conecta con API
   - Verificar `VITE_API_URL` en `.env`
   - Confirmar que **CORS** permite el origen
   - Verificar que **API** está corriendo
WebSocket no conecta
   - Verificar que la URL del WebSocket usa el mismo dominio que la **API**
   - Revisar logs de Network tab en DevTools
Error 403 en endpoints
   - Verificar que el usuario tiene los permisos necesarios
   - Revisar ROLE_PERMISSIONS en packages/shared/src/permissions.ts

### Logs
```bash
# Ver logs del backend
pnpm --filter api run start:dev

# Ver logs de Docker
docker compose logs -f
```

## 🗺️ Roadmap
### ✅ Completado (Fase 1)
   - Monorepo base con pnpm + Turborepo
   - Backend NestJS con autenticación JWT
   - Frontend React + Tailwind
   - Módulos principales (personas, matrículas, pagos, horarios, asistencia)
   - Sistema de reportes y exportación
   - Dark mode completo
   - Seguridad reforzada (DTOs, rate limiting, helmet)
   - Sistema de recuperación de contraseña con WebSockets
   - Integración con Cloudinary y Resend
   - Generación de PDFs y Excel
### 🚧 En Progreso (Fase 2)
   - Testing unitario y E2E
   - PWA (Progressive Web App)
   - Skeleton loaders en todas las páginas
   - Keyboard shortcuts
   - Notificaciones push en tiempo real
### 📋 Futuro (Fase 3)
   - Portal para docentes (autoconsulta)
   - Portal para alumnos (notas, asistencia)
   - App móvil (React Native)
   - Integración con pasarelas de pago
   - Chat interno
   - Videoconferencias integradas

## 🤝 Contribución
### Estándares de Código
   - TypeScript estricto habilitado
   - ESLint + Prettier para formateo
   - Commits convencionales (feat:, fix:, docs:, etc.)
   - Code review obligatorio antes de merge
### Proceso
   - Fork del repositorio
   - Crear rama (git checkout -b feature/nueva-feature)
   - Commit de cambios (git commit -m 'feat: agrega nueva feature')
   - Push a la rama (git push origin feature/nueva-feature)
   - Abrir Pull Request
### Reportar Bugs
   - Usar Issues de GitHub
   - Incluir pasos para reproducir
   - Adjuntar screenshots si aplica
   - Indicar entorno (OS, navegador, versión)

## 📄 Licencia
Este proyecto es propiedad privada. Uso interno de la institución.
## 👥 Equipo
Desarrollado con ❤️ por Gonzalo Sotelo - KDev.

<div align="center">

¿Preguntas o sugerencias? Abrir un issue
[⬆ Volver arriba](#-suite-educativa)

</div>