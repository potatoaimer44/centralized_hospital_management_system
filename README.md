# Centralized Hospital Management System

A full-stack medical records management system built with React, Express, TypeScript, and PostgreSQL.

## Prerequisites

- **Node.js** (v20 or higher recommended)
- **PostgreSQL** (v15 or higher)
- **npm** (comes with Node.js)

## Local Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up PostgreSQL Database

#### Option A: Using Docker (Recommended)

```bash
docker run --name medrecord_db \
  -e POSTGRES_DB=medrecord_db \
  -e POSTGRES_USER=medrecord_user \
  -e POSTGRES_PASSWORD=your_password \
  -p 5432:5432 \
  -d postgres:15-alpine
```

#### Option B: Using Local PostgreSQL

1. Create a new database:
```bash
createdb medrecord_db
```

2. Or using PostgreSQL CLI:
```bash
psql -U postgres
CREATE DATABASE medrecord_db;
\q
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
# Required: Database connection
DATABASE_URL=postgresql://medrecord_user:your_password@localhost:5432/medrecord_db

# Optional: Server port (defaults to 5000)
PORT=5000

# Optional: Session secret (auto-generated if not set)
SESSION_SECRET=your-session-secret-here

# Optional: Replit Auth (only needed if using Replit Auth)
# REPLIT_DEPLOYMENT_URL=
# REPLIT_DEPLOYMENT_ID=
```

**Note:** Replace `your_password` and other values with your actual credentials.

### 4. Push Database Schema

Run Drizzle migrations to create the database tables:

```bash
npm run db:push
```

This will create all necessary tables based on the schema in `shared/schema.ts`.

### 5. Start the Development Server

```bash
npm run dev
```

The application will be available at:
- **Frontend & API**: http://localhost:5000

The server runs in development mode with:
- Hot Module Replacement (HMR) for React components
- Vite dev server for fast builds
- Express backend API at `/api/*`

## Available Scripts

- `npm run dev` - Start development server (recommended for local development)
- `npm run build` - Build for production (creates `dist/` folder)
- `npm run start` - Start production server (requires build first)
- `npm run check` - Type-check TypeScript without building
- `npm run db:push` - Push database schema changes to PostgreSQL

## Project Structure

```
├── client/          # React frontend (TypeScript)
│   └── src/
│       ├── pages/   # Page components
│       ├── components/  # Reusable UI components
│       └── hooks/   # Custom React hooks
├── server/          # Express backend (TypeScript)
│   ├── index.ts     # Server entry point
│   ├── routes.ts    # API routes
│   ├── db.ts        # Database connection
│   └── storage.ts   # Data access layer
├── shared/          # Shared code between client and server
│   └── schema.ts    # Drizzle ORM schema
└── dist/            # Build output (generated)
```

## Troubleshooting

### Database Connection Issues

- Verify PostgreSQL is running: `docker ps` or `sudo systemctl status postgresql`
- Check DATABASE_URL format: `postgresql://user:password@host:port/database`
- Ensure database exists: `psql -l | grep medrecord_db`

### Port Already in Use

If port 5000 is already in use, change it in `.env`:
```bash
PORT=3000
```

### Module Not Found Errors

Clear node_modules and reinstall:
```bash
rm -rf node_modules package-lock.json
npm install
```

## Authentication

This application supports Replit Auth when deployed. For local development, authentication may be limited. Check `server/replitAuth.ts` for authentication setup details.

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Express.js, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Build Tools**: Vite, esbuild
- **State Management**: TanStack React Query

