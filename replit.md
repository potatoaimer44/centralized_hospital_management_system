# MedRecord - Medical Records Management System

## Overview

MedRecord is a secure, centralized web-based medical record management system designed for hospitals in Kathmandu Valley. The system provides role-based access control for administrators, doctors, nurses, and patients, enabling multi-hospital record sharing with comprehensive audit logging and security monitoring.

Key features include:
- Role-based dashboards tailored to specific workflow needs (admin, doctor, nurse, patient)
- Complete medical records management with diagnoses, prescriptions, and lab results
- Vital signs tracking and monitoring
- Cross-hospital access request workflows with approval mechanisms
- Comprehensive audit logging for compliance and security
- Security alert monitoring and resolution

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight client-side routing)
- **State Management**: TanStack React Query for server state management
- **Styling**: Tailwind CSS with shadcn/ui component library (New York style)
- **Build Tool**: Vite with React plugin
- **Design System**: Material Design-inspired with healthcare industry adaptations, using Inter font for readability

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript (ESM modules)
- **API Style**: RESTful JSON APIs under `/api/*` prefix
- **Authentication**: Replit Auth with OpenID Connect (passport.js), with session management via connect-pg-simple
- **Session Storage**: PostgreSQL-backed sessions for persistence

### Database Layer
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with drizzle-zod for schema validation
- **Schema Location**: `shared/schema.ts` (shared between client and server)
- **Migrations**: Drizzle Kit with `db:push` command

### Data Models
Core entities include:
- Users (with roles: admin, doctor, nurse, patient)
- Hospitals
- Patients (linked to users)
- Medical Records
- Vital Signs
- Audit Logs
- Access Requests
- Security Alerts

### Build Configuration
- Development: Vite dev server with HMR, proxied through Express
- Production: Vite builds to `dist/public`, esbuild bundles server to `dist/index.cjs`
- Path aliases: `@/*` for client source, `@shared/*` for shared code

## External Dependencies

### Database
- PostgreSQL via `DATABASE_URL` environment variable
- Connection pooling through `pg` package

### Authentication
- Replit Auth (OpenID Connect) when deployed
- Requires `REPLIT_DEPLOYMENT_URL` and `REPLIT_DEPLOYMENT_ID` environment variables
- Session secret via `SESSION_SECRET` environment variable (auto-generated if not set)

### UI Component Libraries
- Radix UI primitives (dialog, dropdown, tabs, etc.)
- shadcn/ui components (pre-configured in `components.json`)
- Lucide React for icons
- embla-carousel for carousels
- react-day-picker for date selection
- recharts for data visualization

### Form Handling
- React Hook Form with Zod resolver for validation
- drizzle-zod for database schema to Zod schema conversion

### Utilities
- date-fns for date formatting
- clsx and tailwind-merge for class name handling
- memoizee for function memoization