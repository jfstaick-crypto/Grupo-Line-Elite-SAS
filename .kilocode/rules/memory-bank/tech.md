# Technical Context: Sistema de Gestión Hospitalaria

## Technology Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.x | React framework with App Router |
| React | 19.x | UI library |
| TypeScript | 5.9.x | Type-safe JavaScript |
| Tailwind CSS | 4.x | Utility-first CSS |
| Bun | Latest | Package manager & runtime |
| Drizzle ORM | 0.45.x | Database ORM |
| iron-session | 8.x | Session authentication |
| jsPDF | 4.x | PDF generation |
| xlsx | 0.18.x | Excel export |

## Commands

```bash
bun install        # Install dependencies
bun dev            # Start dev server
bun build          # Production build
bun lint           # Run ESLint
bun typecheck      # Run TypeScript type checking
bun db:generate    # Generate DB migrations
bun db:seed        # Seed default users
```

## Database

- SQLite via @kilocode/app-builder-db
- Drizzle ORM for schema and queries
- 5 tables: users, patients, admissions, transfers, clinicalHistories

## Authentication

- iron-session for encrypted session cookies
- Session data: userId, username, fullName, role
- Role-based permissions checked server-side

## Dependencies

### Production
- next, react, react-dom
- @kilocode/app-builder-db, drizzle-orm
- iron-session
- jspdf, jspdf-autotable
- xlsx

### Dev
- typescript, @types/node, @types/react, @types/react-dom, @types/jspdf
- @tailwindcss/postcss, tailwindcss
- eslint, eslint-config-next
- drizzle-kit
